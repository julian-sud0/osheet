import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Card, Chip, Chips, Label, TopBar } from '@/components/ui';
import { track } from '@/data/analytics';
import { useAppStore } from '@/data/store';
import type { ActivityRun, SelfTrialPayload, StoolLog } from '@/data/types';
import { colors, radii, spacing, type as tokenType } from '@/theme/tokens';

/**
 * Self-trial: pick one suspected trigger, cut it for 14/21/28 days, see your
 * own data. Descriptive output only — never prescriptive.
 *
 * UX flow:
 *   1. Pick candidate (top-3 tags from logs + free-text "something else")
 *   2. Pick duration (14 / 21 / 28)
 *   3. Active trial — each day a check-in row (avoided yes/no + 1-5 feeling)
 *   4. Mid-trial cue at day 7
 *   5. On completion (last day reached / user marks complete), comparison
 *      against the equivalent prior period
 */
export function SelfTrial() {
  const logs = useAppStore((s) => s.logs);
  const activityRuns = useAppStore((s) => s.activityRuns);
  const startActivity = useAppStore((s) => s.startActivity);
  const updateActivity = useAppStore((s) => s.updateActivity);
  const completeActivity = useAppStore((s) => s.completeActivity);

  // Find any in-flight self-trial; only one at a time.
  const activeRun = useMemo(
    () => activityRuns.find((r) => r.activity === 'self-trial' && !r.completed),
    [activityRuns],
  );

  if (activeRun) {
    return <ActiveTrial run={activeRun} logs={logs} update={updateActivity} complete={completeActivity} />;
  }

  return <SetupTrial logs={logs} startActivity={startActivity} />;
}

// =============================== SETUP ===================================

