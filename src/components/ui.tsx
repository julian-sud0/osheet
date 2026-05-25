import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radii, shadows, spacing, type as tokenType } from '@/theme/tokens';

/** Brand chip — single tap target, never a styled View. */
export function Chip({
  label,
  on = false,
  variant = 'sage',
  onPress,
}: {
  label: string;
  on?: boolean;
  variant?: 'sage' | 'terra';
  onPress?: () => void;
}) {
  const activeBg = variant === 'terra' ? colors.terra : colors.sage;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={({ pressed }) => [
        styles.chip,
        on && { backgroundColor: activeBg, borderColor: activeBg },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

export function Chips({ children }: { children: ReactNode }) {
  return <View style={styles.chips}>{children}</View>;
}

/** Card surface. `tone="fog"` for the muted variant. */
export function Card({
  children,
  tone = 'white',
  style,
  onPress,
}: {
  children: ReactNode;
  tone?: 'white' | 'fog';
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const cardStyles = [
    styles.card,
    tone === 'fog' ? styles.cardFog : styles.cardShadow,
    style,
  ];
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [cardStyles, pressed && { opacity: 0.92 }]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={cardStyles}>{children}</View>;
}

/** Primary action button. */
export function Button({
  label,
  onPress,
  variant = 'dark',
  style,
  disabled,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'dark' | 'sage' | 'cream' | 'ghost' | 'text';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const variantStyle =
    variant === 'sage'
      ? styles.btnSage
      : variant === 'cream'
      ? styles.btnCream
      : variant === 'ghost'
      ? styles.btnGhost
      : variant === 'text'
      ? styles.btnText
      : styles.btnDark;
  const textStyle =
    variant === 'sage'
      ? styles.btnTextLight
      : variant === 'cream' || variant === 'ghost'
      ? styles.btnTextDark
      : variant === 'text'
      ? styles.btnTextMuted
      : styles.btnTextLight;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        variantStyle,
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

export function Switch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={[styles.switch, !value && styles.switchOff]}
    >
      <View style={[styles.switchThumb, !value && styles.switchThumbOff]} />
    </Pressable>
  );
}

export function Seg({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.seg}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          accessibilityRole="button"
          accessibilityState={{ selected: value === o.value }}
          style={[styles.segItem, value === o.value && styles.segItemOn]}
        >
          <Text style={[styles.segText, value === o.value && styles.segTextOn]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function TopBar({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <View style={styles.topbar}>
      <Pressable
        onPress={onBack ?? (() => router.back())}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={styles.topbarBack}
      >
        <Text style={styles.topbarBackText}>‹</Text>
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.topbarTitle}>{title}</Text>
        {subtitle ? <Text style={[tokenType.sub, { fontSize: 11 }]}>{subtitle}</Text> : null}
      </View>
      {right ?? null}
    </View>
  );
}

export function SavedBanner({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.saved}>
      <View style={styles.savedCheck}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>✓</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '600', fontSize: 14, color: colors.cocoa }}>{title}</Text>
        <Text style={[tokenType.sub, { fontSize: 12 }]}>{body}</Text>
      </View>
    </View>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={tokenType.label}>{children}</Text>;
}

export function Section({ children, gap = spacing.md }: { children: ReactNode; gap?: number }) {
  return <View style={{ flexDirection: 'column', gap }}>{children}</View>;
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1.5,
    borderColor: 'rgba(61,51,43,0.2)',
    borderRadius: radii.pill,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
  },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.cocoa },
  chipTextOn: { color: '#fff' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  card: {
    borderRadius: radii.lg,
    padding: 18,
    backgroundColor: '#fff',
  },
  cardShadow: { ...shadows.card },
  cardFog: { backgroundColor: colors.fog },

  btn: {
    borderRadius: radii.pill,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  btnDark: { backgroundColor: colors.cocoa },
  btnSage: { backgroundColor: colors.sage },
  btnCream: { backgroundColor: colors.cream2 },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.cocoa },
  btnText: { backgroundColor: 'transparent', paddingVertical: 10 },
  btnTextLight: { color: '#fff', fontWeight: '600', fontSize: 14 },
  btnTextDark: { color: colors.cocoa, fontWeight: '600', fontSize: 14 },
  btnTextMuted: { color: colors.cocoa2, fontWeight: '500', fontSize: 14 },

  pill: {
    backgroundColor: colors.fog,
    borderRadius: radii.pill,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  pillText: { fontSize: 10, letterSpacing: 0.6, color: colors.cocoa2, fontWeight: '500' },

  switch: {
    width: 44,
    height: 26,
    borderRadius: radii.pill,
    backgroundColor: colors.sage,
    padding: 3,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  switchOff: { backgroundColor: 'rgba(61,51,43,0.2)', alignItems: 'flex-start' },
  switchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  switchThumbOff: {},

  seg: {
    backgroundColor: colors.cream2,
    borderRadius: radii.pill,
    padding: 4,
    flexDirection: 'row',
  },
  segItem: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radii.pill, alignItems: 'center' },
  segItemOn: { backgroundColor: '#fff' },
  segText: { fontSize: 12, fontWeight: '500', color: colors.cocoa2 },
  segTextOn: { color: colors.cocoa },

  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 12 },
  topbarBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.fog,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbarBackText: { fontSize: 22, color: colors.cocoa, lineHeight: 22, marginTop: -2 },
  topbarTitle: { fontFamily: tokenType.section.fontFamily, fontSize: 16, color: colors.cocoa },

  saved: {
    backgroundColor: colors.sageLight,
    padding: 14,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  savedCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

