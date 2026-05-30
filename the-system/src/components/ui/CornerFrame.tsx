import React from 'react';
import { View } from 'react-native';

interface Props {
  color: string;
  size?: number;
  thickness?: number;
  children?: React.ReactNode;
  style?: object;
}

export default function CornerFrame({ color, size = 14, thickness = 2, children, style }: Props) {
  const c = { width: size, height: size, borderColor: color, position: 'absolute' as const };
  return (
    <View style={[{ position: 'relative' }, style]}>
      <View style={[c, { top: 0, left: 0, borderTopWidth: thickness, borderLeftWidth: thickness }]} />
      <View style={[c, { top: 0, right: 0, borderTopWidth: thickness, borderRightWidth: thickness }]} />
      <View style={[c, { bottom: 0, left: 0, borderBottomWidth: thickness, borderLeftWidth: thickness }]} />
      <View style={[c, { bottom: 0, right: 0, borderBottomWidth: thickness, borderRightWidth: thickness }]} />
      {children}
    </View>
  );
}
