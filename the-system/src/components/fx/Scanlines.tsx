import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Rect, Line } from 'react-native-svg';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
  color?: string;
  /** Opacity of the static scan-lines (0-1). */
  intensity?: number;
}

/**
 * Holographic CRT overlay: fine static scan-lines plus a slow vertical sweep
 * band. Non-interactive; sits above content for a "digital System" feel.
 */
export default function Scanlines({ color = '#8fdcff', intensity = 0.07 }: Props) {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  const translateY = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_H * 0.4, SCREEN_H],
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Static scan-lines via a tiled SVG pattern (GPU-friendly) */}
      <Svg width={SCREEN_W} height={SCREEN_H} style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="scan" width={3} height={3} patternUnits="userSpaceOnUse">
            <Line x1="0" y1="0" x2={SCREEN_W} y2="0" stroke={color} strokeWidth={1} opacity={intensity} />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width={SCREEN_W} height={SCREEN_H} fill="url(#scan)" />
      </Svg>

      {/* Moving sweep band */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: SCREEN_H * 0.4,
          backgroundColor: color,
          opacity: 0.035,
          transform: [{ translateY }],
        }}
      />
    </View>
  );
}
