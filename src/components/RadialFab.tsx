import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { track } from '@/data/analytics';
import { colors, shadows } from '@/theme/tokens';

/**
 * Radial multi-action FAB. Tap the main + → 4 child FABs fan up-and-left
 * in a quarter-arc (Log stool / food / meds / stress). Long-press the
 * main + → skips the menu, routes straight to /log/bristol (fast path).
 *
 * Radial-into-the-screen (not toward the corner) so the four actions are
 * comfortably reachable with a thumb on a phone in portrait.
 */

interface Action {
  id: 'stool' | 'food' | 'meds' | 'stress' | 'sleep';
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
}

const RADIUS = 110; // distance from main FAB centre to child centre

export function RadialFab() {
  const open = useSharedValue(0); // 0 = closed, 1 = open
  const [isOpen, setIsOpen] = useState(false); // JS mirror for pointer-events gating

  const actions: Action[] = [
    {
      id: 'stool',
      icon: 'circle',
      label: 'Stool',
      onPress: () => {
        track('fab_child_tapped', { which: 'stool' });
        router.push('/log/bristol');
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
      id: 'meds',
      icon: 'plus-square',
      label: 'Meds',
      onPress: () => {
        track('fab_child_tapped', { which: 'meds' });
        router.push({ pathname: '/log/trigger', params: { kind: 'med' } });
      },
    },
    {
      id: 'stress',
      icon: 'activity',
      label: 'Stress',
      onPress: () => {
        track('fab_child_tapped', { which: 'stress' });
        router.push({ pathname: '/log/trigger', params: { kind: 'stress' } });
      },
    },
  ];

  // 4 actions across a 75° quarter-arc opening up-and-left.
  // Angles measured CCW from straight left.
  const angles = [15, 40, 65, 90]; // stool, food, meds, stress

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
      {/* Backdrop is only mounted when the menu is open, so it can't intercept
          taps when closed. Critical: an absolutely positioned backdrop with
          pointerEvents="auto" sitting over every tab would eat everything. */}
      {isOpen ? (
        <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents="auto">
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close menu" />
        </Animated.View>
      ) : null}

      {actions.map((a, i) => (
        <ChildFab
          key={a.id}
          angleDeg={angles[i]}
          open={open}
          isOpen={isOpen}
          icon={a.icon}
          label={a.label}
          onPress={() => {
            close();
            a.onPress();
          }}
        />
      ))}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log something"
        onPress={toggle}
        onLongPress={() => {
          // Fast path: long-press skips the menu and goes straight to the
          // most common action (stool log).
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

function ChildFab({
  angleDeg,
  open,
  isOpen,
  icon,
  label,
  onPress,
}: {
  angleDeg: number;
  open: Animated.SharedValue<number>;
  isOpen: boolean;
  icon: Action['icon'];
  label: string;
  onPress: () => void;
}) {
  const rad = (angleDeg * Math.PI) / 180;
  // Up-and-left: x = -cos(angle) * R; y = -sin(angle) * R
  const dx = -Math.cos(rad) * RADIUS;
  const dy = -Math.sin(rad) * RADIUS;

  const childStyle = useAnimatedStyle(() => {
    const t = open.value;
    return {
      transform: [{ translateX: dx * t }, { translateY: dy * t }, { scale: 0.4 + t * 0.6 }],
      opacity: t,
    };
  });

  const labelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(open.value, { duration: 180 }),
  }));

  // Children stay mounted so the close animation can play. When closed
  // they sit invisibly at the main FAB's coordinates only (not covering the
  // rest of the screen) — pointerEvents toggled via prop based on isOpen.
  return (
    <Animated.View
      style={[styles.childWrap, childStyle]}
      pointerEvents={isOpen ? 'auto' : 'none'}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Log ${label}`}
        onPress={onPress}
        style={({ pressed }) => [styles.child, pressed && { opacity: 0.85 }]}
      >
        <Feather name={icon} size={20} color={colors.cocoa} />
      </Pressable>
      <Animated.Text style={[styles.childLabel, labelStyle]}>{label}</Animated.Text>
    </Animated.View>
  );
}

const FAB_RIGHT = 22;
const FAB_BOTTOM = 90;
const FAB_SIZE = 60;
const CHILD_SIZE = 48;

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
  childWrap: {
    position: 'absolute',
    // Anchor the child wrapper so its centre aligns with the main FAB's centre
    right: FAB_RIGHT + (FAB_SIZE - CHILD_SIZE) / 2,
    bottom: FAB_BOTTOM + (FAB_SIZE - CHILD_SIZE) / 2,
    width: CHILD_SIZE,
    alignItems: 'center',
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
  childLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: colors.cocoa,
    backgroundColor: 'rgba(246,241,232,0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
});
