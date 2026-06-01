import type { Log } from '@/data/types';

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toTimeString().slice(0, 5);
}

export function dayNumber(startedAt: number): number {
  return Math.max(1, Math.floor((Date.now() - startedAt) / 86400000) + 1);
}

export interface DayGroup {
  label: string;
  logs: Log[];
}

export function groupLogsByDay(logs: Log[]): DayGroup[] {
  const groups = new Map<string, Log[]>();
  // Walk newest-first so the within-day order is reverse-chronological.
  for (const l of [...logs].sort((a, b) => b.ts - a.ts)) {
    const key = new Date(l.ts).toDateString();
    const arr = groups.get(key) ?? [];
    arr.push(l);
    groups.set(key, arr);
  }

  const today = new Date().toDateString();
  return Array.from(groups.entries()).map(([key, dayLogs]) => {
    let label: string;
    if (key === today) {
      label = 'Today';
    } else {
      const days = Math.round((Date.now() - new Date(key).getTime()) / 86400000);
      if (days === 1) label = 'Yesterday';
      else label = new Date(key).toLocaleDateString(undefined, { weekday: 'long' });
    }
    return { label, logs: dayLogs };
  });
}
