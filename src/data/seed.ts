import { useAppStore } from './store';
import type { StoolLog, TriggerLog } from './types';

/**
 * Loads the prototype's "Week 3 with real data" demo state.
 * Mirrors index.html:935-980 — 14 stool logs + triggers across 7 days,
 * with a deliberate Dairy→mushy correlation seeded in.
 *
 * Wired to the dev-only D shortcut on web and a hidden button on You.
 */
export async function loadDemoData(): Promise<void> {
  const store = useAppStore.getState();
  await store.clearLogs();

  const now = Date.now();
  const seed: Array<
    | { dayAgo: number; hour: number; bristol: number; urgency?: string; pain?: string; extras?: string[] }
    | { dayAgo: number; hour: number; type: 'trigger'; sub: 'ate' | 'stress' | 'med' | 'sleep'; tags?: string[] }
  > = [
    { dayAgo: 6, hour: 9, bristol: 3 },
    { dayAgo: 6, hour: 19, type: 'trigger', sub: 'stress' },
    { dayAgo: 5, hour: 8, type: 'trigger', sub: 'ate', tags: ['Dairy'] },
    { dayAgo: 5, hour: 11, bristol: 5 },
    { dayAgo: 5, hour: 22, bristol: 4 },
    { dayAgo: 4, hour: 7, type: 'trigger', sub: 'ate', tags: ['Dairy', 'Coffee'] },
    { dayAgo: 4, hour: 9, bristol: 5, urgency: 'A bit' },
    { dayAgo: 3, hour: 8, bristol: 3 },
    { dayAgo: 3, hour: 14, type: 'trigger', sub: 'ate', tags: ['Gluten'] },
    { dayAgo: 3, hour: 18, bristol: 6 },
    { dayAgo: 2, hour: 9, bristol: 4 },
    { dayAgo: 2, hour: 20, type: 'trigger', sub: 'stress' },
    { dayAgo: 1, hour: 8, type: 'trigger', sub: 'ate', tags: ['Dairy'] },
    { dayAgo: 1, hour: 9, bristol: 5, urgency: 'A bit', pain: 'Mild' },
    { dayAgo: 1, hour: 19, bristol: 5 },
    { dayAgo: 0, hour: 8, type: 'trigger', sub: 'ate', tags: ['Dairy'] },
    { dayAgo: 0, hour: 9, bristol: 5, urgency: 'A bit', pain: 'Moderate' },
  ];

  for (const s of seed) {
    const ts = now - s.dayAgo * 86400000;
    const d = new Date(ts);
    d.setHours(s.hour, 0, 0, 0);
    if ('type' in s) {
      const trigger: Omit<TriggerLog, 'id'> = {
        type: 'trigger',
        subtype: s.sub,
        tags: s.tags ?? [],
        draft: false,
        ts: d.getTime(),
      };
      await store.addLog(trigger);
    } else {
      const stool: Omit<StoolLog, 'id'> = {
        type: 'stool',
        bristol: s.bristol as 1 | 2 | 3 | 4 | 5 | 6 | 7,
        urgency: (s.urgency as 'None' | 'A bit' | "Couldn't wait" | undefined) ?? null,
        pain: (s.pain as 'None' | 'Mild' | 'Moderate' | 'Sharp' | undefined) ?? null,
        extras: (s.extras ?? []) as ('Blood' | 'Mucus' | 'Felt incomplete' | 'Photo')[],
        ts: d.getTime(),
      };
      await store.addLog(stool);
    }
  }
}
