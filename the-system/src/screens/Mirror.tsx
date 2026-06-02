import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
} from 'react-native';
import Svg, { Polygon, Line, Rect, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSystemStore } from '../store/useSystemStore';
import { getCosmetics } from '../db/queries';
import { RANK_TITLES } from '../engine/xpConstants';
import type { Cosmetic, Rank, HeroClass as HeroClassType } from '../types';
import { STAR_LABELS } from '../types';
import AvatarDisplay from '../components/avatar/AvatarDisplay';
import SectionDivider from '../components/ui/SectionDivider';
import SystemBackground from '../components/fx/SystemBackground';
import AmbientEmbers from '../components/fx/AmbientEmbers';
import CornerFrame from '../components/ui/CornerFrame';
import { CornerBrackets } from '../components/ui/CornerBox';
import Glyph, { GlyphName } from '../components/icons/Glyph';
import type { HeroClass } from '../components/avatar/avatarData';
import { FONTS } from '../theme/typography';

type MoodState = 'radiant' | 'steady' | 'worn' | 'broken';

const STAT_DISCIPLINES: Array<{ label: string; code: string; glyph: GlyphName }> = [
  { label: 'Willpower', code: 'SILENCE', glyph: 'bolt' },
  { label: 'Strength', code: 'FORGE', glyph: 'sword' },
  { label: 'Vitality', code: 'NOURISH', glyph: 'heart' },
  { label: 'Knowledge', code: 'KNOWLEDGE', glyph: 'gem' },
];

function computeMood(rate: number): MoodState {
  if (rate >= 0.9) return 'radiant';
  if (rate >= 0.6) return 'steady';
  if (rate >= 0.3) return 'worn';
  return 'broken';
}

function StatBar({ label, glyph, completed, level, color }: {
  label: string; glyph: GlyphName; completed: boolean; level: number; color: string;
}) {
  const val = completed ? 100 : 30;
  return (
    <View style={statStyles.row}>
      <View style={statStyles.iconWrap}><Glyph name={glyph} color={color} size={16} /></View>
      <Text style={[statStyles.label, { color: '#888' }]}>{label}</Text>
      <View style={[statStyles.barBg, { backgroundColor: '#111' }]}>
        <View style={[statStyles.barFill, { width: `${val}%`, backgroundColor: color }]} />
        {/* Tick marks */}
        {[25, 50, 75].map((p) => (
          <View key={p} style={[statStyles.tick, { left: `${p}%` as `${number}%` }]} />
        ))}
      </View>
      <Text style={[statStyles.lvl, { color }]}>L{level}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  iconWrap: { width: 22, alignItems: 'center' },
  label: { fontSize: 11, letterSpacing: 0.3, width: 90, fontFamily: FONTS.body },
  barBg: { flex: 1, height: 12, overflow: 'hidden', position: 'relative' },
  barFill: { height: 12, position: 'absolute', left: 0, top: 0, bottom: 0 },
  tick: { position: 'absolute', top: 2, bottom: 2, width: 1, backgroundColor: '#000' },
  lvl: { fontSize: 12, width: 28, textAlign: 'right', fontFamily: FONTS.display },
});

function EquipSlot({ label, name, tier, color }: {
  label: string; name: string; tier: number; color: string;
}) {
  return (
    <CornerFrame color={color + '60'} size={10} thickness={1} style={equipStyles.slot}>
      <View style={equipStyles.inner}>
        <Text style={[equipStyles.slotLabel, { color: color + '80' }]}>{label}</Text>
        <Text style={[equipStyles.tier, { color }]}>T{tier}</Text>
        <Text style={[equipStyles.name, { color: '#aaa' }]} numberOfLines={2}>{name}</Text>
      </View>
    </CornerFrame>
  );
}

const equipStyles = StyleSheet.create({
  slot: { flex: 1 },
  inner: { padding: 10, alignItems: 'center', gap: 4 },
  slotLabel: { fontSize: 10, letterSpacing: 0.5, fontFamily: FONTS.body },
  tier: { fontSize: 18, fontFamily: FONTS.display },
  name: { fontSize: 11, textAlign: 'center', lineHeight: 15, fontFamily: FONTS.body },
});

