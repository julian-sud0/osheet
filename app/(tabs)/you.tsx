import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Label, Switch } from '@/components/ui';
import { loadDemoData } from '@/data/seed';
import { useAppStore, type UserMode } from '@/data/store';
import { colors, radii, shadows, spacing, type as tokenType } from '@/theme/tokens';

const MODE_LABEL: Record<UserMode, string> = {
  exploring: "I'm figuring things out",
  appointment: 'I have an appointment coming up',
  diagnosed: 'I was recently diagnosed',
};

export default function You() {
  const userMode = useAppStore((s) => s.userMode);
  const setUserMode = useAppStore((s) => s.setUserMode);
  const clearLogs = useAppStore((s) => s.clearLogs);
  const [modePickerOpen, setModePickerOpen] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={tokenType.title}>You</Text>

        <Card onPress={() => router.push('/export')}>
          <Label>Share with care team</Label>
          <Text style={styles.cardHead}>For your doctor →</Text>
          <Text style={tokenType.sub}>Generate a clinician-ready PDF.</Text>
        </Card>

        <Card>
          <Label>Your situation</Label>
          <Pressable
            onPress={() => setModePickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Change your situation"
            style={({ pressed }) => [styles.modeRow, pressed && { opacity: 0.85 }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.modeValue}>{MODE_LABEL[userMode]}</Text>
              <Text style={[tokenType.sub, { fontSize: 12 }]}>You can change this anytime.</Text>
            </View>
            <Text style={styles.modeChevron}>›</Text>
          </Pressable>
        </Card>

        <Card>
          <Label>Privacy</Label>
          <View style={{ gap: 14, marginTop: 10 }}>
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

      <ModePickerSheet
        visible={modePickerOpen}
        current={userMode}
        onPick={(m) => {
          setUserMode(m);
          setModePickerOpen(false);
        }}
        onClose={() => setModePickerOpen(false)}
      />
    </View>
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

const MODE_OPTIONS: { mode: UserMode; label: string; sub: string }[] = [
  { mode: 'exploring', label: "I'm figuring things out", sub: 'Default thresholds and copy.' },
  { mode: 'appointment', label: 'I have an appointment coming up', sub: 'Surface the doctor PDF after 3 logs.' },
  { mode: 'diagnosed', label: 'I was recently diagnosed', sub: 'Softer copy, looser pattern thresholds.' },
];

function ModePickerSheet({
  visible,
  current,
  onPick,
  onClose,
}: {
  visible: boolean;
  current: UserMode;
  onPick: (m: UserMode) => void;
  onClose: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={pickerStyles.backdrop} onPress={onClose}>
        <Pressable style={pickerStyles.sheet} onPress={() => {}}>
          <Text style={pickerStyles.title}>What brings you here?</Text>
          <Text style={[tokenType.sub, { paddingHorizontal: spacing.md, fontSize: 12 }]}>
            We&apos;ll meet you where you are.
          </Text>
          <View style={{ gap: 6, marginTop: 10 }}>
            {MODE_OPTIONS.map((o) => (
              <Pressable
                key={o.mode}
                onPress={() => onPick(o.mode)}
                accessibilityRole="radio"
                accessibilityState={{ selected: current === o.mode }}
                style={({ pressed }) => [
                  pickerStyles.row,
                  current === o.mode && pickerStyles.rowOn,
                  pressed && pickerStyles.rowPressed,
                ]}
              >
                <Text style={pickerStyles.rowLabel}>{o.label}</Text>
                <Text style={[tokenType.sub, { fontSize: 12, marginTop: 2 }]}>{o.sub}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [pickerStyles.cancel, pressed && { opacity: 0.85 }]}
          >
            <Text style={{ color: colors.cocoa2, fontWeight: '500' }}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  sheet: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.fab,
  },
  title: {
    ...tokenType.label,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: '#fff',
  },
  rowOn: { borderColor: colors.sage },
  rowPressed: { opacity: 0.85 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: colors.cocoa },
  cancel: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.fog,
    borderRadius: radii.md,
  },
});

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: 24, gap: spacing.md, paddingBottom: 120 },
  cardHead: { fontFamily: tokenType.section.fontFamily, fontSize: 18, marginVertical: 4, color: colors.cocoa },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  modeValue: { fontWeight: '500', fontSize: 14, color: colors.cocoa },
  modeChevron: { fontSize: 24, color: colors.cocoa2, marginLeft: 8 },
});
