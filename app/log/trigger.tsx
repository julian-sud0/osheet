import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Card, Chip, Chips, Label, SavedBanner, Seg, TopBar } from '@/components/ui';
import { TimestampToggle } from '@/components/TimestampToggle';
import { capturePhoto } from '@/data/photos';
import { useAppStore } from '@/data/store';
import { COMMON_FOOD_TAGS, COMMON_MEDS, TRIGGER_TYPES, type TriggerKey } from '@/domain/bristol';
import { colors, radii, spacing, type as tokenType } from '@/theme/tokens';

export default function TriggerScreen() {
  const { kind } = useLocalSearchParams<{ kind?: TriggerKey }>();
  const trigger = kind ? TRIGGER_TYPES[kind] : null;
  const addLog = useAppStore((s) => s.addLog);
  const updateLog = useAppStore((s) => s.updateLog);

  const [tags, setTags] = useState<string[]>([]);
  const [detailMode, setDetailMode] = useState<'photo' | 'words'>('photo');
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [eventTs, setEventTs] = useState<number>(() => Date.now());
  const draftIdRef = useRef<string | null>(null);

  // Lock the timestamp the moment the screen mounts — even if the user never
  // taps Done, they've at least recorded WHEN it happened.
  useEffect(() => {
    if (!kind) return;
    (async () => {
      const created = await addLog({
        type: 'trigger',
        subtype: kind,
        tags: [],
        draft: true,
        ts: Date.now(),
      });
      draftIdRef.current = created.id;
    })();
    // intentionally only run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  if (!trigger) {
    router.replace('/(tabs)');
    return null;
  }

  const toggleTag = (t: string) => {
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  };

  const addPhoto = async () => {
    const uri = await capturePhoto();
    if (uri) setPhotoUri(uri);
  };

  const finish = async (later: boolean) => {
    const id = draftIdRef.current;
    if (id) {
      await updateLog(id, {
        tags,
        note: note.trim() || undefined,
        photoUri: photoUri ?? undefined,
        draft: later,
        ts: eventTs,
      });
    }
    router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TopBar title={trigger.label} subtitle="saved" onBack={() => router.back()} />
        <View style={styles.pad}>
          <SavedBanner title="Time locked in." body="Add what you had now, or later today." />

          <Card>
            <Label>When did this happen?</Label>
            <View style={{ marginTop: 10 }}>
              <TimestampToggle value={eventTs} onChange={setEventTs} />
            </View>
          </Card>

          {kind === 'ate' ? (
            <AteDetails
              tags={tags}
              onToggleTag={toggleTag}
              detailMode={detailMode}
              onChangeMode={setDetailMode}
              note={note}
              onChangeNote={setNote}
              photoUri={photoUri}
              onAddPhoto={addPhoto}
            />
          ) : kind === 'med' ? (
            <MedDetails tags={tags} onToggleTag={toggleTag} note={note} onChangeNote={setNote} />
          ) : (
            <GenericNote note={note} onChangeNote={setNote} />
          )}

          <View style={{ height: 14 }} />
          <Button label="Done" variant="sage" onPress={() => finish(false)} />
          <Button label="Finish this later" variant="text" onPress={() => finish(true)} />
        </View>
      </ScrollView>
    </View>
  );
}

function AteDetails({
  tags,
  onToggleTag,
  detailMode,
  onChangeMode,
  note,
  onChangeNote,
  photoUri,
  onAddPhoto,
}: {
  tags: string[];
  onToggleTag: (t: string) => void;
  detailMode: 'photo' | 'words';
  onChangeMode: (m: 'photo' | 'words') => void;
  note: string;
  onChangeNote: (s: string) => void;
  photoUri: string | null;
  onAddPhoto: () => void;
}) {
  return (
    <View style={{ gap: spacing.md }}>
      <Seg
        value={detailMode}
        onChange={(v) => onChangeMode(v as 'photo' | 'words')}
        options={[
          { value: 'photo', label: '📷 Photo' },
          { value: 'words', label: '✏️ A few words' },
        ]}
      />
      {detailMode === 'photo' ? (
        photoUri ? (
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Image source={{ uri: photoUri }} style={styles.thumb} />
            <Pressable
              onPress={onAddPhoto}
              accessibilityRole="button"
              style={({ pressed }) => [{ paddingVertical: 6 }, pressed && { opacity: 0.6 }]}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.sageDark }}>Retake</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={onAddPhoto}
            accessibilityRole="button"
            accessibilityLabel="Add a meal photo"
            style={({ pressed }) => [styles.photoDrop, pressed && { opacity: 0.85 }]}
          >
            <Text style={[tokenType.sub, { fontSize: 13 }]}>📷 Tap to take or choose a meal photo</Text>
          </Pressable>
        )
      ) : (
        <TextInput
          value={note}
          onChangeText={onChangeNote}
          placeholder={'e.g. "leftover pizza"'}
          placeholderTextColor={colors.cocoa2}
          multiline
          style={styles.input}
        />
      )}

      <Card>
        <Label>Common triggers</Label>
        <View style={{ marginTop: 12 }}>
          <Chips>
            {COMMON_FOOD_TAGS.map((t) => (
              <Chip key={t} label={t} on={tags.includes(t)} onPress={() => onToggleTag(t)} />
            ))}
          </Chips>
        </View>
      </Card>
    </View>
  );
}

function MedDetails({
  tags,
  onToggleTag,
  note,
  onChangeNote,
}: {
  tags: string[];
  onToggleTag: (t: string) => void;
  note: string;
  onChangeNote: (s: string) => void;
}) {
  return (
    <View style={{ gap: spacing.md }}>
      <Card>
        <Label>Which med?</Label>
        <View style={{ marginTop: 12 }}>
          <Chips>
            {COMMON_MEDS.map((m) => (
              <Chip key={m} label={m} on={tags.includes(m)} onPress={() => onToggleTag(m)} />
            ))}
          </Chips>
        </View>
        <Text style={[tokenType.sub, { fontSize: 11, marginTop: 10, fontStyle: 'italic' }]}>
          Generic categories. Tap one — your specific brand is fine.
        </Text>
      </Card>
      <Card>
        <Label>Anything else (optional)</Label>
        <TextInput
          value={note}
          onChangeText={onChangeNote}
          placeholder="e.g. dose, taken with food"
          placeholderTextColor={colors.cocoa2}
          multiline
          style={[styles.input, { marginTop: 10, backgroundColor: colors.fog }]}
        />
      </Card>
    </View>
  );
}

function GenericNote({ note, onChangeNote }: { note: string; onChangeNote: (s: string) => void }) {
  return (
    <Card>
      <Label>Add a note (optional)</Label>
      <TextInput
        value={note}
        onChangeText={onChangeNote}
        placeholder="Tap to add a note…"
        placeholderTextColor={colors.cocoa2}
        multiline
        style={[styles.input, { marginTop: 10, backgroundColor: colors.fog }]}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 60 },
  pad: { paddingHorizontal: spacing.lg, paddingTop: 14, gap: spacing.md },

  thumb: { width: 100, height: 100, borderRadius: radii.lg, backgroundColor: colors.fog },
  photoDrop: {
    height: 130,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(61,51,43,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  input: {
    minHeight: 80,
    borderRadius: radii.md,
    padding: 12,
    fontSize: 13,
    color: colors.cocoa,
    backgroundColor: '#fff',
    fontFamily: tokenType.body.fontFamily,
    textAlignVertical: 'top',
  },
});
