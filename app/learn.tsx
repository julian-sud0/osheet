import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import activitiesFile from '@/content/activities.json';
import storiesFile from '@/content/stories.json';
import tipsFile from '@/content/tips.json';
import { Card, Label, TopBar } from '@/components/ui';
import { StoryTile } from '@/components/StoryTile';
import { TipCard, type TipShape } from '@/components/TipCard';
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
const TIPS: TipShape[] = tipsFile.tips as TipShape[];
const STORIES = storiesFile.stories;

export default function LearnScreen() {
  const activityRuns = useAppStore((s) => s.activityRuns);
  const communityWaitlist = useAppStore((s) => s.communityWaitlist);
  const joinCommunityWaitlist = useAppStore((s) => s.joinCommunityWaitlist);
  const buildable = ACTIVITIES.filter((a) => a.buildable);
  const coming = ACTIVITIES.filter((a) => !a.buildable);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <TopBar title="Learn & stories" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={tokenType.title}>Learn & stories</Text>
        <Text style={[tokenType.sub, { marginTop: 4 }]}>
          Optional, opt-in things to read or try. Outputs from activities are descriptive — never
          prescriptive — and stories link out to the people who told them.
        </Text>

        <Text style={styles.sectionHeading}>Things to try</Text>
        <View style={{ gap: spacing.md }}>
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
          {coming.map((a) => (
            <View key={a.id} style={styles.comingCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={styles.categoryPillFog}>
                  <Text style={styles.categoryText}>{a.category}</Text>
                </View>
                <Text style={[tokenType.sub, { fontSize: 11, fontStyle: 'italic' }]}>{a.duration} · coming</Text>
              </View>
              <Text style={[styles.activityTitle, { color: colors.cocoa2 }]}>{a.title}</Text>
              <Text style={[tokenType.sub, { fontSize: 13, marginTop: 4 }]}>{a.blurb}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionHeading}>Education</Text>
        <View style={{ gap: spacing.md }}>
          {TIPS.filter((t) => t.category === 'education').map((t) => (
            <TipCard key={t.id} tip={t} variant="compact" />
          ))}
        </View>

        <Text style={styles.sectionHeading}>Preparing & navigating care</Text>
        <View style={{ gap: spacing.md }}>
          {TIPS.filter((t) => t.category === 'care_nav' || t.category === 'preparation').map((t) => (
            <TipCard key={t.id} tip={t} variant="compact" />
          ))}
        </View>

        <Text style={styles.sectionHeading}>Today's story</Text>
        <StoryTile />

        <Text style={[tokenType.sub, { fontSize: 12, fontStyle: 'italic', marginTop: 8 }]}>
          {STORIES.length} stories rotate one per day. Each links to the source publication —
          we don&apos;t store anything you read.
        </Text>

        <Text style={styles.sectionHeading}>Community</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={communityWaitlist ? "You're on the wait list" : 'Join the wait list'}
          onPress={() => {
            if (!communityWaitlist) {
              joinCommunityWaitlist();
              track('community_waitlist_joined');
            }
          }}
          style={({ pressed }) => [styles.waitlistCard, pressed && { opacity: 0.92 }]}
        >
          <Label>Coming: opt-in patient community</Label>
          <Text style={[tokenType.sub, { marginTop: 8, color: colors.cocoa }]}>
            We&apos;re designing a private, opt-in space where people tracking similar journeys can
            share what helped — without losing the privacy stance the app is built on.
          </Text>
          <Text style={[tokenType.sub, { fontSize: 12, marginTop: 10, fontStyle: 'italic' }]}>
            {communityWaitlist ? "You're on the list — we'll notify you when it's ready." : 'Tap to join the wait list.'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: 14, gap: spacing.md, paddingBottom: 80 },
  sectionHeading: {
    ...tokenType.label,
    marginTop: spacing.xl,
    marginBottom: -2,
  },
  activityCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: radii.lg,
    ...shadows.card,
    gap: 4,
  },
  comingCard: {
    backgroundColor: colors.fog,
    padding: 18,
    borderRadius: radii.lg,
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
  categoryPillFog: {
    backgroundColor: '#fff',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  categoryText: { fontSize: 10, fontWeight: '600', color: colors.cocoa2, textTransform: 'uppercase', letterSpacing: 0.6 },
  completedPill: { marginTop: 10, fontSize: 11, color: colors.sageDark, fontWeight: '600' },
  waitlistCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.sage,
  },
});
