import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';

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
  const cc = cornerColor ?? color;
  const corner = { position: 'absolute' as const, width: cornerLength, height: cornerLength, borderColor: cc };
  return (
    <View
      style={[
        { borderWidth, borderColor: color, position: 'relative', overflow: 'visible' },
        radius != null && { borderRadius: radius },
        fill != null && { backgroundColor: fill },
        style,
      ]}
    >
      <View style={[corner, { top: -borderWidth, left: -borderWidth, borderTopWidth: cornerThickness, borderLeftWidth: cornerThickness }]} />
      <View style={[corner, { top: -borderWidth, right: -borderWidth, borderTopWidth: cornerThickness, borderRightWidth: cornerThickness }]} />
      <View style={[corner, { bottom: -borderWidth, left: -borderWidth, borderBottomWidth: cornerThickness, borderLeftWidth: cornerThickness }]} />
      <View style={[corner, { bottom: -borderWidth, right: -borderWidth, borderBottomWidth: cornerThickness, borderRightWidth: cornerThickness }]} />
      {children}
    </View>
  );
}
