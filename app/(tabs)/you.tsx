import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Label, Switch } from '@/components/ui';
import { loadDemoData } from '@/data/seed';
import { useAppStore } from '@/data/store';
import { colors, spacing, type as tokenType } from '@/theme/tokens';

export default function You() {
  const genericName = useAppStore((s) => s.genericName);
  const setGenericName = useAppStore((s) => s.setGenericName);
  const clearLogs = useAppStore((s) => s.clearLogs);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={styles.scroll}>
      <Text style={tokenType.title}>You</Text>

      <Card onPress={() => router.push('/export')}>
        <Label>Share with care team</Label>
        <Text style={styles.cardHead}>For your doctor →</Text>
        <Text style={tokenType.sub}>Generate a clinician-ready PDF.</Text>
      </Card>

      <Card>
        <Label>Privacy</Label>
        <View style={{ gap: 14, marginTop: 10 }}>
          <Row
            title="Generic app name"
            sub={'Show as "Wellness Journal"'}
            right={<Switch value={genericName} onChange={setGenericName} />}
          />
          <Row title="Biometric lock" sub="Face ID required to open" right={<Switch value={false} onChange={() => {}} />} />
          <Row
            title="Encrypted backup"
            sub="Off (your choice)"
            right={<Switch value={false} onChange={() => {}} />}
          />
        </View>
      </Card>

      <Card tone="fog">
        <Label>About</Label>
        <Text style={[tokenType.sub, { marginTop: 8 }]}>
          Your data lives on this phone. No account, no cloud by default. Export anytime.
        </Text>
      </Card>

      {process.env.NODE_ENV !== 'production' ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={[tokenType.sub, { fontSize: 11, marginTop: spacing.md }]}>Demo tools (dev only)</Text>
          <Button label="Load Week-3 demo data" variant="cream" onPress={() => loadDemoData()} />
          <Button label="Clear all logs" variant="ghost" onPress={() => clearLogs()} />
        </View>
      ) : null}
    </ScrollView>
  );
}

function Row({ title, sub, right }: { title: string; sub: string; right: React.ReactNode }) {
  return (
    <View style={styles.settingsRow}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '500', fontSize: 14, color: colors.cocoa }}>{title}</Text>
        <Text style={[tokenType.sub, { fontSize: 12 }]}>{sub}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: 24, gap: spacing.md, paddingBottom: 120 },
  cardHead: { fontFamily: tokenType.section.fontFamily, fontSize: 18, marginVertical: 4, color: colors.cocoa },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
