import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface ParticleProps {
  color: string;
  count?: number;
}

interface Spec {
  startX: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  maxOpacity: number;
}

function Particle({ spec, color }: { spec: Spec; color: string }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: spec.duration,
        delay: spec.delay,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [progress, spec]);

  // Rise from just below the screen to above it.
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_H + 20, -40],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, spec.drift, 0],
  });
  // Fade in near the bottom, fade out near the top.
  const opacity = progress.interpolate({
    inputRange: [0, 0.12, 0.85, 1],
    outputRange: [0, spec.maxOpacity, spec.maxOpacity, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: spec.startX,
        width: spec.size,
        height: spec.size,
        borderRadius: spec.size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { translateX }],
      }}
    />
  );
}

/**
 * Ambient floating motes ("mana dust") that drift upward across the screen.
 * Rendered as a non-interactive overlay; tuned for ~60fps on a phone.
 */
export default function Particles({ color, count = 16 }: ParticleProps) {
  const specs = useMemo<Spec[]>(
    () =>
      Array.from({ length: count }, () => ({
        startX: Math.random() * SCREEN_W,
        size: 2.5 + Math.random() * 3,
        duration: 9000 + Math.random() * 8000,
        delay: Math.random() * 12000,
        drift: (Math.random() - 0.5) * 60,
        maxOpacity: 0.4 + Math.random() * 0.5,
      })),
    [count]
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {specs.map((spec, i) => (
        <Particle key={i} spec={spec} color={color} />
      ))}
    </View>
  );
}
