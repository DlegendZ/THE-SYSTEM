import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useSystemStore } from '../store/useSystemStore';
import {
  getLogsForRange, getAllMandates, getDisciplineLogsAll, getSilenceStreak,
} from '../db/queries';
import { differenceInCalendarDays, parseISO, format, subDays } from 'date-fns';
import type { DisciplineLog, Discipline, Mandate, Rank } from '../types';
import { RANK_TITLES } from '../engine/xpConstants';

type Tab = 'overview' | 'disciplines' | 'streaks' | 'history';

function HeatmapRow({ discipline, logs }: { discipline: Discipline; logs: DisciplineLog[] }) {
  const today = new Date();
  const days: Array<{ date: string; completed: boolean; failed: boolean }> = [];
  for (let i = 27; i >= 0; i--) {
    const d = subDays(today, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const log = logs.find((l) => l.log_date === dateStr);
    days.push({ date: dateStr, completed: !!log?.completed, failed: !!log?.failed });
  }
  return (
    <View style={styles.heatRow}>
      <View style={styles.heatGrid}>
        {days.map((day, i) => (
          <View
            key={i}
            style={[
              styles.heatCell,
              { backgroundColor: day.completed ? '#4caf50' : day.failed ? '#f44336' : '#2a2a2a' },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function SilenceStreakPanel({ theme }: { theme: { accent: string; text: string; textSecondary: string } }) {
  const [streak, setStreak] = useState<{ current_streak: number; longest_streak: number; total_relapses: number } | null>(null);
  useEffect(() => { getSilenceStreak().then(setStreak); }, []);
  if (!streak) return null;
  return (
    <View style={styles.silencePanel}>
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>SILENCE PROTOCOL</Text>
      <Text style={[styles.bigStat, { color: theme.accent }]}>{streak.current_streak} days</Text>
      <Text style={[styles.subStat, { color: theme.textSecondary }]}>
        Best: {streak.longest_streak} | Relapses: {streak.total_relapses}
      </Text>
    </View>
  );
}

export default function Archive() {
  const { hero, disciplines, currentTheme: theme } = useSystemStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [disciplineLogs, setDisciplineLogs] = useState<Record<number, DisciplineLog[]>>({});
  const [recentLogs, setRecentLogs] = useState<DisciplineLog[]>([]);

  useEffect(() => {
    if (!hero) return;
    getAllMandates().then(setMandates);
    const today = format(new Date(), 'yyyy-MM-dd');
    const start = format(subDays(new Date(), 28), 'yyyy-MM-dd');
    getLogsForRange(start, today).then(setRecentLogs);
  }, [hero]);

  useEffect(() => {
    if (activeTab !== 'disciplines') return;
    (async () => {
      const result: Record<number, DisciplineLog[]> = {};
      for (const d of disciplines) {
        result[d.id] = await getDisciplineLogsAll(d.id);
      }
      setDisciplineLogs(result);
    })();
  }, [activeTab, disciplines]);

  if (!hero) return null;

  const daysElapsed = differenceInCalendarDays(new Date(), parseISO(hero.journey_start_date)) + 1;
  const progressPct = Math.min(daysElapsed / 180, 1);
  const TABS: Tab[] = ['overview', 'disciplines', 'streaks', 'history'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>THE ARCHIVE</Text>
      </View>

      <View style={[styles.tabBar, { borderBottomColor: theme.accent }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && { borderBottomWidth: 2, borderBottomColor: theme.accent }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? theme.accent : theme.textSecondary }]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>JOURNEY PROGRESS</Text>
            <View style={[styles.progressBg, { backgroundColor: '#333333' }]}>
              <View style={[styles.progressFill, { width: `${progressPct * 100}%`, backgroundColor: theme.accent }]} />
            </View>
            <Text style={[styles.progressText, { color: theme.text }]}>Day {daysElapsed} of 180</Text>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>RANK</Text>
            <Text style={[styles.bigStat, { color: theme.accent }]}>{hero.rank}-Rank</Text>
            <Text style={[styles.subStat, { color: theme.textSecondary }]}>{RANK_TITLES[hero.rank as Rank]}</Text>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>TOTAL XP</Text>
            <Text style={[styles.bigStat, { color: theme.accent }]}>{hero.global_xp.toLocaleString()}</Text>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>MANDATES RECEIVED</Text>
            <Text style={[styles.bigStat, { color: theme.accent }]}>{mandates.length}</Text>
          </View>
        )}

        {activeTab === 'disciplines' && (
          <View style={styles.section}>
            {disciplines.map((d) => {
              const logs = disciplineLogs[d.id] ?? [];
              const completed = logs.filter((l) => l.completed).length;
              const failed = logs.filter((l) => l.failed).length;
              const recentForThis = recentLogs.filter((l) => l.discipline_id === d.id);
              return (
                <View key={d.id} style={[styles.disciplineCard, { borderColor: theme.accent + '40' }]}>
                  <Text style={[styles.disciplineName, { color: theme.text }]}>{d.name}</Text>
                  <HeatmapRow discipline={d} logs={recentForThis} />
                  <View style={styles.statsRow}>
                    <Text style={[styles.statChip, { color: '#4caf50' }]}>✓ {completed}</Text>
                    <Text style={[styles.statChip, { color: '#f44336' }]}>✗ {failed}</Text>
                    <Text style={[styles.statChip, { color: theme.textSecondary }]}>Total: {logs.length}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'streaks' && (
          <View style={styles.section}>
            <SilenceStreakPanel theme={theme} />
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>ALL DISCIPLINES</Text>
            {disciplines.map((d) => {
              const logs = disciplineLogs[d.id] ?? [];
              return (
                <View key={d.id} style={styles.streakRow}>
                  <Text style={[styles.streakName, { color: theme.text }]}>{d.name}</Text>
                  <Text style={[styles.streakVal, { color: theme.accent }]}>{logs.filter((l) => l.completed).length} completed</Text>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'history' && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>LAST 28 DAYS</Text>
            {[...new Set(recentLogs.map((l) => l.log_date))].sort().reverse().map((date) => {
              const dayLogs = recentLogs.filter((l) => l.log_date === date);
              const completedCount = dayLogs.filter((l) => l.completed).length;
              const xpEarned = dayLogs.reduce((sum, l) => sum + (l.xp_delta > 0 ? l.xp_delta : 0), 0);
              return (
                <View key={date} style={[styles.historyRow, { borderBottomColor: '#333333' }]}>
                  <Text style={[styles.historyDate, { color: theme.textSecondary }]}>{date}</Text>
                  <Text style={[styles.historyCompleted, { color: '#4caf50' }]}>{completedCount}/{disciplines.length}</Text>
                  <Text style={[styles.historyXP, { color: theme.accent }]}>+{xpEarned} XP</Text>
                </View>
              );
            })}
          </View>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 14, fontWeight: 'bold', letterSpacing: 3 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  scroll: { flex: 1 },
  section: { padding: 16 },
  sectionLabel: { fontSize: 9, letterSpacing: 3, fontWeight: 'bold', marginTop: 20, marginBottom: 8 },
  progressBg: { height: 8, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: 8 },
  progressText: { fontSize: 11, marginBottom: 16 },
  bigStat: { fontSize: 28, fontWeight: 'bold' },
  subStat: { fontSize: 10, marginBottom: 16 },
  disciplineCard: { borderWidth: 1, padding: 12, marginBottom: 12, borderRadius: 2 },
  disciplineName: { fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  heatRow: { marginBottom: 8 },
  heatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  heatCell: { width: 10, height: 10, borderRadius: 1 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statChip: { fontSize: 11 },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#222222' },
  streakName: { fontSize: 12 },
  streakVal: { fontSize: 12 },
  silencePanel: { marginBottom: 16 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
  historyDate: { fontSize: 11 },
  historyCompleted: { fontSize: 11 },
  historyXP: { fontSize: 11 },
  bottomPadding: { height: 64 },
});
