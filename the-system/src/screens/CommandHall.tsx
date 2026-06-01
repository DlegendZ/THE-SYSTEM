import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Alert, Dimensions,
} from 'react-native';
import Svg, { Polygon, Line, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UsageStatsModule from '../native/UsageStatsModule';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSystemStore } from '../store/useSystemStore';
import { RANK_TITLES } from '../engine/xpConstants';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import XPBar from '../components/ui/XPBar';
import DisciplineCard from '../components/ui/DisciplineCard';
import PixelText from '../components/ui/PixelText';
import SectionDivider from '../components/ui/SectionDivider';
import AvatarDisplay from '../components/avatar/AvatarDisplay';
import AvatarOrbit from '../components/avatar/AvatarOrbit';
import SystemBackground from '../components/fx/SystemBackground';
import { getRandomQuote } from '../data/quotes';
import { FONTS } from '../theme/typography';

const ORBIT_BY_RANK: Record<string, number> = { E: 0, D: 2, C: 3, B: 5, A: 7, S: 10 };
import type { Rank } from '../types';
import type { RootStackParamList } from '../navigation/types';
import type { HeroClass } from '../components/avatar/avatarData';

type Nav = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

function SettingsIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Polygon points="11,2 13,7 18,7 14,10 16,16 11,13 6,16 8,10 4,7 9,7" fill="none" stroke={color} strokeWidth="1.5" />
      <Polygon points="11,8 12,10.5 11,13 10,10.5" fill={color} />
    </Svg>
  );
}

