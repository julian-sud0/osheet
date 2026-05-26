import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Chip, Chips, Label, SavedBanner, TopBar } from '@/components/ui';
import { capturePhoto } from '@/data/photos';
import { useAppStore } from '@/data/store';
import type { BristolType, Pain, StoolExtra, Urgency } from '@/data/types';
import { bristolByType } from '@/domain/bristol';
import { colors, radii, spacing, type as tokenType } from '@/theme/tokens';

const URGENCY: Urgency[] = ['None', 'A bit', "Couldn't wait"];
const PAIN: Pain[] = ['None', 'Mild', 'Moderate', 'Sharp'];
// "Photo" is no longer a chip — it gets its own capture UI below.
const EXTRAS: Exclude<StoolExtra, 'Photo'>[] = ['Blood', 'Mucus', 'Felt incomplete'];

export default function StoolDetailsScreen() {
  const params = useLocalSearchParams<{ bristol?: string }>();
  const bristol = (Number(params.bristol) || 4) as BristolType;
  const entry = bristolByType(bristol);

  const addLog = useAppStore((s) => s.addLog);
  const bloodAlertShown = useAppStore((s) => s.bloodAlertShownThisSession);
  const markBloodAlertShown = useAppStore((s) => s.markBloodAlertShown);

  const [urgency, setUrgency] = useState<Urgency | null>(null);
  const [pain, setPain] = useState<Pain | null>(null);
  const [extras, setExtras] = useState<Exclude<StoolExtra, 'Photo'>[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showBloodAlert, setShowBloodAlert] = useState(false);

  const toggleExtra = (e: Exclude<StoolExtra, 'Photo'>) => {
    const wasOn = extras.includes(e);
    const next = wasOn ? extras.filter((x) => x !== e) : [...extras, e];
    setExtras(next);
    if (e === 'Blood' && !wasOn && !bloodAlertShown) {
      setShowBloodAlert(true);
      markBloodAlertShown();
    }
  };

  const addPhoto = async () => {
    const uri = await capturePhoto();
    if (uri) setPhotoUri(uri);
  };

  const finish = async () => {
    const finalExtras: StoolExtra[] = photoUri ? [...extras, 'Photo'] : [...extras];
    await addLog({
      type: 'stool',
      bristol,
      urgency,
      pain,
      extras: finalExtras,
      photoUri: photoUri ?? undefined,
      ts: Date.now(),
    });
    router.replace('/(tabs)');
  };

  const labelMemo = useMemo(() => `${entry.name} · just now`, [entry.name]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TopBar title="Saved" subtitle={labelMemo} onBack={() => router.back()} />
        <View style={styles.pad}>
          <SavedBanner title="Saved to today." body="Add detail if you want, or just close." />

          <Card>
            <Label>Was there urgency?</Label>
            <View style={{ marginTop: 12 }}>
              <Chips>
                {URGENCY.map((o) => (
                  <Chip key={o} label={o} on={urgency === o} onPress={() => setUrgency(o)} />
                ))}
              </Chips>
            </View>
          </Card>

          <Card>
            <Label>Any discomfort?</Label>
            <View style={{ marginTop: 12 }}>
              <Chips>
                {PAIN.map((o) => (
                  <Chip key={o} label={o} on={pain === o} onPress={() => setPain(o)} />
                ))}
              </Chips>
            </View>
          </Card>

          <Card>
            <Label>Anything else?</Label>
            <View style={{ marginTop: 12 }}>
              <Chips>
                {EXTRAS.map((o) => (
                  <Chip
                    key={o}
                    label={o}
                    on={extras.includes(o)}
                    variant={o === 'Blood' ? 'terra' : 'sage'}
                    onPress={() => toggleExtra(o)}
                  />
                ))}
              </Chips>
            </View>
          </Card>

          <Card>
            <Label>Photo (optional)</Label>
            {photoUri ? (
              <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Image source={{ uri: photoUri }} style={styles.thumb} />
                <View style={{ flex: 1 }}>
                  <Text style={[tokenType.sub, { fontSize: 12 }]}>Saved to this entry.</Text>
                  <Pressable
                    onPress={addPhoto}
                    accessibilityRole="button"
                    style={({ pressed }) => [{ marginTop: 6 }, pressed && { opacity: 0.6 }]}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.sageDark }}>Retake</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={addPhoto}
                accessibilityRole="button"
                accessibilityLabel="Add a photo"
                style={({ pressed }) => [styles.photoDrop, pressed && { opacity: 0.85 }]}
              >
                <Text style={{ fontSize: 13, color: colors.cocoa2 }}>📷 Tap to take or choose a photo</Text>
              </Pressable>
            )}
          </Card>

          {showBloodAlert ? (
            <BloodAlert onDismiss={() => setShowBloodAlert(false)} />
          ) : null}

          <View style={{ height: 14 }} />
          <Button label="Done" onPress={finish} />
          <Button label="Skip — already saved" variant="text" onPress={finish} />
        </View>
      </ScrollView>
    </View>
  );
}

function BloodAlert({ onDismiss }: { onDismiss: () => void }) {
  return (
    <View style={styles.alert}>
      <Text style={styles.alertTitle}>Blood can have many causes.</Text>
      <Text style={[tokenType.sub, { marginTop: 6 }]}>
        If you see it regularly, or with pain, it&apos;s worth contacting your doctor before your
        next scheduled visit — not an emergency by itself.
      </Text>
      <View style={{ marginTop: 10 }}>
        <Button label="Got it" variant="cream" onPress={onDismiss} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 60 },
  pad: { paddingHorizontal: spacing.lg, paddingTop: 14, gap: spacing.md },
  thumb: { width: 80, height: 80, borderRadius: 14, backgroundColor: colors.fog },
  photoDrop: {
    marginTop: 10,
    minHeight: 80,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(61,51,43,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alert: {
    backgroundColor: colors.terraLight,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.terra,
  },
  alertTitle: {
    fontFamily: tokenType.section.fontFamily,
    fontSize: 16,
    color: colors.terraDark,
  },
});
