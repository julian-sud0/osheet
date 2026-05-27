import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { track } from '@/data/analytics';
import { colors, radii, shadows } from '@/theme/tokens';

/**
 * Vertical speed-dial FAB. Tap the main + → 4 child rows stack vertically
 * above it (Stool / Food / Meds / Stress from bottom to top), each a small
 * circular icon with a left-aligned label pill so labels never collide
 * with page content the way the previous radial geometry did.
 *
 * Long-press the main + → skip the menu and route straight to /log/bristol
 * (the most common action).
 */

interface Action {
  id: 'stool' | 'food' | 'meds' | 'stress';
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
}

const ROW_GAP = 14;
const CHILD_SIZE = 48;
const FAB_SIZE = 60;
const FAB_RIGHT = 22;
const FAB_BOTTOM = 90;

export function RadialFab() {
  const open = useSharedValue(0);
  const [isOpen, setIsOpen] = useState(false);

  const actions: Action[] = [
    {
      id: 'stress',
      icon: 'activity',
      label: 'Stress',
      onPress: () => {
        track('fab_child_tapped', { which: 'stress' });
        router.push({ pathname: '/log/trigger', params: { kind: 'stress' } });
      },
    },
    {
      id: 'meds',
      icon: 'plus-square',
      label: 'Meds',
      onPress: () => {
        track('fab_child_tapped', { which: 'meds' });
        router.push({ pathname: '/log/trigger', params: { kind: 'med' } });
      },
    },
    {
      id: 'food',
      icon: 'coffee',
      label: 'Food',
      onPress: () => {
        track('fab_child_tapped', { which: 'food' });
        router.push({ pathname: '/log/trigger', params: { kind: 'ate' } });
      },
    },
    {
      id: 'stool',
      icon: 'circle',
      label: 'Stool',
      onPress: () => {
        track('fab_child_tapped', { which: 'stool' });
        router.push('/log/bristol');
      },
    },
  ];
  // Index 0 (Stress) is the FARTHEST from the main FAB; index N-1 (Stool)
  // is the CLOSEST. Bottom-to-top stacking matches the array.

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    open.value = withSpring(next ? 1 : 0, { damping: 14, stiffness: 160 });
    if (next) track('fab_opened');
  };

  const close = () => {
    setIsOpen(false);
    open.value = withSpring(0, { damping: 14, stiffness: 160 });
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: open.value * 0.32,
  }));

  const plusStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${open.value * 45}deg` }],
  }));

  return (
    <>
      {isOpen ? (
        <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents="auto">
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityLabel="Close menu"
          />
        </Animated.View>
      ) : null}

      {actions.map((a, i) => {
        // i is the distance from the FAB (0 = farthest above, last = closest).
        // We want the array's LAST entry (Stool) sitting just above the FAB.
        const distanceFromFab = actions.length - i;
        return (
          <ChildRow
            key={a.id}
            distance={distanceFromFab}
            stagger={i}
            open={open}
            isOpen={isOpen}
            icon={a.icon}
            label={a.label}
            onPress={() => {
              close();
              a.onPress();
            }}
          />
        );
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log something"
        onPress={toggle}
        onLongPress={() => {
          track('fab_child_tapped', { which: 'stool', via: 'long_press' });
          router.push('/log/bristol');
        }}
        delayLongPress={350}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
      >
        <Animated.Text style={[styles.plus, plusStyle]}>＋</Animated.Text>
      </Pressable>
    </>
  );
}

function ChildRow({
  distance,
  stagger,
  open,
  isOpen,
  icon,
  label,
  onPress,
}: {
  distance: number; // 1 = closest to FAB, N = farthest
  stagger: number; // 0 = farthest (animates last), N-1 = closest (animates first)
  open: Animated.SharedValue<number>;
  isOpen: boolean;
  icon: Action['icon'];
  label: string;
  onPress: () => void;
}) {
  const verticalOffset = distance * (CHILD_SIZE + ROW_GAP);

  const childStyle = useAnimatedStyle(() => {
    const t = open.value;
    return {
      transform: [{ translateY: -verticalOffset * t }, { scale: 0.6 + t * 0.4 }],
      opacity: t,
    };
  });

  const labelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(open.value, { duration: 180 }),
  }));

  return (
    <Animated.View
      style={[styles.rowWrap, childStyle]}
      pointerEvents={isOpen ? 'auto' : 'none'}
    >
      <Animated.View style={[styles.labelWrap, labelStyle]}>
        <Text style={styles.labelText}>{label}</Text>
      </Animated.View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Log ${label}`}
        onPress={onPress}
        style={({ pressed }) => [styles.child, pressed && { opacity: 0.85 }]}
      >
        <Feather name={icon} size={20} color={colors.cocoa} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#000',
  },
  fab: {
    position: 'absolute',
    right: FAB_RIGHT,
    bottom: FAB_BOTTOM,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.cocoa,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.fab,
    zIndex: 10,
  },
  plus: { color: colors.cream, fontSize: 32, lineHeight: 34 },

  rowWrap: {
    position: 'absolute',
    right: FAB_RIGHT + (FAB_SIZE - CHILD_SIZE) / 2,
    bottom: FAB_BOTTOM + (FAB_SIZE - CHILD_SIZE) / 2,
    width: CHILD_SIZE,
    height: CHILD_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    zIndex: 9,
  },
  child: {
    width: CHILD_SIZE,
    height: CHILD_SIZE,
    borderRadius: CHILD_SIZE / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  labelWrap: {
    position: 'absolute',
    right: CHILD_SIZE + 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: radii.pill,
    ...shadows.card,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.cocoa,
  },
});
