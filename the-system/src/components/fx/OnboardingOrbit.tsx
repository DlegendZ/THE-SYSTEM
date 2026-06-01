import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, Dimensions } from 'react-native';

interface Props {
  color: string;
}

const { width, height } = Dimensions.get('window');

const RINGS = [
  { radius: 150, count: 6, period: 26, size: 4, opacity: 0.5 },
  { radius: 210, count: 9, period: 38, size: 3, opacity: 0.35 },
  { radius: 280, count: 12, period: 52, size: 3, opacity: 0.22 },
];

function Ring({ color, radius, count, period, size, opacity }: { color: string } & typeof RINGS[number]) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: period * 1000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spin, period]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const box = radius * 2;
  return (
    <Animated.View style={[styles.ring, { width: box, height: box, marginLeft: -radius, marginTop: -radius, transform: [{ rotate }] }]}>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: radius + radius * Math.cos(a) - size / 2,
              top: radius + radius * Math.sin(a) - size / 2,
              width: size, height: size, borderRadius: size / 2,
              backgroundColor: color, opacity,
              shadowColor: color, shadowOpacity: 0.8, shadowRadius: size * 1.6, shadowOffset: { width: 0, height: 0 },
            }}
          />
        );
      })}
    </Animated.View>
  );
}

/** Large, slow, low-opacity concentric orbit for the onboarding background. */
export default function OnboardingOrbit({ color }: Props) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={{ position: 'absolute', left: width / 2, top: height * 0.42 }}>
        {RINGS.map((r, i) => <Ring key={i} color={color} {...r} />)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute' },
});
