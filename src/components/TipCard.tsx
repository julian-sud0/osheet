import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { track } from '@/data/analytics';
import { colors, radii, shadows, spacing, type as tokenType } from '@/theme/tokens';

export interface TipShape {
  id: string;
  category: 'education' | 'care_nav' | 'preparation';
  title: string;
  body: string;
  source: string;
  url: string;
}

export function TipCard({
  tip,
  onDismiss,
  variant = 'standard',
}: {
  tip: TipShape;
  onDismiss?: () => void;
  variant?: 'standard' | 'compact';
}) {
  const open = () => {
    track('tip_tapped', { id: tip.id });
    void WebBrowser.openBrowserAsync(tip.url);
  };

  return (
    <View style={[styles.card, variant === 'compact' && styles.cardCompact]}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Worth reading · {tip.source}</Text>
        {onDismiss ? (
          <Pressable
            onPress={() => {
              track('tip_dismissed', { id: tip.id });
              onDismiss();
            }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss this tip"
            style={({ pressed }) => [styles.dismiss, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.dismissText}>✕</Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable onPress={open} accessibilityRole="link" style={({ pressed }) => [pressed && { opacity: 0.92 }]}>
        <Text style={styles.title}>{tip.title}</Text>
        <Text style={[tokenType.sub, { marginTop: 8, color: colors.cocoa, fontSize: 13 }]}>{tip.body}</Text>
        <Text style={styles.cta}>Read at {tip.source} →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cream2,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.card,
    gap: 4,
  },
  cardCompact: { padding: 14, gap: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { ...tokenType.label, color: colors.cocoa2 },
  dismiss: { padding: 4 },
  dismissText: { color: colors.cocoa2, fontSize: 16 },
  title: { fontFamily: tokenType.section.fontFamily, fontSize: 17, color: colors.cocoa, marginTop: 8 },
  cta: { fontWeight: '600', color: colors.sageDark, fontSize: 13, marginTop: 12 },
});
