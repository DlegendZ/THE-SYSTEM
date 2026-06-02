import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, Dimensions } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface EmberSpec {
  x: number;
  duration: number;
  delay: number;
  drift: number;
  size: number;
}

function Ember({ color, spec }: { color: string; spec: EmberSpec }) {
  const p = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(p, {
        toValue: 1,
        duration: spec.duration,
        delay: spec.delay,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [p, spec.duration, spec.delay]);

  const translateY = p.interpolate({ inputRange: [0, 1], outputRange: [height * 0.92, -40] });
  const translateX = p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, spec.drift, 0] });
  const opacity = p.interpolate({ inputRange: [0, 0.12, 0.85, 1], outputRange: [0, 0.55, 0.45, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: spec.x,
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
 * Slow warm embers drifting up the screen — an ambient background layer that
 * fills the empty space with gentle motion. Non-interactive, low-opacity.
 */
export default function AmbientEmbers({ color, count = 14 }: { color: string; count?: number }) {
  // Pause the whole layer while its screen is off-screen: the looping
  // animations stop, freeing the main thread so tab transitions stay smooth
  // without freezing the screen itself (which can blank on Android).
  const isFocused = useIsFocused();
  const specs = useRef<EmberSpec[]>(
    Array.from({ length: count }).map(() => ({
      x: Math.random() * width,
      duration: 13000 + Math.random() * 13000,
      delay: Math.random() * 14000,
      drift: (Math.random() - 0.5) * 44,
      size: 2 + Math.random() * 2.5,
    }))
  ).current;

  if (!isFocused) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {specs.map((spec, i) => (
        <Ember key={i} color={color} spec={spec} />
      ))}
    </View>
  );
}
