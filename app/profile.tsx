import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Card, Chip, Chips, Label, TopBar } from '@/components/ui';
import { track } from '@/data/analytics';
import { useAppStore } from '@/data/store';
import type {
  AlcoholFrequency,
  DietPattern,
  ExerciseFrequency,
  Profile,
  QuestionnaireResult,
  SleepDuration,
} from '@/data/types';
import { colors, radii, spacing, type as tokenType } from '@/theme/tokens';

const DIET_OPTIONS: { value: DietPattern; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'lowfodmap', label: 'Low-FODMAP (attempted)' },
  { value: 'other', label: 'Other' },
];

const EXERCISE_OPTIONS: { value: ExerciseFrequency; label: string }[] = [
  { value: 'rarely', label: 'Rarely' },
  { value: 'weekly_1_2', label: '1–2× / week' },
  { value: 'weekly_3_4', label: '3–4× / week' },
  { value: 'daily', label: 'Daily' },
];

const SLEEP_OPTIONS: { value: SleepDuration; label: string }[] = [
  { value: 'under_5', label: 'Under 5h' },
  { value: '5_to_6', label: '5–6h' },
  { value: '7_to_8', label: '7–8h' },
  { value: 'over_9', label: '9h+' },
];

const ALCOHOL_OPTIONS: { value: AlcoholFrequency; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'occasional', label: 'Occasional' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'daily', label: 'Daily' },
];

export default function ProfileScreen() {
  const profile = useAppStore((s) => s.profile);
  const setProfileField = useAppStore((s) => s.setProfileField);
  const questionnaires = useAppStore((s) => s.questionnaires);
  const userMode = useAppStore((s) => s.userMode);
  const [ageDraft, setAgeDraft] = useState<string>(profile.age ? String(profile.age) : '');

  const onAgeBlur = () => {
    const n = Number(ageDraft.trim());
    if (Number.isFinite(n) && n > 0 && n < 130) {
      setProfileField('age', n);
      track('profile_field_set', { field: 'age' });
    }
  };

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setProfileField(key, value);
    track('profile_field_set', { field: key });
  };

  const recommendedInstrument: 'ibs-sss' | 'sibdq' = userMode === 'diagnosed' ? 'sibdq' : 'ibs-sss';
  const latest = latestForType(questionnaires, recommendedInstrument);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <TopBar title="About you" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={tokenType.title}>About you</Text>
        <Text style={tokenType.sub}>
          The doctor PDF will include these to give your clinician context.
        </Text>

        <Card>
          <Label>Age</Label>
          <TextInput
            value={ageDraft}
            onChangeText={setAgeDraft}
            onBlur={onAgeBlur}
            placeholder="—"
            placeholderTextColor={colors.cocoa2}
            keyboardType="number-pad"
            style={styles.ageInput}
          />
        </Card>

        <Card>
          <Label>Typical diet</Label>
          <View style={{ marginTop: 10 }}>
            <Chips>
              {DIET_OPTIONS.map((o) => (
                <Chip key={o.value} label={o.label} on={profile.diet === o.value} onPress={() => set('diet', o.value)} />
              ))}
            </Chips>
          </View>
        </Card>

        <Card>
          <Label>Exercise frequency</Label>
          <View style={{ marginTop: 10 }}>
            <Chips>
              {EXERCISE_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  on={profile.exercise === o.value}
                  onPress={() => set('exercise', o.value)}
                />
              ))}
            </Chips>
          </View>
        </Card>

        <Card>
          <Label>Typical sleep</Label>
          <View style={{ marginTop: 10 }}>
            <Chips>
              {SLEEP_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  on={profile.sleep === o.value}
                  onPress={() => set('sleep', o.value)}
                />
              ))}
            </Chips>
          </View>
        </Card>

        <Card>
          <Label>Alcohol</Label>
          <View style={{ marginTop: 10 }}>
            <Chips>
              {ALCOHOL_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  on={profile.alcohol === o.value}
                  onPress={() => set('alcohol', o.value)}
                />
              ))}
            </Chips>
          </View>
        </Card>

        <Card tone="fog">
          <Label>Symptom questionnaire</Label>
          <Text style={[tokenType.sub, { marginTop: 6 }]}>
            {recommendedInstrument === 'ibs-sss'
              ? 'The IBS-SSS is a validated 5-question instrument used by GIs to gauge symptom severity over the last 10 days.'
              : 'The SIBDQ is a 10-item validated instrument used to track IBD-related quality of life.'}
          </Text>
          {latest ? (
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontFamily: tokenType.section.fontFamily, fontSize: 17, color: colors.cocoa }}>
                Last score: {latest.score}
              </Text>
              <Text style={[tokenType.sub, { fontSize: 12 }]}>
                Taken {formatDaysAgo(latest.ts)}.{' '}
                {scoreChangeBlurb(questionnaires, recommendedInstrument)}
              </Text>
            </View>
          ) : null}
          <View style={{ marginTop: 12 }}>
            <Button
              label={latest ? 'Retake the questionnaire' : 'Take the questionnaire'}
              variant="sage"
              onPress={() => {
                track('questionnaire_started', { type: recommendedInstrument });
                router.push({ pathname: '/questionnaire/[type]', params: { type: recommendedInstrument } });
              }}
            />
          </View>
        </Card>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function latestForType(qs: QuestionnaireResult[], type: 'ibs-sss' | 'sibdq'): QuestionnaireResult | undefined {
  const matches = qs.filter((q) => q.type === type).sort((a, b) => b.ts - a.ts);
  return matches[0];
}

function formatDaysAgo(ts: number): string {
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

function scoreChangeBlurb(qs: QuestionnaireResult[], type: 'ibs-sss' | 'sibdq'): string {
  const sorted = qs.filter((q) => q.type === type).sort((a, b) => b.ts - a.ts);
  if (sorted.length < 2) return 'A retake in a few weeks will show change.';
  const [latest, prev] = sorted;
  const delta = latest.score - prev.score;
  if (delta === 0) return 'No change since last time.';
  const arrow = delta < 0 ? '↓' : '↑';
  return `${arrow} ${Math.abs(delta)} since last time.`;
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: 14, gap: spacing.md, paddingBottom: 60 },
  ageInput: {
    marginTop: 10,
    fontSize: 18,
    color: colors.cocoa,
    backgroundColor: '#fff',
    borderRadius: radii.md,
    padding: 12,
    fontFamily: tokenType.body.fontFamily,
  },
});
