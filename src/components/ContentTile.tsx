import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import articlesFile from '@/content/articles.json';
import { colors, radii, shadows, spacing, type as tokenType } from '@/theme/tokens';

interface Article {
  id: string;
  title: string;
  source: string;
  blurb: string;
  url: string;
  tags: string[];
}

const ARTICLES: Article[] = articlesFile.articles;

/**
 * Flip to `true` only after every URL in src/content/articles.json has been
 * clicked-through against the live source site and confirmed canonical.
 * Until then the tile stays hidden in production builds.
 */
const ARTICLES_URLS_VERIFIED = false;

/** Day-of-year, 1-366. Deterministic across timezones for a single user. */
function dayOfYear(d: Date = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

/**
 * Rotates one article per day. Same article all day, new one tomorrow.
 * Curated bundle only — no fetch, no editorial cadence, no geo personalisation
 * in MVP. Those land post-MVP only if usage shows the tile is tapped.
 */
export function ContentTile() {
  if (!ARTICLES_URLS_VERIFIED) return null;
  if (ARTICLES.length === 0) return null;
  const article = ARTICLES[dayOfYear() % ARTICLES.length];

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${article.title}, from ${article.source}`}
      onPress={() => {
        void WebBrowser.openBrowserAsync(article.url);
      }}
      style={({ pressed }) => [styles.tile, pressed && { opacity: 0.92 }]}
    >
      <Text style={styles.label}>Worth reading · {article.source}</Text>
      <Text style={styles.title}>{article.title}</Text>
      <Text style={[tokenType.sub, { marginTop: 6 }]}>{article.blurb}</Text>
      <Text style={styles.cta}>Read →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.cream2,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.card,
    gap: 4,
  },
  label: { ...tokenType.label, color: colors.cocoa2 },
  title: { fontFamily: tokenType.section.fontFamily, fontSize: 17, color: colors.cocoa, marginTop: 6 },
  cta: { fontWeight: '600', color: colors.sageDark, fontSize: 13, marginTop: 10 },
});
