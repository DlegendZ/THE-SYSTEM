# Ascend Redesign + Font Sweep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Ascend (`AscensionPath`) screen into a Claude "constellation spark trail" and finish the Claude typography system across every remaining text element.

**Architecture:** Front-end only; no engine/data/store changes (`getWeekCompletionRate`, 24 nodes unchanged). `ClaudeSpark` gains a `glow` prop and is reused as the trail node. `AscensionPath.tsx` is rewritten: spark nodes by state, dotted warm trail, warm zone tints, Lora serif zone titles, warm modal, sentence case. A final pass sentence-cases + Lora-fies any leftover ALL-CAPS chrome app-wide (notably the Mirror nameplate).

**Tech Stack:** React Native 0.85 / React 19, react-native-svg, react-navigation, Jest. Build: `expo prebuild` (no --clean) + JBR 21 release APK per `the-system-prebuild` memory.

**Branch:** `ascend-redesign` (off `main`).

---

### Task 1: ClaudeSpark `glow` prop

**Files:**
- Modify: `the-system/src/components/avatar/ClaudeSpark.tsx`

- [ ] **Step 1: Add `glow` to Props + render a soft halo**

In `ClaudeSpark.tsx`, add `glow?: boolean;` to the `Props` interface. Destructure it (`glow = false`). The component already computes `cx`, `cy`, `maxR`, and resolves a color (`spec.tip`, or `tint` when provided). Add a soft halo disc as the FIRST child inside the `<AnimatedSvg>` (before the ray `<Path>`s), so it sits behind the rays:

```tsx
{glow && (
  <Circle cx={cx} cy={cy} r={maxR} fill={tint ?? spec.tip} opacity={0.14} />
)}
```

Ensure `Circle` is imported from `react-native-svg` (it already is, used for the core). If a `tint` prop exists, the halo uses it; otherwise `spec.tip`. Keep all existing behavior when `glow` is false/absent.

- [ ] **Step 2: Run tests**

Run: `cd the-system && npx jest avatar`
Expected: PASS (existing avatar suites; glow is additive).

- [ ] **Step 3: Commit**

```bash
git add the-system/src/components/avatar/ClaudeSpark.tsx
git commit -m "feat: ClaudeSpark glow halo prop"
```

---

### Task 2: Ascend "constellation spark trail" redesign

**Files:**
- Modify (full rewrite): `the-system/src/screens/AscensionPath.tsx`

- [ ] **Step 1: Replace the entire file with the redesigned screen**

Overwrite `the-system/src/screens/AscensionPath.tsx` with exactly:

```tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Modal, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';
import { useSystemStore } from '../store/useSystemStore';
import { getWeekCompletionRate } from '../db/queries';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import CornerFrame from '../components/ui/CornerFrame';
import SystemBackground from '../components/fx/SystemBackground';
import ClaudeSpark from '../components/avatar/ClaudeSpark';
import { FONTS } from '../theme/typography';

const TOTAL_NODES = 24;

const ZONE_LABELS = [
  'The Abyss', 'Ruined Kingdom', 'Iron Citadel',
  'Celestial Gate', 'Void Expanse', 'The Throne',
];

// Warm charcoal zone tints — deep at the start, warming toward the throne.
const ZONE_TINTS = ['#201F1D', '#23211E', '#262320', '#2A2622', '#2E2823', '#332B24'];

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
  'Week 24: The divine throne. You have arrived.',
];

const { width } = Dimensions.get('window');

type NodeState = 'current' | 'done' | 'attempted' | 'locked';

function TrailNode({ state, color, pulseAnim }: {
  state: NodeState; color: string; pulseAnim: Animated.Value;
}) {
  if (state === 'locked') {
    return (
      <View style={nodeStyles.lockRing} />
    );
  }
  const size = state === 'current' ? 58 : 38;
  const tint = state === 'attempted' ? '#8A7A6B' : color;
  return (
    <Animated.View
      style={[nodeStyles.sparkWrap, { transform: [{ scale: state === 'current' ? pulseAnim : 1 }] }]}
    >
      <ClaudeSpark rank={state === 'current' ? 'C' : 'E'} size={size} tint={tint} glow={state === 'current'} />
    </Animated.View>
  );
}

const nodeStyles = StyleSheet.create({
  sparkWrap: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  lockRing: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: '#4A463F', margin: 17,
  },
});

function PathConnector({ unlocked, color }: { unlocked: boolean; color: string }) {
  return (
    <View style={connStyles.line}>
      {Array.from({ length: 7 }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 3, height: 3, borderRadius: 1.5,
            backgroundColor: unlocked ? color : '#3A3733',
            opacity: unlocked ? 0.7 : 0.4,
          }}
        />
      ))}
    </View>
  );
}

const connStyles = StyleSheet.create({
  line: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
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
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isCurrent, pulseAnim]);

  const isLeft = nodeNum % 2 === 1;
  const isDone = !isCurrent && !isLocked && completionRate >= 0.5;
  const state: NodeState = isCurrent ? 'current' : isLocked ? 'locked' : isDone ? 'done' : 'attempted';
  const pct = Math.round(completionRate * 100);
  const captionColor = isLocked ? '#6B6A65' : theme.textSecondary;

  return (
    <View style={[styles.nodeRow, { justifyContent: isLeft ? 'flex-start' : 'flex-end' }]}>
      {!isLeft && <PathConnector unlocked={!isLocked} color={theme.accent} />}
      <TouchableOpacity onPress={onPress} disabled={isLocked} activeOpacity={0.7}>
        <View style={styles.nodeCol}>
          <TrailNode state={state} color={theme.accent} pulseAnim={pulseAnim} />
          <Text style={[styles.nodeCaption, { color: captionColor }]}>
            {isLocked ? `Week ${nodeNum}` : `Week ${nodeNum} · ${pct}%`}
          </Text>
        </View>
      </TouchableOpacity>
      {isLeft && <PathConnector unlocked={!isLocked} color={theme.accent} />}
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
      <SystemBackground color={theme.accent} background={theme.background} />
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.accent + '30', paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: theme.text }]}>Ascension path</Text>
          <View style={[styles.weekBadge, { borderColor: theme.accent + '70', backgroundColor: theme.accent + '12' }]}>
            <Text style={[styles.weekNum, { color: theme.accent }]}>{currentWeek}</Text>
            <Text style={[styles.weekOf, { color: theme.textSecondary }]}>/{TOTAL_NODES}</Text>
          </View>
        </View>
        <View style={styles.headerBar}>
          <View style={[styles.headerBarBg, { backgroundColor: '#2A2725' }]}>
            <View style={[styles.headerBarFill, {
              width: `${(currentWeek / TOTAL_NODES) * 100}%`,
              backgroundColor: theme.accent,
            }]} />
          </View>
          <Text style={[styles.headerPct, { color: theme.textSecondary }]}>
            {Math.round(overallRate * 100)}% avg
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
          const zoneColor = ZONE_TINTS[zoneI] ?? theme.background;
          const isCurrent = nodeNum === currentWeek;
          const isLocked = nodeNum > currentWeek;
          const rate = completionRates[nodeNum - 1] ?? 0;

          return (
            <View key={nodeNum} style={[styles.zoneSection, { backgroundColor: zoneColor }]}>
              {nodeNum % 4 === 1 && (
                <View style={styles.zoneLabelWrap}>
                  <View style={[styles.zoneLabelLine, { backgroundColor: theme.accent + '25' }]} />
                  <Svg width={10} height={10} style={styles.zoneGem}>
                    <Polygon points="5,0 6.5,3.5 10,5 6.5,6.5 5,10 3.5,6.5 0,5 3.5,3.5" fill={theme.accent} opacity={0.7} />
                  </Svg>
                  <Text style={[styles.zoneLabel, { color: theme.accent + 'AA' }]}>
                    {ZONE_LABELS[zoneI] ?? ''}
                  </Text>
                  <Svg width={10} height={10} style={styles.zoneGem}>
                    <Polygon points="5,0 6.5,3.5 10,5 6.5,6.5 5,10 3.5,6.5 0,5 3.5,3.5" fill={theme.accent} opacity={0.7} />
                  </Svg>
                  <View style={[styles.zoneLabelLine, { backgroundColor: theme.accent + '25' }]} />
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
            style={[styles.modalBox, { backgroundColor: '#2C2B28' }]}
          >
            <TouchableOpacity activeOpacity={1} style={styles.modalInner}>
              <View style={styles.modalTopRow}>
                <Text style={[styles.modalWeek, { color: theme.accent }]}>
                  Week {selectedNode}
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
                  <Text style={[styles.modalStatLabel, { color: theme.textSecondary }]}>Completion</Text>
                </View>
                <View style={[styles.modalStatBox, { borderColor: theme.accent + '50' }]}>
                  <Text style={[styles.modalStatVal, { color: selectedNode === currentWeek ? theme.accent : theme.textSecondary }]}>
                    {selectedNode === currentWeek ? 'Now' : selectedNode !== null && selectedNode > currentWeek ? 'Locked' : 'Done'}
                  </Text>
                  <Text style={[styles.modalStatLabel, { color: theme.textSecondary }]}>Status</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalClose, { borderColor: theme.accent + '70' }]}
                onPress={() => setSelectedNode(null)}
              >
                <Text style={[styles.modalCloseTxt, { color: theme.accent }]}>Close</Text>
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

  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, gap: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, letterSpacing: 0.3, fontFamily: FONTS.display },
  weekBadge: { flexDirection: 'row', alignItems: 'baseline', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, gap: 2, borderRadius: 4 },
  weekNum: { fontSize: 22, fontFamily: FONTS.display },
  weekOf: { fontSize: 13 },
  headerBar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBarBg: { flex: 1, height: 4, overflow: 'hidden', borderRadius: 2 },
  headerBarFill: { height: 4, borderRadius: 2 },
  headerPct: { fontSize: 11, letterSpacing: 0.5 },

  scroll: { flex: 1 },
  pathWrap: { paddingBottom: 16 },

  zoneSection: { paddingVertical: 2 },
  zoneLabelWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
  zoneLabelLine: { flex: 1, height: 1 },
  zoneGem: {},
  zoneLabel: { fontSize: 13, letterSpacing: 0.5, fontFamily: FONTS.display },

  nodeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginVertical: 4 },
  nodeCol: { alignItems: 'center', width: 96 },
  nodeCaption: { fontSize: 10, letterSpacing: 0.3, marginTop: -4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: Math.min(width * 0.85, 320) },
  modalInner: { padding: 24, gap: 14 },
  modalTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  modalWeek: { fontSize: 22, letterSpacing: 0.3, fontFamily: FONTS.display },
  modalZone: { fontSize: 11, letterSpacing: 0.3 },
  modalDivider: { height: 1 },
  modalLore: { fontSize: 14, lineHeight: 22, letterSpacing: 0.3, fontFamily: FONTS.displayRegular, fontStyle: 'italic' },
  modalStats: { flexDirection: 'row', gap: 10 },
  modalStatBox: { flex: 1, borderWidth: 1, padding: 12, alignItems: 'center', gap: 4, borderRadius: 4 },
  modalStatVal: { fontSize: 20, fontFamily: FONTS.display },
  modalStatLabel: { fontSize: 10, letterSpacing: 0.3 },
  modalClose: { borderWidth: 1, padding: 12, alignItems: 'center', borderRadius: 4 },
  modalCloseTxt: { fontSize: 13, letterSpacing: 0.3, fontFamily: FONTS.display },
});
```

