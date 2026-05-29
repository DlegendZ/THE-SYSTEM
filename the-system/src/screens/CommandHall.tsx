import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSystemStore } from '../store/useSystemStore';
import { RANK_TITLES } from '../engine/xpConstants';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import XPBar from '../components/ui/XPBar';
import DisciplineCard from '../components/ui/DisciplineCard';
import type { Rank } from '../types';

export default function CommandHall() {
  const {
    hero,
    disciplines,
    todayLogs,
    silenceStreak,
    currentTheme: theme,
    completeDiscipline,
    failDiscipline,
    triggerRelapse,
  } = useSystemStore();

  if (!hero) return null;

  const daysElapsed = differenceInCalendarDays(
    new Date(),
    parseISO(hero.journey_start_date)
  );
  const dayNumber = Math.min(daysElapsed + 1, 180);

  const activeDisciplines = disciplines.filter((d) => d.is_active);

  const handleComplete = async (id: number) => {
    const result = await completeDiscipline(id);
    if (result.levelUp?.rankChanged) {
      Alert.alert('RANK UP', `You have ascended to ${result.levelUp.newRank}-Rank!`);
    } else if (result.levelUp) {
      Alert.alert('LEVEL UP', `Level ${result.levelUp.newLevel} reached!`);
    }
  };

  const handleFail = (id: number, code: string) => {
    if (code === 'SILENCE') {
      Alert.alert(
        'SILENCE PROTOCOL BROKEN',
        'This will reset ALL progress. XP to 0. Level to 1. Rank to E. All streaks reset. There is no undo.',
        [
          { text: 'CANCEL', style: 'cancel' },
          {
            text: 'I HAVE FALLEN',
            style: 'destructive',
            onPress: () => triggerRelapse(),
          },
        ]
      );
    } else {
      failDiscipline(id);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <View style={[styles.rankBadge, { borderColor: theme.accent }]}>
          <Text style={[styles.rankText, { color: theme.accent }]}>{hero.rank}</Text>
        </View>
        <Text style={[styles.dayText, { color: theme.text }]}>
          DAY {dayNumber} OF 180
        </Text>
      </View>

      <View style={styles.avatarPlaceholder}>
        <Text style={[styles.avatarText, { color: theme.accent }]}>
          {hero.hero_class.toUpperCase()}
        </Text>
        <Text style={[styles.titleText, { color: theme.textSecondary }]}>
          {RANK_TITLES[hero.rank as Rank]}
        </Text>
      </View>

      <XPBar />

      {silenceStreak && (
        <View style={styles.streakSection}>
          <Text style={[styles.streakNumber, { color: theme.accent }]}>
            {silenceStreak.current_streak}
          </Text>
          <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>
            DAYS OF SILENCE
          </Text>
        </View>
      )}

      <ScrollView style={styles.questLog}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          DAILY QUEST LOG
        </Text>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 48 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  rankBadge: {
    borderWidth: 2,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  rankText: { fontSize: 18, fontWeight: 'bold' },
  dayText: { fontSize: 12 },
  avatarPlaceholder: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarText: { fontSize: 20, fontWeight: 'bold' },
  titleText: { fontSize: 12, marginTop: 4 },
  streakSection: { alignItems: 'center', marginVertical: 8 },
  streakNumber: { fontSize: 36, fontWeight: 'bold' },
  streakLabel: { fontSize: 10, marginTop: 2 },
  questLog: { flex: 1, marginTop: 8 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
});
