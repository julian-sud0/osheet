import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import activitiesFile from '@/content/activities.json';
import { Label } from '@/components/ui';
import { colors, radii, shadows, spacing, type as tokenType } from '@/theme/tokens';

interface ActivityMeta {
  id: string;
  title: string;
  blurb: string;
  duration: string;
  category: 'experiment' | 'learn' | 'navigate';
  buildable: boolean;
}

/**
 * The "Things to try" anchor on Today — a compact preview of buildable
 * activities (Self-trial, Bristol quiz). Promotes the activities surface
 * from /learn to home so the user sees them every day, not just when they
 * tap through to the library.
 */
export function ThingsToTryAnchor() {
  const buildable = (activitiesFile.activities as ActivityMeta[]).filter((a) => a.buildable);

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.headerRow}>
        <Label>Things to try</Label>
        <Pressable onPress={() => router.push('/learn')} accessibilityRole="link">
          <Text style={styles.seeMore}>See more →</Text>
        </Pressable>
      </View>
      <Text style={[tokenType.sub, { fontSize: 13 }]}>
        Optional mini-activities that turn your data into learning.
      </Text>

      <View style={{ gap: 10, marginTop: 4 }}>
        {buildable.map((a) => (
          <Pressable
            key={a.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${a.title}`}
            onPress={() => router.push({ pathname: '/activity/[id]', params: { id: a.id } })}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{a.title}</Text>
              <Text style={styles.rowBlurb} numberOfLines={2}>{a.blurb}</Text>
            </View>
            <View style={styles.durationPill}>
              <Text style={styles.durationText}>{a.duration}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seeMore: { color: colors.sageDark, fontSize: 13, fontWeight: '600' },
  row: {
    backgroundColor: '#fff',
    borderRadius: radii.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadows.card,
  },
  rowTitle: { fontFamily: tokenType.section.fontFamily, fontSize: 16, color: colors.cocoa },
  rowBlurb: { fontSize: 12, color: colors.cocoa2, marginTop: 2, lineHeight: 17 },
  durationPill: {
    backgroundColor: colors.fog,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  durationText: { fontSize: 11, fontWeight: '600', color: colors.cocoa2 },
});
