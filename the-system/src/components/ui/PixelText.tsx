import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

interface PixelTextProps extends TextProps {
  size?: number;
  color?: string;
}

/**
 * Text component that applies the Press Start 2P pixel font.
 * Falls back gracefully if font isn't loaded.
 */
export default function PixelText({ style, size = 12, color, children, ...props }: PixelTextProps) {
  return (
    <Text
      style={[
        styles.base,
        { fontSize: size, color: color ?? '#ffffff' },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'PressStart2P',
  },
});
