import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, type } from '@/theme/tokens';

export default function Onboarding() {
  return (
    <View style={styles.root}>
      <View style={styles.heroIllustration} />

      <View style={styles.headline}>
        <Text style={type.title}>A quiet place{'\n'}for your gut.</Text>
        <Text style={[type.sub, { marginTop: 10 }]}>
          Track how today felt, find what helps, and walk into your next appointment ready.
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      <Pressable
        style={styles.cta}
        onPress={() => router.replace('/(tabs)')}
        accessibilityRole="button"
        accessibilityLabel="Begin"
      >
        <Text style={styles.ctaText}>Begin</Text>
      </Pressable>

      <Text style={[type.sub, { textAlign: 'center', fontSize: 12, paddingBottom: 18 }]}>
        Your data lives on this phone. No account needed.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    gap: 22,
  },
  heroIllustration: {
    height: 170,
    borderRadius: radii.lg,
    backgroundColor: colors.sageLight,
  },
  headline: {
    gap: spacing.sm,
  },
  cta: {
    backgroundColor: colors.sage,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