- [ ] **Step 2: Run tests**

Run: `cd the-system && npx jest AscensionPath`
Expected: PASS. If a test asserts the old uppercase modal strings (`'WEEK'`, `'NOW'`, `'LOCKED'`, `'DONE'`) or zone labels (`'THE ABYSS'`), update those expectations to the new strings (`'Week'`, `'Now'`, `'Locked'`, `'Done'`, `'The Abyss'`). Report which tests changed.

- [ ] **Step 3: Run full suite**

Run: `cd the-system && npx jest`
Expected: 90 pass (or updated count if you adjusted assertions).

- [ ] **Step 4: Commit**

```bash
git add the-system/src/screens/AscensionPath.tsx the-system/__tests__
git commit -m "feat: Ascend constellation spark-trail redesign (warm zones, spark nodes, Lora)"
```

---

### Task 3: Font sweep — finish everywhere

**Files:**
- Modify: `the-system/src/screens/Mirror.tsx` (player nameplate) + any other screen/component with leftover ALL-CAPS chrome or missing Lora on a heading.

- [ ] **Step 1: Audit leftovers**

Run, from `the-system`:
```bash
grep -rnE "toUpperCase|letterSpacing: ?[2-9]|textTransform: ?'uppercase'" src
grep -rnoE ">[A-Z][A-Z ]{3,}<" src/screens src/components
```
List every hit. For each, classify as **chrome** (title/label/section/button/stat/nameplate → fix) or **content** (discipline name, quote, lore body, user-entered value → leave).

