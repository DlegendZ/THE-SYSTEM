import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  Pattern,
  Path,
  Rect,
  RadialGradient,
  Stop,
} from 'react-native-svg';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
  color: string;
  /** Base fill drawn under the grid. */
  background: string;
}

/**
 * Static System backdrop: a faint blueprint grid plus a soft radial glow that
 * lifts the centre of the screen. Cheap (two SVG draws), sits behind content.
 */
export default function SystemBackground({ color, background }: Props) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: background }]}>
      <Svg width={SCREEN_W} height={SCREEN_H} style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="grid" width={32} height={32} patternUnits="userSpaceOnUse">
            <Path d={`M 32 0 L 0 0 0 32`} fill="none" stroke={color} strokeWidth={0.5} opacity={0.06} />
          </Pattern>
          <RadialGradient id="glow" cx="50%" cy="32%" rx="70%" ry="55%">
            <Stop offset="0" stopColor={color} stopOpacity={0.16} />
            <Stop offset="0.55" stopColor={color} stopOpacity={0.04} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={SCREEN_W} height={SCREEN_H} fill="url(#grid)" />
        <Rect x="0" y="0" width={SCREEN_W} height={SCREEN_H} fill="url(#glow)" />
      </Svg>
    </View>
  );
}
