import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Label, TopBar } from '@/components/ui';
import { BristolGlyph } from '@/components/bristolSvg';
import { track } from '@/data/analytics';
import { useAppStore } from '@/data/store';
import type { BristolQuizPayload, BristolType } from '@/data/types';
import { BRISTOL } from '@/domain/bristol';
import { colors, radii, shadows, spacing, type as tokenType } from '@/theme/tokens';

const ROUNDS = 5;

function pickRounds(): BristolType[] {
  // Shuffle the 1-7 list and take the first ROUNDS.
  const arr: BristolType[] = [1, 2, 3, 4, 5, 6, 7];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, ROUNDS) as BristolType[];
}

export function BristolQuiz() {
  const [rounds] = useState<BristolType[]>(pickRounds);
  const [answers, setAnswers] = useState<(BristolType | null)[]>(() => rounds.map(() => null));
  const [step, setStep] = useState(0);
  const [runId, setRunId] = useState<string | null>(null);
  const startActivity = useAppStore((s) => s.startActivity);
  const completeActivity = useAppStore((s) => s.completeActivity);

  const isResults = step === rounds.length;
  const correctCount = useMemo(
    () => answers.filter((a, i) => a !== null && a === rounds[i]).length,
    [answers, rounds],
  );

  const start = async () => {
    if (runId) return;
    track('activity_started', { activity: 'bristol-quiz' });
    const id = await startActivity('bristol-quiz', { rounds: [], score: 0 } as BristolQuizPayload);
    setRunId(id);
  };

  // Lazy-start the run on first render.
  if (!runId && !isResults) {
    void start();
  }

  const answer = (pick: BristolType) => {
    const next = [...answers];
    next[step] = pick;
    setAnswers(next);
    track('activity_step_completed', { activity: 'bristol-quiz', step });
    setTimeout(() => {
      if (step + 1 === rounds.length) {
        const payload: BristolQuizPayload = {
          rounds: rounds.map((p, i) => ({ presented: p, answered: next[i] ?? 0 })),
          score: next.filter((a, i) => a !== null && a === rounds[i]).length,
        };
        if (runId) {
          void completeActivity(runId, payload);
        }
        track('activity_completed', { activity: 'bristol-quiz', score: payload.score });
        setStep(step + 1);
      } else {
        setStep(step + 1);
      }
    }, 280);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <TopBar
        title="Bristol scale literacy"
        subtitle={isResults ? 'Your result' : `Card ${step + 1} of ${rounds.length}`}
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.pad}>
        {isResults ? (
          <Results rounds={rounds} answers={answers} />
        ) : (
          <RoundView
            presented={rounds[step]}
            selected={answers[step]}
            onPick={answer}
          />
        )}
      </ScrollView>

      {isResults ? (
        <View style={styles.footer}>
          <Button label="Done" variant="sage" onPress={() => router.replace('/learn')} />
        </View>
      ) : null}
    </View>
  );
}

function RoundView({
  presented,
  selected,
  onPick,
}: {
  presented: BristolType;
  selected: BristolType | null;
  onPick: (n: BristolType) => void;
}) {
  return (
    <View style={{ gap: spacing.md }}>
      <Text style={[tokenType.sub, { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }]}>
        Which type is this?
      </Text>
      <Card style={styles.glyphCard}>
        <BristolGlyph type={presented} size={220} />
      </Card>
      <Text style={[tokenType.sub, { fontSize: 13 }]}>Tap the matching type below.</Text>
      <View style={styles.numberRow}>
        {([1, 2, 3, 4, 5, 6, 7] as BristolType[]).map((n) => (
          <Pressable
            key={n}
            onPress={() => onPick(n)}
            accessibilityRole="button"
            accessibilityLabel={`Type ${n}`}
            style={({ pressed }) => [
              styles.numBtn,
              selected === n && styles.numBtnOn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.numText, selected === n && styles.numTextOn]}>{n}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Results({
  rounds,
  answers,
}: {
  rounds: BristolType[];
  answers: (BristolType | null)[];
}) {
  const correct = answers.filter((a, i) => a !== null && a === rounds[i]).length;
  return (
    <View style={{ gap: spacing.md }}>
      <Text style={tokenType.title}>{correct} of {rounds.length} correct</Text>
      <Text style={[tokenType.sub, { fontSize: 14, color: colors.cocoa }]}>
        The Bristol scale is a clinical tool — knowing your own type makes the conversation with
        your GI sharper.
      </Text>

      <Card>
        <Label>Review</Label>
        <View style={{ gap: 14, marginTop: 12 }}>
          {rounds.map((presented, i) => {
            const picked = answers[i];
            const entry = BRISTOL[presented - 1];
            const isCorrect = picked === presented;
            return (
              <View key={i} style={styles.reviewRow}>
                <View style={styles.reviewGlyph}>
                  <BristolGlyph type={presented} size={64} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[tokenType.sub, { fontSize: 12, color: isCorrect ? colors.sageDark : colors.terraDark, fontWeight: '600' }]}>
                    {isCorrect ? '✓ Correct' : `Picked Type ${picked} — actually Type ${presented}`}
                  </Text>
                  <Text style={{ fontWeight: '600', fontSize: 14, color: colors.cocoa, marginTop: 2 }}>
                    Type {presented}: {entry.name}
                  </Text>
                  <Text style={[tokenType.sub, { fontSize: 12, marginTop: 2 }]}>{entry.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </Card>

      <Card tone="fog">
        <Label>Why this matters</Label>
        <Text style={[tokenType.sub, { marginTop: 6, color: colors.cocoa }]}>
          Bristol Types 3-5 generally indicate well-formed stools; 1-2 suggest constipation;
          6-7 suggest looseness. Your doctor uses the same scale.
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg, paddingTop: 14, gap: spacing.md, paddingBottom: 120 },
  glyphCard: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#fff' },
  numberRow: { flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  numBtn: {
    flex: 1,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  numBtnOn: { backgroundColor: colors.cocoa },
  numText: { fontFamily: tokenType.section.fontFamily, fontSize: 20, color: colors.cocoa },
  numTextOn: { color: colors.cream },
  reviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  reviewGlyph: { width: 64, height: 44, alignItems: 'center', justifyContent: 'center' },
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
});
