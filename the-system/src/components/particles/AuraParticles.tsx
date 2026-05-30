import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const { width: SCREEN_W } = Dimensions.get('window');

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  size: number;
  color: string;
  delay: number;
}

interface Props {
  particleType: string;
  particleCount: number;
  auraColor: string | null;
  width?: number;
  height?: number;
}

function createParticle(color: string, w: number, h: number, i: number): Particle {
  return {
    x: new Animated.Value(Math.random() * w),
    y: new Animated.Value(Math.random() * h),
    opacity: new Animated.Value(0),
    size: Math.random() * 3 + 2,
    color,
    delay: i * 200,
  };
}

function animateParticle(p: Particle, type: string, w: number, h: number): void {
  const duration = 2000 + Math.random() * 3000;

  if (type === 'dust') {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(p.opacity, { toValue: 0.4, duration: duration * 0.3, useNativeDriver: true }),
          Animated.timing(p.y, {
            toValue: (p.y as unknown as { _value: number })._value - 20 - Math.random() * 20,
            duration,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(p.opacity, { toValue: 0, duration: duration * 0.3, useNativeDriver: true }),
      ])
    ).start();
  } else if (type === 'embers') {
    Animated.loop(
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          Animated.timing(p.opacity, { toValue: 0.8, duration: 400, useNativeDriver: true }),
          Animated.timing(p.y, {
            toValue: (p.y as unknown as { _value: number })._value - 30 - Math.random() * 40,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(p.x, {
            toValue: (p.x as unknown as { _value: number })._value + (Math.random() - 0.5) * 20,
            duration,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(p.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ])
    ).start();
  } else if (type === 'gold_sparks' || type === 'gold_streaks') {
    Animated.loop(
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          Animated.timing(p.opacity, { toValue: 1.0, duration: 200, useNativeDriver: true }),
          Animated.timing(p.y, {
            toValue: (p.y as unknown as { _value: number })._value - 50 - Math.random() * 60,
            duration: duration * 0.8,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(p.opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  } else {
    Animated.loop(
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.timing(p.opacity, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
        Animated.timing(p.opacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }
}

export default function AuraParticles({
  particleType,
  particleCount,
  auraColor,
  width = SCREEN_W,
  height = 200,
}: Props) {
  const color = auraColor ?? '#888888';
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    particlesRef.current = Array.from({ length: particleCount }, (_, i) =>
      createParticle(color, width, height, i)
    );
    particlesRef.current.forEach((p) => animateParticle(p, particleType, width, height));
  }, [particleType, particleCount, color, width, height]);

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      {particlesRef.current.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              transform: [{ translateX: p.x }, { translateY: p.y }],
              opacity: p.opacity,
            },
          ]}
        >
          <Svg width={p.size * 2} height={p.size * 2}>
            <Circle cx={p.size} cy={p.size} r={p.size} fill={color} />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, overflow: 'hidden' },
  particle: { position: 'absolute' },
});
