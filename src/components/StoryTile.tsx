import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import storiesFile from '@/content/stories.json';
import { track } from '@/data/analytics';
import { colors, radii, shadows, spacing, type as tokenType } from '@/theme/tokens';

interface Story {
  id: string;
  who: string;
  condition: string;
  blurb: string;
  source: string;
  url: string;
  tags: string[];
}

const STORIES: Story[] = storiesFile.stories;

function dayOfYear(d: Date = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

/**
 * Rotates one curated patient story per day-of-year. Stories live at
 * verified source URLs — the tile shows a third-person description of
 * what each piece covers, then routes to the source. Never a fabricated
 * first-person excerpt.
 */
export function StoryTile() {
  if (STORIES.length === 0) return null;
  const story = STORIES[dayOfYear() % STORIES.length];

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${story.who}'s story, from ${story.source}`}
      onPress={() => {
        track('story_tapped', { id: story.id });
        void WebBrowser.openBrowserAsync(story.url);
      }}
      style={({ pressed }) => [styles.tile, pressed && { opacity: 0.92 }]}
    >
      <Text style={styles.label}>Today's story · {story.source}</Text>
      <Text style={styles.title}>{story.who} · {story.condition}</Text>
      <Text style={[tokenType.sub, { marginTop: 6, color: colors.cocoa, fontSize: 13 }]}>{story.blurb}</Text>
      <Text style={styles.cta}>Read at {story.source} →</Text>
      <View style={styles.disclaimerRow}>
        <Text style={[tokenType.sub, { fontSize: 11, fontStyle: 'italic' }]}>
          A real story from someone walking this path. We don't store anything you read.
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: '#fff',
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  label: { ...tokenType.label, color: colors.cocoa2 },
  title: { fontFamily: tokenType.section.fontFamily, fontSize: 17, color: colors.cocoa, marginTop: 8 },
  cta: { fontWeight: '600', color: colors.sageDark, fontSize: 13, marginTop: 10 },
  disclaimerRow: { marginTop: 10 },
});
