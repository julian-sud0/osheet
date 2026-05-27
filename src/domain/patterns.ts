import type { AlcoholFrequency, Log, Profile, StoolLog, TriggerLog } from '@/data/types';
import type { UserMode } from '@/data/store';

interface Thresholds {
  strongestMinN: number;
  strongestMinRatio: number;
  watchingMinN: number;
  watchingMinRatio: number;
}

const THRESHOLDS: Record<UserMode, Thresholds> = {
  // Default: pre-conclusion, evidence-y
  exploring: { strongestMinN: 4, strongestMinRatio: 0.75, watchingMinN: 2, watchingMinRatio: 0.5 },
  // Appointment: surface early signals to bring to the doctor
  appointment: { strongestMinN: 3, strongestMinRatio: 0.7, watchingMinN: 2, watchingMinRatio: 0.5 },
  // Recently diagnosed: don't over-claim, but allow loose patterns to surface as "watching"
  diagnosed: { strongestMinN: 3, strongestMinRatio: 0.65, watchingMinN: 2, watchingMinRatio: 0.5 },
};

/**
 * Correlation engine. Replaces the prototype's hardcoded
 * "Dairy → mushy stool, 4 of 4 times" (index.html:399-408, 660-670, 822-828)
 * with one function that computes correlations from real logs.
 *
 * The same output feeds the Patterns list view AND the Insight detail view —
 * no hardcoded entries anywhere downstream.
 */

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export interface CorrelationEntry {
  stoolTs: number;
  triggerTs: number;
  triggerLabel: string;
  delayMs: number;
}

export interface Correlation {
  /** Stable id used for routing: "tag:Dairy" or "subtype:stress" */
  id: string;
  triggerLabel: string; // e.g. "Dairy"
  triggerKind: 'tag' | 'subtype';
  outcomeLabel: string; // e.g. "mushy stool" or "urgency episode"
  n: number; // total trigger occurrences considered
  hits: number; // occurrences followed by the outcome within window
  confidence: 'high' | 'moderate' | 'low';
  entries: CorrelationEntry[];
}

export interface FrequencyTrend {
  thisWeekPerDay: number;
  lastWeekPerDay: number;
  delta: number; // positive = increase
}

export interface PatternsOutput {
  strongest?: Correlation;
  watching?: Correlation;
  frequencyTrend: FrequencyTrend;
  alcoholWatch?: AlcoholWatch;
}

export interface AlcoholWatch {
  declared: AlcoholFrequency;
  flareDaysLast14: number;
  flaresAfterAlcohol: number;
  alcoholLogsLast14: number;
}

function describeAteSubject(trigger: TriggerLog): string {
  if (trigger.tags.length > 0) return trigger.tags.join(', ');
  if (trigger.note) return trigger.note;
  return 'A meal';
}

/**
 * Builds tag-based correlations: for each food tag, how often does eating
 * something with that tag get followed by a high-Bristol stool within 6h?
 */
function tagCorrelations(logs: Log[]): Correlation[] {
  const triggers = logs.filter((l): l is TriggerLog => l.type === 'trigger' && l.subtype === 'ate');
  const stools = logs.filter((l): l is StoolLog => l.type === 'stool');

  const byTag = new Map<string, TriggerLog[]>();
  for (const t of triggers) {
    for (const tag of t.tags) {
      const arr = byTag.get(tag) ?? [];
      arr.push(t);
      byTag.set(tag, arr);
    }
  }

  const results: Correlation[] = [];
  for (const [tag, tagTriggers] of byTag.entries()) {
    const entries: CorrelationEntry[] = [];
    let hits = 0;
    for (const t of tagTriggers) {
      const followingStool = stools.find(
        (s) => s.ts > t.ts && s.ts - t.ts <= SIX_HOURS_MS,
      );
      if (followingStool && followingStool.bristol >= 5) {
        hits++;
        entries.push({
          stoolTs: followingStool.ts,
          triggerTs: t.ts,
          triggerLabel: `${tag} at ${formatHm(t.ts)}`,
          delayMs: followingStool.ts - t.ts,
        });
      }
    }
    const n = tagTriggers.length;
    if (n === 0) continue;
    const ratio = hits / n;
    const confidence: Correlation['confidence'] =
      n >= 4 && ratio >= 0.75 ? 'high' : n >= 3 && ratio >= 0.5 ? 'moderate' : 'low';
    results.push({
      id: `tag:${tag}`,
      triggerLabel: tag,
      triggerKind: 'tag',
      outcomeLabel: 'mushy stool',
      n,
      hits,
      confidence,
      entries: entries.sort((a, b) => b.stoolTs - a.stoolTs),
    });
  }
  return results;
}

