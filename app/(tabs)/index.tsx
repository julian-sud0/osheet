import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Chip, Chips, Label, Pill } from '@/components/ui';
import { ContentTile } from '@/components/ContentTile';
import { StoryTile } from '@/components/StoryTile';
import { TipCard } from '@/components/TipCard';
import { WeatherScene } from '@/components/WeatherScene';
import { track } from '@/data/analytics';
import { useAppStore } from '@/data/store';
import { pickContextualTip } from '@/domain/tipSurfacing';
import type { Log } from '@/data/types';
import { TRIGGER_TYPES, type TriggerKey } from '@/domain/bristol';
import { patterns } from '@/domain/patterns';
import { dayNumber } from '@/domain/time';
import { gutWeatherState, weatherCopy } from '@/domain/weather';
import { colors, radii, shadows, spacing, type as tokenType } from '@/theme/tokens';

export default function Today() {
  const logs = useAppStore((s) => s.logs);
  const startedAt = useAppStore((s) => s.startedAt);
  const userMode = useAppStore((s) => s.userMode);
  const profile = useAppStore((s) => s.profile);
  const softProfilePromptDismissed = useAppStore((s) => s.softProfilePromptDismissed);
  const dismissSoftProfilePrompt = useAppStore((s) => s.dismissSoftProfilePrompt);
  const tipsDismissed = useAppStore((s) => s.tipsDismissed);
  const dismissTip = useAppStore((s) => s.dismissTip);
  const hasAnyProfile = Boolean(
    profile.age || profile.diet || profile.exercise || profile.sleep || profile.alcohol,
  );
  const showSoftPrompt = !hasAnyProfile && !softProfilePromptDismissed;
  const dayN = dayNumber(startedAt);
  const totalLogs = logs.length;
  const state = gutWeatherState(logs);
  // Lifted compute order: derive pattern result first so the weatherCopy
  // footer can honestly match what tapping the hero card will do.
  // `appointment` users get the first-pattern contract loosened — they don't have
  // time to wait for 5 logs before the product proves itself useful.
  const need = userMode === 'appointment' ? 3 : 5;
  const insightReady = totalLogs >= need;
  const pat = insightReady ? patterns(logs, userMode, profile) : null;
  const headlineCorrelation = pat?.strongest ?? pat?.watching ?? null;
  const showDoctorTile = userMode === 'appointment' && totalLogs >= 3;
  const topTag = insightReady && !headlineCorrelation ? topLoggedTag(logs) : null;
  // Contextual tip surfaced at most one at a time, gated by dismissed-set.
  const contextualTip = pickContextualTip(logs, userMode, startedAt, new Set(tipsDismissed));
  // Footer of the hero card honestly matches what tapping it will do:
  // with a correlation → /insight; without → /timeline.
  const copy = weatherCopy(logs, {
    mode: userMode,
    startedAt,
    hasCorrelation: !!headlineCorrelation,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Text style={tokenType.title}>Hi.</Text>
          <Pill label={`Day ${dayN} · ${totalLogs} log${totalLogs === 1 ? '' : 's'}`} />
        </View>

        {showSoftPrompt ? (
          <Card>
            <Label>Set your baseline</Label>
            <Text style={[tokenType.sub, { marginTop: 6, color: colors.cocoa }]}>
              90 seconds to share age, diet, and a quick symptom check. We&apos;ll fold the result
              into your doctor PDF.
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  track('soft_profile_prompt_accepted');
                  router.push('/profile');
                }}
                style={({ pressed }) => [styles.softCta, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.softCtaText}>Get started</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  track('soft_profile_prompt_dismissed');
                  dismissSoftProfilePrompt();
                }}
                style={({ pressed }) => [styles.softDismiss, pressed && { opacity: 0.6 }]}
              >
                <Text style={[tokenType.sub, { fontWeight: '500' }]}>Maybe later</Text>
              </Pressable>
            </View>
          </Card>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={headlineCorrelation ? 'Open pattern detail' : 'Open timeline'}
          onPress={() => {
            // Honest routing: if we have something to surface, take the user
            // to the pattern detail. Otherwise the timeline is the right
            // destination — and the footer copy below should match.
            if (headlineCorrelation) {
              router.push({ pathname: '/insight/[id]', params: { id: headlineCorrelation.id } });
            } else {
              router.push('/(tabs)/timeline');
            }
          }}
          style={[styles.weather, weatherTone(state)]}
        >
          <View style={StyleSheet.absoluteFill}>
            <WeatherScene state={state} />
          </View>
          <View style={styles.weatherContent}>
            <Text style={styles.weatherTitle}>
              {copy.title}
              {'\n'}
              <Text style={styles.weatherEm}>{copy.em}</Text>
            </Text>
            <Text style={styles.weatherFooter}>{copy.footer}</Text>
          </View>
        </Pressable>

        <StoryTile />

        <Card>
          <Label>Quick log</Label>
          <View style={{ marginTop: 12 }}>
            <Chips>
              {(Object.entries(TRIGGER_TYPES) as [TriggerKey, { icon: string; label: string }][]).map(
                ([k, v]) => (
                  <Chip
                    key={k}
                    label={`${v.icon} ${v.label}`}
                    onPress={() => router.push({ pathname: '/log/trigger', params: { kind: k } })}
                  />
                ),
              )}
            </Chips>
          </View>
        </Card>

        {insightReady && headlineCorrelation ? (
          <Card onPress={() => router.push({ pathname: '/insight/[id]', params: { id: headlineCorrelation.id } })}>
            <Label>{userMode === 'appointment' ? 'Early signal' : 'Watching'}</Label>
            <Text style={styles.insightHead}>
              {headlineCorrelation.triggerLabel} → {headlineCorrelation.outcomeLabel},{' '}
              {headlineCorrelation.hits} of {headlineCorrelation.n} times
            </Text>
            <Text style={[tokenType.sub, { fontSize: 12 }]}>Tap to see the entries.</Text>
            <View style={styles.bar}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.round((headlineCorrelation.hits / headlineCorrelation.n) * 100)}%` },
                ]}
              />
            </View>
          </Card>
        ) : insightReady ? (
          <StillWatchingCard topTag={topTag} freqPerDay={freqPerDayThisWeek(logs)} />
        ) : (
          <ProgressContract have={totalLogs} need={need} mode={userMode} />
        )}

        {showDoctorTile ? (
          <Card onPress={() => router.push('/export')}>
            <Label>For your doctor</Label>
            <Text style={styles.insightHead}>You have enough to bring →</Text>
            <Text style={[tokenType.sub, { fontSize: 12 }]}>
              Generate a clinician-ready PDF from your last {totalLogs} entries.
            </Text>
          </Card>
        ) : null}

        {contextualTip ? (
          <TipCard tip={contextualTip} onDismiss={() => dismissTip(contextualTip.id)} />
        ) : null}

        <ContentTile />
      </ScrollView>
    </View>
  );
}

function StillWatchingCard({
  topTag,
  freqPerDay,
}: {
  topTag: { tag: string; count: number } | null;
  freqPerDay: number;
}) {
  return (
    <Card tone="fog">
      <Label>Still watching</Label>
      <Text style={{ fontFamily: tokenType.section.fontFamily, fontSize: 16, marginVertical: 8 }}>
        {topTag
          ? `Most-logged so far: ${topTag.tag} · ${topTag.count}×`
          : 'You have stool data but no triggers yet.'}
      </Text>
      <Text style={[tokenType.sub, { fontSize: 13 }]}>
        {topTag
          ? "A real pattern needs a few flare days alongside the triggers before it surfaces. Keep logging when you eat or feel something distinctive."
          : 'Quick-log a meal or stress event to unlock connections.'}
      </Text>
      <Text style={[tokenType.sub, { fontSize: 12, marginTop: 8, fontStyle: 'italic' }]}>
        Averaging {freqPerDay} log{freqPerDay === 1 ? '' : 's'} per day this week.
      </Text>
    </Card>
  );
}

function topLoggedTag(logs: Log[]): { tag: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const l of logs) {
    if (l.type !== 'trigger') continue;
    for (const t of l.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  let best: { tag: string; count: number } | null = null;
  for (const [tag, count] of counts.entries()) {
    if (!best || count > best.count) best = { tag, count };
  }
  return best;
}

function freqPerDayThisWeek(logs: Log[]): number {
  const week = Date.now() - 7 * 86400000;
  const recent = logs.filter((l) => l.ts >= week).length;
  return Math.round((recent / 7) * 10) / 10;
}

function ProgressContract({
  have,
  need,
  mode,
}: {
  have: number;
  need: number;
  mode: 'exploring' | 'appointment' | 'diagnosed';
}) {
  const pct = Math.min(100, (have / need) * 100);
  const remaining = Math.max(0, need - have);
  const headline =
    mode === 'appointment'
      ? `${remaining} more log${remaining === 1 ? '' : 's'} and you'll have enough to bring.`
      : mode === 'diagnosed'
      ? 'Still finding your patterns.'
      : `${remaining} more log${remaining === 1 ? '' : 's'} to start spotting connections.`;
  return (
    <Card tone="fog">
      <Label>{mode === 'appointment' ? 'For your doctor' : 'Your first pattern'}</Label>
      <Text style={{ fontFamily: tokenType.section.fontFamily, fontSize: 16, marginVertical: 8 }}>
        {headline}
      </Text>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
    </Card>
  );
}

function weatherTone(state: 'calm' | 'mixed' | 'flare') {
  switch (state) {
    case 'calm':
      return { backgroundColor: colors.sageLight };
    case 'mixed':
      return { backgroundColor: '#d4dde6' };
    case 'flare':
      return { backgroundColor: colors.terraLight };
  }
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: 24, gap: 14, paddingBottom: 120 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  weather: {
    height: 220,
    borderRadius: 26,
    overflow: 'hidden',
    ...shadows.card,
    justifyContent: 'space-between',
    padding: 18,
  },
  weatherContent: { flex: 1, justifyContent: 'space-between' },
  weatherTitle: {
    fontFamily: tokenType.section.fontFamily,
    fontSize: 22,
    lineHeight: 26,
    maxWidth: 240,
    color: colors.cocoa,
  },
  weatherEm: { fontStyle: 'italic', color: colors.terraDark },
  weatherFooter: { fontSize: 12, color: colors.cocoa2 },

  insightHead: {
    fontFamily: tokenType.section.fontFamily,
    fontSize: 17,
    marginVertical: 8,
    color: colors.cocoa,
  },

  bar: { height: 6, backgroundColor: colors.fog, borderRadius: radii.pill, overflow: 'hidden', marginTop: 10 },
  barFill: { height: '100%', backgroundColor: colors.sage, borderRadius: radii.pill },

  softCta: {
    backgroundColor: colors.cocoa,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
  },
  softCtaText: { color: colors.cream, fontWeight: '600', fontSize: 13 },
  softDismiss: { paddingVertical: 10, paddingHorizontal: 12 },
});
