import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KpiHeader } from "./components/KpiHeader";
import { QuickEntryForm } from "./components/QuickEntryForm";
import { HistoryView } from "./components/HistoryView";
import { SettingsModal } from "./components/SettingsModal";
import { SignIn } from "./components/SignIn";
import { useStore } from "./lib/store";
import { supabase, type Session } from "./lib/supabase";
import { syncNow } from "./lib/sync";
import type { ActivityLog } from "./lib/types";

type Tab = "log" | "history";

interface SyncState {
  busy: boolean;
  at: number | null;
  error?: string;
}

function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-4">
      <div className="pointer-events-auto rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
        {message}
      </div>
    </div>
  );
}

function SyncPill({ state, onClick }: { state: SyncState; onClick: () => void }) {
  const label = state.busy
    ? "Syncing…"
    : state.error
      ? "Sync failed"
      : state.at
        ? "Synced"
        : "Sync";
  const dot = state.busy
    ? "bg-amber-300"
    : state.error
      ? "bg-red-400"
      : "bg-emerald-300";
  return (
    <button
      onClick={onClick}
      title={state.error ?? (state.at ? new Date(state.at).toLocaleString() : "")}
      className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white"
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </button>
  );
}

export default function App() {
  const logs = useStore((s) => s.logs);
  const hydrated = useStore((s) => s.hydrated);
  const officerName = useStore((s) => s.settings.officer_name);
  const activeLogs = useMemo(() => logs.filter((l) => !l.deleted), [logs]);
  const needsProfile = hydrated && !officerName.trim();

  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("log");
  const [editing, setEditing] = useState<ActivityLog | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [sync, setSync] = useState<SyncState>({ busy: false, at: null });
  const toastTimer = useRef<number | undefined>(undefined);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  // Track the auth session.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  // Drive sync while signed in: on login, on reconnect, on focus, every 30s,
  // and (debounced) whenever local state changes.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    let debounce: number | undefined;

    const run = async () => {
      setSync((s) => ({ ...s, busy: true }));
      const r = await syncNow();
      if (cancelled) return;
      setSync({ busy: false, at: Date.now(), error: r.ok ? undefined : r.error });
    };
    const schedule = () => {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(run, 800);
    };

    run();
    const onOnline = () => run();
    const onVisible = () => document.visibilityState === "visible" && run();
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    const interval = window.setInterval(run, 30_000);
    const unsub = useStore.subscribe(schedule);

    return () => {
      cancelled = true;
      window.clearTimeout(debounce);
      window.clearInterval(interval);
      unsub();
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [session]);

  const startEdit = useCallback((log: ActivityLog) => {
    setEditing(log);
    setTab("log");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    useStore.getState().reset();
    showToast("Signed out");
  }

  if (session === undefined) {
    return (
      <p className="p-8 text-center text-sm text-slate-400">Loading…</p>
    );
  }
  if (session === null) {
    return <SignIn />;
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col bg-slate-100">
      <Toast message={toast} />

      <header className="sticky top-0 z-40 shadow-md">
        <div className="flex items-center justify-between bg-brand px-4 pt-2 text-xs text-teal-50/90">
          <span className="truncate">{session.user.email}</span>
          <div className="flex items-center gap-2">
            <SyncPill state={sync} onClick={() => void triggerManualSync(setSync)} />
            <button className="font-semibold underline" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
        <KpiHeader logs={activeLogs} />
        <div className="flex items-stretch bg-brand-dark text-white">
          <button
            className={`flex-1 py-2.5 text-sm font-semibold ${
              tab === "log" ? "bg-white text-brand" : "text-teal-50/80"
            }`}
            onClick={() => setTab("log")}
          >
            {editing ? "Edit entry" : "Quick log"}
          </button>
          <button
            className={`flex-1 py-2.5 text-sm font-semibold ${
              tab === "history" ? "bg-white text-brand" : "text-teal-50/80"
            }`}
            onClick={() => {
              setEditing(null);
              setTab("history");
            }}
          >
            History
          </button>
          <button
            className="px-4 text-teal-50/80"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
          >
            ⚙
          </button>
        </div>
      </header>

      <main className="flex-1 safe-bottom">
        {needsProfile && (
          <div className="m-4 mb-0 flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800 ring-1 ring-amber-200">
            <span>Set your officer name before logging — it appears on every export.</span>
            <button
              className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white"
              onClick={() => setSettingsOpen(true)}
            >
              Set now
            </button>
          </div>
        )}
        {!hydrated ? (
          <p className="p-8 text-center text-sm text-slate-400">Loading…</p>
        ) : tab === "log" ? (
          <QuickEntryForm
            editing={editing}
            profileIncomplete={needsProfile}
            onOpenSettings={() => setSettingsOpen(true)}
            onDone={() => {
              setEditing(null);
              setTab("history");
            }}
            onToast={showToast}
          />
        ) : (
          <HistoryView onEdit={startEdit} onToast={showToast} />
        )}
      </main>

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          onToast={showToast}
        />
      )}
    </div>
  );
}

async function triggerManualSync(
  setSync: (updater: (s: SyncState) => SyncState) => void,
) {
  setSync((s) => ({ ...s, busy: true }));
  const r = await syncNow();
  setSync(() => ({ busy: false, at: Date.now(), error: r.ok ? undefined : r.error }));
}