function stressCorrelation(logs: Log[]): Correlation | null {
  const triggers = logs.filter(
    (l): l is TriggerLog => l.type === 'trigger' && l.subtype === 'stress',
  );
  if (triggers.length === 0) return null;
  const stools = logs.filter((l): l is StoolLog => l.type === 'stool');
  const entries: CorrelationEntry[] = [];
  let hits = 0;
  for (const t of triggers) {
    const within = stools.find((s) => s.ts > t.ts && s.ts - t.ts <= SIX_HOURS_MS);
    if (within && (within.urgency === "Couldn't wait" || within.urgency === 'A bit')) {
      hits++;
      entries.push({
        stoolTs: within.ts,
        triggerTs: t.ts,
        triggerLabel: `Stress at ${formatHm(t.ts)}`,
        delayMs: within.ts - t.ts,
      });
    }
  }
  const n = triggers.length;
  const ratio = hits / n;
  const confidence: Correlation['confidence'] =
    n >= 4 && ratio >= 0.75 ? 'high' : n >= 3 && ratio >= 0.5 ? 'moderate' : 'low';
  return {
    id: 'subtype:stress',
    triggerLabel: 'Stress',
    triggerKind: 'subtype',
    outcomeLabel: 'urgency episode',
    n,
    hits,
    confidence,
    entries: entries.sort((a, b) => b.stoolTs - a.stoolTs),
  };
}

export function patterns(logs: Log[], mode: UserMode = 'exploring', profile?: Profile): PatternsOutput {
  const t = THRESHOLDS[mode];
  const candidates: Correlation[] = [
    ...tagCorrelations(logs),
    ...(stressCorrelation(logs) ? [stressCorrelation(logs)!] : []),
  ];

  // Rank by hits desc, then by ratio desc.
  candidates.sort((a, b) => {
    if (b.hits !== a.hits) return b.hits - a.hits;
    return b.hits / b.n - a.hits / a.n;
  });

  const strongest = candidates.find((c) => c.n >= t.strongestMinN && c.hits / c.n >= t.strongestMinRatio);
  const watching = candidates.find(
    (c) => c !== strongest && c.n >= t.watchingMinN && c.hits / c.n >= t.watchingMinRatio,
  );

  return {
    strongest,
    watching,
    frequencyTrend: frequencyTrend(logs),
    alcoholWatch: alcoholWatch(logs, profile),
  };
}

function alcoholWatch(logs: Log[], profile?: Profile): AlcoholWatch | undefined {
  if (!profile?.alcohol || profile.alcohol === 'none' || profile.alcohol === 'occasional') return undefined;
  const cutoff = Date.now() - 14 * 86400000;
  const recentStools = logs.filter((l): l is StoolLog => l.type === 'stool' && l.ts >= cutoff);
  const flares = recentStools.filter((s) => s.bristol >= 5);
  if (flares.length < 3) return undefined;
  const alcoholLogs = logs.filter(
    (l) => l.ts >= cutoff && l.type === 'trigger' && (l as TriggerLog).tags.includes('Alcohol'),
  );
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const flaresAfterAlcohol = flares.filter((f) =>
    alcoholLogs.some((a) => a.ts < f.ts && f.ts - a.ts <= ONE_DAY),
  ).length;
  return {
    declared: profile.alcohol,
    flareDaysLast14: flares.length,
    flaresAfterAlcohol,
    alcoholLogsLast14: alcoholLogs.length,
  };
}

/**
 * Returns the top trigger tags being observed even when none has cleared the
 * strongest/watching thresholds yet. Used by the "Still watching" surface
 * on Patterns to honour the user's contribution before a real pattern emerges.
 */
export function hypothesesBelowThreshold(logs: Log[], maxCount = 3): Correlation[] {
  const candidates = [
    ...tagCorrelations(logs),
    ...(stressCorrelation(logs) ? [stressCorrelation(logs)!] : []),
  ];
  // Already filtered above threshold? show those last. Surface tags with
  // some hits first, then most-frequent tags.
  candidates.sort((a, b) => {
    if (b.hits !== a.hits) return b.hits - a.hits;
    return b.n - a.n;
  });
  return candidates.slice(0, maxCount);
}

export function findCorrelationById(logs: Log[], id: string, mode: UserMode = 'exploring'): Correlation | undefined {
  const { strongest, watching } = patterns(logs, mode);
  if (strongest?.id === id) return strongest;
  if (watching?.id === id) return watching;
  // Allow direct lookup even when not surfaced as strongest/watching.
  return [...tagCorrelations(logs), ...(stressCorrelation(logs) ? [stressCorrelation(logs)!] : [])].find(
    (c) => c.id === id,
  );
}

function frequencyTrend(logs: Log[]): FrequencyTrend {
  const now = Date.now();
  const week = 7 * 86400000;
  const thisWeek = logs.filter((l) => l.type === 'stool' && now - l.ts <= week).length;
  const lastWeek = logs.filter(
    (l) => l.type === 'stool' && now - l.ts > week && now - l.ts <= 2 * week,
  ).length;
  return {
    thisWeekPerDay: round1(thisWeek / 7),
    lastWeekPerDay: round1(lastWeek / 7),
    delta: round1(thisWeek / 7 - lastWeek / 7),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function formatHm(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
