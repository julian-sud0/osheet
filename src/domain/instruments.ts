/**
 * Validated questionnaire definitions. Each instrument is a list of items;
 * each item is rendered as one journey screen (question + why-we-ask + input
 * + after-answer reveal).
 *
 * IBS-SSS — IBS Symptom Severity Score. 5 items, 0-100 visual analog per
 * item, total 0-500. Original ref: Francis CY et al, 1997.
 * SIBDQ — Short IBDQ. 10 items, 1-7 Likert per item, total 10-70 (higher
 * is better QoL). Original ref: Irvine EJ et al, 1996.
 */

export type InstrumentId = 'ibs-sss' | 'sibdq';

export interface Item {
  prompt: string;
  why: string; // short "why we ask" line shown before answer
  reveal: string; // "what this measures" reveal shown after answer
  input:
    | { type: 'slider'; min: 0; max: 100; lowLabel: string; highLabel: string }
    | { type: 'likert'; min: 1; max: 7; labels: [string, string] };
}

export interface Instrument {
  id: InstrumentId;
  title: string;
  scaleSummary: string;
  items: Item[];
  scoreRange: [number, number];
  scoreLabel: (score: number) => string;
}

const IBS_SSS_ITEMS: Item[] = [
  {
    prompt: 'How severe has your abdominal pain been over the last 10 days?',
    why: 'Pain severity is the strongest single predictor of how disruptive symptoms have been.',
    reveal: 'Scored 0–100, the visual analog scale gastroenterologists use.',
    input: { type: 'slider', min: 0, max: 100, lowLabel: 'No pain', highLabel: 'Worst imaginable' },
  },
  {
    prompt: 'On how many of the last 10 days did you have abdominal pain?',
    why: 'Frequency and severity tell different stories — they are scored separately.',
    reveal: 'Contributes 0–100 points to the total (each day = 10 points).',
    input: { type: 'slider', min: 0, max: 100, lowLabel: '0 days', highLabel: 'All 10 days' },
  },
  {
    prompt: 'How severe has your bloating or distension been?',
    why: 'Distention is one of the most-reported symptoms in IBS and tracks separately from pain.',
    reveal: 'Adds another 0–100 to the total. Pain and bloating commonly co-vary.',
    input: { type: 'slider', min: 0, max: 100, lowLabel: 'No bloating', highLabel: 'Worst imaginable' },
  },
  {
    prompt: 'How dissatisfied have you been with your bowel habits?',
    why: 'Bowel habit dissatisfaction reflects the lived experience of unpredictability.',
    reveal: 'Adds 0–100 to the total.',
    input: { type: 'slider', min: 0, max: 100, lowLabel: 'Not at all', highLabel: 'Extremely' },
  },
  {
    prompt: 'How much have your symptoms interfered with your life?',
    why: 'The single best summary item for how much your gut is affecting day-to-day function.',
    reveal: 'Final 0–100 component. Total IBS-SSS score is the sum of all five.',
    input: { type: 'slider', min: 0, max: 100, lowLabel: 'Not at all', highLabel: 'Completely' },
  },
];

