import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Label, TopBar } from '@/components/ui';
import { colors, spacing, type as tokenType } from '@/theme/tokens';

export function ActivityPlaceholder({ title, blurb }: { title: string; blurb: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <TopBar title={title} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={tokenType.title}>{title}</Text>
        <Text style={[tokenType.sub, { marginTop: 8 }]}>{blurb}</Text>

        <Card tone="fog" style={{ marginTop: 24 }}>
          <Label>Coming soon</Label>
          <Text style={[tokenType.sub, { marginTop: 8, color: colors.cocoa }]}>
            This activity is being designed. The Self-trial and Bristol scale literacy
            activities are available today.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg, paddingTop: 14, gap: spacing.md },
});
