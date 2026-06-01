/**
 * Domain types. Mirrors the prototype's state shape from index.html.
 * Kept deliberately flat so the storage layer can serialise without a mapper.
 */

export type BristolType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Urgency = 'None' | 'A bit' | "Couldn't wait";
export type Pain = 'None' | 'Mild' | 'Moderate' | 'Sharp';
export type StoolExtra = 'Blood' | 'Mucus' | 'Felt incomplete' | 'Photo';

export type TriggerSubtype = 'ate' | 'stress' | 'med' | 'sleep';

export interface BaseLog {
  id: string;
  ts: number;
}

export interface StoolLog extends BaseLog {
  type: 'stool';
  bristol: BristolType;
  urgency: Urgency | null;
  pain: Pain | null;
  extras: StoolExtra[];
  photoUri?: string;
  note?: string;
}

export interface TriggerLog extends BaseLog {
  type: 'trigger';
  subtype: TriggerSubtype;
  tags: string[];
  note?: string;
  photoUri?: string;
  /** Indicates the user tapped "Finish this later" — entry is timestamped but partial. */
  draft: boolean;
}

export type Log = StoolLog | TriggerLog;

// `ts` is included so retroactive timestamp edits can flow through update() —
// the timestamp toggle on log screens needs to amend the draft entry's time.
export type LogPatch = Partial<Omit<StoolLog, 'id' | 'type'>> | Partial<Omit<TriggerLog, 'id' | 'type'>>;

export const BRISTOL_HIGH_THRESHOLD: BristolType = 5;
export const BRISTOL_LOW_THRESHOLD: BristolType = 1;

// --- Profile + validated questionnaires --------------------------------------

export type DietPattern =
  | 'standard'
  | 'mediterranean'
  | 'vegetarian'
  | 'vegan'
  | 'lowfodmap'
  | 'other';

export type ExerciseFrequency = 'rarely' | 'weekly_1_2' | 'weekly_3_4' | 'daily';
export type SleepDuration = 'under_5' | '5_to_6' | '7_to_8' | 'over_9';
export type AlcoholFrequency = 'none' | 'occasional' | 'weekly' | 'daily';

export type Region =
  | 'north_america'
  | 'uk_ireland'
  | 'europe'
  | 'latin_america'
  | 'middle_east'
  | 'africa'
  | 'south_asia'
  | 'east_asia'
  | 'other';

export interface Profile {
  age?: number;
  diet?: DietPattern;
  exercise?: ExerciseFrequency;
  sleep?: SleepDuration;
  alcohol?: AlcoholFrequency;
  region?: Region;
}

export type QuestionnaireType = 'ibs-sss' | 'sibdq';

export interface QuestionnaireResult {
  id: string;
  type: QuestionnaireType;
  ts: number;
  responses: number[]; // raw item responses, ordered by item index
  score: number; // computed total score
}

// --- Interactive activities (opt-in mini-games) ------------------------------

export type ActivityId =
  | 'self-trial'
  | 'bristol-quiz'
  | 'gi-visit-prep'
  | 'fodmap-basics'
  | 'stress-gut';

export interface SelfTrialPayload {
  candidate: string; // e.g. 'Dairy', 'Coffee', or a free-text label
  durationDays: 14 | 21 | 28;
  dailyCheckIns: Array<{ ts: number; avoided: boolean; feelingScore: number /* 1-5 */ }>;
  // Snapshot of the equivalent prior period for comparison after completion.
  priorPeriodFlareDays?: number;
  trialFlareDays?: number;
}

export interface BristolQuizPayload {
  // Array of {presented, answered} pairs in order. presented is the correct
  // Bristol type 1-7; answered is what the user picked.
  rounds: Array<{ presented: number; answered: number }>;
  score: number; // count correct
}

export type ActivityPayload = SelfTrialPayload | BristolQuizPayload | Record<string, never>;

export interface ActivityRun {
  id: string;
  activity: ActivityId;
  startTs: number;
  endTs?: number;
  completed: boolean;
  payload: ActivityPayload;
}
