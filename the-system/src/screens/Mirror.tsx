import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useSystemStore } from '../store/useSystemStore';
import { getCosmetics } from '../db/queries';
import { RANK_TITLES } from '../engine/xpConstants';
import type { Cosmetic, Rank } from '../types';
import AvatarDisplay from '../components/avatar/AvatarDisplay';
import type { HeroClass } from '../components/avatar/avatarData';

type MoodState = 'radiant' | 'steady' | 'worn' | 'broken';

const STAT_DISCIPLINES: Array<{ label: string; code: string }> = [
  { label: 'WILLPOWER', code: 'SILENCE' },
  { label: 'STRENGTH', code: 'FORGE' },
  { label: 'VITALITY', code: 'NOURISH' },
  { label: 'KNOWLEDGE', code: 'KNOWLEDGE' },
];

function computeMood(recentCompletionRate: number): MoodState {
  if (recentCompletionRate >= 0.9) return 'radiant';
  if (recentCompletionRate >= 0.6) return 'steady';
  if (recentCompletionRate >= 0.3) return 'worn';
  return 'broken';
}

export default function Mirror() {
  const { hero, todayLogs, disciplines, currentTheme: theme } = useSystemStore();
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>([]);

  useEffect(() => {
    getCosmetics().then(setCosmetics);
  }, []);

  if (!hero) return null;

  const equippedWeapon = cosmetics.find((c) => c.type === 'weapon' && c.equipped);
  const equippedArmor = cosmetics.find((c) => c.type === 'armor' && c.equipped);
  const equippedCrown = cosmetics.find((c) => c.type === 'crown' && c.equipped);
  const weaponTier = (equippedWeapon?.tier ?? 1) as 1 | 2 | 3 | 4 | 5;

  const completedToday = todayLogs.filter((l) => l.completed).length;
  const activeDisciplines = disciplines.filter((d) => d.is_active).length;
  const completionRate = activeDisciplines > 0 ? completedToday / activeDisciplines : 0;
  const mood = computeMood(completionRate);

  const titles = cosmetics.filter((c) => c.type === 'title' && c.unlocked);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={[styles.heroName, { color: theme.text }]}>{hero.name}</Text>
          <View style={[styles.rankBadge, { borderColor: theme.accent }]}>
            <Text style={[styles.rankText, { color: theme.accent }]}>{hero.rank}</Text>
          </View>
        </View>
        <Text style={[styles.rankTitle, { color: theme.textSecondary }]}>
          {RANK_TITLES[hero.rank as Rank]}
        </Text>

        <View style={styles.avatarArea}>
          <AvatarDisplay
            heroClass={hero.hero_class as HeroClass}
            rank={hero.rank}
            mood={mood}
            weaponTier={weaponTier}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>EQUIPMENT</Text>
        <View style={styles.equipRow}>
          {[
            { label: 'WEAPON', item: equippedWeapon, tier: equippedWeapon?.tier ?? 1 },
            { label: 'ARMOR', item: equippedArmor, tier: equippedArmor?.tier ?? 1 },
            { label: 'CROWN', item: equippedCrown, tier: equippedCrown?.tier ?? 1 },
          ].map(({ label, item, tier }) => (
            <View key={label} style={[styles.equipSlot, { borderColor: theme.accent }]}>
              <Text style={[styles.equipLabel, { color: theme.textSecondary }]}>{label}</Text>
              <Text style={[styles.equipTier, { color: theme.accent }]}>T{tier}</Text>
              <Text style={[styles.equipName, { color: theme.text }]} numberOfLines={2}>
                {item?.name ?? 'None'}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>STATS</Text>
        {STAT_DISCIPLINES.map(({ label, code }) => {
          const discipline = disciplines.find((d) => d.code === code);
          const log = todayLogs.find((l) => l.discipline_id === discipline?.id);
          const completed = log?.completed === 1;
          return (
            <View key={code} style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
              <View style={[styles.statBarBg, { backgroundColor: '#333' }]}>
                <View
                  style={[styles.statBarFill, { width: completed ? '100%' : '30%', backgroundColor: theme.accent }]}
                />
              </View>
              <Text style={[styles.statValue, { color: theme.accent }]}>Lv.{hero.global_level}</Text>
            </View>
          );
        })}

        {titles.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>TITLES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {titles.map((t) => (
                <View key={t.id} style={[styles.titleChip, { borderColor: theme.accent }]}>
                  <Text style={[styles.titleText, { color: theme.accent }]}>{t.name}</Text>
                </View>
              ))}
            </ScrollView>
          </>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 48 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  heroName: { fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  rankBadge: { borderWidth: 2, paddingHorizontal: 10, paddingVertical: 2 },
  rankText: { fontSize: 16, fontWeight: 'bold' },
  rankTitle: { fontSize: 10, paddingHorizontal: 16, marginTop: 2, marginBottom: 16, letterSpacing: 2 },
  avatarArea: { alignItems: 'center', marginVertical: 24 },
  sectionLabel: { fontSize: 10, letterSpacing: 3, fontWeight: 'bold', paddingHorizontal: 16, marginBottom: 8, marginTop: 16 },
  equipRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  equipSlot: { flex: 1, borderWidth: 1, padding: 8, alignItems: 'center', minHeight: 80 },
  equipLabel: { fontSize: 9, letterSpacing: 1, marginBottom: 4 },
  equipTier: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  equipName: { fontSize: 9, textAlign: 'center' },
  statRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  statLabel: { fontSize: 10, width: 90 },
  statBarBg: { height: 8, borderRadius: 1, overflow: 'hidden', flex: 1 },
  statBarFill: { height: 8 },
  statValue: { fontSize: 10, marginLeft: 8, width: 40 },
  titleChip: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4, marginLeft: 16, marginRight: 4 },
  titleText: { fontSize: 10 },
  bottomPadding: { height: 64 },
});
