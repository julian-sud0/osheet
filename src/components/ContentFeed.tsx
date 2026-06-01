import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import storiesFile from '@/content/stories.json';
import tipsFile from '@/content/tips.json';
import videosFile from '@/content/videos.json';
import type { TipShape } from '@/components/TipCard';
import { track } from '@/data/analytics';
import { useAppStore } from '@/data/store';
import { pickContextualTip } from '@/domain/tipSurfacing';
import { colors, radii, shadows, spacing, type as tokenType } from '@/theme/tokens';

interface TipDef extends TipShape {
  surfacedWhen: string[];
}

interface StoryDef {
  id: string;
  who: string;
  condition: string;
  blurb: string;
  source: string;
  url: string;
  tags: string[];
}

interface VideoDef {
  id: string;
  title: string;
  blurb: string;
  source: string;
  url: string;
  durationSec?: number;
  tags?: string[];
}

const TIPS: TipDef[] = tipsFile.tips as TipDef[];
const STORIES: StoryDef[] = storiesFile.stories as StoryDef[];
const VIDEOS: VideoDef[] = videosFile.videos as VideoDef[];

function dayOfYear(d: Date = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

type FeedItem =
  | { kind: 'tip'; tip: TipDef }
  | { kind: 'story'; story: StoryDef }
  | { kind: 'video'; video: VideoDef };

/**
 * The Today content feed. Mixed-type, vertically scrolled, contextually
 * ordered. No crowd-based ranking ever — order is derived only from the
 * user's own state (most-relevant tip first via `pickContextualTip`, then
 * today's rotating story, then the rest of the curated set).
 *
 * Video items are reserved in the schema but currently empty — when
 * videos.json grows, they appear automatically.
 */
export function ContentFeed() {
  const logs = useAppStore((s) => s.logs);
  const userMode = useAppStore((s) => s.userMode);
  const startedAt = useAppStore((s) => s.startedAt);
  const tipsDismissed = useAppStore((s) => s.tipsDismissed);
  const dismissTip = useAppStore((s) => s.dismissTip);

  const items = buildFeed({
    contextualTip: pickContextualTip(logs, userMode, startedAt, new Set(tipsDismissed)) as TipDef | null,
    todayStoryIndex: dayOfYear() % Math.max(1, STORIES.length),
    dismissedTipIds: new Set(tipsDismissed),
  });

  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.headerRow}>
        <Text style={[tokenType.label]}>Today's feed</Text>
        <Text style={[tokenType.sub, { fontSize: 11, fontStyle: 'italic' }]}>Curated · we don't store what you read</Text>
      </View>

      {items.map((item) => {
        if (item.kind === 'tip') {
          return (
            <TipFeedCard
              key={`tip-${item.tip.id}`}
              tip={item.tip}
              onDismiss={() => dismissTip(item.tip.id)}
            />
          );
        }
        if (item.kind === 'story') {
          return <StoryFeedCard key={`story-${item.story.id}`} story={item.story} />;
        }
        return <VideoFeedCard key={`video-${item.video.id}`} video={item.video} />;
      })}

      <View style={styles.terminus}>
        <Text style={[tokenType.sub, { fontSize: 13, textAlign: 'center', fontStyle: 'italic' }]}>
          That&apos;s everything for today. Check back tomorrow.
        </Text>
      </View>
    </View>
  );
}

function buildFeed({
  contextualTip,
  todayStoryIndex,
  dismissedTipIds,
}: {
  contextualTip: TipDef | null;
  todayStoryIndex: number;
  dismissedTipIds: Set<string>;
}): FeedItem[] {
  const items: FeedItem[] = [];

  // 1. Most-relevant contextual tip first (if any).
  if (contextualTip) {
    items.push({ kind: 'tip', tip: contextualTip });
  }

  // 2. Today's rotating story (if any).
  if (STORIES.length > 0) {
    items.push({ kind: 'story', story: STORIES[todayStoryIndex] });
  }

  // 3. Remaining tips in category order, excluding dismissed and the
  // already-rendered contextual one.
  const categoryOrder: TipDef['category'][] = ['education', 'preparation', 'care_nav'];
  for (const cat of categoryOrder) {
    for (const t of TIPS) {
      if (t.category !== cat) continue;
      if (dismissedTipIds.has(t.id)) continue;
      if (contextualTip && t.id === contextualTip.id) continue;
      items.push({ kind: 'tip', tip: t });
    }
  }

  // 4. Remaining stories in declaration order.
  for (let i = 0; i < STORIES.length; i++) {
    if (i === todayStoryIndex) continue;
    items.push({ kind: 'story', story: STORIES[i] });
  }

  // 5. Videos (currently empty array).
  for (const v of VIDEOS) {
    items.push({ kind: 'video', video: v });
  }

  return items;
}

