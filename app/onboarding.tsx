import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Switch } from '@/components/ui';
import { WeatherScene } from '@/components/WeatherScene';
import { useAppStore } from '@/data/store';
import { colors, radii, spacing, type as tokenType } from '@/theme/tokens';

export default function Onboarding() {
  const genericName = useAppStore((s) => s.genericName);
  const setGenericName = useAppStore((s) => s.setGenericName);
  const setOnboarded = useAppStore((s) => s.setOnboarded);

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <WeatherScene state="calm" />
      </View>

      <View>
        <Text style={tokenType.title}>A quiet place{'\n'}for your gut.</Text>
        <Text style={[tokenType.sub, { marginTop: 10 }]}>
          Track how today felt, find what helps, and walk into your next appointment ready.
        </Text>
      </View>

      <Card tone="fog" style={{ padding: spacing.md }}>
        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text style={{ fontWeight: '600', fontSize: 14, color: colors.cocoa }}>
              Show as &ldquo;Wellness Journal&rdquo;
            </Text>
            <Text style={[tokenType.sub, { fontSize: 12, marginTop: 2 }]}>
              Generic name &amp; icon on your home screen.
            </Text>
          </View>
          <Switch value={genericName} onChange={setGenericName} />
        </View>
      </Card>

      <View style={{ flex: 1 }} />

      <Button
        label="Begin"
        variant="sage"
        onPress={() => {
          setOnboarded(true);
          router.replace('/(tabs)');
        }}
      />
      <Text style={[tokenType.sub, { textAlign: 'center', fontSize: 12, paddingBottom: 18 }]}>
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
  hero: {
    height: 170,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
