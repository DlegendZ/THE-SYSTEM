import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useSystemStore } from '../../store/useSystemStore';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  overrideColor?: string;
}

const CORNER_SIZE = 8;

function CornerBrackets({ color }: { color: string }): React.JSX.Element {
  const s = CORNER_SIZE;
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Top-left */}
      <Rect x={0} y={0} width={s * 2} height={2} fill={color} />
      <Rect x={0} y={0} width={2} height={s * 2} fill={color} />
      {/* Top-right */}
      <Rect x="99%" y={0} width={s * 2} height={2} fill={color} translateX={-(s * 2)} />
      <Rect x="99%" y={0} width={2} height={s * 2} fill={color} translateX={0} />
      {/* Bottom-left */}
      <Rect x={0} y="100%" width={s * 2} height={2} fill={color} translateY={0} />
      <Rect x={0} y="100%" width={2} height={s * 2} fill={color} translateY={-(s * 2)} />
      {/* Bottom-right */}
      <Rect x="99%" y="100%" width={s * 2} height={2} fill={color} translateX={-(s * 2)} translateY={0} />
      <Rect x="99%" y="100%" width={2} height={s * 2} fill={color} translateX={0} translateY={-(s * 2)} />
    </Svg>
  );
}

export default function PixelBorder({ children, style, overrideColor }: Props): React.JSX.Element {
  const theme = useSystemStore((s) => s.currentTheme);
  const color = overrideColor ?? theme.accent;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.inner, { borderColor: color, borderWidth: 1 }]}>
        {children}
        <CornerBrackets color={color} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  inner: { position: 'relative', overflow: 'hidden' },
});
