import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSystemStore } from '../store/useSystemStore';
import { RANK_TITLES } from '../engine/xpConstants';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import XPBar from '../components/ui/XPBar';
import DisciplineCard from '../components/ui/DisciplineCard';
import DisciplineIcon from '../components/icons/DisciplineIcon';
import AvatarDisplay from '../components/avatar/AvatarDisplay';
import AuraParticles from '../components/particles/AuraParticles';
import MandateChest from '../components/ui/MandateChest';
import type { Rank } from '../types';
import type { HeroClass } from '../components/avatar/avatarData';

export default function CommandHall() {
  const {
    hero,
    disciplines,
    todayLogs,
    silenceStreak,
    currentTheme: theme,
    pendingMandate,
    completeDiscipline,
    failDiscipline,
    triggerRelapse,
  } = useSystemStore();

  if (!hero) return null;

  const daysElapsed = differenceInCalendarDays(new Date(), parseISO(hero.journey_start_date));
  const dayNumber = Math.min(daysElapsed + 1, 180);
  const activeDisciplines = disciplines.filter((d) => d.is_active);

  const completedToday = todayLogs.filter((l) => l.completed === 1).length;
  const totalToday = activeDisciplines.length;
  const completionRate = totalToday > 0 ? completedToday / totalToday : 0;
  const mood: 'radiant' | 'steady' | 'worn' | 'broken' =
    completionRate >= 0.9 ? 'radiant' :
    completionRate >= 0.6 ? 'steady' :
    completionRate >= 0.3 ? 'worn' : 'broken';

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
          { text: 'I HAVE FALLEN', style: 'destructive', onPress: () => triggerRelapse() },
        ]
      );
    } else {
      failDiscipline(id);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={[styles.rankBadge, { borderColor: theme.accent }]}>
          <Text style={[styles.rankText, { color: theme.accent }]}>{hero.rank}</Text>
        </View>
        <Text style={[styles.dayText, { color: theme.text }]}>DAY {dayNumber} OF 180</Text>
      </View>

      {/* Avatar section */}
      <View style={styles.avatarSection}>
        {theme.particleCount > 0 && (
          <AuraParticles
            particleType={theme.particleType}
            particleCount={Math.min(theme.particleCount, 20)}
            auraColor={theme.auraColor}
            width={300}
            height={160}
          />
        )}
        <AvatarDisplay
          heroClass={hero.hero_class as HeroClass}
          rank={hero.rank as Rank}
          mood={mood}
        />
        <Text style={[styles.titleText, { color: theme.textSecondary }]}>
          {RANK_TITLES[hero.rank as Rank]}
        </Text>
      </View>

      {/* Mandate chest if pending */}
      {pendingMandate && (
        <View style={styles.mandateContainer}>
          <MandateChest tier={pendingMandate.tier} size={48} />
          <Text style={[styles.mandateText, { color: theme.accent }]}>MANDATE AWAITS</Text>
        </View>
      )}

      {/* XP Bar */}
      <XPBar />

      {/* Silence streak */}
      {silenceStreak && (
        <View style={styles.streakSection}>
          <Text style={[styles.streakNumber, { color: theme.accent }]}>
            {silenceStreak.current_streak}
          </Text>
          <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>DAYS OF SILENCE</Text>
        </View>
      )}

      {/* Quest Log */}
      <ScrollView style={styles.questLog}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>DAILY QUEST LOG</Text>
        {activeDisciplines.map((discipline) => {
          const log = todayLogs.find((l) => l.discipline_id === discipline.id);
          return (
            <View key={discipline.id} style={styles.cardRow}>
              <View style={styles.iconWrapper}>
                <DisciplineIcon code={discipline.code} size={2} />
              </View>
              <View style={styles.cardFlex}>
                <DisciplineCard
                  discipline={discipline}
                  log={log}
                  theme={theme}
                  onComplete={() => handleComplete(discipline.id)}
                  onFail={() => handleFail(discipline.id, discipline.code)}
                />
              </View>
            </View>
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
    marginBottom: 8,
  },
  rankBadge: { borderWidth: 2, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 4 },
  rankText: { fontSize: 18, fontWeight: 'bold' },
  dayText: { fontSize: 12 },
  avatarSection: { alignItems: 'center', paddingVertical: 16, height: 160, justifyContent: 'center' },
  titleText: { fontSize: 11, marginTop: 4 },
  mandateContainer: { alignItems: 'center', marginVertical: 4 },
  mandateText: { fontSize: 10, marginTop: 4, letterSpacing: 2 },
  streakSection: { alignItems: 'center', marginVertical: 4 },
  streakNumber: { fontSize: 36, fontWeight: 'bold' },
  streakLabel: { fontSize: 10, marginTop: 2 },
  questLog: { flex: 1, marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', paddingHorizontal: 16, marginBottom: 8 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: { paddingLeft: 8, paddingRight: 4 },
  cardFlex: { flex: 1 },
});
