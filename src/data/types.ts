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
  /** Indicates the user tapped "Finish this later" — entry is timestamped but partial. */
  draft: boolean;
}

export type Log = StoolLog | TriggerLog;

export type LogPatch = Partial<Omit<StoolLog, 'id' | 'ts' | 'type'>> | Partial<Omit<TriggerLog, 'id' | 'ts' | 'type'>>;

export const BRISTOL_HIGH_THRESHOLD: BristolType = 5;
export const BRISTOL_LOW_THRESHOLD: BristolType = 1;
