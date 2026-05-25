import { create } from 'zustand';
import { getRepository } from './LogRepository';
import type { Log, LogPatch, StoolLog, TriggerLog } from './types';

type NewLog = Omit<StoolLog, 'id'> | Omit<TriggerLog, 'id'>;

interface AppState {
  hydrated: boolean;
  logs: Log[];
  onboarded: boolean;
  genericName: boolean;
  startedAt: number;
  bloodAlertShownThisSession: boolean;

  hydrate: () => Promise<void>;
  addLog: (log: NewLog) => Promise<Log>;
  updateLog: (id: string, patch: LogPatch) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  clearLogs: () => Promise<void>;

  setOnboarded: (v: boolean) => void;
  setGenericName: (v: boolean) => void;
  markBloodAlertShown: () => void;
}

const SETTINGS_KEY = 'osheet:settings:v1';

interface PersistedSettings {
  onboarded: boolean;
  genericName: boolean;
  startedAt: number;
}

function loadSettings(): PersistedSettings {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { onboarded: false, genericName: true, startedAt: Date.now() };
  }
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { onboarded: false, genericName: true, startedAt: Date.now() };
    return JSON.parse(raw);
  } catch {
    return { onboarded: false, genericName: true, startedAt: Date.now() };
  }
}

function saveSettings(s: PersistedSettings): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota errors */
  }
}

export const useAppStore = create<AppState>((set, get) => {
  const initial = loadSettings();
  return {
    hydrated: false,
    logs: [],
    onboarded: initial.onboarded,
    genericName: initial.genericName,
    startedAt: initial.startedAt,
    bloodAlertShownThisSession: false,

    async hydrate() {
      const repo = getRepository();
      const logs = await repo.list();
      set({ logs, hydrated: true });
    },

    async addLog(log) {
      const repo = getRepository();
      const created = await repo.add(log as Parameters<typeof repo.add>[0]);
      set({ logs: [...get().logs, created] });
      return created;
    },

    async updateLog(id, patch) {
      const repo = getRepository();
      await repo.update(id, patch);
      set({ logs: get().logs.map((l) => (l.id === id ? ({ ...l, ...patch } as Log) : l)) });
    },

    async deleteLog(id) {
      const repo = getRepository();
      await repo.delete(id);
      set({ logs: get().logs.filter((l) => l.id !== id) });
    },

    async clearLogs() {
      const repo = getRepository();
      await repo.clear();
      set({ logs: [] });
    },

    setOnboarded(v) {
      set({ onboarded: v });
      const { genericName, startedAt } = get();
      saveSettings({ onboarded: v, genericName, startedAt });
    },

    setGenericName(v) {
      set({ genericName: v });
      const { onboarded, startedAt } = get();
      saveSettings({ onboarded, genericName: v, startedAt });
    },

    markBloodAlertShown() {
      set({ bloodAlertShownThisSession: true });
    },
  };
});
