import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import activitiesFile from '@/content/activities.json';
import { Card, Label, TopBar } from '@/components/ui';
import { track } from '@/data/analytics';
import { useAppStore } from '@/data/store';
import { colors, radii, shadows, spacing, type as tokenType } from '@/theme/tokens';

interface ActivityMeta {
  id: string;
  title: string;
  blurb: string;
  duration: string;
  category: 'experiment' | 'learn' | 'navigate';
  buildable: boolean;
}

const ACTIVITIES: ActivityMeta[] = activitiesFile.activities as ActivityMeta[];

export default function LearnScreen() {
  const activityRuns = useAppStore((s) => s.activityRuns);
  const communityWaitlist = useAppStore((s) => s.softProfilePromptDismissed); // placeholder until v3 settings ship

  const buildable = ACTIVITIES.filter((a) => a.buildable);
  const coming = ACTIVITIES.filter((a) => !a.buildable);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <TopBar title="Learn & stories" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={tokenType.title}>Things to try</Text>
        <Text style={[tokenType.sub, { marginTop: 4 }]}>
          Optional, opt-in activities that turn your data into learning. Outputs are descriptive —
          never prescriptive.
        </Text>

        <View style={{ gap: spacing.md, marginTop: spacing.md }}>
          {buildable.map((a) => {
            const completedCount = activityRuns.filter(
              (r) => r.activity === a.id && r.completed,
            ).length;
            return (
              <Pressable
                key={a.id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/activity/[id]', params: { id: a.id } })}
                style={({ pressed }) => [styles.activityCard, pressed && { opacity: 0.92 }]}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryText}>{a.category}</Text>
                  </View>
                  <Text style={[tokenType.sub, { fontSize: 11 }]}>{a.duration}</Text>
                </View>
                <Text style={styles.activityTitle}>{a.title}</Text>
                <Text style={[tokenType.sub, { fontSize: 13, marginTop: 4 }]}>{a.blurb}</Text>
                {completedCount > 0 ? (
                  <Text style={styles.completedPill}>Completed {completedCount}×</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionHeading, { marginTop: spacing.xl }]}>Coming</Text>
        <View style={{ gap: 10 }}>
          {coming.map((a) => (
            <View key={a.id} style={styles.comingRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', fontSize: 14, color: colors.cocoa }}>{a.title}</Text>
                <Text style={[tokenType.sub, { fontSize: 12 }]}>{a.blurb}</Text>
              </View>
              <Text style={[tokenType.sub, { fontSize: 11, fontStyle: 'italic' }]}>{a.duration}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionHeading, { marginTop: spacing.xl }]}>Stories & education</Text>
        <Card tone="fog">
          <Label>Coming next</Label>
          <Text style={[tokenType.sub, { marginTop: 6, color: colors.cocoa }]}>
            We&apos;re curating real first-person patient stories and evidence-cited education
            cards from Mayo, Cleveland Clinic, NIDDK, and Harvard Health. Both land here.
          </Text>
        </Card>

        <Text style={[styles.sectionHeading, { marginTop: spacing.xl }]}>Community</Text>
        <CommunityWaitlistCard />
      </ScrollView>
    </View>
  );
}

function CommunityWaitlistCard() {
  // Stored on a localStorage flag for now — backend lands in a later phase.
  const joined = typeof window !== 'undefined' ? !!window.localStorage?.getItem('osheet:community_waitlist') : false;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        if (typeof window === 'undefined') return;
        window.localStorage?.setItem('osheet:community_waitlist', '1');
        track('community_waitlist_joined');
      }}
      style={({ pressed }) => [styles.waitlistCard, pressed && { opacity: 0.92 }]}
    >
      <Label>Coming: opt-in patient community</Label>
      <Text style={[tokenType.sub, { marginTop: 8, color: colors.cocoa }]}>
        We&apos;re designing a private, opt-in space where people tracking similar journeys can
        share what helped — without losing the privacy stance the app is built on. Tap to be
        notified when it&apos;s ready.
      </Text>
      <Text style={[tokenType.sub, { fontSize: 12, marginTop: 10, fontStyle: 'italic' }]}>
        {joined ? "You're on the list." : 'Tap to join the wait list.'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: 14, gap: spacing.md, paddingBottom: 60 },
  sectionHeading: { ...tokenType.label, marginBottom: 4 },
  activityCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: radii.lg,
    ...shadows.card,
    gap: 4,
  },
  activityTitle: {
    fontFamily: tokenType.section.fontFamily,
    fontSize: 19,
    color: colors.cocoa,
    marginTop: 10,
  },
  categoryPill: {
    backgroundColor: colors.fog,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  categoryText: { fontSize: 10, fontWeight: '600', color: colors.cocoa2, textTransform: 'uppercase', letterSpacing: 0.6 },
  completedPill: { marginTop: 10, fontSize: 11, color: colors.sageDark, fontWeight: '600' },
  comingRow: {
    backgroundColor: colors.fog,
    padding: 14,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waitlistCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.sage,
  },
});
