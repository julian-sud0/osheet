import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { WeatherScene } from '@/components/WeatherScene';
import { colors, radii, spacing, type as tokenType } from '@/theme/tokens';

export default function Onboarding() {
  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <WeatherScene state="calm" />
      </View>

      <View style={styles.headline}>
        <Text style={tokenType.title}>
          Most days this is{'\n'}invisible work.{'\n'}Here, it counts.
        </Text>
        <Text style={[tokenType.sub, { marginTop: 14 }]}>
          A quiet place to notice patterns, side by side. We watch the data so you can live the
          days.
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      <Button
        label="Begin"
        variant="sage"
        onPress={() => router.push('/onboarding-mode')}
      />
      <Text style={[tokenType.sub, { textAlign: 'center', fontSize: 12, paddingBottom: 18 }]}>
        Stays on this phone. No account, no cloud.
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
    gap: spacing.lg,
  },
  hero: {
    height: 170,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  headline: { gap: spacing.sm },
});
