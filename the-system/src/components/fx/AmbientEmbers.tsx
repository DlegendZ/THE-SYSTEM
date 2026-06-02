import React from 'react';
import { Animated, Easing, StyleSheet, View, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface EmberSpec {
  x: number;
  duration: number;
  delay: number;
  drift: number;
  size: number;
}

// Specs AND their driving animated values are created ONCE at module load and
// shared by every screen. Sharing the values (not just the specs) keeps every
// page at the same point in the cycle, so the ember layout is identical
// everywhere instead of drifting out of phase per screen. The loops are started
// once and NEVER stopped — and the views are never unmounted (see below) — so
// the native animation always has a live view bound to it and can't be torn
// down (which is what previously froze the embers after closing a modal).
interface SharedEmbers {
  specs: EmberSpec[];
  values: Animated.Value[];
}
const CACHE = new Map<number, SharedEmbers>();

function getShared(count: number): SharedEmbers {
  let shared = CACHE.get(count);
  if (!shared) {
    const specs: EmberSpec[] = Array.from({ length: count }).map(() => ({
      x: Math.random() * width,
      duration: 13000 + Math.random() * 13000,
      delay: Math.random() * 14000,
      drift: (Math.random() - 0.5) * 44,
      size: 2 + Math.random() * 2.5,
    }));
    const values = specs.map(() => new Animated.Value(0));
    values.forEach((v, i) => {
      Animated.loop(
        Animated.timing(v, {
          toValue: 1,
          duration: specs[i].duration,
          delay: specs[i].delay,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    });
    shared = { specs, values };
    CACHE.set(count, shared);
  }
  return shared;
}

function Ember({ color, spec, value }: { color: string; spec: EmberSpec; value: Animated.Value }) {
  const translateY = value.interpolate({ inputRange: [0, 1], outputRange: [height * 0.92, -40] });
  const translateX = value.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, spec.drift, 0] });
  const opacity = value.interpolate({ inputRange: [0, 0.12, 0.85, 1], outputRange: [0, 0.55, 0.45, 0] });

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
 *
 * Renders on every screen (incl. modals) and never unmounts on blur: keeping a
 * live view bound to each shared, always-running native value means the embers
 * keep moving everywhere and never freeze after a modal closes.
 */
export default function AmbientEmbers({ color, count = 14 }: { color: string; count?: number }) {
  const { specs, values } = getShared(count);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {specs.map((spec, i) => (
        <Ember key={i} color={color} spec={spec} value={values[i]} />
      ))}
    </View>
  );
}
