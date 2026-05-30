import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSystemStore } from '../store/useSystemStore';
import { RANK_TITLES } from '../engine/xpConstants';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import XPBar from '../components/ui/XPBar';
import DisciplineCard from '../components/ui/DisciplineCard';
import type { Rank } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

export default function CommandHall() {
  const navigation = useNavigation<Nav>();
  const {
    hero,
    disciplines,
    todayLogs,
    silenceStreak,
    pendingMandate,
    currentTheme: theme,
    completeDiscipline,
    failDiscipline,
    triggerRelapse,
  } = useSystemStore();

  const floatAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!pendingMandate) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 900, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pendingMandate, floatAnim]);

  if (!hero) return null;

  const daysElapsed = differenceInCalendarDays(new Date(), parseISO(hero.journey_start_date));
  const dayNumber = Math.min(daysElapsed + 1, 180);
  const activeDisciplines = disciplines.filter((d) => d.is_active);

  const handleComplete = async (id: number) => {
    const result = await completeDiscipline(id);
    if (result.levelUp) {
      navigation.navigate('LevelUpSplash', {
        level: result.levelUp.newLevel,
        xpGained: result.xpGained,
        rankChanged: result.levelUp.rankChanged,
        newRank: result.levelUp.newRank,
      });
    }
  };

  const handleFail = (id: number, code: string) => {
    if (code === 'SILENCE') {
      Alert.alert(
        'SILENCE PROTOCOL BROKEN',
        'This will reset ALL progress. XP to 0. Level to 1. Rank to E. All streaks reset. There is no undo.',
        [
          { text: 'CANCEL', style: 'cancel' },
          { text: 'I HAVE FALLEN', style: 'destructive', onPress: () => triggerRelapse() },
        ]
      );
    } else {
      failDiscipline(id);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={[styles.rankBadge, { borderColor: theme.accent }]}>
          <Text style={[styles.rankText, { color: theme.accent }]}>{hero.rank}</Text>
        </View>
        <Text style={[styles.dayText, { color: theme.text }]}>DAY {dayNumber} OF 180</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsBtn}>
          <Text style={[styles.settingsIcon, { color: theme.textSecondary }]}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar area */}
      <View style={styles.avatarArea}>
        <View style={styles.avatarPlaceholder}>
          <Text style={[styles.avatarText, { color: theme.accent }]}>
            {hero.hero_class.toUpperCase()}
          </Text>
          <Text style={[styles.titleText, { color: theme.textSecondary }]}>
            {RANK_TITLES[hero.rank as Rank]}
          </Text>
        </View>

        {pendingMandate && (
          <Animated.View style={[styles.chestFloat, { transform: [{ translateY: floatAnim }] }]}>
            <TouchableOpacity onPress={() => navigation.navigate('MandateReveal')}>
              <View style={[styles.chestBadge, { borderColor: theme.accent, backgroundColor: theme.accent + '30' }]}>
                <Text style={{ fontSize: 24 }}>📦</Text>
                <Text style={[styles.chestLabel, { color: theme.accent }]}>{pendingMandate.tier}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      <XPBar />

      {silenceStreak && (
        <View style={styles.streakSection}>
          <Text style={[styles.streakNumber, { color: theme.accent }]}>{silenceStreak.current_streak}</Text>
          <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>DAYS OF SILENCE</Text>
        </View>
      )}

      <ScrollView style={styles.questLog}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>DAILY QUEST LOG</Text>
        {activeDisciplines.map((discipline) => {
          const log = todayLogs.find((l) => l.discipline_id === discipline.id);
          return (
            <DisciplineCard
              key={discipline.id}
              discipline={discipline}
              log={log}
              theme={theme}
              onComplete={() => handleComplete(discipline.id)}
              onFail={() => handleFail(discipline.id, discipline.code)}
            />
          );
        })}
        {/* Shield Protocol Button */}
        <TouchableOpacity
          style={[styles.shieldButton, { backgroundColor: '#1a0000', borderColor: '#ff4444' }]}
          onPress={() => navigation.navigate('ShieldOverlay')}
        >
          <Text style={styles.shieldButtonText}>🛡 SHIELD PROTOCOL</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 48 },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 16,
  },
  rankBadge: { borderWidth: 2, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 4 },
  rankText: { fontSize: 18, fontWeight: 'bold' },
  dayText: { fontSize: 12 },
  settingsBtn: { padding: 8 },
  settingsIcon: { fontSize: 20 },
  avatarArea: { alignItems: 'center', paddingVertical: 16 },
  avatarPlaceholder: { alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold' },
  titleText: { fontSize: 12, marginTop: 4 },
  chestFloat: { position: 'absolute', right: 32, top: 0 },
  chestBadge: { borderWidth: 2, borderRadius: 8, padding: 8, alignItems: 'center' },
  chestLabel: { fontSize: 9, fontWeight: 'bold', marginTop: 2 },
  streakSection: { alignItems: 'center', marginVertical: 8 },
  streakNumber: { fontSize: 36, fontWeight: 'bold' },
  streakLabel: { fontSize: 10, marginTop: 2 },
  questLog: { flex: 1, marginTop: 8 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', paddingHorizontal: 16, marginBottom: 8 },
  shieldButton: { margin: 16, marginBottom: 8, padding: 16, borderWidth: 2, alignItems: 'center' },
  shieldButtonText: { color: '#ff4444', fontSize: 13, fontWeight: 'bold', letterSpacing: 2 },
});
