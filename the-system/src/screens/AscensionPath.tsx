import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Modal,
} from 'react-native';
import { useSystemStore } from '../store/useSystemStore';
import { getWeekCompletionRate } from '../db/queries';
import { differenceInCalendarDays, parseISO } from 'date-fns';

const TOTAL_NODES = 24;

const ZONE_LABELS = [
  'UNDERGROUND CAVERN', 'RUINED KINGDOM', 'IRON MOUNTAINS',
  'CASTLE IN THE CLOUDS', 'STAR FIELDS', 'DIVINE APPROACH',
];

const ZONE_COLORS = ['#1a1a1a', '#1a0f00', '#0d0900', '#080610', '#050310', '#000000'];

const LORE: string[] = [
  'Week 1: The descent begins. You carry nothing but will.',
  'Week 2: The cavern walls press close. You press back.',
  'Week 3: Light fades. You become the light.',
  'Week 4: The surface. You have earned the sun.',
  'Week 5: Ruins stretch before you. Others fell here.',
  'Week 6: You walk where kingdoms died.',
  'Week 7: Bronze ashes. Your path is different.',
  'Week 8: The forge still burns. You step in.',
  'Week 9: Mountains. The kind that break men.',
  'Week 10: Storm. The kind that reveals character.',
  'Week 11: Iron sky. Iron will. One remains.',
  'Week 12: The peak. From here, everything looks small.',
  'Week 13: The clouds part. You were always above this.',
  'Week 14: Castle walls. They built them to keep you out.',
  'Week 15: The gates open. You were expected.',
  'Week 16: The throne room. It has been waiting.',
  'Week 17: Stars. The System reveals its full scope.',
  'Week 18: Constellations form in your name.',
  'Week 19: The void between stars. You cross it.',
  'Week 20: Light bends around you now.',
  'Week 21: The final path. Each step is legend.',
  'Week 22: The System marks your progress.',
  'Week 23: One more. The last wall.',
  'Week 24: The divine throne. You have arrived.',
];

interface NodeTheme {
  accent: string;
  text: string;
  textSecondary: string;
  primary: string;
}

function NodeRow({
  nodeNum, completionRate, isCurrent, isLocked, onPress, theme,
}: {
  nodeNum: number;
  completionRate: number;
  isCurrent: boolean;
  isLocked: boolean;
  onPress: () => void;
  theme: NodeTheme;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isCurrent) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isCurrent, pulseAnim]);

  const isLeft = nodeNum % 2 === 1;
  const pct = Math.round(completionRate * 100);

  return (
    <View style={[styles.nodeRow, { justifyContent: isLeft ? 'flex-start' : 'flex-end' }]}>
      <TouchableOpacity onPress={onPress} disabled={isLocked}>
        <Animated.View
          style={[
            styles.nodeCircle,
            {
              borderColor: isLocked ? '#444444' : isCurrent ? theme.accent : theme.accent + '80',
              backgroundColor: isLocked ? '#222222' : isCurrent ? theme.accent + '30' : completionRate >= 0.7 ? theme.accent + '20' : 'transparent',
              transform: [{ scale: isCurrent ? pulseAnim : 1 }],
            },
          ]}
        >
          <Text style={[styles.nodeNum, { color: isLocked ? '#444444' : theme.accent }]}>{nodeNum}</Text>
          {!isLocked && <Text style={[styles.nodePct, { color: theme.textSecondary }]}>{pct}%</Text>}
          {isLocked && <Text style={[styles.nodeLock, { color: '#444444' }]}>🔒</Text>}
          {isCurrent && <View style={[styles.currentDot, { backgroundColor: theme.accent }]} />}
        </Animated.View>
      </TouchableOpacity>
      <View style={[styles.pathLine, { backgroundColor: isLocked ? '#333333' : theme.accent + '40' }]} />
    </View>
  );
}

export default function AscensionPath() {
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>ASCENSION PATH</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>WEEK {currentWeek} OF {TOTAL_NODES}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.pathContainer} showsVerticalScrollIndicator={false}>
        {Array.from({ length: TOTAL_NODES }, (_, i) => {
          const nodeNum = TOTAL_NODES - i;
          const zoneIdx = Math.floor((nodeNum - 1) / 4);
          const zoneColor = ZONE_COLORS[zoneIdx] ?? '#000000';
          const isCurrent = nodeNum === currentWeek;
          const isLocked = nodeNum > currentWeek;
          const rate = completionRates[nodeNum - 1] ?? 0;

          return (
            <View key={nodeNum} style={[styles.zoneSection, { backgroundColor: zoneColor }]}>
              {nodeNum % 4 === 1 && (
                <Text style={[styles.zoneLabel, { color: '#555555' }]}>
                  {ZONE_LABELS[zoneIdx] ?? ''}
                </Text>
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
      </ScrollView>

      <Modal
        visible={selectedNode !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNode(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.background, borderColor: theme.accent }]}>
            <Text style={[styles.modalTitle, { color: theme.accent }]}>WEEK {selectedNode}</Text>
            <Text style={[styles.modalLore, { color: theme.text }]}>
              {selectedNode ? LORE[selectedNode - 1] : ''}
            </Text>
            {selectedNode && (
              <Text style={[styles.modalPct, { color: theme.textSecondary }]}>
                Completion: {Math.round((completionRates[selectedNode - 1] ?? 0) * 100)}%
              </Text>
            )}
            <TouchableOpacity style={[styles.modalClose, { borderColor: theme.accent }]} onPress={() => setSelectedNode(null)}>
              <Text style={[styles.modalCloseText, { color: theme.accent }]}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#333333' },
  title: { fontSize: 14, fontWeight: 'bold', letterSpacing: 3 },
  subtitle: { fontSize: 10, marginTop: 2, letterSpacing: 2 },
  scroll: { flex: 1 },
  pathContainer: { paddingBottom: 32 },
  zoneSection: { paddingVertical: 4 },
  zoneLabel: { fontSize: 9, letterSpacing: 3, paddingHorizontal: 16, paddingVertical: 4, textAlign: 'center' },
  nodeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, marginVertical: 8 },
  nodeCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  nodeNum: { fontSize: 18, fontWeight: 'bold' },
  nodePct: { fontSize: 9 },
  nodeLock: { fontSize: 14 },
  currentDot: { position: 'absolute', bottom: 6, width: 8, height: 8, borderRadius: 4 },
  pathLine: { flex: 1, height: 2, marginHorizontal: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: 300, padding: 24, borderWidth: 2 },
  modalTitle: { fontSize: 14, fontWeight: 'bold', letterSpacing: 2, marginBottom: 12 },
  modalLore: { fontSize: 12, lineHeight: 20, marginBottom: 12 },
  modalPct: { fontSize: 10, marginBottom: 16 },
  modalClose: { borderWidth: 1, padding: 10, alignItems: 'center' },
  modalCloseText: { fontSize: 11, fontWeight: 'bold', letterSpacing: 2 },
});
