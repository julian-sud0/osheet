import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Label, TopBar } from '@/components/ui';
import { track } from '@/data/analytics';
import { useAppStore } from '@/data/store';
import type { QuestionnaireType } from '@/data/types';
import { computeScore, INSTRUMENTS, type InstrumentId, type Item } from '@/domain/instruments';
import { colors, radii, spacing, type as tokenType } from '@/theme/tokens';

export default function QuestionnaireJourney() {
  const { type } = useLocalSearchParams<{ type: QuestionnaireType }>();
  const instrument = useMemo(() => INSTRUMENTS[type as InstrumentId], [type]);
  const addResult = useAppStore((s) => s.addQuestionnaireResult);

  const [step, setStep] = useState(0); // 0..items.length = answering; items.length+1 = results
  const [responses, setResponses] = useState<number[]>(() => instrument?.items.map(() => -1) ?? []);
  const [revealed, setRevealed] = useState(false);
  const [previousScore, setPreviousScore] = useState<number | undefined>(undefined);
  const allQuestionnaires = useAppStore((s) => s.questionnaires);

  if (!instrument) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream }}>
        <TopBar title="Questionnaire" onBack={() => router.back()} />
        <View style={{ padding: spacing.lg }}>
          <Text style={tokenType.title}>Unknown questionnaire</Text>
        </View>
      </View>
    );
  }

  const isAnswering = step < instrument.items.length;
  const isResults = step === instrument.items.length;
  const currentItem: Item | null = isAnswering ? instrument.items[step] : null;
  const currentResponse = isAnswering ? responses[step] : -1;
  const score = computeScore(instrument.id, responses);
  const scoreLabel = instrument.scoreLabel(score);
  const stoolLogCount = useAppStore((s) => s.logs.filter((l) => l.type === 'stool').length);

  const setResponse = (val: number) => {
    setResponses((r) => {
      const next = [...r];
      next[step] = val;
      return next;
    });
    if (!revealed) {
      setRevealed(true);
      track('questionnaire_item_answered', { type: instrument.id, item: step });
    }
  };

  const next = () => {
    if (step + 1 === instrument.items.length) {
      // Capture the previous score BEFORE persisting the new one so the
      // results screen can show a delta if there's prior history.
      setPreviousScore(previousScoreFor(allQuestionnaires, instrument.id));
      setStep(step + 1);
      track('questionnaire_completed', { type: instrument.id, score });
      void addResult({
        type: instrument.id,
        ts: Date.now(),
        responses,
        score,
      });
    } else {
      setStep(step + 1);
      setRevealed(false);
    }
  };

  const skip = () => {
    track('questionnaire_skipped', { type: instrument.id, at: step });
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <TopBar
        title={instrument.title}
        subtitle={isAnswering ? `Question ${step + 1} of ${instrument.items.length}` : 'Your result'}
        onBack={isAnswering ? () => (step > 0 ? setStep(step - 1) : router.back()) : () => router.back()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {isAnswering && currentItem ? (
          <ItemScreen
            item={currentItem}
            value={currentResponse}
            onChange={setResponse}
            revealed={revealed}
            progress={(step + 1) / instrument.items.length}
          />
        ) : null}

        {isResults ? (
          <ResultsScreen
            instrument={{ id: instrument.id, scoreRange: instrument.scoreRange, items: instrument.items }}
            score={score}
            label={scoreLabel}
            responses={responses}
            previousScore={previousScore}
            stoolLogCount={stoolLogCount}
          />
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {isAnswering ? (
          <>
            <Button
              label={step + 1 === instrument.items.length ? 'See your result' : 'Next'}
              variant="sage"
              disabled={currentResponse < 0}
              onPress={next}
            />
            <Pressable onPress={skip} accessibilityRole="button" style={({ pressed }) => [styles.skip, pressed && { opacity: 0.6 }]}>
              <Text style={[tokenType.sub, { textAlign: 'center', fontSize: 13 }]}>Skip for now</Text>
            </Pressable>
          </>
        ) : (
          <Button label="Done" variant="sage" onPress={() => router.replace('/profile')} />
        )}
      </View>
    </View>
  );
}

function ItemScreen({
  item,
  value,
  onChange,
  revealed,
  progress,
}: {
  item: Item;
  value: number;
  onChange: (v: number) => void;
  revealed: boolean;
  progress: number;
}) {
  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <Text style={[tokenType.sub, { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }]}>
        Why we ask
      </Text>
      <Text style={[tokenType.sub, { fontSize: 13, color: colors.cocoa }]}>{item.why}</Text>

      <Text style={[tokenType.section, { fontSize: 22, marginTop: 14, color: colors.cocoa }]}>
        {item.prompt}
      </Text>

      <View style={{ marginTop: 18 }}>
        {item.input.type === 'slider' ? (
          <SliderInput
            value={value}
            min={item.input.min}
            max={item.input.max}
            lowLabel={item.input.lowLabel}
            highLabel={item.input.highLabel}
            onChange={onChange}
          />
        ) : (
          <LikertInput
            value={value}
            min={item.input.min}
            max={item.input.max}
            labels={item.input.labels}
            onChange={onChange}
          />
        )}
      </View>

      {revealed ? (
        <Card tone="fog" style={{ marginTop: 14 }}>
          <Label>What this measures</Label>
          <Text style={[tokenType.sub, { marginTop: 6, color: colors.cocoa }]}>{item.reveal}</Text>
        </Card>
      ) : null}
    </View>
  );
}

function SliderInput({
  value,
  min,
  max,
  lowLabel,
  highLabel,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  lowLabel: string;
  highLabel: string;
  onChange: (v: number) => void;
}) {
  // Visual analog scale 0-100. Use native <input type="range"> on web for
  // accessibility + finger drag; native gets a tap-row fallback (proper
  // gesture-driven slider lands when native build is wired in Phase 4).
  if (Platform.OS === 'web') {
    return (
      <View>
        <Text style={styles.sliderValue}>{value < 0 ? '—' : value}</Text>
        <input
          type="range"
          min={min}
          max={max}
          value={value < 0 ? Math.round((min + max) / 2) : value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: colors.sage }}
        />
        <View style={styles.sliderLabels}>
          <Text style={tokenType.sub}>{lowLabel}</Text>
          <Text style={tokenType.sub}>{highLabel}</Text>
        </View>
      </View>
    );
  }
  // Native fallback: 5-tap row for now.
  const stops = [0, 25, 50, 75, 100];
  return (
    <View style={styles.tapRow}>
      {stops.map((s) => (
        <Pressable
          key={s}
          onPress={() => onChange(s)}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.tapStop,
            value === s && styles.tapStopOn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={[styles.tapStopText, value === s && styles.tapStopTextOn]}>{s}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function LikertInput({
  value,
  min,
  max,
  labels,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  labels: [string, string];
  onChange: (v: number) => void;
}) {
  const stops: number[] = [];
  for (let i = min; i <= max; i++) stops.push(i);
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.tapRow}>
        {stops.map((s) => (
          <Pressable
            key={s}
            onPress={() => onChange(s)}
            accessibilityRole="button"
            accessibilityState={{ selected: value === s }}
            style={({ pressed }) => [
              styles.likertStop,
              value === s && styles.tapStopOn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.tapStopText, value === s && styles.tapStopTextOn]}>{s}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.likertLabels}>
        <Text style={tokenType.sub}>{labels[0]}</Text>
        <Text style={tokenType.sub}>{labels[1]}</Text>
      </View>
    </View>
  );
}

function ResultsScreen({
  instrument,
  score,
  label,
  responses,
  previousScore,
  stoolLogCount,
}: {
  instrument: { id: InstrumentId; scoreRange: [number, number]; items: Item[] };
  score: number;
  label: string;
  responses: number[];
  previousScore?: number;
  stoolLogCount: number;
}) {
  const pct =
    ((score - instrument.scoreRange[0]) / (instrument.scoreRange[1] - instrument.scoreRange[0])) * 100;
  const items = instrument.items;
  const action = nextAction(instrument.id, score, stoolLogCount);
  const delta = previousScore !== undefined ? score - previousScore : undefined;
  const deltaCopy = delta !== undefined ? deltaInterpretation(instrument.id, delta) : null;

  return (
    <View style={{ gap: spacing.md }}>
      <Text style={tokenType.title}>Your score</Text>
      <Text style={{ fontFamily: tokenType.section.fontFamily, fontSize: 56, color: colors.cocoa }}>
        {score}
      </Text>
      <Text style={[tokenType.sub, { fontSize: 16, color: colors.cocoa }]}>
        That puts you in the <Text style={{ fontWeight: '600' }}>{label}</Text> range today.
      </Text>

      <View style={[styles.progressBar, { marginTop: 14 }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.max(2, Math.min(100, pct))}%`, backgroundColor: colors.terra },
          ]}
        />
      </View>

      {/* Item-by-item breakdown — shows what's driving the score. */}
      <Card style={{ marginTop: 14 }}>
        <Label>What's driving your score</Label>
        <View style={{ gap: 10, marginTop: 12 }}>
          {items.map((item, i) => {
            const itemMax = item.input.type === 'slider' ? item.input.max : item.input.max;
            const r = responses[i];
            const w = itemMax > 0 ? Math.max(2, (r / itemMax) * 100) : 0;
            return (
              <View key={i} style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[tokenType.sub, { fontSize: 12, flex: 1, color: colors.cocoa }]} numberOfLines={1}>
                    {shortLabel(item.prompt)}
                  </Text>
                  <Text style={[tokenType.sub, { fontSize: 12, marginLeft: 8 }]}>
                    {r} / {itemMax}
                  </Text>
                </View>
                <View style={styles.breakdownBar}>
                  <View style={[styles.breakdownFill, { width: `${w}%` }]} />
                </View>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Compare to previous. */}
      {delta !== undefined && deltaCopy ? (
        <Card tone="fog">
          <Label>Since your last take</Label>
          <Text style={{ fontFamily: tokenType.section.fontFamily, fontSize: 22, color: colors.cocoa, marginTop: 6 }}>
            {delta === 0 ? 'No change' : `${delta < 0 ? '↓' : '↑'} ${Math.abs(delta)}`}
          </Text>
          <Text style={[tokenType.sub, { fontSize: 13, marginTop: 4 }]}>{deltaCopy}</Text>
        </Card>
      ) : null}

      {/* Severity-tied next action. */}
      <Card>
        <Label>What now?</Label>
        <Text style={[tokenType.sub, { marginTop: 6, fontSize: 14, color: colors.cocoa }]}>
          {action.copy}
        </Text>
        {action.clinicianWants ? (
          <View style={{ gap: 8, marginTop: 12 }}>
            {action.clinicianWants.map((line, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={[tokenType.sub, { color: colors.terraDark, fontWeight: '600' }]}>·</Text>
                <Text style={[tokenType.sub, { flex: 1, color: colors.cocoa }]}>{line}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {action.cta ? (
          <View style={{ marginTop: 12 }}>
            <Button label={action.cta.label} variant="sage" onPress={action.cta.onPress} />
          </View>
        ) : null}
      </Card>

      {/* Honesty + retake nudge. */}
      <Text style={[tokenType.sub, { marginTop: 14, fontSize: 12, fontStyle: 'italic' }]}>
        Most useful retaken in 2–4 weeks. This isn&apos;t a diagnosis — your doctor uses scores like
        this alongside the rest of your story.
      </Text>
    </View>
  );
}

function shortLabel(prompt: string): string {
  // Use the first key noun phrase from each prompt so the breakdown stays readable.
  const map: Record<string, string> = {
    'How severe has your abdominal pain': 'Pain severity',
    'On how many of the last 10 days': 'Pain frequency',
    'How severe has your bloating': 'Bloating',
    'How dissatisfied have you been with your bowel': 'Bowel habit',
    'How much have your symptoms interfered': 'Life interference',
    'How often have you felt tired': 'Fatigue',
    'How frequently have your bowel movements': 'Bowel movements',
    'How depressed or discouraged': 'Mood',
    'How often have you been unable to attend': 'Missed events',
    'How much trouble have you had with cramping': 'Cramping',
    'How relaxed and free of tension': 'Tension',
    'How often has gas or passing wind': 'Gas',
    'How often have you felt impatient': 'Restlessness',
    'How often have accidents or fears': 'Accident worry',
    'How upset have you been by your symptoms': 'Symptom distress',
  };
  for (const prefix in map) {
    if (prompt.startsWith(prefix)) return map[prefix];
  }
  return prompt.slice(0, 24) + '…';
}

interface NextAction {
  copy: string;
  /** When set, render as a bulleted list under `copy` — what a clinician
   *  will actually want from a few weeks of logs. Used in the
   *  severe-score-but-no-logs case to anchor next steps in real data. */
  clinicianWants?: string[];
  cta?: { label: string; onPress: () => void };
}

const STARTER_LOG_THRESHOLD = 3;

function nextAction(id: InstrumentId, score: number, stoolLogCount: number): NextAction {
  const hasBaseline = stoolLogCount >= STARTER_LOG_THRESHOLD;

  if (id === 'ibs-sss') {
    if (score >= 300) {
      // Severe — the most consequential branch. If the user has barely logged
      // yet (e.g. just took the baseline questionnaire at onboarding), don't
      // promise a doctor-ready PDF. Preview what a clinician will actually
      // want, and anchor the next step in logging.
      if (!hasBaseline) {
        return {
          copy: "A severe score is real signal. Your GI will get the most out of it with 2–3 weeks of logs behind it. Here's what they'll want to see:",
          clinicianWants: [
            'When your flare days happen — time of day, days of week',
            'What you ate or felt in the hours before each flare',
            'Whether anything you tried (meds, food, rest) brought it down',
          ],
          cta: {
            label: 'Log your first entry →',
            onPress: () => router.replace('/log/bristol'),
          },
        };
      }
      return {
        copy: 'Worth bringing to your GI. A severe score with specific contributing items is exactly the data a clinician can act on.',
        cta: { label: 'Generate doctor PDF →', onPress: () => router.replace('/export') },
      };
    }
    if (score >= 175) return { copy: 'Track for 2–3 weeks, then retake to see your change.' };
    if (score >= 75) return { copy: 'Keep watching — small changes are worth recording.' };
    return { copy: "Whatever you're doing is working. The instrument is most useful when symptoms shift." };
  }

  // SIBDQ — higher is better (10–70). Lower scores = worse QoL.
  if (score < 30) {
    if (!hasBaseline) {
      return {
        copy: "Quality-of-life impact looks high. A clinician will get the most from this score paired with a few weeks of logs. Here's what your IBD team will want:",
        clinicianWants: [
          'Stool consistency and frequency over time (the Bristol chart)',
          'Whether symptoms cluster around specific foods, stress, or sleep',
          'Whether mood and bowel patterns track together',
        ],
        cta: { label: 'Log your first entry →', onPress: () => router.replace('/log/bristol') },
      };
    }
    return {
      copy: 'Quality-of-life impact looks high. Bringing this score to your IBD team is worth the visit.',
      cta: { label: 'Generate doctor PDF →', onPress: () => router.replace('/export') },
    };
  }
  if (score < 50) return { copy: 'Moderate impact. Retaking in 2–4 weeks will show whether your trend is moving.' };
  if (score < 60) return { copy: 'Mild impact today. Keep tracking; small improvements are real.' };
  return { copy: 'Good signal today. Worth keeping the rhythm that got you here.' };
}

function deltaInterpretation(id: InstrumentId, delta: number): string {
  if (id === 'ibs-sss') {
    if (delta <= -50) return 'A drop of 50+ is typically considered clinically meaningful.';
    if (delta <= -20) return 'A real change in the right direction.';
    if (delta < 20) return 'Steady — within the noise band.';
    if (delta < 50) return 'A real change in the harder direction.';
    return 'A rise of 50+ — worth raising at your next visit.';
  }
  // SIBDQ — higher is better
  if (delta >= 10) return 'A 10-point rise is typically considered clinically meaningful.';
  if (delta >= 4) return 'A real change in the right direction.';
  if (delta > -4) return 'Steady — within the noise band.';
  if (delta > -10) return 'A real drop — worth tracking closely.';
  return 'A 10-point drop — worth raising at your next visit.';
}

function previousScoreFor(qs: { type: InstrumentId; ts: number; score: number }[], type: InstrumentId): number | undefined {
  const matches = qs.filter((q) => q.type === type).sort((a, b) => b.ts - a.ts);
  return matches[0]?.score;
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: 14, gap: spacing.md, paddingBottom: 200 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: 'rgba(61,51,43,0.06)',
    gap: 6,
  },
  progressBar: { height: 4, backgroundColor: colors.fog, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.sage, borderRadius: 2 },
  breakdownBar: { height: 6, backgroundColor: colors.fog, borderRadius: 3, overflow: 'hidden' },
  breakdownFill: { height: '100%', backgroundColor: colors.terra, borderRadius: 3 },
  skip: { paddingVertical: 6 },
  sliderValue: {
    fontFamily: tokenType.section.fontFamily,
    fontSize: 32,
    color: colors.cocoa,
    textAlign: 'center',
    marginBottom: 4,
  },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  tapRow: { flexDirection: 'row', gap: 6 },
  tapStop: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  likertStop: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapStopOn: { backgroundColor: colors.cocoa },
  tapStopText: { fontWeight: '600', color: colors.cocoa },
  tapStopTextOn: { color: colors.cream },
  likertLabels: { flexDirection: 'row', justifyContent: 'space-between' },
});
