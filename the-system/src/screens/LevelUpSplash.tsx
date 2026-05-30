import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { useSystemStore } from '../store/useSystemStore';
import { RANK_TITLES } from '../engine/xpConstants';
import type { RootStackParamList } from '../navigation/types';
import type { Rank } from '../types';

type Nav = StackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'LevelUpSplash'>;

const RANK_COLORS: Record<string, string> = {
  E: '#666666', D: '#b87333', C: '#f0a500',
  B: '#ffd700', A: '#ffe566', S: '#ffffff',
};

export default function LevelUpSplash() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { level, xpGained, rankChanged, newRank } = route.params;
  const theme = useSystemStore((s) => s.currentTheme);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const rankColor = RANK_COLORS[newRank] ?? theme.accent;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.15, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    glowLoop.start();
    return () => glowLoop.stop();
  }, [scaleAnim, fadeAnim, glowAnim]);

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.container, { backgroundColor: theme.background, opacity: fadeAnim }]}>
        {rankChanged ? (
          <>
            <Text style={[styles.rankUpLabel, { color: rankColor }]}>RANK UP!</Text>
            <Animated.Text style={[styles.rankLetter, { color: rankColor, transform: [{ scale: scaleAnim }] }]}>
              {newRank}
            </Animated.Text>
            <Text style={[styles.rankTitle, { color: theme.text }]}>
              {RANK_TITLES[newRank as Rank] ?? ''}
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.levelUpLabel, { color: rankColor }]}>LEVEL UP!</Text>
            <Animated.Text style={[styles.levelNumber, { color: theme.accent, transform: [{ scale: scaleAnim }] }]}>
              {level}
            </Animated.Text>
          </>
        )}
        <Animated.Text style={[styles.xpLabel, { color: theme.textSecondary, opacity: glowAnim }]}>
          +{xpGained} XP
        </Animated.Text>
        <TouchableOpacity style={[styles.continueButton, { borderColor: rankColor }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.continueText, { color: rankColor }]}>CONTINUE</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  container: { width: width * 0.85, padding: 40, alignItems: 'center', borderRadius: 4, borderWidth: 2, borderColor: '#333' },
  rankUpLabel: { fontSize: 14, fontWeight: 'bold', letterSpacing: 4, marginBottom: 16 },
  levelUpLabel: { fontSize: 14, fontWeight: 'bold', letterSpacing: 4, marginBottom: 16 },
  rankLetter: { fontSize: 80, fontWeight: 'bold', marginBottom: 8 },
  rankTitle: { fontSize: 14, letterSpacing: 2, marginBottom: 24 },
  levelNumber: { fontSize: 80, fontWeight: 'bold', marginBottom: 24 },
  xpLabel: { fontSize: 12, letterSpacing: 2, marginBottom: 32 },
  continueButton: { borderWidth: 2, paddingHorizontal: 32, paddingVertical: 14 },
  continueText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 3 },
});
