import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, type } from '@/theme/tokens';

export default function Timeline() {
  return (
    <View style={styles.root}>
      <Text style={type.title}>Timeline</Text>
      <Text style={[type.sub, { marginTop: spacing.md }]}>Phase 1 will land logs grouped by day.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: spacing.lg, paddingTop: 60 },
});
