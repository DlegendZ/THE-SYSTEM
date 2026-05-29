import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Discipline, DisciplineLog } from '../../types';
import type { RankTheme } from '../../theme/rankThemes';

interface Props {
  discipline: Discipline;
  log: DisciplineLog | undefined;
  theme: RankTheme;
  onComplete: () => void;
  onFail: () => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: '#4a9',
  NORMAL: '#49a',
  HARD: '#a64',
  LEGENDARY: '#a4a',
};

export default function DisciplineCard({ discipline, log, theme, onComplete, onFail }: Props) {
  const isCompleted = log?.completed === 1;
  const isFailed = log?.failed === 1;

  const cardBg = isCompleted
    ? '#0a2a0a'
    : isFailed
      ? '#2a0a0a'
      : theme.primary;

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: theme.accent }]}>
      <View style={styles.info}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: theme.text }]}>{discipline.name}</Text>
          <View style={[styles.badge, { backgroundColor: DIFFICULTY_COLORS[discipline.difficulty] ?? '#666' }]}>
            <Text style={styles.badgeText}>{discipline.difficulty}</Text>
          </View>
        </View>
        <Text style={[styles.desc, { color: theme.textSecondary }]} numberOfLines={1}>
          {discipline.description}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          +{discipline.xp_gain} XP{discipline.deadline_time ? ` — Deadline: ${discipline.deadline_time}` : ''}
        </Text>
      </View>

      {!isCompleted && !isFailed && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.accent }]}
            onPress={onComplete}
          >
            <Text style={styles.btnText}>✓</Text>
          </TouchableOpacity>
          {discipline.code === 'SILENCE' && (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#a00' }]}
              onPress={onFail}
            >
              <Text style={styles.btnText}>✗</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isCompleted && (
        <Text style={styles.status}>✓ DONE</Text>
      )}
      {isFailed && (
        <Text style={[styles.status, { color: '#f44' }]}>✗ FAILED</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 14, fontWeight: 'bold' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2 },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  desc: { fontSize: 10, marginTop: 2 },
  meta: { fontSize: 9, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  status: { color: '#4a4', fontSize: 12, fontWeight: 'bold' },
});
