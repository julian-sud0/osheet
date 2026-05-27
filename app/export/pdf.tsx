import { router, useLocalSearchParams } from 'expo-router';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, TopBar } from '@/components/ui';
import { track } from '@/data/analytics';
import { useAppStore } from '@/data/store';
import { patterns } from '@/domain/patterns';
import type { Log, Profile, QuestionnaireResult, StoolLog } from '@/data/types';
import { INSTRUMENTS } from '@/domain/instruments';
import { colors, radii, shadows, spacing, type as tokenType } from '@/theme/tokens';

type Range = '2w' | '30d' | '90d';

const DAYS: Record<Range, number> = { '2w': 14, '30d': 30, '90d': 90 };

export default function PDFPreview() {
  const { range = '30d' } = useLocalSearchParams<{ range?: Range }>();
  const logs = useAppStore((s) => s.logs);
  const userMode = useAppStore((s) => s.userMode);
  const profile = useAppStore((s) => s.profile);
  const questionnaires = useAppStore((s) => s.questionnaires);
  const cutoff = Date.now() - DAYS[range as Range] * 86400000;
  const filtered = logs.filter((l) => l.ts >= cutoff);
  const distribution = bristolDistribution(filtered);
  const result = patterns(filtered, userMode);
  const aboutLine = formatAboutLine(profile, questionnaires);

  const handleSave = () => {
    track('pdf_generated', { range });
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }}>
      <TopBar title="Preview" subtitle="Page 1 of 4" onBack={() => router.back()} />
      <View style={styles.pad}>
        <View style={styles.page}>
          <Text style={styles.pageTitle}>Bowel &amp; symptom report</Text>
          <Text style={styles.meta}>
            WJ-{new Date().toISOString().slice(0, 10).replace(/-/g, '')} · {String(range).toUpperCase()} ·{' '}
            {filtered.length} entries
          </Text>

          {aboutLine ? (
            <>
              <Text style={styles.section}>About this person</Text>
              <Text style={[styles.meta, { fontSize: 12 }]}>{aboutLine}</Text>
            </>
          ) : null}

          <Text style={styles.section}>Bristol distribution</Text>
          <View style={styles.histo}>
            {distribution.map((h, i) => (
              <View
                key={i}
                style={[
                  styles.histoBar,
                  { height: `${Math.max(4, h)}%`, backgroundColor: i >= 5 ? colors.terra : colors.sage },
                ]}
              />
            ))}
          </View>
          <Text style={styles.meta}>
            {(() => {
              const total = distribution.reduce((a, b) => a + b, 0) || 1;
              const high = (distribution[5] + distribution[6]) / total;
              return `Types 6–7 represent ${Math.round(high * 100)}% of stools.`;
            })()}
          </Text>

          <Text style={styles.section}>Flagged correlations</Text>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableHeadCell]}>Trigger</Text>
            <Text style={[styles.tableCell, styles.tableHeadCell]}>Outcome</Text>
            <Text style={[styles.tableCell, styles.tableHeadCell, styles.colN]}>n</Text>
            <Text style={[styles.tableCell, styles.tableHeadCell, styles.colN]}>Conf</Text>
          </View>
          {([result.strongest, result.watching].filter(Boolean) as NonNullable<typeof result.strongest>[]).map(
            (c) => (
              <View key={c.id} style={styles.tableRow}>
                <Text style={styles.tableCell}>{c.triggerLabel}</Text>
                <Text style={styles.tableCell}>{c.outcomeLabel}</Text>
                <Text style={[styles.tableCell, styles.colN]}>
                  {c.hits}/{c.n}
                </Text>
                <Text style={[styles.tableCell, styles.colN]}>{capitalise(c.confidence)}</Text>
              </View>
            ),
          )}
          {!result.strongest && !result.watching ? (
            <Text style={[styles.meta, { marginTop: 6 }]}>No correlations cleared the threshold in this range.</Text>
          ) : null}

          <Text style={styles.section}>Frequency</Text>
          <Text style={[styles.meta, { fontFamily: tokenType.section.fontFamily }]}>
            Mean {result.frequencyTrend.thisWeekPerDay}/day this week, {result.frequencyTrend.lastWeekPerDay}/day last
            week.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button label="Share" variant="cream" style={{ flex: 1 }} onPress={() => { /* share lands in Phase 3 */ }} />
          <Button label="Save PDF" variant="sage" style={{ flex: 1 }} onPress={handleSave} />
        </View>
        {Platform.OS !== 'web' ? (
          <Text style={[tokenType.sub, { fontSize: 11, textAlign: 'center', marginTop: 4 }]}>
            Real PDF generation lands on native in Phase 3 (expo-print).
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

function bristolDistribution(logs: Log[]): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const l of logs) {
    if (l.type === 'stool') counts[(l as StoolLog).bristol - 1]++;
  }
  const max = Math.max(1, ...counts);
  return counts.map((c) => (c / max) * 100);
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const DIET_LABEL: Record<string, string> = {
  standard: 'standard diet',
  mediterranean: 'Mediterranean-leaning',
  vegetarian: 'vegetarian',
  vegan: 'vegan',
  lowfodmap: 'low-FODMAP attempted',
  other: 'other diet',
};

const EXERCISE_LABEL: Record<string, string> = {
  rarely: 'rarely exercises',
  weekly_1_2: '1–2× / week exercise',
  weekly_3_4: '3–4× / week exercise',
  daily: 'daily exercise',
};

function formatAboutLine(profile: Profile, qs: QuestionnaireResult[]): string | null {
  const parts: string[] = [];
  if (profile.age) parts.push(`Age ${profile.age}`);
  if (profile.diet) parts.push(DIET_LABEL[profile.diet] ?? profile.diet);
  if (profile.exercise) parts.push(EXERCISE_LABEL[profile.exercise] ?? profile.exercise);
  if (profile.alcohol && profile.alcohol !== 'none') {
    parts.push(`alcohol: ${profile.alcohol}`);
  }
  // Latest questionnaire score with severity label.
  const sorted = [...qs].sort((a, b) => b.ts - a.ts);
  const latest = sorted[0];
  if (latest) {
    const inst = INSTRUMENTS[latest.type];
    parts.push(`${inst.title.split(' — ')[0]} ${latest.score} (${inst.scoreLabel(latest.score)})`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg, paddingTop: 14, gap: spacing.md, paddingBottom: 60 },
  page: { backgroundColor: '#fff', borderRadius: 12, padding: 18, ...shadows.card },
  pageTitle: { fontFamily: tokenType.section.fontFamily, fontSize: 18, marginBottom: 2, color: colors.cocoa },
  meta: { color: colors.cocoa2, fontSize: 11 },
  section: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.cocoa2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  histo: { flexDirection: 'row', gap: 5, alignItems: 'flex-end', height: 56, marginTop: 6 },
  histoBar: { flex: 1, borderRadius: 3, backgroundColor: colors.sage },

  tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderColor: colors.fog },
  tableCell: { flex: 2, fontSize: 11, color: colors.cocoa },
  tableHeadCell: { fontWeight: '600', color: colors.cocoa2 },
  colN: { flex: 1, textAlign: 'right' },

  actions: { flexDirection: 'row', gap: 8 },
});
