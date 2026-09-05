import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import {
  DEFAULT_SETTINGS,
  type ActivityInput,
  type ActivityLog,
  type Settings,
} from "./types";

const EPOCH = "1970-01-01T00:00:00.000Z";
const ms = (iso: string) => new Date(iso).getTime();

// IndexedDB-backed storage for Zustand persist. Robust for larger local
// datasets and survives Safari's localStorage eviction on mobile.
const idbStorage: StateStorage = {
  getItem: async (name) => (await idbGet<string>(name)) ?? null,
  setItem: async (name, value) => {
    await idbSet(name, value);
  },
  removeItem: async (name) => {
    await idbDel(name);
  },
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface RemoteSettings extends Settings {
  updated_at: string;
}

interface LogState {
  logs: ActivityLog[]; // includes tombstones; consumers filter `deleted`
  settings: Settings;
  settingsUpdatedAt: string;
  lastSyncedAt: string; // sync watermark (ISO)
  hydrated: boolean;

  addLog: (input: ActivityInput) => void;
  updateLog: (id: string, input: ActivityInput) => void;
  deleteLog: (id: string) => void; // soft delete
  setSettings: (patch: Partial<Settings>) => void;

  // Sync plumbing.
  mergeRemoteLogs: (rows: ActivityLog[]) => void;
  mergeRemoteSettings: (remote: RemoteSettings) => void;
  setLastSyncedAt: (iso: string) => void;
  reset: () => void;
}

export const useStore = create<LogState>()(
  persist(
    (set) => ({
      logs: [],
      settings: DEFAULT_SETTINGS,
      settingsUpdatedAt: EPOCH,
      lastSyncedAt: EPOCH,
      hydrated: false,

      addLog: (input) =>
        set((state) => {
          const now = new Date().toISOString();
          const log: ActivityLog = {
            ...input,
            id: newId(),
            deleted: false,
            created_at: now,
            updated_at: now,
          };
          return { logs: [log, ...state.logs] };
        }),

      updateLog: (id, input) =>
        set((state) => ({
          logs: state.logs.map((l) =>
            l.id === id
              ? { ...l, ...input, updated_at: new Date().toISOString() }
              : l,
          ),
        })),

      deleteLog: (id) =>
        set((state) => ({
          logs: state.logs.map((l) =>
            l.id === id
              ? { ...l, deleted: true, updated_at: new Date().toISOString() }
              : l,
          ),
        })),

      setSettings: (patch) =>
        set((state) => ({
          settings: { ...state.settings, ...patch },
          settingsUpdatedAt: new Date().toISOString(),
        })),

      mergeRemoteLogs: (rows) =>
        set((state) => {
          const byId = new Map(state.logs.map((l) => [l.id, l]));
          let changed = false;
          for (const r of rows) {
            const cur = byId.get(r.id);
            if (!cur || ms(r.updated_at) >= ms(cur.updated_at)) {
              if (!cur || cur.updated_at !== r.updated_at) changed = true;
              byId.set(r.id, r);
            }
          }
          return changed ? { logs: [...byId.values()] } : {};
        }),

      mergeRemoteSettings: (remote) =>
        set((state) =>
          ms(remote.updated_at) > ms(state.settingsUpdatedAt)
            ? {
                settings: {
                  officer_name: remote.officer_name,
                  branch_name: remote.branch_name,
                },
                settingsUpdatedAt: remote.updated_at,
              }
            : {},
        ),

      setLastSyncedAt: (iso) =>
        set((state) => (iso !== state.lastSyncedAt ? { lastSyncedAt: iso } : {})),

      reset: () =>
        set({
          logs: [],
          settings: DEFAULT_SETTINGS,
          settingsUpdatedAt: EPOCH,
          lastSyncedAt: EPOCH,
        }),
    }),
    {
      name: "field-activity-logger/v1",
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        logs: state.logs,
        settings: state.settings,
        settingsUpdatedAt: state.settingsUpdatedAt,
        lastSyncedAt: state.lastSyncedAt,
      }),
    },
  ),
);

// Async (IndexedDB) rehydration finishes after the store is created; flip the
// flag via setState so subscribed components re-render out of the loading state.
useStore.persist.onFinishHydration(() => {
  useStore.setState({ hydrated: true });
});
if (useStore.persist.hasHydrated()) {
  useStore.setState({ hydrated: true });
}
