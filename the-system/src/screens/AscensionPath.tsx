import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Modal, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon, Line, Circle, Path } from 'react-native-svg';
import { useSystemStore } from '../store/useSystemStore';
import { getWeekCompletionRate } from '../db/queries';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import CornerFrame from '../components/ui/CornerFrame';

const TOTAL_NODES = 24;

const ZONE_LABELS = [
  'THE ABYSS', 'RUINED KINGDOM', 'IRON CITADEL',
  'CELESTIAL GATE', 'VOID EXPANSE', 'THE THRONE',
];

const ZONE_COLORS = ['#050508', '#0d0800', '#080808', '#060410', '#030208', '#000000'];

const LORE: string[] = [
  'Week 1: The descent begins. You carry nothing but will.',
  'Week 2: The abyss walls press close. You press back.',
  'Week 3: Light fades. You become the light.',
  'Week 4: The surface. You have earned the sun.',
  'Week 5: Ruins stretch before you. Others fell here.',
  'Week 6: You walk where kingdoms died.',
  'Week 7: Bronze ashes. Your path is different.',
  'Week 8: The forge still burns. You step in.',
  'Week 9: Iron sky. Iron will. One remains.',
  'Week 10: Storm reveals character. Storm passes.',
  'Week 11: The citadel walls. You built them.',
  'Week 12: The peak. Everything looks small from here.',
  'Week 13: The clouds part. You were above this.',
  'Week 14: Gates of the celestial plane open.',
  'Week 15: You were expected.',
  'Week 16: The throne room has been waiting.',
  'Week 17: Stars. The System reveals its scope.',
  'Week 18: Constellations form in your name.',
  'Week 19: The void between stars. You cross it.',
  'Week 20: Light bends around you now.',
  'Week 21: The final path. Each step is legend.',
  'Week 22: The System marks your approach.',
  'Week 23: One wall remains. The last.',
  'Week 24: THE DIVINE THRONE. You have arrived.',
];

const { width } = Dimensions.get('window');

