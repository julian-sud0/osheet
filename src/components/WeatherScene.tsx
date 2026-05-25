import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import type { WeatherState } from '@/domain/weather';

/**
 * Atmospheric scenes for the home weather card.
 * Ported from index.html:195-212.
 */
export function WeatherScene({ state }: { state: WeatherState }) {
  if (state === 'calm') {
    return (
      <Svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
        <Rect width={320} height={160} fill="#eaf0e9" />
        <Circle cx={250} cy={50} r={28} fill="#f1c98a" opacity={0.85} />
        <Path d="M0 130 Q 60 95 130 115 T 320 105 L 320 160 L 0 160 Z" fill="#7FA88B" opacity={0.85} />
        <Path d="M0 145 Q 80 120 160 135 T 320 130 L 320 160 L 0 160 Z" fill="#5C8770" />
      </Svg>
    );
  }
  if (state === 'mixed') {
    return (
      <Svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
        <Rect width={320} height={160} fill="#e4ebf0" />
        <Circle cx={220} cy={55} r={26} fill="#f1c98a" opacity={0.85} />
        <Ellipse cx={100} cy={60} rx={55} ry={18} fill="#fff" opacity={0.85} />
        <Ellipse cx={140} cy={50} rx={45} ry={18} fill="#fff" />
        <Path d="M0 130 Q 70 110 140 120 T 320 115 L 320 160 L 0 160 Z" fill="#7C9BB3" opacity={0.5} />
        <Path d="M0 145 Q 80 130 160 140 T 320 135 L 320 160 L 0 160 Z" fill="#5C7C92" opacity={0.85} />
      </Svg>
    );
  }
  // flare
  return (
    <Svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <Rect width={320} height={160} fill="#f7e5dc" />
      <Ellipse cx={80} cy={50} rx={50} ry={18} fill="#fff" opacity={0.7} />
      <Ellipse cx={120} cy={42} rx={40} ry={16} fill="#fff" opacity={0.85} />
      <Path
        d="M0 110 q 20 -18 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 L 320 160 L 0 160 Z"
        fill="#D88B6B"
        opacity={0.7}
      />
      <Path
        d="M0 130 q 25 -14 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 L 320 160 L 0 160 Z"
        fill="#B86A4C"
      />
    </Svg>
  );
}
