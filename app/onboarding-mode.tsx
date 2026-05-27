import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { useAppStore, type UserMode } from '@/data/store';
import { colors, radii, shadows, spacing, type as tokenType } from '@/theme/tokens';

interface Option {
  mode: UserMode;
  label: string;
  sub: string;
}

const OPTIONS: Option[] = [
  {
    mode: 'exploring',
    label: "I'm trying to figure things out",
    sub: "Take your time. We'll watch for patterns as you go.",
  },
  {
    mode: 'appointment',
    label: 'I have an appointment coming up',
    sub: 'Faster path to a doctor-ready report.',
  },
  {
    mode: 'diagnosed',
    label: 'I was recently diagnosed',
    sub: 'Gentler pace while you find your footing.',
  },
];

export default function OnboardingMode() {
  const setUserMode = useAppStore((s) => s.setUserMode);
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const [selected, setSelected] = useState<UserMode>('exploring');

  const finish = (mode: UserMode) => {
    setUserMode(mode);
    setOnboarded(true);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.root}>
      <View style={styles.headline}>
        <Text style={tokenType.title}>What brings{'\n'}you here?</Text>
        <Text style={[tokenType.sub, { marginTop: 10 }]}>
          We&apos;ll meet you where you are. You can change this anytime.
        </Text>
      </View>

      <View style={styles.options}>
        {OPTIONS.map((o) => (
          <Pressable
            key={o.mode}
            onPress={() => setSelected(o.mode)}
            accessibilityRole="radio"
            accessibilityState={{ selected: selected === o.mode }}
            style={({ pressed }) => [
              styles.option,
              selected === o.mode && styles.optionSelected,
              pressed && { opacity: 0.92 },
            ]}
          >
            <View style={[styles.radio, selected === o.mode && styles.radioSelected]}>
              {selected === o.mode ? <View style={styles.radioDot} /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionLabel}>{o.label}</Text>
              <Text style={[tokenType.sub, { fontSize: 12, marginTop: 2 }]}>{o.sub}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <Button label="Continue" variant="sage" onPress={() => finish(selected)} />
      <Pressable
        accessibilityRole="button"
        onPress={() => finish('exploring')}
        style={({ pressed }) => [styles.skip, pressed && { opacity: 0.6 }]}
      >
        <Text style={[tokenType.sub, { textAlign: 'center', fontSize: 13 }]}>Skip for now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
    gap: spacing.lg,
    paddingBottom: 32,
  },
  headline: { gap: spacing.sm },
  options: { gap: spacing.sm, marginTop: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...shadows.card,
  },
  optionSelected: {
    borderColor: colors.sage,
  },
  optionLabel: { fontSize: 15, fontWeight: '600', color: colors.cocoa },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(61,51,43,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  radioSelected: { borderColor: colors.sage },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.sage },
  skip: { paddingVertical: 8 },
});