export default function Mirror() {
  const insets = useSafeAreaInsets();
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
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <SystemBackground color={theme.accent} background={theme.background} />
      <AmbientEmbers color={theme.auraColor ?? theme.accent} />
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.accent + '30' }]}>
        <View style={styles.nameRow}>
          <Text style={[styles.heroName, { color: theme.text }]}>{hero.name}</Text>
          <View style={[styles.rankPill, { borderColor: theme.accent + '80', backgroundColor: theme.accent + '15' }]}>
            <CornerBrackets color={theme.accent + '80'} length={8} />
            <Text style={[styles.rankLetter, { color: theme.accent }]}>{hero.rank}</Text>
          </View>
        </View>
        <Text style={[styles.rankTitle, { color: theme.textSecondary }]}>
          {RANK_TITLES[hero.rank as Rank]} · {STAR_LABELS[hero.hero_class as HeroClassType] ?? hero.hero_class}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Avatar with decorative frame */}
        <View style={styles.avatarWrap}>
          {/* Outer decorative ring */}
          <View style={[styles.avatarRing, { borderColor: theme.accent + '30' }]}>
            <View style={[styles.avatarRingInner, { borderColor: theme.accent + '60' }]}>
              <AvatarDisplay
                heroClass={hero.hero_class as HeroClass}
                rank={hero.rank}
                mood={mood}
                weaponTier={weaponTier}
                pixelSize={5}
              />
            </View>
          </View>
          {/* Mood indicator */}
          <View style={[styles.moodBadge, { borderColor: theme.accent + '60', backgroundColor: theme.primary }]}>
            <CornerBrackets color={theme.accent + '60'} length={8} />
            <Text style={[styles.moodText, { color: theme.accent }]}>
              {mood.charAt(0).toUpperCase() + mood.slice(1)}
            </Text>
          </View>
        </View>

        {/* Equipment */}
        <SectionDivider title="Equipment" color={theme.accent} />
        <View style={styles.equipRow}>
          <EquipSlot label="Weapon" name={equippedWeapon?.name ?? 'None'} tier={equippedWeapon?.tier ?? 1} color={theme.accent} />
          <EquipSlot label="Armor" name={equippedArmor?.name ?? 'None'} tier={equippedArmor?.tier ?? 1} color={theme.accent} />
          <EquipSlot label="Crown" name={equippedCrown?.name ?? 'None'} tier={equippedCrown?.tier ?? 1} color={theme.accent} />
        </View>

        {/* Stats */}
        <SectionDivider title="Attributes" color={theme.accent} />
        <View style={styles.statsSection}>
          {STAT_DISCIPLINES.map(({ label, code, glyph }) => {
            const discipline = disciplines.find((d) => d.code === code);
            const log = todayLogs.find((l) => l.discipline_id === discipline?.id);
            const completed = log?.completed === 1;
            return (
              <StatBar
                key={code}
                label={label}
                glyph={glyph}
                completed={completed}
                level={hero.global_level}
                color={theme.accent}
              />
            );
          })}
        </View>

        {/* Titles */}
        {titles.length > 0 && (
          <>
            <SectionDivider title="Titles" color={theme.accent} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.titlesRow}>
              {titles.map((t) => (
                <View key={t.id} style={[styles.titleChip, { borderColor: theme.accent + '70', backgroundColor: theme.accent + '10' }]}>
                  <CornerBrackets color={theme.accent + '70'} length={8} />
                  <Text style={[styles.titleTxt, { color: theme.accent }]}>{t.name}</Text>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroName: { fontSize: 18, letterSpacing: 0.3, fontFamily: FONTS.display },
  rankPill: {
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    position: 'relative',
  },
  rankLetter: { fontSize: 20, fontFamily: FONTS.display },
  rankTitle: { fontSize: 11, letterSpacing: 0.5, marginTop: 4, fontFamily: FONTS.body },

  scroll: { paddingBottom: 24 },

  avatarWrap: { alignItems: 'center', paddingVertical: 20, position: 'relative' },
  avatarRing: {
    borderWidth: 2,
    borderRadius: 100,
    padding: 8,
  },
  avatarRingInner: {
    borderWidth: 1,
    borderRadius: 100,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodBadge: {
    position: 'absolute',
    bottom: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  moodText: { fontSize: 10, letterSpacing: 0.3, fontFamily: FONTS.display },

  equipRow: { flexDirection: 'row', paddingHorizontal: 14, gap: 8 },

  statsSection: { paddingHorizontal: 16 },

  titlesRow: { paddingLeft: 14 },
  titleChip: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginRight: 8,
    position: 'relative',
  },
  titleTxt: { fontSize: 12, letterSpacing: 1, fontFamily: FONTS.bold },

  bottomPad: { height: 64 },
});
