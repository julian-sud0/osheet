import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Card, Chip, Chips, Label, SavedBanner, Seg, TopBar } from '@/components/ui';
import { useAppStore } from '@/data/store';
import { COMMON_FOOD_TAGS, TRIGGER_TYPES, type TriggerKey } from '@/domain/bristol';
import { colors, radii, spacing, type as tokenType } from '@/theme/tokens';

export default function TriggerScreen() {
  const { kind } = useLocalSearchParams<{ kind?: TriggerKey }>();
  const trigger = kind ? TRIGGER_TYPES[kind] : null;
  const addLog = useAppStore((s) => s.addLog);
  const updateLog = useAppStore((s) => s.updateLog);

  const [tags, setTags] = useState<string[]>([]);
  const [detailMode, setDetailMode] = useState<'photo' | 'words'>('photo');
  const [note, setNote] = useState('');
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

  const finish = async (later: boolean) => {
    const id = draftIdRef.current;
    if (id) {
      await updateLog(id, { tags, note: note.trim() || undefined, draft: later });
    }
    router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TopBar title={trigger.label} subtitle="saved" onBack={() => router.back()} />
        <View style={styles.pad}>
          <SavedBanner title="Time locked in." body="Add what you had now, or later today." />

          {kind === 'ate' ? (
            <AteDetails
              tags={tags}
              onToggleTag={toggleTag}
              detailMode={detailMode}
              onChangeMode={setDetailMode}
              note={note}
              onChangeNote={setNote}
            />
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
}: {
  tags: string[];
  onToggleTag: (t: string) => void;
  detailMode: 'photo' | 'words';
  onChangeMode: (m: 'photo' | 'words') => void;
  note: string;
  onChangeNote: (s: string) => void;
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
        <View style={styles.photoDrop}>
          <Text style={[tokenType.sub, { fontSize: 13 }]}>Tap to add a meal photo</Text>
        </View>
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
