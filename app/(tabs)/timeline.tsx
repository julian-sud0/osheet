import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RowActionsSheet } from '@/components/RowActionsSheet';
import { Pill, Seg } from '@/components/ui';
import { useAppStore } from '@/data/store';
import type { Log, StoolLog, TriggerLog } from '@/data/types';
import { bristolByType, TRIGGER_TYPES } from '@/domain/bristol';
import { formatTime, groupLogsByDay } from '@/domain/time';
import { colors, radii, shadows, spacing, type as tokenType } from '@/theme/tokens';

export default function Timeline() {
  const logs = useAppStore((s) => s.logs);
  const deleteLog = useAppStore((s) => s.deleteLog);
  const grouped = groupLogsByDay(logs);
  const [actionTarget, setActionTarget] = useState<Log | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={styles.scroll}>
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
              {g.logs.length >= 2 ? (
                <Text style={styles.daySummary}>{summariseDay(g.logs)}</Text>
              ) : null}
              {g.logs.map((l) => (
                <Row key={l.id} log={l} onLongPress={() => setActionTarget(l)} />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <RowActionsSheet
        visible={actionTarget !== null}
        title={actionTarget ? describeLog(actionTarget) : ''}
        onEdit={
          actionTarget
            ? () => {
                const target = actionTarget;
                if (target.type === 'stool') {
                  router.push({
                    pathname: '/log/stool-details',
                    params: { bristol: String(target.bristol), edit: target.id },
                  });
                } else {
                  router.push({
                    pathname: '/log/trigger',
                    params: { kind: target.subtype, edit: target.id },
                  });
                }
              }
            : undefined
        }
        onDelete={
          actionTarget
            ? () => {
                void deleteLog(actionTarget.id);
              }
            : undefined
        }
        onClose={() => setActionTarget(null)}
      />
    </View>
  );
}

function describeLog(log: Log): string {
  if (log.type === 'stool') {
    return `${bristolByType(log.bristol).name} · ${formatTime(log.ts)}`;
  }
  return `${TRIGGER_TYPES[log.subtype].label} · ${formatTime(log.ts)}`;
}

/**
 * Descriptive one-line summary for a day. Counts stools (with modal Bristol
 * type), counts trigger subtypes, and surfaces up to 2 food tags. No
 * inference, no claims — just glanceable counts.
 */
function summariseDay(logs: Log[]): string {
  const stools = logs.filter((l): l is StoolLog => l.type === 'stool');
  const triggers = logs.filter((l): l is TriggerLog => l.type === 'trigger');
  const meds = triggers.filter((t) => t.subtype === 'med').length;
  const ate = triggers.filter((t) => t.subtype === 'ate').length;
  const stress = triggers.filter((t) => t.subtype === 'stress').length;
  const sleep = triggers.filter((t) => t.subtype === 'sleep').length;

  const parts: string[] = [];
  if (stools.length > 0) {
    const modal = modalBristol(stools);
    parts.push(
      `${stools.length} stool${stools.length === 1 ? '' : 's'}${modal ? ` (Type ${modal} avg)` : ''}`,
    );
  }
  if (meds > 0) parts.push(`${meds} med${meds === 1 ? '' : 's'}`);
  if (ate > 0) {
    const allTags = triggers
      .filter((t) => t.subtype === 'ate')
      .flatMap((t) => t.tags)
      .slice(0, 2);
    parts.push(allTags.length > 0 ? allTags.join(' & ').toLowerCase() : `${ate} meal${ate === 1 ? '' : 's'}`);
  }
  if (stress > 0) parts.push(`${stress} stress`);
  if (sleep > 0) parts.push(`${sleep} sleep`);
  return parts.join(' · ');
}

function modalBristol(stools: StoolLog[]): number | null {
  const counts = new Map<number, number>();
  for (const s of stools) counts.set(s.bristol, (counts.get(s.bristol) ?? 0) + 1);
  let best: { type: number; n: number } | null = null;
  for (const [type, n] of counts.entries()) {
    if (!best || n > best.n) best = { type, n };
  }
  return best?.type ?? null;
}

function Row({ log, onLongPress }: { log: Log; onLongPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={describeLog(log)}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}
    >
      {log.type === 'stool' ? <StoolRowContent log={log} /> : <TriggerRowContent log={log} />}
    </Pressable>
  );
}

function StoolRowContent({ log }: { log: StoolLog }) {
  const b = bristolByType(log.bristol);
  const color = b.color === 'sage' ? colors.sage : b.color === 'terra' ? colors.terra : colors.blue;
  const extras: string[] = [];
  if (log.urgency && log.urgency !== 'None') extras.push(log.urgency.toLowerCase());
  if (log.pain && log.pain !== 'None') extras.push(`${log.pain.toLowerCase()} pain`);
  if (log.extras.includes('Blood')) extras.push('blood');
  if (log.extras.includes('Mucus')) extras.push('mucus');
  return (
    <>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{b.name}</Text>
        <Text style={styles.rowMeta}>{extras.length > 0 ? extras.join(' · ') : 'No notes'}</Text>
      </View>
      {log.photoUri ? <Image source={{ uri: log.photoUri }} style={styles.thumb} /> : null}
      <Text style={styles.rowTime}>{formatTime(log.ts)}</Text>
    </>
  );
}

function TriggerRowContent({ log }: { log: TriggerLog }) {
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
    <>
      <View style={[styles.dot, { backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 11 }}>{t.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{t.label}</Text>
        <Text style={styles.rowMeta}>{meta}</Text>
      </View>
      {log.photoUri ? <Image source={{ uri: log.photoUri }} style={styles.thumb} /> : null}
      <Text style={styles.rowTime}>{formatTime(log.ts)}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: 24, gap: spacing.md, paddingBottom: 120 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  empty: { backgroundColor: colors.fog, borderRadius: radii.md, padding: 16 },
  dayLabel: { fontFamily: tokenType.section.fontFamily, fontSize: 14, color: colors.cocoa2, paddingHorizontal: 4, marginTop: 4 },
  daySummary: { fontSize: 12, color: colors.cocoa2, paddingHorizontal: 4, marginTop: -2, fontStyle: 'italic' },
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
  thumb: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.fog },
  rowTitle: { fontWeight: '500', fontSize: 14, color: colors.cocoa },
  rowMeta: { color: colors.cocoa2, fontSize: 12, marginTop: 2 },
  rowTime: { fontSize: 11, color: colors.cocoa2 },
});
