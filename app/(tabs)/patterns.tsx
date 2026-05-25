import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, type } from '@/theme/tokens';

export default function Patterns() {
  return (
    <View style={styles.root}>
      <Text style={type.title}>Patterns</Text>
      <Text style={[type.sub, { marginTop: spacing.md }]}>
        Phase 2 wires the real correlation engine here — no more hardcoded "Dairy".
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: spacing.lg, paddingTop: 60 },
});
