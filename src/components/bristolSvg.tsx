import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import type { BristolType } from '@/data/types';

/** Bristol scale illustrations, ported from index.html:213-219. */
export function BristolGlyph({ type, size = 170 }: { type: BristolType; size?: number }) {
  switch (type) {
    case 1:
      return (
        <Svg viewBox="0 0 120 80" width={size} height={(size * 80) / 120}>
          <G fill="#8B7355">
            <Circle cx={22} cy={40} r={10} />
            <Circle cx={46} cy={38} r={11} />
            <Circle cx={72} cy={42} r={10} />
            <Circle cx={96} cy={40} r={9} />
          </G>
        </Svg>
      );
    case 2:
      return (
        <Svg viewBox="0 0 120 80" width={size} height={(size * 80) / 120}>
          <Path
            d="M15 40 Q 35 20 55 40 T 95 40"
            stroke="#8B7355"
            strokeWidth={22}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      );
    case 3:
      return (
        <Svg viewBox="0 0 120 80" width={size} height={(size * 80) / 120}>
          <Path
            d="M15 40 Q 60 28 105 40"
            stroke="#8B7355"
            strokeWidth={20}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      );
    case 4:
      return (
        <Svg viewBox="0 0 120 80" width={size} height={(size * 80) / 120}>
          <Path
            d="M15 40 Q 60 28 105 40"
            stroke="#7FA88B"
            strokeWidth={22}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      );
    case 5:
      return (
        <Svg viewBox="0 0 120 80" width={size} height={(size * 80) / 120}>
          <G fill="#A3856B">
            <Ellipse cx={30} cy={40} rx={14} ry={11} />
            <Ellipse cx={60} cy={42} rx={16} ry={12} />
            <Ellipse cx={92} cy={40} rx={14} ry={11} />
          </G>
        </Svg>
      );
    case 6:
      return (
        <Svg viewBox="0 0 120 80" width={size} height={(size * 80) / 120}>
          <Path
            d="M10 42 q 8 -10 20 -6 t 22 4 q 12 -10 24 -4 t 22 6 q 12 -8 20 -2"
            stroke="#D88B6B"
            strokeWidth={18}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      );
    case 7:
      return (
        <Svg viewBox="0 0 120 80" width={size} height={(size * 80) / 120}>
          <Path
            d="M10 38 q 15 -8 25 0 t 25 0 t 25 0 t 25 0"
            stroke="#B86A4C"
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M10 50 q 15 -8 25 0 t 25 0 t 25 0 t 25 0"
            stroke="#B86A4C"
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
            opacity={0.7}
          />
        </Svg>
      );
  }
}
