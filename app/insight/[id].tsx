import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Label, TopBar } from '@/components/ui';
import { useAppStore } from '@/data/store';
import { findCorrelationById, type CorrelationEntry } from '@/domain/patterns';
import { colors, spacing, type as tokenType } from '@/theme/tokens';

export default function InsightDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const logs = useAppStore((s) => s.logs);
  const userMode = useAppStore((s) => s.userMode);
  const correlation = useMemo(
    () => (id ? findCorrelationById(logs, id, userMode) : undefined),
    [logs, id, userMode],
  );

  if (!correlation) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream }}>
        <TopBar title="Pattern detail" onBack={() => router.back()} />
        <View style={styles.pad}>
          <Text style={tokenType.title}>No pattern yet</Text>
          <Text style={[tokenType.sub, { marginTop: 8 }]}>
            Once you have a few more logs, the strongest trigger-to-outcome links land here.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }}>
      <TopBar title="Pattern detail" onBack={() => router.back()} />
      <View style={styles.pad}>
        <Text style={tokenType.title}>
          {correlation.triggerLabel} →{'\n'}
          {correlation.outcomeLabel}
        </Text>
        <Text style={tokenType.sub}>
          {correlation.hits} of {correlation.n} times · {correlation.confidence} confidence
        </Text>

        <Card>
          <Label>The {correlation.entries.length} entr{correlation.entries.length === 1 ? 'y' : 'ies'}</Label>
          <View style={{ gap: 10, marginTop: 10 }}>
            {correlation.entries.length === 0 ? (
              <Text style={tokenType.sub}>No matching entries in the current window.</Text>
            ) : (
              correlation.entries.map((e, i) => <EntryRow key={i} entry={e} />)
            )}
          </View>
        </Card>

        <Card tone="fog">
          <Label>What this might mean</Label>
          <Text style={[tokenType.sub, { marginTop: 8 }]}>
            A consistent within-6-hour pattern is worth raising with your GI. It&apos;s not a
            diagnosis — your doctor can suggest a trial elimination or testing if useful.
          </Text>
        </Card>

        <Button label="Include this in next report" variant="cream" onPress={() => router.push('/export')} />
      </View>
    </ScrollView>
  );
}

function EntryRow({ entry }: { entry: CorrelationEntry }) {
  const stoolDate = new Date(entry.stoolTs);
  const stoolWhen = relativeDate(stoolDate);
  const stoolTime = `${String(stoolDate.getHours()).padStart(2, '0')}:${String(stoolDate.getMinutes()).padStart(2, '0')}`;
  const delayMin = Math.round(entry.delayMs / 60000);
  const delay =
    delayMin < 60
      ? `~${delayMin}m`
      : `~${Math.floor(delayMin / 60)}h ${delayMin % 60}m`;
  return (
    <View style={styles.entryRow}>
      <View style={styles.entryDot} />
      <View style={{ flex: 1 }}>
        <Text style={styles.entryWhen}>
          {stoolWhen} {stoolTime}
        </Text>
        <Text style={[tokenType.sub, { fontSize: 12 }]}>{entry.triggerLabel}</Text>
      </View>
      <Text style={[tokenType.sub, { fontSize: 11 }]}>{delay}</Text>
    </View>
  );
}

function relativeDate(d: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const that = new Date(d);
  that.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - that.getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg, paddingTop: 14, gap: spacing.md },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  entryDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.terra },
  entryWhen: { fontWeight: '500', fontSize: 14, color: colors.cocoa },
});
