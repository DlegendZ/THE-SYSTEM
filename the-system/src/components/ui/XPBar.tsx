import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSystemStore } from '../../store/useSystemStore';
import { getXpForLevel, XP_TABLE } from '../../engine/xpConstants';

export default function XPBar() {
  const hero = useSystemStore((s) => s.hero);
  const theme = useSystemStore((s) => s.currentTheme);

  if (!hero) return null;

  const currentXP = hero.global_xp;
  const currentLevelXP = XP_TABLE[hero.global_level] ?? 0;
  const nextLevelXP = getXpForLevel(hero.global_level + 1);

  let progress = 1;
  let xpText = 'MAX LEVEL';
  if (nextLevelXP !== null) {
    const range = nextLevelXP - currentLevelXP;
    const earned = currentXP - currentLevelXP;
    progress = range > 0 ? Math.min(1, Math.max(0, earned / range)) : 0;
    xpText = `${currentXP} / ${nextLevelXP} XP`;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.barBg, { borderColor: theme.accent }]}>
        <View
          style={[
            styles.barFill,
            { width: `${progress * 100}%`, backgroundColor: theme.accent },
          ]}
        />
      </View>
      <Text style={[styles.text, { color: theme.text }]}>
        LVL {hero.global_level} — {xpText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginVertical: 8 },
  barBg: {
    height: 16,
    borderWidth: 2,
    borderRadius: 2,
    backgroundColor: '#111',
    overflow: 'hidden',
  },
  barFill: { height: '100%' },
  text: { fontSize: 10, textAlign: 'center', marginTop: 4 },
});