function SetupTrial({
  logs,
  startActivity,
}: {
  logs: ReturnType<typeof useAppStore.getState>['logs'];
  startActivity: ReturnType<typeof useAppStore.getState>['startActivity'];
}) {
  const top3Tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of logs) {
      if (l.type !== 'trigger') continue;
      for (const t of l.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);
  }, [logs]);

  const [candidate, setCandidate] = useState<string>('');
  const [customCandidate, setCustomCandidate] = useState<string>('');
  const [duration, setDuration] = useState<14 | 21 | 28>(14);

  const effectiveCandidate = candidate === '__custom' ? customCandidate.trim() : candidate;
  const ready = !!effectiveCandidate && effectiveCandidate.length > 0;

  const begin = async () => {
    if (!ready) return;
    track('activity_started', { activity: 'self-trial', candidate: effectiveCandidate, duration });
    const payload: SelfTrialPayload = {
      candidate: effectiveCandidate,
      durationDays: duration,
      dailyCheckIns: [],
    };
    await startActivity('self-trial', payload);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <TopBar title="Self-trial" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={tokenType.title}>Pick one to cut out.</Text>
        <Text style={[tokenType.sub, { marginTop: 6 }]}>
          You&apos;ll avoid it for the duration, log a daily check-in, and we&apos;ll show your data
          compared to the equivalent prior period.
        </Text>

        <Card>
          <Label>What would you like to test?</Label>
          {top3Tags.length > 0 ? (
            <View style={{ marginTop: 12 }}>
              <Text style={[tokenType.sub, { fontSize: 12, marginBottom: 8 }]}>
                Your most-logged so far
              </Text>
              <Chips>
                {top3Tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    on={candidate === tag}
                    onPress={() => setCandidate(tag)}
                  />
                ))}
              </Chips>
            </View>
          ) : null}
          <View style={{ marginTop: 16 }}>
            <Text style={[tokenType.sub, { fontSize: 12, marginBottom: 8 }]}>Or something else</Text>
            <Pressable
              onPress={() => setCandidate('__custom')}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.customRow,
                candidate === '__custom' && styles.customRowOn,
                pressed && { opacity: 0.9 },
              ]}
            >
              <TextInput
                value={customCandidate}
                onChangeText={(t) => {
                  setCustomCandidate(t);
                  setCandidate('__custom');
                }}
                placeholder="e.g. spicy food, energy drinks"
                placeholderTextColor={colors.cocoa2}
                style={styles.customInput}
              />
            </Pressable>
          </View>
        </Card>

        <Card>
          <Label>How long?</Label>
          <View style={{ marginTop: 12, gap: 8 }}>
            {[
              { d: 14 as const, h: '14 days', sub: 'Quick hypothesis — enough for a clear signal on dietary triggers.' },
              { d: 21 as const, h: '21 days', sub: 'A bit more confidence; rules out short-cycle noise.' },
              { d: 28 as const, h: '28 days', sub: 'Closer to the duration used in clinically supervised protocols.' },
            ].map(({ d, h, sub }) => (
              <Pressable
                key={d}
                onPress={() => setDuration(d)}
                accessibilityRole="radio"
                accessibilityState={{ selected: duration === d }}
                style={({ pressed }) => [
                  styles.durationRow,
                  duration === d && styles.durationRowOn,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Text style={[styles.durationHeadline, duration === d && { color: colors.cream }]}>
                  {h}
                </Text>
                <Text style={[styles.durationSub, duration === d && { color: 'rgba(246,241,232,0.85)' }]}>
                  {sub}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card tone="fog">
          <Label>Important</Label>
          <Text style={[tokenType.sub, { marginTop: 6, color: colors.cocoa }]}>
            This is your own descriptive experiment — it doesn&apos;t replace a clinically
            supervised elimination diet. If you&apos;re considering a full low-FODMAP protocol or
            similar, work with your GI or a dietitian.
          </Text>
        </Card>

        <View style={{ height: 80 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button label={ready ? `Begin ${duration}-day trial` : 'Pick one to begin'} variant="sage" disabled={!ready} onPress={begin} />
      </View>
    </View>
  );
}

// =============================== ACTIVE ==================================

function ActiveTrial({
  run,
  logs,
  update,
  complete,
}: {
  run: ActivityRun;
  logs: StoolLog[] | ReturnType<typeof useAppStore.getState>['logs'];
  update: ReturnType<typeof useAppStore.getState>['updateActivity'];
  complete: ReturnType<typeof useAppStore.getState>['completeActivity'];
}) {
  const payload = run.payload as SelfTrialPayload;
  const dayMs = 86400000;
  const elapsed = Math.floor((Date.now() - run.startTs) / dayMs);
  const dayN = Math.min(payload.durationDays, elapsed + 1);
  const remaining = Math.max(0, payload.durationDays - elapsed);
  const todayKey = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
  const todayCheckIn = payload.dailyCheckIns.find(
    (c) => new Date(new Date(c.ts).setHours(0, 0, 0, 0)).getTime() === todayKey,
  );

  const [avoided, setAvoided] = useState<boolean | null>(todayCheckIn?.avoided ?? null);
  const [feeling, setFeeling] = useState<number | null>(todayCheckIn?.feelingScore ?? null);
  // Brief acknowledgement flash so the user sees the submit actually fired.
  const [justSaved, setJustSaved] = useState(false);

  const submitCheckIn = async () => {
    if (avoided === null || feeling === null) return;
    const nextCheckIns = [
      ...payload.dailyCheckIns.filter(
        (c) => new Date(new Date(c.ts).setHours(0, 0, 0, 0)).getTime() !== todayKey,
      ),
      { ts: Date.now(), avoided, feelingScore: feeling },
    ];
    const nextPayload: SelfTrialPayload = { ...payload, dailyCheckIns: nextCheckIns };
    track('activity_step_completed', { activity: 'self-trial', day: dayN });
    await update(run.id, { payload: nextPayload });
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1400);
  };

  const finishTrial = async () => {
    // Compute the flare-day comparison: flares during trial vs flares in the
    // equivalent prior period.
    const trialStart = run.startTs;
    const trialEnd = trialStart + payload.durationDays * dayMs;
    const priorStart = trialStart - payload.durationDays * dayMs;
    const flaresInRange = (start: number, end: number) =>
      (logs as StoolLog[])
        .filter((l) => l.type === 'stool' && l.ts >= start && l.ts < end)
        .filter((s) => (s as StoolLog).bristol >= 5).length;
    const trialFlareDays = flaresInRange(trialStart, trialEnd);
    const priorPeriodFlareDays = flaresInRange(priorStart, trialStart);
    const finalPayload: SelfTrialPayload = {
      ...payload,
      trialFlareDays,
      priorPeriodFlareDays,
    };
    track('activity_completed', { activity: 'self-trial', trialFlareDays, priorPeriodFlareDays });
    await complete(run.id, finalPayload);
  };

  const trialComplete = elapsed >= payload.durationDays;

  if (trialComplete) {
    return <CompletionView run={run} payload={payload} onFinalise={finishTrial} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <TopBar
        title={`Trial: ${payload.candidate}`}
        subtitle={`Day ${dayN} of ${payload.durationDays}`}
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={tokenType.title}>Today&apos;s check-in</Text>

        <Card>
          <Label>Did you avoid {payload.candidate} today?</Label>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Pressable
              onPress={() => setAvoided(true)}
              accessibilityRole="button"
              accessibilityState={{ selected: avoided === true }}
              style={({ pressed }) => [
                styles.toggleBtn,
                avoided === true && styles.toggleBtnOnSage,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={[styles.toggleText, avoided === true && { color: colors.cream }]}>Yes, fully avoided</Text>
            </Pressable>
            <Pressable
              onPress={() => setAvoided(false)}
              accessibilityRole="button"
              accessibilityState={{ selected: avoided === false }}
              style={({ pressed }) => [
                styles.toggleBtn,
                avoided === false && styles.toggleBtnOnTerra,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={[styles.toggleText, avoided === false && { color: colors.cream }]}>Slipped today</Text>
            </Pressable>
          </View>
        </Card>

        <Card>
          <Label>How did today feel?</Label>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 14 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => setFeeling(n)}
                accessibilityRole="button"
                accessibilityState={{ selected: feeling === n }}
                style={({ pressed }) => [
                  styles.feelingDot,
                  feeling === n && styles.feelingDotOn,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.feelingText, feeling === n && { color: colors.cream }]}>{n}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={tokenType.sub}>Rough day</Text>
            <Text style={tokenType.sub}>Felt good</Text>
          </View>
        </Card>

        <Button
          label={
            justSaved
              ? 'Saved ✓'
              : todayCheckIn
              ? "Update today's check-in"
              : "Save today's check-in"
          }
          variant="sage"
          disabled={avoided === null || feeling === null}
          onPress={submitCheckIn}
        />

        {payload.dailyCheckIns.length === 7 ? (
          <Card tone="fog">
            <Label>Day 7 reflection</Label>
            <Text style={[tokenType.sub, { marginTop: 6, color: colors.cocoa }]}>
              You&apos;re a third of the way through (or more). Still too early to draw a real line —
              the rest of the period is where the signal usually emerges.
            </Text>
          </Card>
        ) : null}

        <Card>
          <Label>Trial progress</Label>
          <View style={[styles.bar, { marginTop: 12 }]}>
            <View
              style={[
                styles.barFill,
                { width: `${Math.min(100, (elapsed / payload.durationDays) * 100)}%` },
              ]}
            />
          </View>
          <Text style={[tokenType.sub, { marginTop: 8, fontSize: 12 }]}>
            {remaining} day{remaining === 1 ? '' : 's'} to go · {payload.dailyCheckIns.length} check-ins logged
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

// =============================== COMPLETION ==============================

function CompletionView({
  run,
  payload,
  onFinalise,
}: {
  run: ActivityRun;
  payload: SelfTrialPayload;
  onFinalise: () => Promise<void>;
}) {
  const [finalised, setFinalised] = useState(false);
  const handle = async () => {
    await onFinalise();
    setFinalised(true);
  };

  // Read final flare counts from payload after finalise. Until then preview.
  const adherent = payload.dailyCheckIns.filter((c) => c.avoided).length;
  const total = payload.dailyCheckIns.length;
  const avgFeeling =
    payload.dailyCheckIns.length > 0
      ? payload.dailyCheckIns.reduce((a, c) => a + c.feelingScore, 0) / payload.dailyCheckIns.length
      : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <TopBar
        title={`Trial complete: ${payload.candidate}`}
        subtitle="Your data"
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={tokenType.title}>The {payload.durationDays}-day window is done.</Text>

        <Card>
          <Label>Adherence</Label>
          <Text style={{ fontFamily: tokenType.section.fontFamily, fontSize: 32, color: colors.cocoa, marginTop: 6 }}>
            {adherent} of {total}
          </Text>
          <Text style={[tokenType.sub, { fontSize: 13 }]}>
            check-in days where you fully avoided {payload.candidate}.
          </Text>
        </Card>

        {avgFeeling !== null ? (
          <Card>
            <Label>Average self-rating</Label>
            <Text style={{ fontFamily: tokenType.section.fontFamily, fontSize: 32, color: colors.cocoa, marginTop: 6 }}>
              {avgFeeling.toFixed(1)} / 5
            </Text>
            <Text style={[tokenType.sub, { fontSize: 13 }]}>
              how the trial period felt overall.
            </Text>
          </Card>
        ) : null}

        {payload.trialFlareDays !== undefined && payload.priorPeriodFlareDays !== undefined ? (
          <Card>
            <Label>Flare day comparison</Label>
            <Text style={{ fontFamily: tokenType.section.fontFamily, fontSize: 22, color: colors.cocoa, marginTop: 6 }}>
              {payload.trialFlareDays} vs. {payload.priorPeriodFlareDays}
            </Text>
            <Text style={[tokenType.sub, { fontSize: 13 }]}>
              flare days during the trial vs. the equivalent prior {payload.durationDays}-day window.
            </Text>
          </Card>
        ) : null}

        <Card tone="fog">
          <Label>What this means (and doesn&apos;t)</Label>
          <Text style={[tokenType.sub, { marginTop: 6, color: colors.cocoa }]}>
            This is descriptive data from a single-variable self-experiment — useful as a starting
            point, not a diagnosis. For a clinically validated trial, work with your GI; many
            elimination protocols (e.g. low-FODMAP) typically run 4–6 weeks under supervision.
            Your doctor PDF can include this trial alongside your other logs.
          </Text>
        </Card>

        {!finalised ? (
          <Button label="Finalise trial result" variant="sage" onPress={handle} />
        ) : (
          <View>
            <Text style={[tokenType.sub, { textAlign: 'center', marginTop: 12 }]}>
              Saved to your record. It&apos;ll appear on the doctor PDF when you next generate one.
            </Text>
            <View style={{ height: 12 }} />
            <Button label="Done" variant="sage" onPress={() => router.replace('/learn')} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg, paddingTop: 14, gap: spacing.md, paddingBottom: 200 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: 'rgba(61,51,43,0.06)',
  },
  customRow: {
    backgroundColor: colors.fog,
    borderRadius: radii.md,
    padding: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  customRowOn: { borderColor: colors.sage },
  customInput: { padding: 8, fontSize: 14, color: colors.cocoa, fontFamily: tokenType.body.fontFamily },
  durationRow: { borderRadius: radii.md, padding: 14, backgroundColor: '#fff' },
  durationRowOn: { backgroundColor: colors.cocoa },
  durationHeadline: { fontFamily: tokenType.section.fontFamily, fontSize: 16, color: colors.cocoa },
  durationSub: { fontSize: 12, color: colors.cocoa2, marginTop: 4 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  toggleBtnOnSage: { backgroundColor: colors.sage },
  toggleBtnOnTerra: { backgroundColor: colors.terra },
  toggleText: { fontWeight: '600', fontSize: 13, color: colors.cocoa, textAlign: 'center' },
  feelingDot: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feelingDotOn: { backgroundColor: colors.cocoa },
  feelingText: { fontWeight: '600', color: colors.cocoa },
  bar: { height: 6, backgroundColor: colors.fog, borderRadius: radii.pill, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.sage, borderRadius: radii.pill },
});
