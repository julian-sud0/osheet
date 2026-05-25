import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, type } from '@/theme/tokens';

export default function Today() {
  return (
    <View style={styles.root}>
      <Text style={type.title}>Hi.</Text>
      <Text style={[type.sub, { marginTop: spacing.md }]}>
        Phase 0 scaffold. The weather card, quick log, and FAB land in Phase 1.
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
  },
});
