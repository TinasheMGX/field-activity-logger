import { useCallback, useEffect, useRef, useState } from "react";
import { KpiHeader } from "./components/KpiHeader";
import { QuickEntryForm } from "./components/QuickEntryForm";
import { HistoryView } from "./components/HistoryView";
import { SettingsModal } from "./components/SettingsModal";
import { useStore } from "./lib/store";
import type { ActivityLog } from "./lib/types";

type Tab = "log" | "history";

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

export default function App() {
  const logs = useStore((s) => s.logs);
  const hydrated = useStore((s) => s.hydrated);

  const [tab, setTab] = useState<Tab>("log");
  const [editing, setEditing] = useState<ActivityLog | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const startEdit = useCallback((log: ActivityLog) => {
    setEditing(log);
    setTab("log");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col bg-slate-100">
      <Toast message={toast} />

      <header className="sticky top-0 z-40 shadow-md">
        <KpiHeader logs={logs} />
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
        {!hydrated ? (
          <p className="p-8 text-center text-sm text-slate-400">Loading…</p>
        ) : tab === "log" ? (
          <QuickEntryForm
            editing={editing}
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
