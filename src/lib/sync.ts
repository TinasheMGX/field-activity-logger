import { supabase } from "./supabase";
import { useStore } from "./store";
import type { ActivityLog } from "./types";

const LOGS = "field_activity_logs";
const SETTINGS = "field_logger_settings";
const ms = (iso: string) => new Date(iso).getTime();

export interface SyncResult {
  ok: boolean;
  pushed: number;
  pulled: number;
  error?: string;
}

interface LogRow extends ActivityLog {
  user_id: string;
}

function toRow(l: ActivityLog, userId: string): LogRow {
  return { ...l, user_id: userId };
}
function fromRow(r: LogRow): ActivityLog {
  const { user_id: _user_id, ...rest } = r;
  return rest;
}

/**
 * Reconcile local state with Supabase. Push locally-changed rows, then pull
 * remote changes, both filtered by the sync watermark. Conflicts resolve
 * last-write-wins on updated_at (adequate for one officer across devices).
 *
 * Timestamps are compared as epoch ms, never as strings: the client writes
 * `…Z` and PostgREST returns `…+00:00`, which do not compare correctly
 * lexicographically.
 */
export async function syncNow(): Promise<SyncResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, pushed: 0, pulled: 0, error: "not signed in" };

  const userId = session.user.id;
  const st = useStore.getState();
  const cursor = st.lastSyncedAt;

  try {
    // --- PUSH: local rows/settings changed since the last sync ---
    const dirtyLogs = st.logs.filter((l) => ms(l.updated_at) > ms(cursor));
    if (dirtyLogs.length) {
      const { error } = await supabase
        .from(LOGS)
        .upsert(dirtyLogs.map((l) => toRow(l, userId)));
      if (error) throw error;
    }
    if (ms(st.settingsUpdatedAt) > ms(cursor)) {
      const { error } = await supabase.from(SETTINGS).upsert({
        user_id: userId,
        officer_name: st.settings.officer_name,
        branch_name: st.settings.branch_name,
        updated_at: st.settingsUpdatedAt,
      });
      if (error) throw error;
    }

    // --- PULL: remote rows/settings changed since the last sync ---
    const { data: remoteLogs, error: e1 } = await supabase
      .from(LOGS)
      .select("*")
      .gt("updated_at", cursor);
    if (e1) throw e1;

    const { data: remoteSettings, error: e2 } = await supabase
      .from(SETTINGS)
      .select("*")
      .maybeSingle();
    if (e2) throw e2;

    const mapped = ((remoteLogs ?? []) as LogRow[]).map(fromRow);
    useStore.getState().mergeRemoteLogs(mapped);
    if (remoteSettings) {
      useStore.getState().mergeRemoteSettings({
        officer_name: remoteSettings.officer_name,
        branch_name: remoteSettings.branch_name,
        updated_at: remoteSettings.updated_at,
      });
    }

    // Advance the watermark to the newest timestamp actually observed, so we
    // never skip a row but also don't needlessly re-pull everything.
    let watermark = cursor;
    for (const t of [
      ...dirtyLogs.map((l) => l.updated_at),
      ...mapped.map((l) => l.updated_at),
      remoteSettings?.updated_at,
      ms(st.settingsUpdatedAt) > ms(cursor) ? st.settingsUpdatedAt : undefined,
    ]) {
      if (t && ms(t) > ms(watermark)) watermark = t;
    }
    useStore.getState().setLastSyncedAt(watermark);

    return { ok: true, pushed: dirtyLogs.length, pulled: mapped.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, pushed: 0, pulled: 0, error: msg };
  }
}
