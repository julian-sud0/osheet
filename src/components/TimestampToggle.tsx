import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { track } from '@/data/analytics';
import { colors, radii, type as tokenType } from '@/theme/tokens';

/**
 * "When did this happen?" control. Default = right now. Tap "Earlier today"
 * to set a specific time. Pins the entry's `ts` to today at the chosen time.
 *
 * Days-ago editing is deferred — keeping the surface small for MVP. Most
 * retroactive logging happens same-day anyway ("logged at 8pm what happened
 * at 11am").
 */
export function TimestampToggle({
  value,
  onChange,
}: {
  value: number;
  onChange: (ts: number) => void;
}) {
  const [mode, setMode] = useState<'now' | 'earlier'>('now');

  const setNow = () => {
    setMode('now');
    onChange(Date.now());
  };

  const setEarlier = () => {
    setMode('earlier');
    track('timestamp_toggle_used');
    // Default the time picker to one hour ago.
    onChange(Date.now() - 60 * 60 * 1000);
  };

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'now' }}
          onPress={setNow}
          style={({ pressed }) => [
            styles.btn,
            mode === 'now' && styles.btnOn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={[styles.btnText, mode === 'now' && styles.btnTextOn]}>Just now</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'earlier' }}
          onPress={setEarlier}
          style={({ pressed }) => [
            styles.btn,
            mode === 'earlier' && styles.btnOn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={[styles.btnText, mode === 'earlier' && styles.btnTextOn]}>Earlier today</Text>
        </Pressable>
      </View>

      {mode === 'earlier' ? (
        <View style={styles.picker}>
          <Text style={[tokenType.sub, { fontSize: 12 }]}>What time was it?</Text>
          <TimeInput value={value} onChange={onChange} />
        </View>
      ) : null}
    </View>
  );
}

function TimeInput({ value, onChange }: { value: number; onChange: (ts: number) => void }) {
  const d = new Date(value);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const display = `${hh}:${mm}`;

  if (Platform.OS === 'web') {
    // RN Web passes unknown style props through, but for an actual <input>
    // we use createElement to dodge RN's typed View.
    return (
      <input
        type="time"
        value={display}
        onChange={(e) => {
          const [h, m] = e.target.value.split(':').map(Number);
          if (Number.isFinite(h) && Number.isFinite(m)) {
            const next = new Date();
            next.setHours(h, m, 0, 0);
            onChange(next.getTime());
          }
        }}
        style={{
          fontSize: 16,
          padding: 10,
          borderRadius: 10,
          border: `1.5px solid ${colors.fog}`,
          backgroundColor: '#fff',
          color: colors.cocoa,
          fontFamily: 'inherit',
        }}
      />
    );
  }
  // Native: minimal fallback — just display the chosen time. A proper native
  // wheel picker via @react-native-community/datetimepicker lands when the
  // native build is wired in Phase 4.
  return (
    <View style={styles.nativeStub}>
      <Text style={{ fontSize: 16, color: colors.cocoa }}>{display}</Text>
      <Text style={[tokenType.sub, { fontSize: 11, marginTop: 4 }]}>
        Native time-picker wiring lands in Phase 4.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    borderRadius: radii.pill,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.fog,
    alignItems: 'center',
  },
  btnOn: { backgroundColor: colors.cocoa },
  btnText: { fontSize: 13, fontWeight: '500', color: colors.cocoa },
  btnTextOn: { color: colors.cream },
  picker: { gap: 6, marginTop: 4 },
  nativeStub: { padding: 10, backgroundColor: '#fff', borderRadius: 10 },
});
