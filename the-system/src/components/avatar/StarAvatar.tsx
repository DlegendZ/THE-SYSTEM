import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path, Circle, Line, Defs, RadialGradient, Stop } from 'react-native-svg';
import type { HeroClass } from './avatarData';
import { rankToArmorTier } from './avatarData';

type RankCode = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

interface Props {
  heroClass: HeroClass;
  rank: string;
  size?: number;
  /** Override rank for previews (e.g. select-star cards before the run starts). */
  previewIntensity?: RankCode;
}

// Warm-tuned real star colors.
const COLORS: Record<HeroClass, { core: string; tip: string; glow: string }> = {
  Warrior: { core: '#F0875A', tip: '#E0623C', glow: '#FF7A4D' }, // Antares — red supergiant
  Mage: { core: '#FBE3B0', tip: '#E8C879', glow: '#FFE9A8' },    // Polaris — gold-white pole star
  Rogue: { core: '#CFE0EC', tip: '#9FB8CC', glow: '#B8D0E4' },   // Altair — muted silver-blue
};

// Rank → layered effect flags.
interface Fx { halo: boolean; ring: boolean; motes: number; spin: boolean; corona: boolean; opacity: number }
const FX: Record<RankCode, Fx> = {
  E: { halo: false, ring: false, motes: 0, spin: false, corona: false, opacity: 0.72 },
  D: { halo: true, ring: false, motes: 0, spin: false, corona: false, opacity: 0.82 },
  C: { halo: true, ring: true, motes: 0, spin: false, corona: false, opacity: 0.9 },
  B: { halo: true, ring: true, motes: 1, spin: false, corona: false, opacity: 0.95 },
  A: { halo: true, ring: true, motes: 2, spin: true, corona: false, opacity: 1 },
  S: { halo: true, ring: true, motes: 3, spin: true, corona: true, opacity: 1 },
};

const TIER_TO_RANK: RankCode[] = ['E', 'D', 'C', 'B', 'A', 'S'];

function rankCode(rank: string, preview?: RankCode): RankCode {
  if (preview) return preview;
  if ((['E', 'D', 'C', 'B', 'A', 'S'] as string[]).includes(rank)) return rank as RankCode;
  return TIER_TO_RANK[rankToArmorTier(rank) - 1] ?? 'E';
}

/** Tapered leaf ray from center outward; curveDir bends it (swept "wing"). */
function ray(cx: number, cy: number, angle: number, len: number, width: number, curveDir = 0): string {
  const tx = cx + len * Math.cos(angle);
  const ty = cy + len * Math.sin(angle);
  const bx = cx + Math.cos(angle + Math.PI / 2) * width;
  const by = cy + Math.sin(angle + Math.PI / 2) * width;
  const bx2 = cx + Math.cos(angle - Math.PI / 2) * width;
  const by2 = cy + Math.sin(angle - Math.PI / 2) * width;
  const midR = len * 0.45;
  const skew = curveDir * len * 0.25;
  const mx = cx + midR * Math.cos(angle) + Math.cos(angle + Math.PI / 2) * skew;
  const my = cy + midR * Math.sin(angle) + Math.sin(angle + Math.PI / 2) * skew;
  return `M ${bx} ${by} Q ${mx} ${my} ${tx} ${ty} Q ${mx} ${my} ${bx2} ${by2} Z`;
}

/** 4-point sparkle (concave diamond). */
function fourPoint(cx: number, cy: number, outer: number, inner: number): string {
  return [
    `M ${cx} ${cy - outer}`,
    `L ${cx + inner} ${cy - inner}`,
    `L ${cx + outer} ${cy}`,
    `L ${cx + inner} ${cy + inner}`,
    `L ${cx} ${cy + outer}`,
    `L ${cx - inner} ${cy + inner}`,
    `L ${cx - outer} ${cy}`,
    `L ${cx - inner} ${cy - inner}`,
    'Z',
  ].join(' ');
}

