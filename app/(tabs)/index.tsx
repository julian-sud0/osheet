import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Chip, Chips, Label, Pill } from '@/components/ui';
import { ContentTile } from '@/components/ContentTile';
import { WeatherScene } from '@/components/WeatherScene';
import { useAppStore } from '@/data/store';
import { TRIGGER_TYPES, type TriggerKey } from '@/domain/bristol';
import { patterns } from '@/domain/patterns';
import { dayNumber } from '@/domain/time';
import { gutWeatherState, weatherCopy } from '@/domain/weather';
import { colors, radii, shadows, spacing, type as tokenType } from '@/theme/tokens';

export default function Today() {
  const logs = useAppStore((s) => s.logs);
  const startedAt = useAppStore((s) => s.startedAt);
  const dayN = dayNumber(startedAt);
  const totalLogs = logs.length;
  const state = gutWeatherState(logs);
  const copy = weatherCopy(logs);
  const need = 5;
  const insightReady = totalLogs >= need;
  const pat = insightReady ? patterns(logs) : null;
  const headlineCorrelation = pat?.strongest ?? pat?.watching ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Text style={tokenType.title}>Hi.</Text>
          <Pill label={`Day ${dayN} · ${totalLogs} log${totalLogs === 1 ? '' : 's'}`} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open timeline"
          onPress={() => router.push('/(tabs)/timeline')}
          style={[styles.weather, weatherTone(state)]}
        >
          <View style={StyleSheet.absoluteFill}>
            <WeatherScene state={state} />
          </View>
          <View style={styles.weatherContent}>
            <Text style={styles.weatherTitle}>
              {copy.title}
              {'\n'}
              <Text style={styles.weatherEm}>{copy.em}</Text>
            </Text>
            <Text style={styles.weatherFooter}>{copy.footer}</Text>
          </View>
        </Pressable>

        <Card>
          <Label>Quick log</Label>
          <View style={{ marginTop: 12 }}>
            <Chips>
              {(Object.entries(TRIGGER_TYPES) as [TriggerKey, { icon: string; label: string }][]).map(
                ([k, v]) => (
                  <Chip
                    key={k}
                    label={`${v.icon} ${v.label}`}
                    onPress={() => router.push({ pathname: '/log/trigger', params: { kind: k } })}
                  />
                ),
              )}
            </Chips>
          </View>
        </Card>

        {insightReady && headlineCorrelation ? (
          <Card onPress={() => router.push({ pathname: '/insight/[id]', params: { id: headlineCorrelation.id } })}>
            <Label>Watching</Label>
            <Text style={styles.insightHead}>
              {headlineCorrelation.triggerLabel} → {headlineCorrelation.outcomeLabel},{' '}
              {headlineCorrelation.hits} of {headlineCorrelation.n} times
            </Text>
            <Text style={[tokenType.sub, { fontSize: 12 }]}>Tap to see the entries.</Text>
            <View style={styles.bar}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.round((headlineCorrelation.hits / headlineCorrelation.n) * 100)}%` },
                ]}
              />
            </View>
          </Card>
        ) : (
          <ProgressContract have={totalLogs} need={need} />
        )}

        <ContentTile />
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log a stool"
        onPress={() => router.push('/log/bristol')}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.fabPlus}>＋</Text>
      </Pressable>
    </View>
  );
}

function ProgressContract({ have, need }: { have: number; need: number }) {
  const pct = Math.min(100, (have / need) * 100);
  return (
    <Card tone="fog">
      <Label>Your first pattern</Label>
      <Text style={{ fontFamily: tokenType.section.fontFamily, fontSize: 16, marginVertical: 8 }}>
        {need - have} more log{need - have === 1 ? '' : 's'} to start spotting connections.
      </Text>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
    </Card>
  );
}

function weatherTone(state: 'calm' | 'mixed' | 'flare') {
  switch (state) {
    case 'calm':
      return { backgroundColor: colors.sageLight };
    case 'mixed':
      return { backgroundColor: '#d4dde6' };
    case 'flare':
      return { backgroundColor: colors.terraLight };
  }
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: 24, gap: 14, paddingBottom: 120 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  weather: {
    height: 220,
    borderRadius: 26,
    overflow: 'hidden',
    ...shadows.card,
    justifyContent: 'space-between',
    padding: 18,
  },
  weatherContent: { flex: 1, justifyContent: 'space-between' },
  weatherTitle: {
    fontFamily: tokenType.section.fontFamily,
    fontSize: 22,
    lineHeight: 26,
    maxWidth: 240,
    color: colors.cocoa,
  },
  weatherEm: { fontStyle: 'italic', color: colors.terraDark },
  weatherFooter: { fontSize: 12, color: colors.cocoa2 },

  insightHead: {
    fontFamily: tokenType.section.fontFamily,
    fontSize: 17,
    marginVertical: 8,
    color: colors.cocoa,
  },

  bar: { height: 6, backgroundColor: colors.fog, borderRadius: radii.pill, overflow: 'hidden', marginTop: 10 },
  barFill: { height: '100%', backgroundColor: colors.sage, borderRadius: radii.pill },

  fab: {
    position: 'absolute',
    right: 22,
    bottom: 96,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.cocoa,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.fab,
  },
  fabPlus: { color: colors.cream, fontSize: 28, lineHeight: 30 },
});
