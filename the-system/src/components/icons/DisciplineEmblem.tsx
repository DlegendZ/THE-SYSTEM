import React from 'react';
import Svg, { Path, Polyline, Line, Circle, Polygon, G } from 'react-native-svg';

/**
 * Geometric line-art emblems for discipline boxes. A pool of 12 distinct sigils;
 * each discipline gets a stable one chosen by id (deterministic, never reshuffles).
 * Behind the sigil sits a faint per-variant backdrop "object" (ring / dots / arc)
 * so each box reads as its own little crest. Single-stroke, themeable via `color`.
 */
interface Props {
  /** Stable selector — pass the discipline id (or any int). */
  seed: number;
  color: string;
  size?: number;
}

const VIEW = 32;

function emblem(index: number, c: string, sw: number): React.ReactNode {
  const s = { stroke: c, strokeWidth: sw, fill: 'none' as const, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (index % 12) {
    case 0: // mountain
      return <Polyline points="4,25 13,12 18,18 22,11 28,25" {...s} />;
    case 1: // flame
      return <Path d="M16 4 C19 11 24 13 21 20 C19 25 12 25 11 19 C10.5 16 13 15 13 17 C13 12 15 9 16 4 Z" {...s} />;
    case 2: // eye
      return <G><Path d="M3 16 C9 9 23 9 29 16 C23 23 9 23 3 16 Z" {...s} /><Circle cx="16" cy="16" r="3.2" {...s} /></G>;
    case 3: // key
      return <G><Circle cx="11" cy="12" r="5" {...s} /><Line x1="14.5" y1="15.5" x2="25" y2="26" {...s} /><Line x1="22" y1="23" x2="25" y2="20" {...s} /><Line x1="19" y1="20" x2="22" y2="17" {...s} /></G>;
    case 4: // crescent
      return <Path d="M21 5 C13 7 13 25 21 27 C14 27 7 22 7 16 C7 10 14 5 21 5 Z" {...s} />;
    case 5: // tower
      return <G><Polyline points="9,12 9,9 12,9 12,11 15,11 15,9 18,9 18,11 21,11 21,9 23,9 23,12" {...s} /><Polyline points="9,12 9,26 23,26 23,12" {...s} /><Line x1="16" y1="17" x2="16" y2="26" {...s} /></G>;
    case 6: // dagger
      return <G><Polygon points="16,3 19,11 16,20 13,11" {...s} /><Line x1="11" y1="20" x2="21" y2="20" {...s} /><Line x1="16" y1="20" x2="16" y2="28" {...s} /></G>;
    case 7: // leaf
      return <G><Path d="M7 25 C7 13 20 6 25 8 C27 19 16 27 7 25 Z" {...s} /><Line x1="10" y1="23" x2="22" y2="11" {...s} /></G>;
    case 8: // hourglass
      return <G><Polyline points="8,6 24,6 13,16 24,26 8,26 19,16 8,6" {...s} /></G>;
    case 9: // rune
      return <G><Line x1="16" y1="4" x2="16" y2="28" {...s} /><Line x1="16" y1="11" x2="8" y2="5" {...s} /><Line x1="16" y1="16" x2="24" y2="10" {...s} /><Line x1="16" y1="22" x2="8" y2="28" {...s} /></G>;
    case 10: // starburst
      return <G><Polygon points="16,4 18,14 28,16 18,18 16,28 14,18 4,16 14,14" {...s} /></G>;
    case 11: // wave
    default:
      return <G><Path d="M4 13 C8 9 12 17 16 13 C20 9 24 17 28 13" {...s} /><Path d="M4 20 C8 16 12 24 16 20 C20 16 24 24 28 20" {...s} /></G>;
  }
}

function backdrop(index: number, c: string): React.ReactNode {
  const faint = c + '24';
  switch (index % 3) {
    case 0: // ring
      return <Circle cx="16" cy="16" r="14" stroke={faint} strokeWidth={1} fill="none" />;
    case 1: // corner dots
      return (
        <G>
          {[[5, 5], [27, 5], [5, 27], [27, 27]].map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r="1.4" fill={faint} />
          ))}
        </G>
      );
    default: // arc
      return <Path d="M4 22 C10 28 22 28 28 22" stroke={faint} strokeWidth={1} fill="none" />;
  }
}

export default function DisciplineEmblem({ seed, color, size = 28 }: Props) {
  const idx = ((seed % 12) + 12) % 12;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
      {backdrop(idx, color)}
      {emblem(idx, color, 2)}
    </Svg>
  );
}
