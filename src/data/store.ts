import { get as idbGet, set as idbSet } from 'idb-keyval';
import { create } from 'zustand';
import { getRepository } from './LogRepository';
import type {
  ActivityId,
  ActivityPayload,
  ActivityRun,
  Log,
  LogPatch,
  Profile,
  QuestionnaireResult,
  StoolLog,
  TriggerLog,
} from './types';

type NewLog = Omit<StoolLog, 'id'> | Omit<TriggerLog, 'id'>;

export type UserMode = 'exploring' | 'appointment' | 'diagnosed';

const QUESTIONNAIRES_KEY = 'osheet:questionnaires:v1';
const ACTIVITIES_KEY = 'osheet:activities:v1';

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
  activityRuns: ActivityRun[];
  tipsDismissed: string[];
  communityWaitlist: boolean;

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
  dismissTip: (id: string) => void;
  joinCommunityWaitlist: () => void;
  startActivity: (activity: ActivityId, initialPayload: ActivityPayload) => Promise<string>;
  updateActivity: (id: string, patch: Partial<Omit<ActivityRun, 'id' | 'activity'>>) => Promise<void>;
  completeActivity: (id: string, finalPayload: ActivityPayload) => Promise<void>;
}

const SETTINGS_KEY = 'osheet:settings:v3';

interface PersistedSettings {
  onboarded: boolean;
  userMode: UserMode;
  startedAt: number;
  profile: Profile;
  softProfilePromptDismissed: boolean;
  tipsDismissed: string[];
  communityWaitlist: boolean;
}

function loadSettings(): PersistedSettings {
  const fallback: PersistedSettings = {
    onboarded: false,
    userMode: 'exploring',
    startedAt: Date.now(),
    profile: {},
    softProfilePromptDismissed: false,
    tipsDismissed: [],
    communityWaitlist: false,
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
      tipsDismissed: parsed.tipsDismissed ?? [],
      communityWaitlist: parsed.communityWaitlist ?? false,
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
    activityRuns: [],
    tipsDismissed: initial.tipsDismissed,
    communityWaitlist: initial.communityWaitlist,

    async hydrate() {
      const repo = getRepository();
      const logs = await repo.list();
      let questionnaires: QuestionnaireResult[] = [];
      let activityRuns: ActivityRun[] = [];
      try {
        questionnaires = (await idbGet<QuestionnaireResult[]>(QUESTIONNAIRES_KEY)) ?? [];
      } catch {
        /* ignore */
      }
      try {
        activityRuns = (await idbGet<ActivityRun[]>(ACTIVITIES_KEY)) ?? [];
      } catch {
        /* ignore */
      }
      set({ logs, questionnaires, activityRuns, hydrated: true });
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

    dismissTip(id) {
      if (get().tipsDismissed.includes(id)) return;
      set({ tipsDismissed: [...get().tipsDismissed, id] });
      persistSettingsFromState(get());
    },

    joinCommunityWaitlist() {
      if (get().communityWaitlist) return;
      set({ communityWaitlist: true });
      persistSettingsFromState(get());
    },

    async startActivity(activity, initialPayload) {
      const run: ActivityRun = {
        id: `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        activity,
        startTs: Date.now(),
        completed: false,
        payload: initialPayload,
      };
      const next = [...get().activityRuns, run];
      set({ activityRuns: next });
      try {
        await idbSet(ACTIVITIES_KEY, next);
      } catch {
        /* ignore */
      }
      return run.id;
    },

    async updateActivity(id, patch) {
      const next = get().activityRuns.map((r) => (r.id === id ? { ...r, ...patch } : r));
      set({ activityRuns: next });
      try {
        await idbSet(ACTIVITIES_KEY, next);
      } catch {
        /* ignore */
      }
    },

    async completeActivity(id, finalPayload) {
      const next = get().activityRuns.map((r) =>
        r.id === id ? { ...r, completed: true, endTs: Date.now(), payload: finalPayload } : r,
      );
      set({ activityRuns: next });
      try {
        await idbSet(ACTIVITIES_KEY, next);
      } catch {
        /* ignore */
      }
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
    tipsDismissed: s.tipsDismissed,
    communityWaitlist: s.communityWaitlist,
  });
}
