import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Chip, Chips, Label, TopBar } from '@/components/ui';
import { useAppStore } from '@/data/store';
import { colors, spacing, type as tokenType } from '@/theme/tokens';

type Range = '2w' | '30d' | '90d';

const LABEL: Record<Range, string> = {
  '2w': 'Last 2 weeks',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
};

export default function ExportScreen() {
  const logs = useAppStore((s) => s.logs);
  const [range, setRange] = useState<Range>('30d');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }}>
      <TopBar title="For your doctor" onBack={() => router.back()} />
      <View style={styles.pad}>
        <Text style={tokenType.title}>For your{'\n'}doctor</Text>

        <Card>
          <Label>How much to include</Label>
          <Text style={styles.rangeHead}>{LABEL[range]}</Text>
          <Text style={[tokenType.sub, { fontSize: 12 }]}>{logs.length} entries</Text>
          <View style={{ marginTop: 12 }}>
            <Chips>
              <Chip label="2 weeks" on={range === '2w'} onPress={() => setRange('2w')} />
              <Chip label="30 days" on={range === '30d'} onPress={() => setRange('30d')} />
              <Chip label="90 days" on={range === '90d'} onPress={() => setRange('90d')} />
            </Chips>
          </View>
          <Text style={[tokenType.sub, { fontSize: 11, marginTop: 10, fontStyle: 'italic' }]}>
            Custom ranges land in a coming update — these three cover the common ask sizes.
          </Text>
        </Card>

        <Card>
          <Label>What&apos;s in it</Label>
          <View style={{ gap: 10, marginTop: 10 }}>
            <IncludeRow item="Bristol distribution" />
            <IncludeRow item="Symptom timeline" />
            <IncludeRow item="Trigger correlations" />
            <IncludeRow item="Daily log table" />
            <IncludeRow item="Photos" status="Opt-in per entry" warn />
          </View>
        </Card>

        <View style={{ height: 14 }} />
        <Button label="Preview &amp; generate" variant="sage" onPress={() => router.push({ pathname: '/export/pdf', params: { range } })} />
      </View>
    </ScrollView>
  );
}

function IncludeRow({ item, status = 'Included', warn = false }: { item: string; status?: string; warn?: boolean }) {
  return (
    <View style={styles.includeRow}>
      <Text style={{ fontSize: 14, color: colors.cocoa }}>{item}</Text>
      <Text style={{ fontWeight: '500', color: warn ? colors.terraDark : colors.sageDark }}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg, paddingTop: 14, gap: spacing.md, paddingBottom: 60 },
  rangeHead: { fontFamily: tokenType.section.fontFamily, fontSize: 18, marginVertical: 6, color: colors.cocoa },
  includeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
