import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows, spacing, type as tokenType } from '@/theme/tokens';

/**
 * Brief post-log confirmation that auto-dismisses. Closes the emotional
 * loop after a log AND offers a "Log another" shortcut for flare days
 * when multiple-per-day logging is real.
 */
export function PostLogSheet({
  visible,
  label,
  onDone,
  onLogAnother,
  autoDismissMs = 4000,
}: {
  visible: boolean;
  label: string;
  onDone: () => void;
  onLogAnother: () => void;
  autoDismissMs?: number;
}) {
  const [internallyVisible, setInternallyVisible] = useState(visible);

  useEffect(() => {
    setInternallyVisible(visible);
  }, [visible]);

  useEffect(() => {
    if (!internallyVisible) return;
    const t = setTimeout(() => {
      setInternallyVisible(false);
      onDone();
    }, autoDismissMs);
    return () => clearTimeout(t);
  }, [internallyVisible, autoDismissMs, onDone]);

  return (
    <Modal transparent visible={internallyVisible} animationType="fade" onRequestClose={onDone}>
      <Pressable
        style={styles.backdrop}
        onPress={() => {
          setInternallyVisible(false);
          onDone();
        }}
      >
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.check}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>✓</Text>
          </View>
          <Text style={styles.title}>Saved.</Text>
          <Text style={[tokenType.sub, { fontSize: 13, textAlign: 'center', marginTop: 4 }]}>{label}</Text>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setInternallyVisible(false);
                onDone();
              }}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.secondaryText}>Done</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setInternallyVisible(false);
                onLogAnother();
              }}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.primaryText}>Log another</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: 28,
    alignItems: 'center',
    minWidth: 280,
    ...shadows.fab,
  },
  check: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontFamily: tokenType.section.fontFamily, fontSize: 22, color: colors.cocoa },
  primaryBtn: {
    backgroundColor: colors.cocoa,
    borderRadius: radii.pill,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  primaryText: { color: colors.cream, fontWeight: '600' },
  secondaryBtn: {
    backgroundColor: colors.fog,
    borderRadius: radii.pill,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  secondaryText: { color: colors.cocoa, fontWeight: '600' },
});
