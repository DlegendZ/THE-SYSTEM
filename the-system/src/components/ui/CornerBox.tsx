import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

export function CornerBrackets({
  color, thickness = 2, length = 14, inset = 0, style,
}: { color: string; thickness?: number; length?: number; inset?: number; style?: StyleProp<ViewStyle> }) {
  const c = { position: 'absolute' as const, width: length, height: length, borderColor: color };
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <View style={[c, { top: inset, left: inset, borderTopWidth: thickness, borderLeftWidth: thickness }]} />
      <View style={[c, { top: inset, right: inset, borderTopWidth: thickness, borderRightWidth: thickness }]} />
      <View style={[c, { bottom: inset, left: inset, borderBottomWidth: thickness, borderLeftWidth: thickness }]} />
      <View style={[c, { bottom: inset, right: inset, borderBottomWidth: thickness, borderRightWidth: thickness }]} />
    </View>
  );
}

interface Props {
  /** Edge + corner color (corner overridable via cornerColor). */
  color: string;
  /** Thin full-edge border width. */
  borderWidth?: number;
  /** Thicker corner bracket stroke. */
  cornerThickness?: number;
  /** Length of each corner bracket leg. */
  cornerLength?: number;
  cornerColor?: string;
  radius?: number;
  /** Background fill. */
  fill?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Bordered box with a thin full border on all edges plus four thicker corner
 * brackets, so the corners read heavier than the edges — the app-wide
 * "cap-corner" frame (CommandHall rank badge / shield panel style).
 */
export default function CornerBox({
  color,
  borderWidth = 1,
  cornerThickness = 2,
  cornerLength = 14,
  cornerColor,
  radius,
  fill,
  style,
  children,
}: Props) {
  return (
    <View
      style={[
        { borderWidth, borderColor: color, position: 'relative', overflow: 'visible' },
        radius != null && { borderRadius: radius },
        fill != null && { backgroundColor: fill },
        style,
      ]}
    >
      <CornerBrackets color={cornerColor ?? color} thickness={cornerThickness} length={cornerLength} inset={-borderWidth} />
      {children}
    </View>
  );
}
