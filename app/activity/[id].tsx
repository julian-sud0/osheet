import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import activitiesFile from '@/content/activities.json';
import { BristolQuiz } from '@/components/activities/BristolQuiz';
import { SelfTrial } from '@/components/activities/SelfTrial';
import { ActivityPlaceholder } from '@/components/activities/Placeholder';
import { TopBar } from '@/components/ui';
import { colors, spacing, type as tokenType } from '@/theme/tokens';

export default function ActivityScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const meta = activitiesFile.activities.find((a) => a.id === id);

  if (!meta) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream }}>
        <TopBar title="Activity" onBack={() => router.back()} />
        <ScrollView contentContainerStyle={styles.pad}>
          <Text style={tokenType.title}>Unknown activity</Text>
          <Text style={[tokenType.sub, { marginTop: 8 }]}>
            We don&apos;t recognise this id. Go back and pick from the Learn library.
          </Text>
        </ScrollView>
      </View>
    );
  }

  if (!meta.buildable) {
    return <ActivityPlaceholder title={meta.title} blurb={meta.blurb} />;
  }

  if (meta.id === 'self-trial') {
    return <SelfTrial />;
  }
  if (meta.id === 'bristol-quiz') {
    return <BristolQuiz />;
  }
  return <ActivityPlaceholder title={meta.title} blurb={meta.blurb} />;
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg, paddingTop: 14, gap: spacing.md },
});