function NodeSvg({ num, pct, isCurrent, isLocked, isComplete, color }: {
  num: number; pct: number; isCurrent: boolean; isLocked: boolean; isComplete: boolean; color: string;
}) {
  const size = 68;
  const cx = size / 2;
  const r = 28;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + r * Math.cos(a)},${cx + r * Math.sin(a)}`;
  }).join(' ');

  const fillColor = isComplete ? color + '30' : isCurrent ? color + '20' : isLocked ? '#111' : '#0a0a0a';
  const strokeColor = isLocked ? '#333' : color;
  const strokeW = isCurrent ? 2 : isComplete ? 1.5 : 1;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Polygon points={pts} fill={fillColor} stroke={strokeColor} strokeWidth={strokeW} strokeOpacity={isLocked ? 0.4 : 1} />
      {isCurrent && (
        <Circle cx={cx} cy={cx} r={4} fill={color} />
      )}
      {isComplete && !isCurrent && (
        <Polygon
          points={`${cx},${cx - 8} ${cx + 7},${cx + 4} ${cx - 7},${cx + 4}`}
          fill={color}
          fillOpacity="0.8"
        />
      )}
    </Svg>
  );
}

function PathConnector({ isUnlocked, color, isLeft }: { isUnlocked: boolean; color: string; isLeft: boolean }) {
  return (
    <View style={[connStyles.line, { backgroundColor: isUnlocked ? color + '50' : '#2a2a2a' }]}>
      {isUnlocked && (
        <View style={[connStyles.dot, { backgroundColor: color, right: isLeft ? 0 : undefined, left: isLeft ? undefined : 0 }]} />
      )}
    </View>
  );
}

const connStyles = StyleSheet.create({
  line: { flex: 1, height: 1.5, position: 'relative' },
  dot: { position: 'absolute', top: -2, width: 5, height: 5, borderRadius: 2.5 },
});

function NodeRow({ nodeNum, completionRate, isCurrent, isLocked, onPress, theme }: {
  nodeNum: number; completionRate: number; isCurrent: boolean; isLocked: boolean;
  onPress: () => void; theme: { accent: string; textSecondary: string; text: string };
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isCurrent) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isCurrent, pulseAnim]);

  const isLeft = nodeNum % 2 === 1;
  const isComplete = !isCurrent && !isLocked && completionRate >= 0.5;
  const pct = Math.round(completionRate * 100);

  return (
    <View style={[styles.nodeRow, { justifyContent: isLeft ? 'flex-start' : 'flex-end' }]}>
      {!isLeft && <PathConnector isUnlocked={!isLocked} color={theme.accent} isLeft={false} />}

      <TouchableOpacity onPress={onPress} disabled={isLocked} activeOpacity={0.7}>
        <Animated.View style={{ transform: [{ scale: isCurrent ? pulseAnim : 1 }] }}>
          <View style={styles.nodeWrap}>
            <NodeSvg
              num={nodeNum}
              pct={pct}
              isCurrent={isCurrent}
              isLocked={isLocked}
              isComplete={isComplete}
              color={theme.accent}
            />
            <Text style={[styles.nodeNum, { color: isLocked ? '#444' : theme.accent }]}>{nodeNum}</Text>
            {!isLocked && (
              <Text style={[styles.nodePct, { color: isLocked ? '#333' : theme.textSecondary }]}>
                {pct}%
              </Text>
            )}
            {isLocked && <Text style={styles.nodeLock}>🔒</Text>}
          </View>
        </Animated.View>
      </TouchableOpacity>

      {isLeft && <PathConnector isUnlocked={!isLocked} color={theme.accent} isLeft={true} />}
    </View>
  );
}

export default function AscensionPath() {
  const insets = useSafeAreaInsets();
  const { hero, currentTheme: theme } = useSystemStore();
  const [completionRates, setCompletionRates] = useState<number[]>(new Array(TOTAL_NODES).fill(0));
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  useEffect(() => {
    if (!hero) return;
    (async () => {
      const rates: number[] = [];
      for (let w = 1; w <= TOTAL_NODES; w++) {
        const rate = await getWeekCompletionRate(hero.journey_start_date, w);
        rates.push(rate);
      }
      setCompletionRates(rates);
    })();
  }, [hero]);

  if (!hero) return null;

  const daysElapsed = differenceInCalendarDays(new Date(), parseISO(hero.journey_start_date));
  const currentWeek = Math.min(Math.floor(daysElapsed / 7) + 1, TOTAL_NODES);
  const overallRate = completionRates.slice(0, currentWeek).reduce((s, r) => s + r, 0) / Math.max(currentWeek, 1);

  const selectedRate = selectedNode ? (completionRates[selectedNode - 1] ?? 0) : 0;
  const zoneIdx = selectedNode ? Math.floor((selectedNode - 1) / 4) : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.accent + '30', paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: theme.text }]}>ASCENSION PATH</Text>
          <View style={[styles.weekBadge, { borderColor: theme.accent + '70', backgroundColor: theme.accent + '10' }]}>
            <Text style={[styles.weekNum, { color: theme.accent }]}>{currentWeek}</Text>
            <Text style={[styles.weekOf, { color: theme.textSecondary }]}>/{TOTAL_NODES}</Text>
          </View>
        </View>
        <View style={styles.headerBar}>
          <View style={[styles.headerBarBg, { backgroundColor: '#111' }]}>
            <View style={[styles.headerBarFill, {
              width: `${(currentWeek / TOTAL_NODES) * 100}%`,
              backgroundColor: theme.accent,
            }]} />
          </View>
          <Text style={[styles.headerPct, { color: theme.textSecondary }]}>
            {Math.round(overallRate * 100)}% AVG
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.pathWrap}
        showsVerticalScrollIndicator={false}
      >
        {Array.from({ length: TOTAL_NODES }, (_, i) => {
          const nodeNum = TOTAL_NODES - i;
          const zoneI = Math.floor((nodeNum - 1) / 4);
          const zoneColor = ZONE_COLORS[zoneI] ?? '#000';
          const isCurrent = nodeNum === currentWeek;
          const isLocked = nodeNum > currentWeek;
          const rate = completionRates[nodeNum - 1] ?? 0;

          return (
            <View key={nodeNum} style={[styles.zoneSection, { backgroundColor: zoneColor }]}>
              {nodeNum % 4 === 1 && (
                <View style={styles.zoneLabelWrap}>
                  <View style={[styles.zoneLabelLine, { backgroundColor: theme.accent + '20' }]} />
                  <Text style={[styles.zoneLabel, { color: theme.accent + '50' }]}>
                    {ZONE_LABELS[zoneI] ?? ''}
                  </Text>
                  <View style={[styles.zoneLabelLine, { backgroundColor: theme.accent + '20' }]} />
                </View>
              )}
              <NodeRow
                nodeNum={nodeNum}
                completionRate={rate}
                isCurrent={isCurrent}
                isLocked={isLocked}
                onPress={() => setSelectedNode(nodeNum)}
                theme={theme}
              />
            </View>
          );
        })}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Node detail modal */}
      <Modal
        visible={selectedNode !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNode(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedNode(null)}
        >
          <CornerFrame
            color={theme.accent}
            size={16}
            thickness={2}
            style={[styles.modalBox, { backgroundColor: '#050505' }]}
          >
            <TouchableOpacity activeOpacity={1} style={styles.modalInner}>
              <View style={styles.modalTopRow}>
                <Text style={[styles.modalWeek, { color: theme.accent }]}>
                  WEEK {selectedNode}
                </Text>
                <Text style={[styles.modalZone, { color: theme.textSecondary }]}>
                  {ZONE_LABELS[zoneIdx] ?? ''}
                </Text>
              </View>

              <View style={[styles.modalDivider, { backgroundColor: theme.accent + '40' }]} />

              <Text style={[styles.modalLore, { color: theme.text }]}>
                {selectedNode ? LORE[selectedNode - 1] : ''}
              </Text>

              <View style={styles.modalStats}>
                <View style={[styles.modalStatBox, { borderColor: theme.accent + '50' }]}>
                  <Text style={[styles.modalStatVal, { color: theme.accent }]}>
                    {Math.round(selectedRate * 100)}%
                  </Text>
                  <Text style={[styles.modalStatLabel, { color: theme.textSecondary }]}>COMPLETION</Text>
                </View>
                <View style={[styles.modalStatBox, { borderColor: theme.accent + '50' }]}>
                  <Text style={[styles.modalStatVal, { color: selectedNode === currentWeek ? theme.accent : theme.textSecondary }]}>
                    {selectedNode === currentWeek ? 'NOW' : selectedNode !== null && selectedNode > currentWeek ? 'LOCKED' : 'DONE'}
                  </Text>
                  <Text style={[styles.modalStatLabel, { color: theme.textSecondary }]}>STATUS</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalClose, { borderColor: theme.accent + '70' }]}
                onPress={() => setSelectedNode(null)}
              >
                <Text style={[styles.modalCloseTxt, { color: theme.accent }]}>CLOSE</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </CornerFrame>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', letterSpacing: 4 },
  weekBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 2,
  },
  weekNum: { fontSize: 22, fontWeight: 'bold' },
  weekOf: { fontSize: 13 },
  headerBar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBarBg: { flex: 1, height: 4, overflow: 'hidden' },
  headerBarFill: { height: 4 },
  headerPct: { fontSize: 11, letterSpacing: 1 },

  scroll: { flex: 1 },
  pathWrap: { paddingBottom: 16 },

  zoneSection: { paddingVertical: 2 },
  zoneLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  zoneLabelLine: { flex: 1, height: 1 },
  zoneLabel: { fontSize: 9, letterSpacing: 3, fontWeight: 'bold' },

  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 6,
  },
  nodeWrap: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  nodeNum: {
    position: 'absolute',
    fontSize: 18,
    fontWeight: 'bold',
    top: 14,
  },
  nodePct: {
    position: 'absolute',
    fontSize: 10,
    bottom: 12,
  },
  nodeLock: {
    position: 'absolute',
    fontSize: 14,
    bottom: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: Math.min(width * 0.85, 320),
  },
  modalInner: { padding: 24, gap: 14 },
  modalTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  modalWeek: { fontSize: 22, fontWeight: 'bold', letterSpacing: 2 },
  modalZone: { fontSize: 10, letterSpacing: 2 },
  modalDivider: { height: 1 },
  modalLore: { fontSize: 14, lineHeight: 22, letterSpacing: 0.3 },
  modalStats: { flexDirection: 'row', gap: 10 },
  modalStatBox: {
    flex: 1,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  modalStatVal: { fontSize: 20, fontWeight: 'bold' },
  modalStatLabel: { fontSize: 10, letterSpacing: 1 },
  modalClose: {
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  modalCloseTxt: { fontSize: 12, fontWeight: 'bold', letterSpacing: 2 },
});
