import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

interface Props {
  color: string;
  /** Number of orbiting motes (0 = nothing rendered). */
  count: number;
  /** Orbit radius in px. */
  radius?: number;
  size?: number;
  /** Seconds for a full revolution. */
  period?: number;
}

/**
 * Small motes orbiting the avatar. Count/brightness scale with rank to make
 * progression feel powerful. Non-interactive.
 */
export default function AvatarOrbit({
  color,
  count,
  radius = 56,
  size = 5,
  period = 7,
}: Props) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (count <= 0) return;
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: period * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin, count, period]);

  if (count <= 0) return null;

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const box = (radius + size) * 2;

  return (
    <View pointerEvents="none" style={[styles.wrap, { width: box, height: box }]}>
      <Animated.View style={[styles.ring, { width: box, height: box, transform: [{ rotate }] }]}>
        {Array.from({ length: count }).map((_, i) => {
          const angle = (i / count) * Math.PI * 2;
          const cx = box / 2 + radius * Math.cos(angle) - size / 2;
          const cy = box / 2 + radius * Math.sin(angle) - size / 2;
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: cx,
                top: cy,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                shadowColor: color,
                shadowOpacity: 0.9,
                shadowRadius: size * 1.4,
                shadowOffset: { width: 0, height: 0 },
              }}
            />
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute' },
});
