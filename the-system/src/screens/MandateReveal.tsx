import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSystemStore } from '../store/useSystemStore';
import type { RootStackParamList } from '../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

const TIER_COLORS = {
  BRONZE: '#b87333',
  SILVER: '#c0c0c0',
  GOLD: '#ffd700',
};

const LOOT_TYPE_LABELS: Record<string, string> = {
  scroll: 'SYSTEM SCROLL',
  title: 'TITLE UNLOCKED',
  accessory: 'ACCESSORY',
  cosmetic_variant: 'COSMETIC VARIANT',
  background: 'BACKGROUND UNLOCKED',
  equipment_tier: 'EQUIPMENT UPGRADE',
  aura_variant: 'AURA VARIANT',
};

export default function MandateReveal() {
  const navigation = useNavigation<Nav>();
  const { pendingMandate, openMandate, currentTheme: theme } = useSystemStore();
  const [loot, setLoot] = useState<{ type: string; name: string } | null>(null);
  const [opened, setOpened] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const lootAnim = useRef(new Animated.Value(0)).current;

  const tierColor =
    pendingMandate ? TIER_COLORS[pendingMandate.tier] ?? '#b87333' : '#b87333';

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [glowAnim]);

  const handleTapChest = async () => {
    if (opened) return;
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start(async () => {
      const result = await openMandate();
      if (result) {
        setLoot(result);
        setOpened(true);
        Animated.spring(lootAnim, { toValue: 1, useNativeDriver: true }).start();
      }
    });
  };

  const handleDismiss = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.overlay}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: tierColor }]}>
          {pendingMandate?.tier ?? 'BRONZE'} MANDATE
        </Text>

        {!opened ? (
          <>
            <Animated.View
              style={[styles.chestArea, { transform: [{ translateX: shakeAnim }], opacity: glowAnim }]}
            >
              <View style={[styles.chestPixel, { backgroundColor: tierColor }]}>
                <View style={[styles.chestLid, { backgroundColor: tierColor, borderBottomColor: theme.background }]} />
                <View style={styles.chestLock} />
              </View>
            </Animated.View>
            <Text style={[styles.tapHint, { color: theme.textSecondary }]}>TAP TO OPEN</Text>
            <TouchableOpacity style={styles.chestTouchArea} onPress={handleTapChest} />
          </>
        ) : (
          <Animated.View style={[styles.lootContainer, { opacity: lootAnim, transform: [{ scale: lootAnim }] }]}>
            <Text style={[styles.lootCategory, { color: tierColor }]}>
              {loot ? LOOT_TYPE_LABELS[loot.type] ?? loot.type.toUpperCase() : ''}
            </Text>
            <Text style={[styles.lootName, { color: theme.text }]}>{loot?.name ?? ''}</Text>
            <View style={[styles.divider, { backgroundColor: tierColor }]} />
            <TouchableOpacity style={[styles.dismissButton, { borderColor: tierColor }]} onPress={handleDismiss}>
              <Text style={[styles.dismissText, { color: tierColor }]}>MANDATE RECEIVED</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {!opened && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleDismiss}>
            <Text style={[styles.cancelText, { color: theme.textSecondary }]}>CLOSE</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center', alignItems: 'center',
  },
  container: {
    width: width * 0.85, padding: 32, alignItems: 'center',
    borderRadius: 4, borderWidth: 2, borderColor: '#333',
  },
  title: { fontSize: 14, fontWeight: 'bold', letterSpacing: 2, marginBottom: 32 },
  chestArea: { alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  chestPixel: { width: 80, height: 64, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  chestLid: { position: 'absolute', top: 0, width: 80, height: 28, borderBottomWidth: 3, borderRadius: 4 },
  chestLock: { width: 16, height: 16, backgroundColor: '#333', borderRadius: 8, marginTop: 8 },
  chestTouchArea: { position: 'absolute', width: 120, height: 120 },
  tapHint: { fontSize: 10, letterSpacing: 2, marginBottom: 8 },
  lootContainer: { alignItems: 'center', paddingVertical: 16 },
  lootCategory: { fontSize: 10, letterSpacing: 3, marginBottom: 12 },
  lootName: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  divider: { width: 60, height: 2, marginBottom: 24 },
  dismissButton: { borderWidth: 2, paddingHorizontal: 24, paddingVertical: 12 },
  dismissText: { fontSize: 11, fontWeight: 'bold', letterSpacing: 2 },
  cancelButton: { marginTop: 24, padding: 8 },
  cancelText: { fontSize: 10, letterSpacing: 1 },
});
