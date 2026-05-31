import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import type { Discipline, DisciplineLog } from '../../types';
import type { RankTheme } from '../../theme/rankThemes';
import CornerFrame from './CornerFrame';

interface Props {
  discipline: Discipline;
  log: DisciplineLog | undefined;
  theme: RankTheme;
  onComplete: () => void;
  onFail: () => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: '#4caf50',
  NORMAL: '#2196f3',
  HARD: '#ff9800',
  LEGENDARY: '#e040fb',
};

const DIFFICULTY_ABBR: Record<string, string> = {
  EASY: 'E',
  NORMAL: 'N',
  HARD: 'H',
  LEGENDARY: 'L',
};

function DiffIcon({ color }: { color: string }) {
  return (
    <Svg width={8} height={8}>
      <Polygon points="4,0 8,4 4,8 0,4" fill={color} />
    </Svg>
  );
}

function StatusMark({ type }: { type: 'complete' | 'fail' }) {
  const color = type === 'complete' ? '#4caf50' : '#f44336';
  const bg = type === 'complete' ? '#0a1a0a' : '#1a0a0a';
  return (
    <View style={[styles.statusBox, { borderColor: color, backgroundColor: bg }]}>
      <Text style={[styles.statusGlyph, { color }]}>
        {type === 'complete' ? '✓' : '✗'}
      </Text>
    </View>
  );
}

export default function DisciplineCard({ discipline, log, theme, onComplete, onFail }: Props) {
  const isCompleted = log?.completed === 1;
  const isFailed = log?.failed === 1;
  const diffColor = DIFFICULTY_COLORS[discipline.difficulty] ?? theme.accent;

  const cardBg = isCompleted
    ? '#050e05'
    : isFailed
      ? '#0e0505'
      : theme.primary;

  const frameColor = isCompleted ? '#4caf5066' : isFailed ? '#f4433666' : theme.accent + '44';

  return (
    <CornerFrame color={frameColor} size={10} thickness={1} style={[styles.card, { backgroundColor: cardBg }]}>
      {/* Difficulty stripe */}
      <View style={[styles.stripe, { backgroundColor: diffColor }]} />

      <View style={styles.body}>
        {/* Difficulty gem */}
        <View style={styles.gemCol}>
          <DiffIcon color={diffColor} />
          <Text style={[styles.diffAbbr, { color: diffColor }]}>
            {DIFFICULTY_ABBR[discipline.difficulty] ?? '?'}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {discipline.name}
          </Text>
          <Text style={[styles.desc, { color: theme.textSecondary }]}>
            {discipline.description}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.xpGain}>+{discipline.xp_gain}</Text>
            {discipline.xp_loss > 0 && (
              <Text style={styles.xpLoss}>−{discipline.xp_loss}</Text>
            )}
            <View style={[styles.diffPill, { borderColor: diffColor + '70', backgroundColor: diffColor + '15' }]}>
              <Text style={[styles.diffText, { color: diffColor }]}>{discipline.difficulty}</Text>
            </View>
            {discipline.deadline_time ? (
              <Text style={[styles.deadline, { color: theme.textSecondary }]}>
                {discipline.deadline_time}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Action */}
        <View style={styles.action}>
          {isCompleted && <StatusMark type="complete" />}
          {isFailed && <StatusMark type="fail" />}
          {!isCompleted && !isFailed && (
            <View style={styles.btnStack}>
              <TouchableOpacity
                style={[styles.btn, styles.btnComplete]}
                onPress={onComplete}
                activeOpacity={0.7}
              >
                <Text style={[styles.btnGlyph, { color: '#4caf50' }]}>✓</Text>
              </TouchableOpacity>
              {discipline.code === 'SILENCE' && (
                <TouchableOpacity
                  style={[styles.btn, styles.btnFail]}
                  onPress={onFail}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.btnGlyph, { color: '#f44336' }]}>✗</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </CornerFrame>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    marginVertical: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  stripe: {
    width: 3,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
    gap: 10,
  },
  gemCol: {
    alignItems: 'center',
    gap: 3,
    width: 16,
  },
  diffAbbr: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  desc: {
    fontSize: 12,
    lineHeight: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  xpGain: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  xpLoss: {
    fontSize: 12,
    color: '#f44336',
  },
  diffPill: {
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  diffText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  deadline: {
    fontSize: 11,
  },
  action: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  statusBox: {
    width: 38,
    height: 38,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusGlyph: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  btnStack: {
    gap: 5,
    alignItems: 'center',
  },
  btn: {
    width: 36,
    height: 36,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnComplete: {
    borderColor: '#4caf5088',
    backgroundColor: '#0a1a0a',
  },
  btnFail: {
    borderColor: '#f4433688',
    backgroundColor: '#1a0a0a',
  },
  btnGlyph: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
