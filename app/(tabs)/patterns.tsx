import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Label, Pill, Seg } from '@/components/ui';
import { useAppStore } from '@/data/store';
import { hypothesesBelowThreshold, patterns, type Correlation } from '@/domain/patterns';
import { colors, radii, spacing, type as tokenType } from '@/theme/tokens';

export default function PatternsScreen() {
  const logs = useAppStore((s) => s.logs);
  const userMode = useAppStore((s) => s.userMode);
  const profile = useAppStore((s) => s.profile);
  const need = userMode === 'appointment' ? 3 : 5;
  const ready = logs.length >= need;
  const result = ready ? patterns(logs, userMode, profile) : null;

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
        <EmptyState count={logs.length} need={need} />
      ) : (
        <>
          {result.strongest ? <CorrelationCard correlation={result.strongest} headline="Strongest link" /> : null}
          {result.watching ? <CorrelationCard correlation={result.watching} headline="Watching" muted /> : null}
          {!result.strongest && !result.watching ? (
            <StillWatchingPanel hypotheses={hypothesesBelowThreshold(logs)} />
          ) : null}

          {result.alcoholWatch ? (
            <Card>
              <Label>Alcohol watch</Label>
              <Text style={styles.corHead}>
                {result.alcoholWatch.flaresAfterAlcohol} of {result.alcoholWatch.flareDaysLast14} flare
                days followed an alcohol log
              </Text>
              <Text style={tokenType.sub}>
                You marked your intake as {result.alcoholWatch.declared}.{' '}
                {result.alcoholWatch.alcoholLogsLast14 === 0
                  ? 'Tag "Alcohol" on a meal log to see the connection more clearly.'
                  : 'Within 24 hours — worth raising with your GI if it persists.'}
              </Text>
            </Card>
          ) : null}

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

function StillWatchingPanel({ hypotheses }: { hypotheses: Correlation[] }) {
  return (
    <>
      <Card>
        <Label>Still watching</Label>
        <Text style={styles.corHead}>Real patterns need a few flare days alongside the triggers.</Text>
        <Text style={tokenType.sub}>
          We&apos;re tracking the candidates below. None has cleared the confidence threshold yet —
          keep logging when you eat or feel something distinctive.
        </Text>
      </Card>

      {hypotheses.length > 0 ? (
        <Card tone="fog">
          <Label>What we&apos;re watching</Label>
          <View style={{ gap: 10, marginTop: 10 }}>
            {hypotheses.map((h) => {
              const remaining = Math.max(0, 3 - h.hits);
              return (
                <View key={h.id} style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontWeight: '600', fontSize: 14, color: colors.cocoa, flex: 1 }} numberOfLines={1}>
                      {h.triggerLabel} → {h.outcomeLabel}
                    </Text>
                    <Text style={[tokenType.sub, { fontSize: 12, marginLeft: 8 }]}>
                      {h.hits} / {h.n}
                    </Text>
                  </View>
                  <Text style={[tokenType.sub, { fontSize: 12 }]}>
                    {remaining > 0
                      ? `${remaining} more matching ${remaining === 1 ? 'event' : 'events'} would clear the threshold.`
                      : "Strong ratio — we'd need more occurrences before calling it."}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>
      ) : null}
    </>
  );
}

function EmptyState({ count, hint, need = 5 }: { count: number; hint?: string; need?: number }) {
  return (
    <View style={styles.empty}>
      <Text style={{ fontFamily: tokenType.section.fontFamily, fontSize: 20, color: colors.cocoa, textAlign: 'center' }}>
        {hint ?? 'Still finding your patterns.'}
      </Text>
      <Text style={[tokenType.sub, { marginTop: 10, textAlign: 'center' }]}>
        Patterns appear after about {need} logs across a few days.
      </Text>
      <View style={[styles.bar, { marginTop: 16 }]}>
        <View style={[styles.barFill, { width: `${Math.min(100, (count / need) * 100)}%` }]} />
      </View>
      <Text style={[tokenType.sub, { fontSize: 12, marginTop: 8, textAlign: 'center' }]}>
        {count} / {need}
      </Text>
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
