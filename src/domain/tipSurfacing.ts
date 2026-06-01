import tipsFile from '@/content/tips.json';
import type { Log, StoolLog, TriggerLog } from '@/data/types';
import type { UserMode } from '@/data/store';
import type { TipShape } from '@/components/TipCard';

interface TipDef extends TipShape {
  surfacedWhen: string[];
}

const TIPS: TipDef[] = tipsFile.tips as TipDef[];

/**
 * Returns the most relevant un-dismissed tip for the current user state, or
 * null when nothing meaningful applies. Order of preference:
 *
 *   1. Safety-flavoured tips (blood logged → blood-in-stool tip)
 *   2. Recent-event tips (Type 7 logged → bristol-6-7 tip)
 *   3. Mode/duration tips (pre-diagnosis 14+ days → when-to-see-GI)
 *   4. Generic education
 *
 * No automatic targeting copy — the surfaced card just says "Worth reading".
 * The user never sees the surfacing logic.
 */
export function pickContextualTip(
  logs: Log[],
  mode: UserMode,
  startedAt: number,
  dismissed: Set<string>,
): TipShape | null {
  const activeTriggers = computeActiveTriggers(logs, mode, startedAt);
  // Score each tip: number of its `surfacedWhen` triggers currently active.
  let best: { tip: TipDef; score: number } | null = null;
  for (const tip of TIPS) {
    if (dismissed.has(tip.id)) continue;
    const score = tip.surfacedWhen.filter((t) => activeTriggers.has(t)).length;
    if (score === 0) continue;
    if (!best || score > best.score) best = { tip, score };
  }
  return best?.tip ?? null;
}

function computeActiveTriggers(
  logs: Log[],
  mode: UserMode,
  startedAt: number,
): Set<string> {
  const triggers = new Set<string>();
  const now = Date.now();
  const dayMs = 86400000;

  // Recent-event triggers — last 24h
  const recent = logs.filter((l) => now - l.ts <= dayMs);
  for (const l of recent) {
    if (l.type === 'stool') {
      const s = l as StoolLog;
      if (s.bristol === 7) triggers.add('type_7_logged');
      if (s.bristol === 6) triggers.add('type_6_logged');
      if (s.extras.includes('Blood')) triggers.add('blood_logged');
    }
  }

  // Trigger-count triggers — last 7 days
  const weekAgo = now - 7 * dayMs;
  const recentTriggers = logs.filter((l) => l.type === 'trigger' && l.ts >= weekAgo) as TriggerLog[];
  const stressCount = recentTriggers.filter((t) => t.subtype === 'stress').length;
  if (stressCount >= 2) triggers.add('stress_trigger_week');

  // Flare-week trigger: ≥3 high-bristol stools in last 7 days
  const flareCount = logs.filter(
    (l) => l.type === 'stool' && (l as StoolLog).bristol >= 5 && l.ts >= weekAgo,
  ).length;
  if (flareCount >= 3) triggers.add('flare_week');

  // Food correlation watch — heuristic: ≥2 distinct tagged trigger types
  const tagsThisMonth = new Set(
    recentTriggers
      .filter((t) => t.subtype === 'ate')
      .flatMap((t) => t.tags),
  );
  if (tagsThisMonth.size >= 3) triggers.add('food_correlations_watched');

  // Mode/duration triggers
  if (mode === 'exploring') {
    triggers.add('exploring_user');
    if (Date.now() - startedAt >= 14 * dayMs) triggers.add('exploring_14_days');
    triggers.add('pre_diagnosis');
  }
  if (mode === 'appointment') triggers.add('appointment_mode');
  if (mode === 'diagnosed') triggers.add('diagnosed_mode');

  return triggers;
}
