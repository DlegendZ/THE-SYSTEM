import React, { useEffect } from 'react';
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
  loops: Animated.CompositeAnimation[];
  mounted: number;
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
    shared = { specs, values, loops: [], mounted: 0 };
    CACHE.set(count, shared);
  }
  return shared;
}

// Build fresh loops bound to the shared values and start them. Native-driven
// animations are torn down once every view bound to a value unmounts (e.g. a
// full nav-tree teardown on reset), so the loop objects must be rebuilt — not
// merely re-started — when ember layers come back.
function startLoops(shared: SharedEmbers) {
  shared.loops.forEach((l) => l.stop());
  shared.loops = shared.values.map((v, i) => {
    v.setValue(0);
    const loop = Animated.loop(
      Animated.timing(v, {
        toValue: 1,
        duration: shared.specs[i].duration,
        delay: shared.specs[i].delay,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return loop;
  });
}

// Ref-count mounted ember layers. While at least one is mounted the loops run;
// the first mount after the count drops to zero rebuilds + restarts them, so
// the embers survive a full teardown (reset) instead of freezing.
function acquire(shared: SharedEmbers) {
  if (shared.mounted === 0) startLoops(shared);
  shared.mounted += 1;
}
function release(shared: SharedEmbers) {
  shared.mounted = Math.max(0, shared.mounted - 1);
  if (shared.mounted === 0) shared.loops.forEach((l) => l.stop());
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
  const shared = getShared(count);
  const { specs, values } = shared;

  useEffect(() => {
    acquire(shared);
    return () => release(shared);
  }, [shared]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {specs.map((spec, i) => (
        <Ember key={i} color={color} spec={spec} value={values[i]} />
      ))}
    </View>
  );
}