function HexagonFrame({ color, size = 80 }: { color: string; size?: number }) {
  const s = size;
  const cx = s / 2;
  const r = s / 2 - 2;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + r * Math.cos(a)},${(s / 2) + r * Math.sin(a)}`;
  }).join(' ');
  return (
    <Svg width={s} height={s} style={{ position: 'absolute' }}>
      <Polygon points={pts} fill="none" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

function RankBadge({ rank, color }: { rank: string; color: string }) {
  return (
    <View style={[styles.rankBadgeOuter, { borderColor: color + '80' }]}>
      <View style={[styles.rankBadgeInner, { backgroundColor: color + '15' }]}>
        <PixelText size={20} color={color}>{rank}</PixelText>
      </View>
      {/* Corner ticks */}
      <View style={[styles.rankCorner, { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2, borderColor: color }]} />
      <View style={[styles.rankCorner, { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2, borderColor: color }]} />
      <View style={[styles.rankCorner, { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: color }]} />
      <View style={[styles.rankCorner, { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2, borderColor: color }]} />
    </View>
  );
}

function PresenceWidget({ theme }: { theme: any }) {
  const [minutes, setMinutes] = React.useState<number>(-1);
  React.useEffect(() => {
    const fetch = async () => {
      const mins = await UsageStatsModule.getScrollingTimeToday();
      setMinutes(mins);
    };
    fetch();
    const id = setInterval(fetch, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  if (minutes < 0) return null;
  return <PresenceBar minutes={minutes} theme={theme} />;
}

function PresenceBar({ minutes, theme }: { minutes: number; theme: any }) {
  const limit = 30;
  const pct = Math.min(minutes / limit, 1);
  const overLimit = minutes > limit;
  const barColor = overLimit ? '#f44336' : '#4caf50';
  return (
    <View style={styles.presenceWrap}>
      <View style={styles.presenceRow}>
        <Text style={[styles.presenceLabel, { color: theme.textSecondary }]}>Screen time</Text>
        <Text style={[styles.presenceTime, { color: barColor }]}>
          {Math.round(minutes)}m {overLimit ? '▲ EXCEEDED' : '✓ OK'}
        </Text>
      </View>
      <View style={[styles.presenceBg, { backgroundColor: '#2A2725' }]}>
        <View style={[styles.presenceFill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
        <View style={[styles.presenceLimit, { left: '100%', backgroundColor: theme.textSecondary + '40' }]} />
      </View>
    </View>
  );
}

export default function CommandHall() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const {
    hero, disciplines, todayLogs, silenceStreak, pendingMandate, currentTheme: theme,
    completeDiscipline, failDiscipline, triggerRelapse,
  } = useSystemStore();

  const floatAnim = React.useRef(new Animated.Value(0)).current;
  const glowAnim = React.useRef(new Animated.Value(0.4)).current;
  const avatarFloat = React.useRef(new Animated.Value(0)).current;

  // Reroll on every mount (i.e. each time the app lands on home).
  const quote = React.useRef(getRandomQuote()).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(avatarFloat, { toValue: -6, duration: 1600, useNativeDriver: true }),
        Animated.timing(avatarFloat, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [avatarFloat]);

  React.useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
      ])
    );
    glowLoop.start();
    return () => glowLoop.stop();
  }, [glowAnim]);

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

  const completedToday = todayLogs.filter((l) => l.completed).length;
  const completionRate = activeDisciplines.length > 0 ? completedToday / activeDisciplines.length : 0;
  const mood = completionRate >= 0.9 ? 'radiant' : completionRate >= 0.6 ? 'steady' : completionRate >= 0.3 ? 'worn' : 'broken';

  const handleComplete = async (id: number) => {
    const result = await completeDiscipline(id);
    if (result.levelUp) {
      if (result.levelUp.rankChanged && result.levelUp.newRank === 'S') {
        navigation.navigate('LevelUpSplash', {
          level: result.levelUp.newLevel,
          xpGained: result.xpGained,
          rankChanged: result.levelUp.rankChanged,
          newRank: result.levelUp.newRank,
        });
      } else {
        navigation.navigate('LevelUpSplash', {
          level: result.levelUp.newLevel,
          xpGained: result.xpGained,
          rankChanged: result.levelUp.rankChanged,
          newRank: result.levelUp.newRank,
        });
      }
    }
  };

  const handleFail = async (id: number, code: string) => {
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
      await failDiscipline(id);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <SystemBackground color={theme.accent} background={theme.background} />

      {/* ── TOP HUD BAR ── */}
      <View style={[styles.hudBar, { borderBottomColor: theme.accent + '30' }]}>
        <RankBadge rank={hero.rank} color={theme.accent} />

        <View style={styles.hudCenter}>
          <PixelText size={10} color={theme.textSecondary}>
            {hero.name}
          </PixelText>
          <View style={styles.dayRow}>
            <View style={[styles.dayDot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.dayText, { color: theme.accent }]}>Day {dayNumber}</Text>
            <Text style={[styles.dayOf, { color: theme.textSecondary }]}> / 180</Text>
          </View>
          <Text style={[styles.rankTitle, { color: theme.textSecondary }]}>
            {RANK_TITLES[hero.rank as Rank]}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.settingsBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <SettingsIcon color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── DAILY QUOTE (rerolls each open) ── */}
      <View style={[styles.quoteBox, { borderLeftColor: theme.accent }]}>
        <Text style={[styles.quoteText, { color: theme.text }]}>
          “{quote.text}”
        </Text>
        {quote.author && (
          <Text style={[styles.quoteAuthor, { color: theme.accent }]}>
            — {quote.author}
          </Text>
        )}
      </View>

      {/* ── AVATAR AREA ── */}
      <View style={styles.avatarSection}>
        {/* Avatar frame */}
        <View style={styles.avatarFrame}>
          {/* Rank aura glow — intensifies with screenGlow ranks */}
          <Animated.View
            style={[
              styles.avatarGlow,
              {
                backgroundColor: (theme.auraColor ?? theme.accent) + '22',
                shadowColor: theme.auraColor ?? theme.accent,
                shadowRadius: theme.screenGlow ? 34 : 18,
                opacity: glowAnim.interpolate({
                  inputRange: [0.4, 1],
                  outputRange: [0.35, 0.85],
                }),
              },
            ]}
          />
          <AvatarOrbit
            color={theme.auraColor ?? theme.accent}
            count={ORBIT_BY_RANK[hero.rank] ?? 0}
            radius={54}
          />
          <HexagonFrame color={theme.accent + '55'} size={132} />
          <Animated.View
            style={{ opacity: glowAnim, transform: [{ translateY: avatarFloat }] }}
          >
            <AvatarDisplay
              heroClass={hero.hero_class as HeroClass}
              rank={hero.rank}
              mood={mood}
              pixelSize={6}
            />
          </Animated.View>
        </View>

        {/* Silence streak */}
        {silenceStreak && silenceStreak.current_streak > 0 && (
          <View style={styles.streakBox}>
            <PixelText size={32} color={theme.accent}>{String(silenceStreak.current_streak)}</PixelText>
            <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>Days clean</Text>
          </View>
        )}

        {/* Mandate chest */}
        {pendingMandate && (
          <Animated.View style={[styles.chestFloat, { transform: [{ translateY: floatAnim }] }]}>
            <TouchableOpacity
              onPress={() => navigation.navigate('MandateReveal')}
              style={[styles.chestBtn, { borderColor: theme.accent, backgroundColor: theme.accent + '20' }]}
            >
              <Text style={{ fontSize: 28 }}>📦</Text>
              <Text style={[styles.chestTier, { color: theme.accent }]}>{pendingMandate.tier}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* ── XP BAR ── */}
      <XPBar />

      {/* ── Presence ── */}
      <PresenceWidget theme={theme} />

      {/* ── QUEST LOG ── */}
      <SectionDivider
        title="Daily objectives"
        color={theme.accent}
        style={styles.sectionDivider}
      />

      <View style={styles.questProgress}>
        <Text style={[styles.questCount, { color: theme.textSecondary }]}>
          {completedToday}/{activeDisciplines.length} complete
        </Text>
        <View style={[styles.questProgressBar, { backgroundColor: '#2A2725' }]}>
          <View
            style={[
              styles.questProgressFill,
              { width: `${completionRate * 100}%`, backgroundColor: theme.accent },
            ]}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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

        {/* Shield Protocol */}
        <View style={styles.shieldSection}>
          <TouchableOpacity
            style={styles.shieldBtn}
            onPress={() => navigation.navigate('ShieldOverlay')}
            activeOpacity={0.8}
          >
            <View style={[styles.shieldInner, { borderColor: '#ff4444', backgroundColor: '#1a0000' }]}>
              <View style={[styles.shieldCorner, { top: 0, left: 0, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: '#ff4444' }]} />
              <View style={[styles.shieldCorner, { top: 0, right: 0, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: '#ff4444' }]} />
              <View style={[styles.shieldCorner, { bottom: 0, left: 0, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderColor: '#ff4444' }]} />
              <View style={[styles.shieldCorner, { bottom: 0, right: 0, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: '#ff4444' }]} />
              <Text style={styles.shieldText}>🛡 Shield protocol</Text>
              <Text style={styles.shieldSub}>Engage digital fortress</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // HUD Bar
  hudBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  quoteBox: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingLeft: 12,
    paddingVertical: 4,
    borderLeftWidth: 2,
  },
  quoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
    letterSpacing: 0.3,
  },
  quoteAuthor: {
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 1,
    textAlign: 'right',
  },
  rankBadgeOuter: {
    borderWidth: 1,
    padding: 2,
    position: 'relative',
  },
  rankBadgeInner: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
  },
  rankCorner: {
    position: 'absolute',
    width: 7,
    height: 7,
  },
  hudCenter: {
    flex: 1,
    alignItems: 'center',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dayText: {
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  dayOf: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  rankTitle: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  settingsBtn: { padding: 4 },

  // Avatar
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 16,
  },
  avatarFrame: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    elevation: 8,
  },
  streakBox: {
    flex: 1,
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  chestFloat: {
    alignItems: 'center',
  },
  chestBtn: {
    borderWidth: 1.5,
    borderRadius: 4,
    padding: 8,
    alignItems: 'center',
  },
  chestTier: {
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 2,
    letterSpacing: 1,
  },

  // Presence
  presenceWrap: {
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  presenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  presenceLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  presenceTime: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  presenceBg: {
    height: 3,
    overflow: 'hidden',
  },
  presenceFill: {
    height: 3,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  presenceLimit: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },

  // Section
  sectionDivider: { marginTop: 4 },
  questProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 8,
    gap: 10,
  },
  questCount: {
    fontSize: 11,
    letterSpacing: 1,
    minWidth: 110,
  },
  questProgressBar: {
    flex: 1,
    height: 3,
    overflow: 'hidden',
  },
  questProgressFill: {
    height: 3,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  // Shield
  shieldSection: { margin: 14, marginTop: 16 },
  shieldBtn: { overflow: 'hidden' },
  shieldInner: {
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  shieldCorner: {
    position: 'absolute',
    width: 10,
    height: 10,
  },
  shieldText: {
    color: '#ff4444',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.3,
    fontFamily: FONTS.display,
  },
  shieldSub: {
    color: '#ff444488',
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 4,
  },
});