- [ ] **Step 2: Fix the Mirror nameplate**

In `the-system/src/screens/Mirror.tsx`, the player name renders ALL-CAPS. Find the `heroName` Text + its style. Remove any `textTransform: 'uppercase'` from the style and any `.toUpperCase()` applied to the name value, so it renders in the player's natural case. Keep `fontFamily: FONTS.display` and a calm `letterSpacing` (≤0.5). Example: if the style has `heroName: { ..., letterSpacing: 2, textTransform: 'uppercase' }`, change to `heroName: { ..., letterSpacing: 0.3 }` and render `{hero.name}` (not `{hero.name.toUpperCase()}`).

- [ ] **Step 3: Apply the rule to every other leftover from Step 1**

For each remaining **chrome** hit:
- Replace ALL-CAPS literal with sentence case (first word capitalized; keep acronyms like XP/JSON).
- Remove `.toUpperCase()` / `textTransform: 'uppercase'` on chrome labels.
- If it is a heading/title/section/stat-value/primary-button style missing `fontFamily: FONTS.display`, add it (import `FONTS` from the correct relative `../theme/typography`). Body/caption/description stay Inter.
- Reduce any `letterSpacing` ≥ 2 on heading/label styles to 0.3 (titles) / 0.5 (small labels).
Leave all **content** strings untouched.

- [ ] **Step 4: Verify no chrome caps remain**

Run: `grep -rnoE ">[A-Z][A-Z ]{3,}<" src/screens src/components`
Expected: only matches that are content (e.g. an acronym, or a discipline-derived value) — report each remaining and why it's content. Run `grep -rn "toUpperCase\|textTransform: 'uppercase'" src` and confirm none apply to chrome/nameplate.

- [ ] **Step 5: Run tests**

Run: `cd the-system && npx jest`
Expected: all pass; update any test asserting an exact uppercase chrome string you changed (report which).

- [ ] **Step 6: Commit**

```bash
git add the-system/src the-system/__tests__
git commit -m "feat: finish Claude typography — sentence-case + Lora on all remaining chrome (incl. nameplate)"
```

---

### Task 4: Build, install, verify on device

**Files:** none (build/verify only).

- [ ] **Step 1: Prebuild (NEVER --clean) — only if native config changed**

These tasks are JS-only, so prebuild is not required. Skip unless `app.json`/native changed.

- [ ] **Step 2: Release build (JBR 21)**

Run (PowerShell): `$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'; cd the-system/android; .\gradlew.bat assembleRelease`
Expected: BUILD SUCCESSFUL; APK at `the-system/android/app/build/outputs/apk/release/app-release.apk`.

- [ ] **Step 3: Install + verify**

```bash
adb install -r the-system/android/app/build/outputs/apk/release/app-release.apk
adb shell am force-stop com.thesystem
adb shell monkey -p com.thesystem -c android.intent.category.LAUNCHER 1
```
Screenshot-verify: Ascend (warm zones, spark nodes, current-week glow, a zone title, tap a node → warm modal with italic lore), Mirror (nameplate natural case), and spot-check other screens for any missed caps. Capture with `adb exec-out screencap -p > /tmp/v.png` and Read it.

---

## Self-Review

- **Spec coverage:** ClaudeSpark glow (T1), Ascend nodes/trail/zones/modal/header + sentence case (T2), font finish-everywhere incl. nameplate (T3), build+verify (T4). All spec sections mapped.
- **Placeholders:** none — full file provided in T2; T3 rules are concrete with grep anchors.
- **Type consistency:** `NodeState` union used in `TrailNode`/`NodeRow`; `ClaudeSpark` props `rank`/`size`/`tint`/`glow` match Task 1's added `glow` + existing `tint`. `FONTS.display`/`FONTS.displayRegular` exist in `src/theme/typography.ts`.
