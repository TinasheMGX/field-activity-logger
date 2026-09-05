import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import {
  DEFAULT_SETTINGS,
  type ActivityInput,
  type ActivityLog,
  type Settings,
} from "./types";

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

interface LogState {
  logs: ActivityLog[];
  settings: Settings;
  hydrated: boolean;
  addLog: (input: ActivityInput) => void;
  updateLog: (id: string, input: ActivityInput) => void;
  deleteLog: (id: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
}

export const useStore = create<LogState>()(
  persist(
    (set) => ({
      logs: [],
      settings: DEFAULT_SETTINGS,
      hydrated: false,
      addLog: (input) =>
        set((state) => {
          const now = new Date().toISOString();
          const log: ActivityLog = {
            ...input,
            id: newId(),
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
        set((state) => ({ logs: state.logs.filter((l) => l.id !== id) })),
      setSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),
    }),
    {
      name: "field-activity-logger/v1",
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({ logs: state.logs, settings: state.settings }),
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
