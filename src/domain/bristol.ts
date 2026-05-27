/**
 * Bristol Stool Scale reference data.
 * Ported from index.html:232-240.
 *
 * Color band roughly maps clinical concern:
 *   blue  = constipated end (Types 1, 2)
 *   sage  = healthy range   (Types 3, 4, 5)
 *   terra = loose / urgent  (Types 6, 7)
 */

import type { BristolType } from '@/data/types';

export type BristolColor = 'blue' | 'sage' | 'terra';

export interface BristolEntry {
  n: BristolType;
  name: string;
  desc: string;
  color: BristolColor;
}

export const BRISTOL: readonly BristolEntry[] = [
  { n: 1, name: 'Separate hard lumps', desc: 'Like little nuts, hard to pass.', color: 'blue' },
  { n: 2, name: 'Lumpy sausage', desc: 'Sausage-shaped but lumpy.', color: 'blue' },
  { n: 3, name: 'Cracked log', desc: 'Sausage with surface cracks.', color: 'sage' },
  { n: 4, name: 'Smooth & formed', desc: 'Soft, easy to pass. The textbook one.', color: 'sage' },
  { n: 5, name: 'Soft pieces', desc: 'Soft blobs with clear edges.', color: 'sage' },
  { n: 6, name: 'Mushy, ragged', desc: 'Fluffy with ragged edges. Mushy.', color: 'terra' },
  { n: 7, name: 'Liquid', desc: 'Entirely liquid, no solid pieces.', color: 'terra' },
];

export function bristolByType(n: BristolType): BristolEntry {
  return BRISTOL[n - 1];
}

export const TRIGGER_TYPES = {
  ate: { icon: '🍽', label: 'Just ate' },
  stress: { icon: '😣', label: 'Stressed' },
  med: { icon: '💊', label: 'Med taken' },
  sleep: { icon: '😴', label: 'Slept poorly' },
} as const;

export type TriggerKey = keyof typeof TRIGGER_TYPES;

export const COMMON_FOOD_TAGS = [
  'Dairy',
  'Gluten',
  'Spicy',
  'Coffee',
  'Alcohol',
  'Eating out',
  'Fiber',
  'Sugar',
] as const;

// Generic categories with the most common brand/molecule in parens, so one tap
// is enough but the user recognises what each category covers. Brand names are
// disambiguation aids only; the stored tag is this whole string so the
// pattern engine can group consistently.
export const COMMON_MEDS = [
  'Anti-diarrhoeal (Loperamide)',
  'Antispasmodic (Mebeverine / Buscopan)',
  '5-ASA (Mesalazine)',
  'Laxative (Movicol / Senna)',
  'Probiotic',
  'PPI (Omeprazole)',
] as const;
