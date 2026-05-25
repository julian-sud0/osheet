import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows, spacing, type as tokenType } from '@/theme/tokens';

/**
 * Cross-platform bottom sheet for log-row long-press actions.
 * Replaces the prototype's `onclick="toast(...)"` placeholders with a real
 * edit / delete path. Closes gap #4.
 */
export function RowActionsSheet({
  visible,
  title,
  onEdit,
  onDelete,
  onClose,
}: {
  visible: boolean;
  title: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {onEdit ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onClose();
                onEdit();
              }}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <Text style={styles.rowText}>Edit</Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onClose();
                onDelete();
              }}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <Text style={[styles.rowText, { color: colors.terraDark }]}>Delete</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.row, styles.cancel, pressed && styles.rowPressed]}
          >
            <Text style={[styles.rowText, { fontWeight: '500', color: colors.cocoa2 }]}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    gap: 6,
    ...shadows.fab,
  },
  title: {
    ...tokenType.label,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  rowPressed: { backgroundColor: colors.cream2 },
  rowText: { fontSize: 16, fontWeight: '600', color: colors.cocoa },
  cancel: { marginTop: 6, backgroundColor: colors.fog },
});