export default function StarAvatar({ heroClass, rank, size = 96, previewIntensity }: Props) {
  const code = rankCode(rank, previewIntensity);
  const fx = FX[code];
  const col = COLORS[heroClass];
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2;

  // Signature motion per star.
  const antaresPulse = heroClass === 'Warrior';
  const doPulse = antaresPulse || fx.motes > 0; // Antares always; others from B-rank
  const doSpin = heroClass === 'Rogue' || (heroClass === 'Warrior' && fx.spin); // Altair always, Antares A+, Polaris never

  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!doPulse) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [doPulse, pulse]);

  useEffect(() => {
    if (!doSpin) return;
    const dur = heroClass === 'Rogue' ? 26000 : 40000;
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: dur, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [doSpin, heroClass, spin]);

  useEffect(() => {
    if (fx.motes === 0) return;
    const loop = Animated.loop(
      Animated.timing(orbit, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [fx.motes, orbit]);

  useEffect(() => {
    if (heroClass !== 'Rogue') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [heroClass, shimmer]);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, antaresPulse ? 1.07 : 1.04] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.22] });
  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const orbitDeg = orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const shimmerOp = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] });

  // ── Star body per class ──────────────────────────────────────────────────
  let body: React.ReactNode = null;

  if (heroClass === 'Warrior') {
    // Antares — round supergiant disc + broad soft flares.
    const flares = Array.from({ length: fx.corona ? 12 : 8 }).map((_, i, arr) =>
      ray(cx, cy, (i / arr.length) * Math.PI * 2, R * (fx.corona ? 0.92 : 0.72), R * 0.16)
    );
    body = (
      <>
        {flares.map((d, i) => <Path key={i} d={d} fill={col.tip} opacity={0.5} />)}
        <Circle cx={cx} cy={cy} r={R * 0.34} fill="url(#starCore)" />
      </>
    );
  } else if (heroClass === 'Mage') {
    // Polaris — 4-point sparkle + faint guiding cross + secondary star.
    body = (
      <>
        <Line x1={cx} y1={cy - R * 0.96} x2={cx} y2={cy + R * 0.96} stroke={col.tip} strokeWidth={1} opacity={0.22} />
        <Line x1={cx - R * 0.96} y1={cy} x2={cx + R * 0.96} y2={cy} stroke={col.tip} strokeWidth={1} opacity={0.22} />
        <Path d={fourPoint(cx, cy, R * 0.78, R * 0.16)} fill={col.tip} opacity={0.4} transform={`rotate(45 ${cx} ${cy})`} />
        <Path d={fourPoint(cx, cy, R * 0.9, R * 0.2)} fill={col.tip} opacity={0.92} />
        <Circle cx={cx} cy={cy} r={R * 0.16} fill="url(#starCore)" />
      </>
    );
  } else {
    // Altair — sleek star with swept-back "eagle wing" rays.
    const swept = [
      ray(cx, cy, -Math.PI / 2, R * 0.9, R * 0.07, 0),     // up
      ray(cx, cy, Math.PI / 2, R * 0.55, R * 0.06, 0),     // down (short tail)
      ray(cx, cy, -Math.PI * 0.18, R * 0.92, R * 0.07, 0.9),  // right wing swept up
      ray(cx, cy, Math.PI * 1.18, R * 0.92, R * 0.07, -0.9),  // left wing swept up
      ray(cx, cy, Math.PI * 0.16, R * 0.6, R * 0.05, -0.7),   // lower right
      ray(cx, cy, Math.PI * 0.84, R * 0.6, R * 0.05, 0.7),    // lower left
    ];
    body = (
      <>
        {swept.map((d, i) => <Path key={i} d={d} fill={col.tip} opacity={0.9} />)}
        <Circle cx={cx} cy={cy} r={R * 0.13} fill="url(#starCore)" />
      </>
    );
  }

  // ── Orbiting motes (lesser stars) ────────────────────────────────────────
  const moteR = R * 0.06;
  const motePositions = Array.from({ length: fx.motes }).map((_, i) => {
    const a = (i / Math.max(fx.motes, 1)) * Math.PI * 2;
    return { x: cx + R * 0.82 * Math.cos(a), y: cy + R * 0.82 * Math.sin(a) };
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Glow halo */}
      {fx.halo && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: glowOpacity }]}>
          <Svg width={size} height={size}>
            <Circle cx={cx} cy={cy} r={R} fill={col.glow} />
          </Svg>
        </Animated.View>
      )}

      {/* Body (spin + pulse) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { opacity: fx.opacity, transform: [{ scale: doPulse ? pulseScale : 1 }, { rotate: doSpin ? spinDeg : '0deg' }] },
        ]}
      >
        <Animated.View style={[StyleSheet.absoluteFill, heroClass === 'Rogue' ? { opacity: shimmerOp } : null]}>
          <Svg width={size} height={size}>
            <Defs>
              <RadialGradient id="starCore" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={col.core} stopOpacity={1} />
                <Stop offset="1" stopColor={col.tip} stopOpacity={0.9} />
              </RadialGradient>
            </Defs>
            {fx.ring && <Circle cx={cx} cy={cy} r={R * 0.62} fill="none" stroke={col.tip} strokeWidth={1} opacity={0.25} />}
            {body}
          </Svg>
        </Animated.View>
      </Animated.View>

      {/* Orbiting motes */}
      {fx.motes > 0 && (
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: orbitDeg }] }]}>
          <Svg width={size} height={size}>
            {motePositions.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={moteR} fill={col.core} opacity={0.85} />
            ))}
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}