// ============================== Card variants =============================

function TipFeedCard({ tip, onDismiss }: { tip: TipDef; onDismiss: () => void }) {
  const open = () => {
    track('tip_tapped', { id: tip.id });
    void WebBrowser.openBrowserAsync(tip.url);
  };
  return (
    <View style={[styles.card, styles.tipCard]}>
      <View style={styles.cardHeader}>
        <View style={[styles.chip, styles.chipTip]}>
          <Text style={styles.chipText}>Worth reading</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[tokenType.sub, { fontSize: 11 }]}>{tip.source}</Text>
          <Pressable
            onPress={() => {
              track('tip_dismissed', { id: tip.id });
              onDismiss();
            }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            style={({ pressed }) => [styles.dismiss, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.dismissText}>✕</Text>
          </Pressable>
        </View>
      </View>
      <Pressable onPress={open} accessibilityRole="link" style={({ pressed }) => [pressed && { opacity: 0.92 }]}>
        <Text style={styles.title}>{tip.title}</Text>
        <Text style={[tokenType.sub, { fontSize: 13, marginTop: 8, color: colors.cocoa }]}>{tip.body}</Text>
        <Text style={styles.cta}>Read at {tip.source} →</Text>
      </Pressable>
    </View>
  );
}

function StoryFeedCard({ story }: { story: StoryDef }) {
  const open = () => {
    track('story_tapped', { id: story.id });
    void WebBrowser.openBrowserAsync(story.url);
  };
  return (
    <Pressable
      onPress={open}
      accessibilityRole="link"
      accessibilityLabel={`${story.who}'s story, from ${story.source}`}
      style={({ pressed }) => [styles.card, styles.storyCard, pressed && { opacity: 0.92 }]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.chip, styles.chipStory]}>
          <Text style={styles.chipText}>Story</Text>
        </View>
        <Text style={[tokenType.sub, { fontSize: 11 }]}>{story.source}</Text>
      </View>
      <Text style={styles.title}>
        {story.who} · {story.condition}
      </Text>
      <Text style={[tokenType.sub, { fontSize: 13, marginTop: 8, color: colors.cocoa }]}>{story.blurb}</Text>
      <Text style={styles.cta}>Read at {story.source} →</Text>
    </Pressable>
  );
}

function VideoFeedCard({ video }: { video: VideoDef }) {
  const open = () => {
    track('story_tapped', { id: video.id });
    void WebBrowser.openBrowserAsync(video.url);
  };
  return (
    <Pressable
      onPress={open}
      accessibilityRole="link"
      style={({ pressed }) => [styles.card, styles.videoCard, pressed && { opacity: 0.92 }]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.chip, styles.chipVideo]}>
          <Text style={styles.chipText}>Video</Text>
        </View>
        <Text style={[tokenType.sub, { fontSize: 11 }]}>{video.source}</Text>
      </View>
      <View style={styles.videoPlaceholder}>
        <Text style={styles.playIcon}>▶</Text>
      </View>
      <Text style={styles.title}>{video.title}</Text>
      <Text style={[tokenType.sub, { fontSize: 13, marginTop: 6, color: colors.cocoa }]}>{video.blurb}</Text>
      <Text style={styles.cta}>Watch at {video.source} →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  card: {
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.card,
    gap: 4,
  },
  tipCard: { backgroundColor: colors.cream2 },
  storyCard: { backgroundColor: '#fff' },
  videoCard: { backgroundColor: '#fff' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
  },
  chipTip: { backgroundColor: 'rgba(127,168,139,0.18)' },
  chipStory: { backgroundColor: 'rgba(216,139,107,0.18)' },
  chipVideo: { backgroundColor: 'rgba(124,155,179,0.18)' },
  chipText: { fontSize: 10, fontWeight: '700', color: colors.cocoa, letterSpacing: 0.4, textTransform: 'uppercase' },
  dismiss: { padding: 4 },
  dismissText: { color: colors.cocoa2, fontSize: 16 },
  title: { fontFamily: tokenType.section.fontFamily, fontSize: 17, color: colors.cocoa, marginTop: 8 },
  cta: { fontWeight: '600', color: colors.sageDark, fontSize: 13, marginTop: 12 },
  videoPlaceholder: {
    height: 140,
    borderRadius: radii.md,
    backgroundColor: colors.fog,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  playIcon: { fontSize: 32, color: colors.cocoa2 },
  terminus: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
});
