import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { BristolGlyph } from './bristolSvg';
import { BRISTOL } from '@/domain/bristol';
import type { BristolType } from '@/data/types';
import { colors, radii, shadows, type as tokenType } from '@/theme/tokens';

const SWIPE_THRESHOLD = 50;
const CARD_WIDTH = 260;

interface Props {
  initial?: BristolType;
  onChoose: (type: BristolType) => void;
}

/**
 * Swipeable Bristol picker. Closes gap #1 — replaces the prototype's "swipe"
 * affordance that was never wired (index.html:434-462 had no touch handler).
 *
 * Pan gesture moves between cards; tapping the centre card confirms the choice.
 * Prev / Next buttons remain as a keyboard / no-touch fallback in the parent.
 */
export function BristolStack({ initial = 4, onChoose }: Props) {
  const [index, setIndex] = useState<number>(initial - 1);

  const setIndexClamped = useCallback((i: number) => {
    const clamped = Math.max(0, Math.min(6, i));
    setIndex(clamped);
  }, []);

  const dragX = useSharedValue(0);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      dragX.value = e.translationX;
    })
    .onEnd((e) => {
      const delta = e.translationX;
      dragX.value = withTiming(0, { duration: 180 });
      if (delta < -SWIPE_THRESHOLD) {
        runOnJS(setIndexClamped)(index + 1);
      } else if (delta > SWIPE_THRESHOLD) {
        runOnJS(setIndexClamped)(index - 1);
      }
    });

  return (
    <View>
      <GestureDetector gesture={pan}>
        <View style={styles.stack}>
          {BRISTOL.map((b, i) => {
            const offset = i - index;
            return (
              <BristolCard
                key={b.n}
                offset={offset}
                dragX={dragX}
                onPress={() => {
                  if (offset === 0) onChoose(b.n);
                  else setIndexClamped(i);
                }}
              >
                <Text style={styles.cardNum}>Type {b.n}</Text>
                <BristolGlyph type={b.n} />
                <View>
                  <Text style={styles.cardName}>{b.name}</Text>
                  <Text style={styles.cardDesc}>{b.desc}</Text>
                  {offset === 0 ? <Text style={styles.cardHint}>Tap to choose →</Text> : null}
                </View>
              </BristolCard>
            );
          })}
        </View>
      </GestureDetector>

      <View style={styles.dots}>
        {BRISTOL.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotOn]} />
        ))}
      </View>

      <View style={styles.controlsRow}>
        <Pressable
          onPress={() => setIndexClamped(index - 1)}
          accessibilityRole="button"
          accessibilityLabel="Previous Bristol type"
          style={({ pressed }) => [styles.controlBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.controlText}>← Prev</Text>
        </Pressable>
        <Pressable
          onPress={() => setIndexClamped(index + 1)}
          accessibilityRole="button"
          accessibilityLabel="Next Bristol type"
          style={({ pressed }) => [styles.controlBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.controlText}>Next →</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => onChoose(BRISTOL[index].n)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.chooseBtn, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.chooseText}>
          Choose Type {BRISTOL[index].n}: {BRISTOL[index].name}
        </Text>
      </Pressable>
    </View>
  );
}

function BristolCard({
  offset,
  dragX,
  onPress,
  children,
}: {
  offset: number;
  dragX: Animated.SharedValue<number>;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    // Base layout per offset, plus the live drag offset on the centre stack.
    const drag = dragX.value;
    let baseX: number, scale: number, opacity: number, zIndex: number;
    if (offset === 0) {
      baseX = 0;
      scale = 1;
      opacity = 1;
      zIndex = 10;
    } else if (offset === 1) {
      baseX = 80;
      scale = 0.92;
      opacity = 0.5;
      zIndex = 9;
    } else if (offset === -1) {
      baseX = -80;
      scale = 0.92;
      opacity = 0.5;
      zIndex = 9;
    } else if (offset === 2) {
      baseX = 140;
      scale = 0.85;
      opacity = 0.25;
      zIndex = 8;
    } else if (offset === -2) {
      baseX = -140;
      scale = 0.85;
      opacity = 0.25;
      zIndex = 8;
    } else {
      baseX = offset > 0 ? 220 : -220;
      scale = 0.8;
      opacity = 0;
      zIndex = 0;
    }
    return {
      transform: [{ translateX: baseX + drag * 0.4 }, { scale }],
      opacity,
      zIndex,
    };
  });

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <Pressable onPress={onPress} accessibilityRole="button" style={styles.cardInner}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stack: { height: 380, alignItems: 'center', justifyContent: 'flex-start' },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: 360,
    borderRadius: 28,
    backgroundColor: '#fff',
    padding: 24,
    ...shadows.card,
  },
  cardInner: { flex: 1, alignItems: 'center', justifyContent: 'space-between' },
  cardNum: {
    fontFamily: tokenType.section.fontFamily,
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.cocoa2,
  },
  cardName: { fontFamily: tokenType.section.fontFamily, fontSize: 24, textAlign: 'center', color: colors.cocoa },
  cardDesc: { fontSize: 12, color: colors.cocoa2, textAlign: 'center', marginTop: 4 },
  cardHint: { fontSize: 11, color: colors.sageDark, marginTop: 8, fontWeight: '600', textAlign: 'center' },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, paddingTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(61,51,43,0.2)' },
  dotOn: { backgroundColor: colors.cocoa, width: 16, borderRadius: 3 },

  controlsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  controlBtn: {
    flex: 1,
    backgroundColor: colors.cream2,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  controlText: { fontWeight: '600', color: colors.cocoa, fontSize: 14 },

  chooseBtn: {
    backgroundColor: colors.sage,
    borderRadius: radii.pill,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginTop: 8,
    alignItems: 'center',
  },
  chooseText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
