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
        <Text style={tokenType.title}>Welcome to O.</Text>
        <Text style={[tokenType.sub, { marginTop: 12, fontSize: 15, color: colors.cocoa }]}>
          The quiet sidekick for understanding IBS, IBD, and a sensitive gut.
        </Text>
        <Text style={[tokenType.sub, { marginTop: 14 }]}>
          Track how today felt. Notice the patterns that matter. Walk into your next appointment
          knowing exactly what to share.
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
