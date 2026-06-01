import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { BristolStack } from '@/components/BristolStack';
import { TopBar } from '@/components/ui';
import type { BristolType } from '@/data/types';
import { colors, spacing, type as tokenType } from '@/theme/tokens';

export default function BristolLogScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <TopBar title="Log stool" subtitle="just now" onBack={() => router.back()} />
      <View style={styles.pad}>
        <Text style={tokenType.title}>How was it?</Text>
        <Text style={[tokenType.sub, { marginTop: -4 }]}>Swipe through, tap to choose.</Text>
      </View>

      <View style={{ flex: 1 }}>
        <BristolStack
          onChoose={(type: BristolType) =>
            router.replace({ pathname: '/log/stool-details', params: { bristol: String(type) } })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: spacing.lg, paddingTop: 18, gap: spacing.md },
});
