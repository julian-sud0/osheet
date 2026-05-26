import type { Log, StoolLog } from '@/data/types';
import type { UserMode } from '@/data/store';

/**
 * Derives gut weather state + copy from real log history.
 * Replaces the prototype's hardcoded "Dairy seems to land hard" (index.html:315)
 * with copy derived from the user's actual co-occurring trigger tags.
 */

export type WeatherState = 'calm' | 'mixed' | 'flare';

export function gutWeatherState(logs: Log[]): WeatherState {
  const recentStools = logs
    .filter((l): l is StoolLog => l.type === 'stool')
    .slice(-7);
  if (recentStools.length === 0) return 'calm';
  const flareTypes = recentStools.filter((l) => l.bristol >= 5 || l.bristol <= 1).length;
  const ratio = flareTypes / recentStools.length;
  if (ratio >= 0.5) return 'flare';
  if (ratio >= 0.25) return 'mixed';
  return 'calm';
}

export interface WeatherCopy {
  title: string;
  em: string;
  footer: string;
}

/**
 * Finds the trigger tag that most often precedes a high-Bristol (>=5) stool
 * within 6 hours. Returns null if no tag shows a meaningful pattern.
 */
function topProblemTag(logs: Log[]): string | null {
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  const stoolFlares = logs.filter(
    (l): l is StoolLog => l.type === 'stool' && l.bristol >= 5,
  );
  if (stoolFlares.length === 0) return null;

  const tagHits = new Map<string, number>();
  for (const stool of stoolFlares) {
    const window = logs.filter(
      (l) =>
        l.type === 'trigger' &&
        l.subtype === 'ate' &&
        l.ts < stool.ts &&
        stool.ts - l.ts <= SIX_HOURS_MS,
    );
    const seen = new Set<string>();
    for (const trigger of window) {
      if (trigger.type !== 'trigger') continue;
      for (const tag of trigger.tags) {
        if (seen.has(tag)) continue;
        seen.add(tag);
        tagHits.set(tag, (tagHits.get(tag) ?? 0) + 1);
      }
    }
  }

  let best: { tag: string; n: number } | null = null;
  for (const [tag, n] of tagHits.entries()) {
    if (!best || n > best.n) best = { tag, n };
  }
  // Only surface if it cleared a small threshold — avoid weaponising a single
  // coincidence.
  if (!best || best.n < 2) return null;
  return best.tag;
}

const ONE_WEEK_MS = 7 * 86400000;

export function weatherCopy(
  logs: Log[],
  opts: { mode?: UserMode; startedAt?: number } = {},
): WeatherCopy {
  const state = gutWeatherState(logs);
  const stoolCount = logs.filter((l) => l.type === 'stool').length;
  const mode = opts.mode ?? 'exploring';
  const inEarlyDiagnosedWindow =
    mode === 'diagnosed' && opts.startedAt !== undefined && Date.now() - opts.startedAt < ONE_WEEK_MS;

  if (stoolCount === 0) {
    return {
      title: 'A gentle start.',
      em: 'Nothing logged yet.',
      footer: 'Tap the + to record your first entry.',
    };
  }

  // Diagnosed mode: hold space for the early-week noise rather than calling it
  // a flare. The data is real, but the narrative would be premature.
  if (inEarlyDiagnosedWindow && state !== 'calm') {
    return {
      title: 'Still settling in.',
      em: 'Early days are noisy by nature.',
      footer: `${stoolCount} entries · tap for the timeline`,
    };
  }

  if (state === 'calm') {
    return {
      title: 'Settling.',
      em: 'Mostly smooth this week.',
      footer: `${stoolCount} entries · last log just now`,
    };
  }

  if (state === 'mixed') {
    return {
      title: 'A mixed few days.',
      em: 'Some flare, some calm.',
      footer: `${stoolCount} entries · tap for the timeline`,
    };
  }

  const tag = topProblemTag(logs);
  return {
    title: 'Choppy lately.',
    em: tag ? `${tag} seems to land hard.` : 'A rough stretch.',
    footer: `${stoolCount} entries · tap to see the pattern`,
  };
}
