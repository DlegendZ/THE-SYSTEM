import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import type { Rank } from '../../types';

const { width: W, height: H } = Dimensions.get('window');

interface Props {
  rank: Rank;
  title: string;
  onDismiss: () => void;
}

const RANK_COLORS: Record<Rank, { primary: string; secondary: string }> = {
  E: { primary: '#666666', secondary: '#444444' },
  D: { primary: '#b87333', secondary: '#8b5e2a' },
  C: { primary: '#f0a500', secondary: '#c87a00' },
  B: { primary: '#ffd700', secondary: '#ff8c00' },
  A: { primary: '#ffe566', secondary: '#ffd700' },
  S: { primary: '#ffffff', secondary: '#ffd700' },
};

export default function RankPromotionSplash({ rank, title, onDismiss }: Props): React.JSX.Element {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const rankScale = useRef(new Animated.Value(0.2)).current;
  const rayRotate = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  const colors = RANK_COLORS[rank];

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(rankScale, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 800, delay: 400, useNativeDriver: true }),
      ]),
    ]).start();

    const rayLoop = Animated.loop(
      Animated.timing(rayRotate, { toValue: 1, duration: 8000, useNativeDriver: true })
    );
    rayLoop.start();

    const timer = setTimeout(onDismiss, 4000);
    return () => {
      clearTimeout(timer);
      rayLoop.stop();
    };
  }, []);

  const spin = rayRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
      <View style={StyleSheet.absoluteFill}>
        <Svg width={W} height={H}>
          <Rect width={W} height={H} fill="#000000" />
          {Array.from({ length: 12 }).map((_, i) => (
            <Rect
              key={i}
              x={W / 2 - 1}
              y={0}
              width={2}
              height={H}
              fill={colors.primary}
              opacity={0.15}
              rotation={i * 30}
              originX={W / 2}
              originY={H / 2}
            />
          ))}
        </Svg>
      </View>

      <Animated.View
        style={[styles.rayContainer, { transform: [{ rotate: spin }] }]}
        pointerEvents="none"
      >
        <Svg width={W} height={H}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Rect
              key={i}
              x={W / 2 - 1}
              y={0}
              width={2}
              height={H}
              fill={colors.secondary}
              opacity={0.2}
              rotation={i * 60}
              originX={W / 2}
              originY={H / 2}
            />
          ))}
        </Svg>
      </Animated.View>

      <Animated.Text
        style={[styles.rankLetter, { color: colors.primary, transform: [{ scale: rankScale }] }]}
      >
        {rank}
      </Animated.Text>

      <Animated.Text style={[styles.rankLabel, { color: colors.secondary }]}>
        Rank
      </Animated.Text>

      <Animated.Text style={[styles.title, { color: colors.primary, opacity: titleOpacity }]}>
        {title}
      </Animated.Text>

      <Animated.Text style={[styles.tap, { opacity: titleOpacity }]}>
        Tap to continue
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  rayContainer: { ...StyleSheet.absoluteFill },
  rankLetter: { fontFamily: 'Lora_600SemiBold', fontSize: 120, fontWeight: 'bold', letterSpacing: 0.5 },
  rankLabel: { fontFamily: 'Lora_600SemiBold', fontSize: 24, fontWeight: 'bold', letterSpacing: 0.5, marginTop: -16 },
  title: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.3,
    marginTop: 32,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  tap: { fontFamily: 'Lora_600SemiBold', fontSize: 10, color: '#666666', letterSpacing: 0.5, marginTop: 48 },
});
