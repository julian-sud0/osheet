import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, type } from '@/theme/tokens';

export default function You() {
  return (
    <View style={styles.root}>
      <Text style={type.title}>You</Text>
      <Text style={[type.sub, { marginTop: spacing.md }]}>
        Privacy controls and the doctor-PDF export land in Phase 1 and 3.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: spacing.lg, paddingTop: 60 },
});
