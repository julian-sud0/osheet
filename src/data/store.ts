import { get as idbGet, set as idbSet } from 'idb-keyval';
import { create } from 'zustand';
import { getRepository } from './LogRepository';
import type { Log, LogPatch, Profile, QuestionnaireResult, StoolLog, TriggerLog } from './types';

type NewLog = Omit<StoolLog, 'id'> | Omit<TriggerLog, 'id'>;

export type UserMode = 'exploring' | 'appointment' | 'diagnosed';

const QUESTIONNAIRES_KEY = 'osheet:questionnaires:v1';

interface AppState {
  hydrated: boolean;
  logs: Log[];
  onboarded: boolean;
  userMode: UserMode;
  startedAt: number;
  bloodAlertShownThisSession: boolean;
  softProfilePromptDismissed: boolean;
  profile: Profile;
  questionnaires: QuestionnaireResult[];

  hydrate: () => Promise<void>;
  addLog: (log: NewLog) => Promise<Log>;
  updateLog: (id: string, patch: LogPatch) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  clearLogs: () => Promise<void>;

  setOnboarded: (v: boolean) => void;
  setUserMode: (m: UserMode) => void;
  markBloodAlertShown: () => void;
  setProfileField: <K extends keyof Profile>(key: K, value: Profile[K]) => void;
  addQuestionnaireResult: (r: Omit<QuestionnaireResult, 'id'>) => Promise<void>;
  dismissSoftProfilePrompt: () => void;
}

const SETTINGS_KEY = 'osheet:settings:v2';

interface PersistedSettings {
  onboarded: boolean;
  userMode: UserMode;
  startedAt: number;
  profile: Profile;
  softProfilePromptDismissed: boolean;
}

function loadSettings(): PersistedSettings {
  const fallback: PersistedSettings = {
    onboarded: false,
    userMode: 'exploring',
    startedAt: Date.now(),
    profile: {},
    softProfilePromptDismissed: false,
  };
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    return {
      onboarded: parsed.onboarded ?? false,
      userMode: parsed.userMode ?? 'exploring',
      startedAt: parsed.startedAt ?? Date.now(),
      profile: parsed.profile ?? {},
      softProfilePromptDismissed: parsed.softProfilePromptDismissed ?? false,
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
    softProfilePromptDismissed: initial.softProfilePromptDismissed,
    profile: initial.profile,
    questionnaires: [],

    async hydrate() {
      const repo = getRepository();
      const logs = await repo.list();
      let questionnaires: QuestionnaireResult[] = [];
      try {
        questionnaires = (await idbGet<QuestionnaireResult[]>(QUESTIONNAIRES_KEY)) ?? [];
      } catch {
        /* ignore */
      }
      set({ logs, questionnaires, hydrated: true });
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
      persistSettingsFromState(get());
    },

    setUserMode(m) {
      set({ userMode: m });
      persistSettingsFromState(get());
    },

    markBloodAlertShown() {
      set({ bloodAlertShownThisSession: true });
    },

    setProfileField(key, value) {
      const next: Profile = { ...get().profile, [key]: value };
      set({ profile: next });
      persistSettingsFromState(get());
    },

    async addQuestionnaireResult(r) {
      const result: QuestionnaireResult = {
        ...r,
        id: `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      };
      const next = [...get().questionnaires, result];
      set({ questionnaires: next });
      try {
        await idbSet(QUESTIONNAIRES_KEY, next);
      } catch {
        /* ignore quota errors */
      }
    },

    dismissSoftProfilePrompt() {
      set({ softProfilePromptDismissed: true });
      persistSettingsFromState(get());
    },
  };
});

function persistSettingsFromState(s: AppState) {
  saveSettings({
    onboarded: s.onboarded,
    userMode: s.userMode,
    startedAt: s.startedAt,
    profile: s.profile,
    softProfilePromptDismissed: s.softProfilePromptDismissed,
  });
}
