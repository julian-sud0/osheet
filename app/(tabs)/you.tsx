import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Label } from '@/components/ui';
import articlesFile from '@/content/articles.json';
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

        <Card onPress={() => router.push('/profile')}>
          <Label>About you</Label>
          <Text style={styles.cardHead}>Profile &amp; baseline →</Text>
          <Text style={tokenType.sub}>
            Age, diet, lifestyle, and the validated symptom score you can share with your doctor.
          </Text>
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

            <Card tone="fog">
              <Label>Verify article URLs</Label>
              <Text style={[tokenType.sub, { fontSize: 12, marginTop: 6 }]}>
                Tap each to open the source page. Any that 404 or redirect to a homepage should be
                updated in <Text style={{ fontFamily: 'monospace' }}>src/content/articles.json</Text>.
              </Text>
              <View style={{ gap: 6, marginTop: 10 }}>
                {articlesFile.articles.map((a: { id: string; title: string; source: string; url: string }) => (
                  <Pressable
                    key={a.id}
                    onPress={() => {
                      void WebBrowser.openBrowserAsync(a.url);
                    }}
                    accessibilityRole="link"
                    style={({ pressed }) => [verifyStyles.row, pressed && { opacity: 0.7 }]}
                  >
                    <Text style={verifyStyles.title}>{a.title}</Text>
                    <Text style={verifyStyles.source}>{a.source}</Text>
                  </Pressable>
                ))}
              </View>
            </Card>
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

const MODE_OPTIONS: { mode: UserMode; label: string; sub: string }[] = [
  { mode: 'exploring', label: "I'm figuring things out", sub: "Take your time. We'll watch for patterns as you go." },
  { mode: 'appointment', label: 'I have an appointment coming up', sub: 'Faster path to a doctor-ready report.' },
  { mode: 'diagnosed', label: 'I was recently diagnosed', sub: 'Gentler pace while you find your footing.' },
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

const verifyStyles = StyleSheet.create({
  row: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: radii.md,
  },
  title: { fontSize: 13, fontWeight: '600', color: colors.cocoa },
  source: { fontSize: 11, color: colors.cocoa2, marginTop: 2 },
});

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
  modeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  modeValue: { fontWeight: '500', fontSize: 14, color: colors.cocoa },
  modeChevron: { fontSize: 24, color: colors.cocoa2, marginLeft: 8 },
});
