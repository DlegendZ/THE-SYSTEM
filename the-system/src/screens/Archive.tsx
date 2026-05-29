import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSystemStore } from '../store/useSystemStore';

export default function Archive() {
  const theme = useSystemStore((s) => s.currentTheme);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>THE ARCHIVE</Text>
      <Text style={[styles.sub, { color: theme.textSecondary }]}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16, fontWeight: 'bold' },
  sub: { fontSize: 12, marginTop: 8 },
});
