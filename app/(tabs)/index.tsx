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
  const userMode = useAppStore((s) => s.userMode);
  const dayN = dayNumber(startedAt);
  const totalLogs = logs.length;
  const state = gutWeatherState(logs);
  const copy = weatherCopy(logs, { mode: userMode, startedAt });
  // `appointment` users get the first-pattern contract loosened — they don't have
  // time to wait for 5 logs before the product proves itself useful.
  const need = userMode === 'appointment' ? 3 : 5;
  const insightReady = totalLogs >= need;
  const pat = insightReady ? patterns(logs, userMode) : null;
  const headlineCorrelation = pat?.strongest ?? pat?.watching ?? null;
  const showDoctorTile = userMode === 'appointment' && totalLogs >= 3;

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
            <Label>{userMode === 'appointment' ? 'Early signal' : 'Watching'}</Label>
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
          <ProgressContract have={totalLogs} need={need} mode={userMode} />
        )}

        {showDoctorTile ? (
          <Card onPress={() => router.push('/export')}>
            <Label>For your doctor</Label>
            <Text style={styles.insightHead}>You have enough to bring →</Text>
            <Text style={[tokenType.sub, { fontSize: 12 }]}>
              Generate a clinician-ready PDF from your last {totalLogs} entries.
            </Text>
          </Card>
        ) : null}

        <ContentTile />
      </ScrollView>
    </View>
  );
}

function ProgressContract({
  have,
  need,
  mode,
}: {
  have: number;
  need: number;
  mode: 'exploring' | 'appointment' | 'diagnosed';
}) {
  const pct = Math.min(100, (have / need) * 100);
  const remaining = Math.max(0, need - have);
  const headline =
    mode === 'appointment'
      ? `${remaining} more log${remaining === 1 ? '' : 's'} and you'll have enough to bring.`
      : mode === 'diagnosed'
      ? 'Still finding your patterns.'
      : `${remaining} more log${remaining === 1 ? '' : 's'} to start spotting connections.`;
  return (
    <Card tone="fog">
      <Label>{mode === 'appointment' ? 'For your doctor' : 'Your first pattern'}</Label>
      <Text style={{ fontFamily: tokenType.section.fontFamily, fontSize: 16, marginVertical: 8 }}>
        {headline}
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
});
