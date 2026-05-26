import { create } from 'zustand';
import { getRepository } from './LogRepository';
import type { Log, LogPatch, StoolLog, TriggerLog } from './types';

type NewLog = Omit<StoolLog, 'id'> | Omit<TriggerLog, 'id'>;

export type UserMode = 'exploring' | 'appointment' | 'diagnosed';

interface AppState {
  hydrated: boolean;
  logs: Log[];
  onboarded: boolean;
  userMode: UserMode;
  startedAt: number;
  bloodAlertShownThisSession: boolean;

  hydrate: () => Promise<void>;
  addLog: (log: NewLog) => Promise<Log>;
  updateLog: (id: string, patch: LogPatch) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  clearLogs: () => Promise<void>;

  setOnboarded: (v: boolean) => void;
  setUserMode: (m: UserMode) => void;
  markBloodAlertShown: () => void;
}

const SETTINGS_KEY = 'osheet:settings:v2';

interface PersistedSettings {
  onboarded: boolean;
  userMode: UserMode;
  startedAt: number;
}

function loadSettings(): PersistedSettings {
  const fallback: PersistedSettings = { onboarded: false, userMode: 'exploring', startedAt: Date.now() };
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    return {
      onboarded: parsed.onboarded ?? false,
      userMode: parsed.userMode ?? 'exploring',
      startedAt: parsed.startedAt ?? Date.now(),
    };
  } catch {
    return fallback;
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
    userMode: initial.userMode,
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
      const { userMode, startedAt } = get();
      saveSettings({ onboarded: v, userMode, startedAt });
    },

    setUserMode(m) {
      set({ userMode: m });
      const { onboarded, startedAt } = get();
      saveSettings({ onboarded, userMode: m, startedAt });
    },

    markBloodAlertShown() {
      set({ bloodAlertShownThisSession: true });
    },
  };
});
