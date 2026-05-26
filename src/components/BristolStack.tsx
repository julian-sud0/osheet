import { useCallback, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  Extrapolation,
} from 'react-native-reanimated';
import { BristolGlyph } from './bristolSvg';
import { BRISTOL, type BristolEntry } from '@/domain/bristol';
import type { BristolType } from '@/data/types';
import { colors, radii, shadows, type as tokenType } from '@/theme/tokens';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<BristolEntry>);

interface Props {
  initial?: BristolType;
  onChoose: (type: BristolType) => void;
}

/**
 * Swipeable Bristol picker on horizontal FlatList + pagingEnabled.
 *
 * Why this shape instead of Pan + reanimated worklets:
 *   - On RN Web, reanimated runs on the JS thread (no UI thread), so Pan-driven
 *     drag-with-finger feels stuttery
 *   - The browser owns horizontal scroll inertia natively; we get smooth 60fps
 *     drag-and-snap for free
 *   - touchAction: 'pan-x' on the container tells iOS Safari "we own
 *     horizontal", which prevents the edge-swipe back-navigation gesture from
 *     fighting our drag
 *
 * Each item is full container-width and snaps via pagingEnabled. Card scale +
 * opacity interpolate from the live scrollX so we keep the "stack" aesthetic.
 */
export function BristolStack({ initial = 4, onChoose }: Props) {
  const [containerWidth, setContainerWidth] = useState(() => Dimensions.get('window').width);
  const itemWidth = Math.min(containerWidth, 360);
  const listRef = useRef<FlatList<BristolEntry>>(null);
  const [index, setIndex] = useState<number>(initial - 1);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const scrollTo = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(6, i));
      listRef.current?.scrollToOffset({ offset: clamped * itemWidth, animated: true });
      setIndex(clamped);
    },
    [itemWidth],
  );

  return (
    <View
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      // Web hint to claim horizontal panning from the browser. RN Web passes
      // unknown style props through to the DOM.
      style={[styles.container, { touchAction: 'pan-x' } as object]}
    >
      <AnimatedFlatList
        ref={listRef as never}
        data={BRISTOL}
        keyExtractor={(b) => String(b.n)}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        snapToInterval={itemWidth}
        decelerationRate="fast"
        initialScrollIndex={initial - 1}
        getItemLayout={(_, i) => ({ length: itemWidth, offset: itemWidth * i, index: i })}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / itemWidth);
          setIndex(Math.max(0, Math.min(6, newIndex)));
        }}
        renderItem={({ item, index: i }) => (
          <BristolCard
            entry={item}
            index={i}
            scrollX={scrollX}
            itemWidth={itemWidth}
            onPress={() => {
              if (i === index) onChoose(item.n);
              else scrollTo(i);
            }}
          />
        )}
      />

      <View style={styles.dots}>
        {BRISTOL.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotOn]} />
        ))}
      </View>

      <View style={styles.controlsRow}>
        <Pressable
          onPress={() => scrollTo(index - 1)}
          accessibilityRole="button"
          accessibilityLabel="Previous Bristol type"
          style={({ pressed }) => [styles.controlBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.controlText}>← Prev</Text>
        </Pressable>
        <Pressable
          onPress={() => scrollTo(index + 1)}
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
  entry,
  index,
  scrollX,
  itemWidth,
  onPress,
}: {
  entry: BristolEntry;
  index: number;
  scrollX: Animated.SharedValue<number>;
  itemWidth: number;
  onPress: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    // Position of this card's centre relative to the current viewport centre,
    // expressed in "pages" (-1 = one card to the left of current).
    const offset = scrollX.value / itemWidth - index;
    const distance = Math.abs(offset);
    const scale = interpolate(distance, [0, 1, 2], [1, 0.86, 0.78], Extrapolation.CLAMP);
    const opacity = interpolate(distance, [0, 1, 2], [1, 0.5, 0.2], Extrapolation.CLAMP);
    return { transform: [{ scale }], opacity };
  });

  return (
    <View style={[styles.itemSlot, { width: itemWidth }]}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Pressable onPress={onPress} accessibilityRole="button" style={styles.cardInner}>
          <Text style={styles.cardNum}>Type {entry.n}</Text>
          <BristolGlyph type={entry.n} />
          <View>
            <Text style={styles.cardName}>{entry.name}</Text>
            <Text style={styles.cardDesc}>{entry.desc}</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  itemSlot: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  card: {
    width: 260,
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
