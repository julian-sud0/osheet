import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pill, Seg } from '@/components/ui';
import { useAppStore } from '@/data/store';
import { bristolByType, TRIGGER_TYPES } from '@/domain/bristol';
import { formatTime, groupLogsByDay } from '@/domain/time';
import type { Log, StoolLog, TriggerLog } from '@/data/types';
import { colors, radii, shadows, spacing, type as tokenType } from '@/theme/tokens';

export default function Timeline() {
  const logs = useAppStore((s) => s.logs);
  const grouped = groupLogsByDay(logs);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={styles.scroll}>
      <View style={styles.headerRow}>
        <Text style={tokenType.title}>Timeline</Text>
        <Pill label="Recent" />
      </View>

      <Seg
        value="day"
        onChange={(v) => {
          if (v === 'pattern') router.replace('/(tabs)/patterns');
        }}
        options={[
          { value: 'day', label: 'By day' },
          { value: 'pattern', label: 'By pattern' },
        ]}
      />

      {grouped.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[tokenType.sub, { textAlign: 'center', fontStyle: 'italic' }]}>
            No entries yet. Tap + on Today to log your first.
          </Text>
        </View>
      ) : (
        grouped.map((g) => (
          <View key={g.label} style={{ gap: spacing.sm }}>
            <Text style={styles.dayLabel}>{g.label}</Text>
            {g.logs.map((l) => (
              <Row key={l.id} log={l} />
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

function Row({ log }: { log: Log }) {
  if (log.type === 'stool') {
    return <StoolRow log={log} />;
  }
  return <TriggerRow log={log} />;
}

function StoolRow({ log }: { log: StoolLog }) {
  const b = bristolByType(log.bristol);
  const color = b.color === 'sage' ? colors.sage : b.color === 'terra' ? colors.terra : colors.blue;
  const extras: string[] = [];
  if (log.urgency && log.urgency !== 'None') extras.push(log.urgency.toLowerCase());
  if (log.pain && log.pain !== 'None') extras.push(`${log.pain.toLowerCase()} pain`);
  if (log.extras.includes('Blood')) extras.push('blood');
  if (log.extras.includes('Mucus')) extras.push('mucus');
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{b.name}</Text>
        <Text style={styles.rowMeta}>{extras.length > 0 ? extras.join(' · ') : 'No notes'}</Text>
      </View>
      <Text style={styles.rowTime}>{formatTime(log.ts)}</Text>
    </View>
  );
}

function TriggerRow({ log }: { log: TriggerLog }) {
  const t = TRIGGER_TYPES[log.subtype];
  const meta =
    log.tags.length > 0
      ? log.tags.join(', ')
      : log.note
      ? log.note
      : log.draft
      ? 'finish later'
      : 'logged';
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 11 }}>{t.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{t.label}</Text>
        <Text style={styles.rowMeta}>{meta}</Text>
      </View>
      <Text style={styles.rowTime}>{formatTime(log.ts)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: 24, gap: spacing.md, paddingBottom: 120 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  empty: { backgroundColor: colors.fog, borderRadius: radii.md, padding: 16 },
  dayLabel: { fontFamily: tokenType.section.fontFamily, fontSize: 14, color: colors.cocoa2, paddingHorizontal: 4, marginTop: 4 },
  row: {
    backgroundColor: '#fff',
    borderRadius: radii.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadows.card,
  },
  dot: { width: 20, height: 20, borderRadius: 10 },
  rowTitle: { fontWeight: '500', fontSize: 14, color: colors.cocoa },
  rowMeta: { color: colors.cocoa2, fontSize: 12, marginTop: 2 },
  rowTime: { fontSize: 11, color: colors.cocoa2 },
});
