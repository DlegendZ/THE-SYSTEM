import React from 'react';
import Svg, { Path, Polyline, Line, Circle, Rect } from 'react-native-svg';

/**
 * Geometric line-art glyphs that replace the app's emoji. Single-stroke, themeable
 * via `color`, scalable. One <Glyph name=… /> renders a 24×24 viewBox icon.
 */
export type GlyphName =
  | 'check'
  | 'cross'
  | 'close'
  | 'bolt'
  | 'sword'
  | 'heart'
  | 'chest'
  | 'shield'
  | 'up'
  | 'gem';

interface Props {
  name: GlyphName;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export default function Glyph({ name, color, size = 18, strokeWidth = 2 }: Props) {
  const common = {
    stroke: color,
    strokeWidth,
    fill: 'none' as const,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'check' && <Polyline points="4,13 9,18 20,6" {...common} />}
      {(name === 'cross' || name === 'close') && (
        <>
          <Line x1="6" y1="6" x2="18" y2="18" {...common} />
          <Line x1="18" y1="6" x2="6" y2="18" {...common} />
        </>
      )}
      {name === 'bolt' && (
        <Polyline points="13,2 5,13 11,13 9,22 19,9 12,9 13,2" {...common} />
      )}
      {name === 'sword' && (
        <>
          <Line x1="12" y1="2" x2="12" y2="15" {...common} />
          <Line x1="8.5" y1="15" x2="15.5" y2="15" {...common} />
          <Line x1="12" y1="15" x2="12" y2="21" {...common} />
          <Line x1="10" y1="21" x2="14" y2="21" {...common} />
        </>
      )}
      {name === 'heart' && (
        <Path
          d="M12 20.5 C5 15 3.2 11.4 5.2 8.3 C7 5.6 11 6.2 12 9 C13 6.2 17 5.6 18.8 8.3 C20.8 11.4 19 15 12 20.5 Z"
          {...common}
        />
      )}
      {name === 'chest' && (
        <>
          <Path d="M4 9 C4 6 7 5 12 5 C17 5 20 6 20 9 L20 9" {...common} />
          <Rect x="4" y="9" width="16" height="10" rx="1" {...common} />
          <Line x1="4" y1="13" x2="20" y2="13" {...common} />
          <Rect x="10.5" y="11.5" width="3" height="3" rx="0.6" {...common} />
        </>
      )}
      {name === 'shield' && (
        <Path
          d="M12 3 L19.5 6 L19.5 12 C19.5 16.6 16 19.6 12 21.5 C8 19.6 4.5 16.6 4.5 12 L4.5 6 Z"
          {...common}
        />
      )}
      {name === 'up' && <Polyline points="5,17 12,7 19,17" {...common} />}
      {name === 'gem' && (
        <>
          <Path d="M7 4 H17 L21 9 L12 21 L3 9 Z" {...common} />
          <Path d="M3 9 H21 M7 4 L12 21 L17 4" {...common} />
        </>
      )}
    </Svg>
  );
}
