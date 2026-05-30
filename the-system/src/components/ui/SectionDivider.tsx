import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

interface Props {
  title: string;
  color: string;
  style?: object;
}

export default function SectionDivider({ title, color, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <View style={[styles.line, { backgroundColor: color + '50' }]} />
      <Svg width={8} height={8} style={styles.gem}>
        <Polygon points="4,0 8,4 4,8 0,4" fill={color} />
      </Svg>
      <Text style={[styles.label, { color }]}>{title}</Text>
      <Svg width={8} height={8} style={styles.gem}>
        <Polygon points="4,0 8,4 4,8 0,4" fill={color} />
      </Svg>
      <View style={[styles.line, { backgroundColor: color + '50' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginVertical: 12 },
  line: { flex: 1, height: 1 },
  gem: { marginHorizontal: 6 },
  label: { fontSize: 11, fontWeight: 'bold', letterSpacing: 3 },
});
