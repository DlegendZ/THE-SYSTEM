import React from 'react';
import { View } from 'react-native';
import StarAvatar from './StarAvatar';
import type { HeroClass, ArmorTier } from './avatarData';

interface Props {
  heroClass: HeroClass;
  rank: string;
  mood?: 'radiant' | 'steady' | 'worn' | 'broken';
  weaponTier?: ArmorTier;
  pixelSize?: number;
}

const MOOD_OPACITY: Record<string, number> = {
  radiant: 1.0,
  steady: 1.0,
  worn: 0.75,
  broken: 0.55,
};

export default function AvatarDisplay({ heroClass, rank, mood = 'steady', pixelSize = 4 }: Props) {
  const size = pixelSize * 24;
  const opacity = MOOD_OPACITY[mood] ?? 1.0;

  return (
    <View style={[styles.container, { opacity }]}>
      <StarAvatar rank={rank} heroClass={heroClass} size={size} />
    </View>
  );
}

const styles = {
  container: { alignItems: 'center' as const, justifyContent: 'center' as const },
};
