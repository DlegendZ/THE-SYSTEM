import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import type { MandateTier } from '../../types';

interface Props {
  tier: MandateTier;
  onPress?: () => void;
  size?: number;
}

const TIER_COLORS: Record<MandateTier, { body: string; lid: string; lock: string; glow: string }> = {
  BRONZE: { body: '#8b5e2a', lid: '#7a4e1a', lock: '#6b4010', glow: '#cd7f32' },
  SILVER: { body: '#7a7a8a', lid: '#6a6a7a', lock: '#5a5a6a', glow: '#c0c0c0' },
  GOLD:   { body: '#1a1a00', lid: '#2a2a00', lock: '#ffd700', glow: '#ffd700' },
};

export default function MandateChest({ tier, onPress, size = 48 }: Props): React.JSX.Element {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const c = TIER_COLORS[tier];

  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -4, duration: 600, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    );
    glowLoop.start();
    bounceLoop.start();
    return () => {
      glowLoop.stop();
      bounceLoop.stop();
    };
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.0] });
  const s = size;

  return (
    <TouchableOpacity onPress={onPress}>
      <Animated.View style={[styles.container, { transform: [{ translateY: bounceAnim }] }]}>
        <Animated.View
          style={[
            styles.glow,
            {
              width: s + 16,
              height: s + 16,
              borderRadius: (s + 16) / 2,
              backgroundColor: c.glow,
              opacity: glowOpacity,
            },
          ]}
        />
        <Svg width={s} height={s}>
          <Rect x={2} y={s * 0.4} width={s - 4} height={s * 0.55} fill={c.body} rx={2} />
          <Rect x={2} y={2} width={s - 4} height={s * 0.42} fill={c.lid} rx={2} />
          <Rect x={0} y={s * 0.38} width={s} height={4} fill={c.lock} />
          <Rect x={s / 2 - 5} y={s * 0.5} width={10} height={8} fill={c.lock} rx={1} />
          <Rect x={s / 2 - 4} y={s * 0.42} width={8} height={6} fill="none" stroke={c.lock} strokeWidth={2} />
          <Rect x={2} y={s * 0.6} width={s - 4} height={2} fill={c.lock} opacity={0.5} />
          <Rect x={2} y={s * 0.75} width={s - 4} height={2} fill={c.lock} opacity={0.5} />
        </Svg>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', top: -8, left: -8 },
});
