import React from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import {
  BASE_PIXELS,
  getPalette,
  getRegalia,
  applyOverlay,
  rankToArmorTier,
  type HeroClass,
  type ArmorTier,
} from './avatarData';

interface Props {
  heroClass: HeroClass;
  rank: string;           // E|D|C|B|A|S
  mood?: 'radiant' | 'steady' | 'worn' | 'broken';
  weaponTier?: ArmorTier;
  pixelSize?: number;     // default 4 → 64×96 display
}

export default function AvatarDisplay({
  heroClass,
  rank,
  mood = 'steady',
  weaponTier,
  pixelSize = 4,
}: Props) {
  const armorTier = rankToArmorTier(rank);

  const basePalette = getPalette(heroClass, armorTier);
  const regalia = getRegalia(rank);

  const palette: Record<string, string> = { ...basePalette, R: regalia.color };
  const pixels = applyOverlay(BASE_PIXELS[heroClass], regalia.pixels);

  const moodOpacity: Record<string, number> = {
    radiant: 1.0,
    steady: 1.0,
    worn: 0.75,
    broken: 0.55,
  };
  const opacity = moodOpacity[mood] ?? 1.0;

  const cols = pixels[0]?.length ?? 16;
  const rows = pixels.length;
  const width = cols * pixelSize;
  const height = rows * pixelSize;

  const brokenTint = mood === 'broken' ? '#440000' : undefined;

  return (
    <View style={[styles.container, { opacity }]}>
      <Svg width={width} height={height}>
        {pixels.flatMap((row, y) =>
          Array.from(row).map((char, x) => {
            if (char === '.' || !palette[char]) return null;
            let color = palette[char];
            if (brokenTint && char !== 'S' && char !== 'F') {
              color = blendColor(color, brokenTint, 0.25);
            }
            return (
              <Rect
                key={`${y}-${x}`}
                x={x * pixelSize}
                y={y * pixelSize}
                width={pixelSize}
                height={pixelSize}
                fill={color}
              />
            );
          })
        )}
      </Svg>
    </View>
  );
}

function blendColor(base: string, target: string, ratio: number): string {
  const parse = (hex: string) => {
    const raw = hex.replace('#', '');
    // Expand 3-char shorthand: 'abc' → 'aabbcc'
    const h = raw.length === 3
      ? raw[0] + raw[0] + raw[1] + raw[1] + raw[2] + raw[2]
      : raw;
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = parse(base);
  const [r2, g2, b2] = parse(target);
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);
  return `rgb(${r},${g},${b})`;
}

const styles = {
  container: { alignItems: 'center' as const, justifyContent: 'center' as const },
};
