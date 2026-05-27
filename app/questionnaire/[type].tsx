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
            instrument={instrument}
            score={score}
            label={scoreLabel}
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
          <SliderInput value={value} min={item.input.min} max={item.input.max} onChange={onChange} />
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
  onChange,
}: {
  value: number;
  min: number;
  max: number;
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
          <Text style={tokenType.sub}>None</Text>
          <Text style={tokenType.sub}>As bad as imaginable</Text>
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
}: {
  instrument: { id: InstrumentId; scoreRange: [number, number] };
  score: number;
  label: string;
}) {
  const pct = ((score - instrument.scoreRange[0]) / (instrument.scoreRange[1] - instrument.scoreRange[0])) * 100;
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

      <Card tone="fog" style={{ marginTop: 14 }}>
        <Label>What this is for</Label>
        <Text style={[tokenType.sub, { marginTop: 6, color: colors.cocoa }]}>
          {instrument.id === 'ibs-sss'
            ? 'IBS-SSS is the standard severity score gastroenterologists use to track change over time. A drop of 50+ between visits is usually considered clinically meaningful.'
            : 'SIBDQ tracks how IBD affects daily life across symptoms, social function, and mood. Higher is better; a 10-point improvement is clinically meaningful.'}
        </Text>
      </Card>

      <Text style={[tokenType.sub, { marginTop: 14 }]}>
        Retake this in 2–4 weeks to see your change. Your doctor PDF will include the most recent
        score automatically.
      </Text>
    </View>
  );
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
