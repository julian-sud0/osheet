import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Label, Pill, Seg } from '@/components/ui';
import { useAppStore } from '@/data/store';
import { patterns, type Correlation } from '@/domain/patterns';
import { colors, radii, spacing, type as tokenType } from '@/theme/tokens';

export default function PatternsScreen() {
  const logs = useAppStore((s) => s.logs);
  const ready = logs.length >= 5;
  const result = ready ? patterns(logs) : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={styles.scroll}>
      <View style={styles.headerRow}>
        <Text style={tokenType.title}>Patterns</Text>
        <Pill label={`${logs.length} log${logs.length === 1 ? '' : 's'}`} />
      </View>

      <Seg
        value="pattern"
        onChange={(v) => {
          if (v === 'day') router.replace('/(tabs)/timeline');
        }}
        options={[
          { value: 'day', label: 'By day' },
          { value: 'pattern', label: 'By pattern' },
        ]}
      />

      {!ready || !result ? (
        <EmptyState count={logs.length} />
      ) : (
        <>
          {result.strongest ? <CorrelationCard correlation={result.strongest} headline="Strongest link" /> : null}
          {result.watching ? <CorrelationCard correlation={result.watching} headline="Watching" muted /> : null}
          {!result.strongest && !result.watching ? <EmptyState count={logs.length} hint="Not enough signal yet — keep logging." /> : null}

          <Card tone="fog">
            <Label>Frequency</Label>
            <Text style={styles.frequencyHead}>{result.frequencyTrend.thisWeekPerDay} / day this week</Text>
            <Text style={[tokenType.sub]}>
              {result.frequencyTrend.delta === 0
                ? 'Steady vs. last week.'
                : `${result.frequencyTrend.delta > 0 ? '↑' : '↓'} from ${result.frequencyTrend.lastWeekPerDay} last week.`}
            </Text>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

function CorrelationCard({
  correlation,
  headline,
  muted,
}: {
  correlation: Correlation;
  headline: string;
  muted?: boolean;
}) {
  const pct = Math.round((correlation.hits / correlation.n) * 100);
  return (
    <Card onPress={() => router.push({ pathname: '/insight/[id]', params: { id: correlation.id } })}>
      <Label>{headline}</Label>
      <Text style={styles.corHead}>
        {correlation.triggerLabel} → {correlation.outcomeLabel}
      </Text>
      <Text style={tokenType.sub}>
        {correlation.hits} of {correlation.n} times, within 6 hours.
      </Text>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: muted ? colors.sage : colors.terra }]} />
      </View>
    </Card>
  );
}

function EmptyState({ count, hint }: { count: number; hint?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={{ fontFamily: tokenType.section.fontFamily, fontSize: 20, color: colors.cocoa, textAlign: 'center' }}>
        {hint ?? 'Not enough data yet.'}
      </Text>
      <Text style={[tokenType.sub, { marginTop: 10, textAlign: 'center' }]}>
        Patterns appear after about 5 logs across a few days.
      </Text>
      <View style={[styles.bar, { marginTop: 16 }]}>
        <View style={[styles.barFill, { width: `${Math.min(100, count * 20)}%` }]} />
      </View>
      <Text style={[tokenType.sub, { fontSize: 12, marginTop: 8, textAlign: 'center' }]}>{count} / 5</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: 24, gap: spacing.md, paddingBottom: 120 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  corHead: { fontFamily: tokenType.section.fontFamily, fontSize: 18, color: colors.cocoa, marginVertical: 8 },
  frequencyHead: { fontFamily: tokenType.section.fontFamily, fontSize: 17, color: colors.cocoa, marginVertical: 8 },
  bar: { height: 6, backgroundColor: colors.fog, borderRadius: radii.pill, overflow: 'hidden', marginTop: 10 },
  barFill: { height: '100%', backgroundColor: colors.sage, borderRadius: radii.pill },
  empty: { backgroundColor: colors.fog, borderRadius: radii.lg, padding: 32 },
});
