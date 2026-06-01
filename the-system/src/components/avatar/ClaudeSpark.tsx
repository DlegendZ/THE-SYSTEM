import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import type { HeroClass } from './avatarData';

interface Props {
  rank: string;            // E|D|C|B|A|S
  heroClass?: HeroClass;   // ray-style variant
  size?: number;
  mood?: 'radiant' | 'steady' | 'worn' | 'broken';
  tint?: string;           // override ray fill and core color
  glow?: boolean;          // soft radial halo behind the rays
}

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

// Rank → spark intensity. More/longer rays and warmer tips with progress.
const RANK_SPEC: Record<string, { rays: number; len: number; tip: string; core: string; rotate: boolean }> = {
  E: { rays: 6,  len: 0.62, tip: '#B98E78', core: '#C9A893', rotate: false },
  D: { rays: 8,  len: 0.68, tip: '#C68F70', core: '#D6A98C', rotate: false },
  C: { rays: 10, len: 0.74, tip: '#D97757', core: '#E89B7E', rotate: false },
  B: { rays: 12, len: 0.80, tip: '#E07F54', core: '#F0A782', rotate: false },
  A: { rays: 14, len: 0.86, tip: '#E88A5A', core: '#F3B98C', rotate: true },
  S: { rays: 16, len: 0.94, tip: '#F0A368', core: '#FBD9A6', rotate: true },
};

// HeroClass tweaks ray silhouette: Mage=slender, Rogue=sharp, Warrior=broad.
const CLASS_WIDTH: Record<string, number> = { Warrior: 0.16, Mage: 0.09, Rogue: 0.06 };

export default function ClaudeSpark({ rank, heroClass = 'Warrior', size = 96, mood = 'steady', tint, glow = false }: Props) {
  const baseSpec = RANK_SPEC[rank] ?? RANK_SPEC.E;
  const spec = tint ? { ...baseSpec, tip: tint, core: tint } : baseSpec;
  const widthFrac = CLASS_WIDTH[heroClass] ?? 0.12;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!spec.rotate) return;
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 36000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spec.rotate, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // Build tapered petals: each ray is a thin leaf from center outward.
  const rays = Array.from({ length: spec.rays }).map((_, i) => {
    const a = (i / spec.rays) * Math.PI * 2;
    const tipR = maxR * spec.len;
    const w = maxR * widthFrac;
    const tx = cx + tipR * Math.cos(a);
    const ty = cy + tipR * Math.sin(a);
    const bx = cx + Math.cos(a + Math.PI / 2) * w;
    const by = cy + Math.sin(a + Math.PI / 2) * w;
    const bx2 = cx + Math.cos(a - Math.PI / 2) * w;
    const by2 = cy + Math.sin(a - Math.PI / 2) * w;
    const midR = maxR * spec.len * 0.45;
    const mx = cx + midR * Math.cos(a);
    const my = cy + midR * Math.sin(a);
    return `M ${bx} ${by} Q ${mx} ${my} ${tx} ${ty} Q ${mx} ${my} ${bx2} ${by2} Z`;
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <AnimatedSvg width={size} height={size} style={{ transform: [{ rotate }] }}>
        <Defs>
          <RadialGradient id="sparkCore" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={spec.core} stopOpacity={1} />
            <Stop offset="1" stopColor={spec.tip} stopOpacity={0.9} />
          </RadialGradient>
        </Defs>
        {glow && <Circle cx={cx} cy={cy} r={maxR} fill={tint ?? spec.tip} opacity={0.14} />}
        {rays.map((d, i) => (
          <Path key={i} d={d} fill={spec.tip} opacity={0.92} />
        ))}
        <Circle cx={cx} cy={cy} r={maxR * 0.2} fill="url(#sparkCore)" />
      </AnimatedSvg>
    </View>
  );
}