const SIBDQ_ITEMS: Item[] = [
  {
    prompt: 'How often have you felt tired or worn out in the last two weeks?',
    why: 'Fatigue is one of the most reported quality-of-life impacts of IBD.',
    reveal: 'Scored 1 (all of the time) to 7 (none of the time). Higher = better.',
    input: { type: 'likert', min: 1, max: 7, labels: ['All the time', 'None of the time'] },
  },
  {
    prompt: 'How frequently have your bowel movements been a problem?',
    why: 'A core IBD QoL anchor.',
    reveal: 'Scored 1 (constant problem) to 7 (no problem).',
    input: { type: 'likert', min: 1, max: 7, labels: ['Constant', 'No problem'] },
  },
  {
    prompt: 'How depressed or discouraged have you been feeling?',
    why: 'Mood and gut symptoms are bidirectionally linked — tracking both is standard.',
    reveal: 'Scored 1 (extremely) to 7 (not at all).',
    input: { type: 'likert', min: 1, max: 7, labels: ['Extremely', 'Not at all'] },
  },
  {
    prompt: 'How often have you been unable to attend school, work, or social events?',
    why: 'Functional impact captures the lived cost of the condition.',
    reveal: 'Scored 1 (all of the time) to 7 (none of the time).',
    input: { type: 'likert', min: 1, max: 7, labels: ['All the time', 'None of the time'] },
  },
  {
    prompt: 'How much trouble have you had with cramping?',
    why: 'Cramping is one of the most disruptive IBD symptoms and tracks separately from pain.',
    reveal: 'Scored 1 (a great deal) to 7 (none).',
    input: { type: 'likert', min: 1, max: 7, labels: ['A great deal', 'None'] },
  },
  {
    prompt: 'How relaxed and free of tension have you been?',
    why: 'Tension levels are often elevated during flares.',
    reveal: 'Scored 1 (not at all) to 7 (completely).',
    input: { type: 'likert', min: 1, max: 7, labels: ['Not at all', 'Completely'] },
  },
  {
    prompt: 'How often has gas or passing wind been a problem?',
    why: 'A discrete symptom that contributes substantially to social burden.',
    reveal: 'Scored 1 (constant problem) to 7 (no problem).',
    input: { type: 'likert', min: 1, max: 7, labels: ['Constant', 'No problem'] },
  },
  {
    prompt: 'How often have you felt impatient or restless?',
    why: 'Tracks irritability and mood, which interact with gut symptoms.',
    reveal: 'Scored 1 (all of the time) to 7 (none of the time).',
    input: { type: 'likert', min: 1, max: 7, labels: ['All the time', 'None of the time'] },
  },
  {
    prompt: 'How often have accidents or fears of accidents been on your mind?',
    why: 'Anticipatory anxiety around bowel control affects daily decisions.',
    reveal: 'Scored 1 (all of the time) to 7 (none of the time).',
    input: { type: 'likert', min: 1, max: 7, labels: ['All the time', 'None of the time'] },
  },
  {
    prompt: 'How upset have you been by your symptoms?',
    why: 'The emotional weight of symptoms, separate from their physical severity.',
    reveal: 'Scored 1 (extremely) to 7 (not at all). Final item — total SIBDQ is the sum.',
    input: { type: 'likert', min: 1, max: 7, labels: ['Extremely', 'Not at all'] },
  },
];

export const INSTRUMENTS: Record<InstrumentId, Instrument> = {
  'ibs-sss': {
    id: 'ibs-sss',
    title: 'IBS-SSS — Symptom Severity Score',
    scaleSummary: '5 questions · about 90 seconds · 0–500 score',
    items: IBS_SSS_ITEMS,
    scoreRange: [0, 500],
    scoreLabel: (score) => {
      if (score < 75) return 'in remission';
      if (score < 175) return 'mild';
      if (score < 300) return 'moderate';
      return 'severe';
    },
  },
  sibdq: {
    id: 'sibdq',
    title: 'SIBDQ — Quality of Life',
    scaleSummary: '10 questions · about 2 minutes · 10–70 score',
    items: SIBDQ_ITEMS,
    scoreRange: [10, 70],
    scoreLabel: (score) => {
      if (score < 30) return 'severely impacted';
      if (score < 50) return 'moderately impacted';
      if (score < 60) return 'mildly impacted';
      return 'good quality of life';
    },
  },
};

export function computeScore(id: InstrumentId, responses: number[]): number {
  if (id === 'ibs-sss') return responses.reduce((a, b) => a + b, 0);
  // SIBDQ: sum (each item 1-7 → total 10-70). Already aligned: higher = better.
  return responses.reduce((a, b) => a + b, 0);
}
