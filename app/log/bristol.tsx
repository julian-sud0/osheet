import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BristolStack } from '@/components/BristolStack';
import { TopBar } from '@/components/ui';
import type { BristolType } from '@/data/types';
import { colors, spacing, type as tokenType } from '@/theme/tokens';

export default function BristolLogScreen() {
  return (
    <ScrollView contentContainerStyle={styles.scroll} style={{ backgroundColor: colors.cream }}>
      <TopBar title="Log stool" subtitle="just now" onBack={() => router.back()} />
      <View style={styles.pad}>
        <Text style={tokenType.title}>How was it?</Text>
        <Text style={[tokenType.sub, { marginTop: -4 }]}>Swipe through, tap to choose.</Text>

        <View style={{ marginTop: 14 }}>
          <BristolStack
            onChoose={(type: BristolType) =>
              router.replace({ pathname: '/log/stool-details', params: { bristol: String(type) } })
            }
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 60 },
  pad: { paddingHorizontal: spacing.lg, paddingTop: 18, gap: spacing.md },
});
