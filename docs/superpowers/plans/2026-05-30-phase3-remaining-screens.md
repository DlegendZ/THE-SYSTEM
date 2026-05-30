# Phase 3: Remaining Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill in all stub screens (Mirror, AscensionPath, Archive, Codex) and add modal screens (MandateReveal, LevelUpSplash, Settings). Wire CommandHall to navigate to modals.

**Architecture:** Root stack navigator wraps MainTabs + modal screens. Modal screens use `presentation: 'modal'` (React Navigation 7). CommandHall uses `useNavigation()` to push modals. Phase 2 SVG components (AvatarDisplay, RankPromotionSplash, MandateChest) are assumed already built.

**Tech Stack:** React Navigation 7 stack/tabs, Zustand 5 store, expo-sqlite, TypeScript strict

---

## File Structure

```
src/
  navigation/
    types.ts                — RootStackParamList type
    AppNavigator.tsx        — add modal screens to root stack
  screens/
    MandateReveal.tsx       — chest-opening modal
    LevelUpSplash.tsx       — level-up celebration modal
    Settings.tsx            — settings modal
    Mirror.tsx              — avatar room (replace stub)
    AscensionPath.tsx       — 24-node world map (replace stub)
    Archive.tsx             — stats with 4 tabs (replace stub)
    Codex.tsx               — discipline manager (replace stub)
    CommandHall.tsx         — add settings icon + mandate chest button
  db/
    queries.ts              — add getLogsForRange, getAllMandates, setDisciplineActive,
                              createCustomDiscipline, deleteDiscipline
```

---

## Task 1: Navigation Types + Modal Stack

**Files:**
- Create: `the-system/src/navigation/types.ts`
- Modify: `the-system/src/navigation/AppNavigator.tsx`

- [ ] **Step 1: Create navigation types**

Create `the-system/src/navigation/types.ts`:
```typescript
export type RootStackParamList = {
  Awakening: undefined;
  Main: undefined;
  MandateReveal: undefined;
  LevelUpSplash: {
    level: number;
    xpGained: number;
    rankChanged: boolean;
    newRank: string;
  };
  Settings: undefined;
};
```

- [ ] **Step 2: Update AppNavigator to add modal screens**

Replace `the-system/src/navigation/AppNavigator.tsx` entirely:
```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useSystemStore } from '../store/useSystemStore';
import type { RootStackParamList } from './types';

import CommandHall from '../screens/CommandHall';
import AscensionPath from '../screens/AscensionPath';
import Mirror from '../screens/Mirror';
import Codex from '../screens/Codex';
import Archive from '../screens/Archive';
import Awakening from '../screens/Awakening';
import MandateReveal from '../screens/MandateReveal';
import LevelUpSplash from '../screens/LevelUpSplash';
import Settings from '../screens/Settings';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused, color }: { label: string; focused: boolean; color: string }) {
  return (
    <Text style={{ color, fontSize: 10, fontWeight: focused ? 'bold' : 'normal' }}>
      {label}
    </Text>
  );
}

function MainTabs() {
  const theme = useSystemStore((s) => s.currentTheme);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.primary,
          borderTopColor: theme.accent,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
      }}
    >
      <Tab.Screen
        name="CommandHall"
        component={CommandHall}
        options={{
          tabBarLabel: 'COMMAND',
          tabBarIcon: ({ focused, color }) => <TabIcon label="⚔" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="AscensionPath"
        component={AscensionPath}
        options={{
          tabBarLabel: 'ASCEND',
          tabBarIcon: ({ focused, color }) => <TabIcon label="▲" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Mirror"
        component={Mirror}
        options={{
          tabBarLabel: 'MIRROR',
          tabBarIcon: ({ focused, color }) => <TabIcon label="◆" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Codex"
        component={Codex}
        options={{
          tabBarLabel: 'CODEX',
          tabBarIcon: ({ focused, color }) => <TabIcon label="≡" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Archive"
        component={Archive}
        options={{
          tabBarLabel: 'ARCHIVE',
          tabBarIcon: ({ focused, color }) => <TabIcon label="◫" focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { initialized, onboardingComplete } = useSystemStore();

  if (!initialized) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>THE SYSTEM</Text>
        <Text style={styles.loadingSub}>INITIALIZING...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboardingComplete ? (
          <Stack.Screen name="Awakening" component={Awakening} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="MandateReveal"
              component={MandateReveal}
              options={{ presentation: 'transparentModal', cardStyle: { backgroundColor: 'transparent' } }}
            />
            <Stack.Screen
              name="LevelUpSplash"
              component={LevelUpSplash}
              options={{ presentation: 'transparentModal', cardStyle: { backgroundColor: 'transparent' } }}
            />
            <Stack.Screen
              name="Settings"
              component={Settings}
              options={{ presentation: 'modal' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffd700',
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingSub: {
    color: '#666',
    fontSize: 12,
    marginTop: 12,
  },
});
```

- [ ] **Step 3: Write test**

Create `the-system/__tests__/navigation/types.test.ts`:
```typescript
import type { RootStackParamList } from '../../src/navigation/types';

describe('RootStackParamList types', () => {
  it('LevelUpSplash params have required fields', () => {
    const params: RootStackParamList['LevelUpSplash'] = {
      level: 5,
      xpGained: 300,
      rankChanged: false,
      newRank: 'E',
    };
    expect(params.level).toBe(5);
    expect(params.xpGained).toBe(300);
    expect(params.rankChanged).toBe(false);
    expect(params.newRank).toBe('E');
  });
});
```

Run: `cd the-system && npx jest __tests__/navigation/types.test.ts --no-coverage`
Expected: PASS

- [ ] **Step 4: Commit**

```powershell
cd the-system
git add src/navigation/types.ts src/navigation/AppNavigator.tsx __tests__/navigation/
git commit -m "feat: add modal stack navigation and RootStackParamList types"
```

---

## Task 2: Add Missing DB Queries

**Files:**
- Modify: `the-system/src/db/queries.ts`

- [ ] **Step 1: Add getLogsForRange**

Append to `the-system/src/db/queries.ts`:
```typescript
export async function getLogsForRange(
  startDate: string,
  endDate: string
): Promise<DisciplineLog[]> {
  return getDb().getAllAsync<DisciplineLog>(
    `SELECT * FROM discipline_logs
     WHERE log_date >= ? AND log_date <= ?
     ORDER BY log_date, discipline_id`,
    [startDate, endDate]
  );
}

export async function getAllMandates(): Promise<Mandate[]> {
  return getDb().getAllAsync<Mandate>(
    'SELECT * FROM mandates ORDER BY granted_at DESC'
  );
}

export async function setDisciplineActive(id: number, active: boolean): Promise<void> {
  await getDb().runAsync(
    'UPDATE disciplines SET is_active = ? WHERE id = ?',
    [active ? 1 : 0, id]
  );
}

export async function createCustomDiscipline(data: {
  name: string;
  description: string;
  difficulty: string;
  xpGain: number;
  xpLoss: number;
  deadlineTime: string | null;
}): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO disciplines (code, name, description, difficulty, xp_gain, xp_loss, deadline_time, is_active, is_custom, frequency, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 'daily', ?)`,
    [
      `CUSTOM_${Date.now()}`,
      data.name,
      data.description,
      data.difficulty,
      data.xpGain,
      data.xpLoss,
      data.deadlineTime,
      new Date().toISOString(),
    ]
  );
}

export async function deleteDiscipline(id: number): Promise<void> {
  await getDb().runAsync(
    'DELETE FROM disciplines WHERE id = ? AND is_custom = 1',
    [id]
  );
  await getDb().runAsync(
    'DELETE FROM discipline_logs WHERE discipline_id = ?',
    [id]
  );
}

export async function getDisciplineLogsAll(disciplineId: number): Promise<DisciplineLog[]> {
  return getDb().getAllAsync<DisciplineLog>(
    'SELECT * FROM discipline_logs WHERE discipline_id = ? ORDER BY log_date DESC',
    [disciplineId]
  );
}
```

- [ ] **Step 2: Write tests**

Create `the-system/__tests__/db/queries-phase3.test.ts`:
```typescript
import { initDatabase } from '../../src/db/database';
import {
  getLogsForRange,
  getAllMandates,
  setDisciplineActive,
  createCustomDiscipline,
  deleteDiscipline,
  getAllDisciplines,
  getDiscipline,
} from '../../src/db/queries';

beforeAll(async () => {
  await initDatabase();
});

describe('getLogsForRange', () => {
  it('returns empty array when no logs in range', async () => {
    const logs = await getLogsForRange('2030-01-01', '2030-01-07');
    expect(logs).toEqual([]);
  });
});

describe('getAllMandates', () => {
  it('returns array', async () => {
    const mandates = await getAllMandates();
    expect(Array.isArray(mandates)).toBe(true);
  });
});

describe('setDisciplineActive + createCustomDiscipline + deleteDiscipline', () => {
  it('toggles discipline active state', async () => {
    const before = await getAllDisciplines();
    const rise = before.find(d => d.code === 'RISE');
    expect(rise).toBeDefined();
    await setDisciplineActive(rise!.id, false);
    const after = await getDiscipline(rise!.id);
    expect(after?.is_active).toBe(0);
    // restore
    await setDisciplineActive(rise!.id, true);
  });

  it('creates and deletes a custom discipline', async () => {
    await createCustomDiscipline({
      name: 'Test Habit',
      description: 'Test description',
      difficulty: 'EASY',
      xpGain: 10,
      xpLoss: 5,
      deadlineTime: '23:59',
    });
    const all = await getAllDisciplines();
    const custom = all.find(d => d.name === 'Test Habit');
    expect(custom).toBeDefined();
    await deleteDiscipline(custom!.id);
    const allAfter = await getAllDisciplines();
    expect(allAfter.find(d => d.name === 'Test Habit')).toBeUndefined();
  });
});
```

Run: `cd the-system && npx jest __tests__/db/queries-phase3.test.ts --no-coverage`
Expected: PASS

- [ ] **Step 3: Commit**

```powershell
cd the-system
git add src/db/queries.ts __tests__/db/queries-phase3.test.ts
git commit -m "feat: add Phase 3 queries (range logs, custom disciplines, mandate list)"
```

---

## Task 3: MandateReveal Modal

**Files:**
- Create: `the-system/src/screens/MandateReveal.tsx`

- [ ] **Step 1: Write MandateReveal screen**

Create `the-system/src/screens/MandateReveal.tsx`:
```tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSystemStore } from '../store/useSystemStore';
import type { RootStackParamList } from '../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

const TIER_COLORS = {
  BRONZE: '#b87333',
  SILVER: '#c0c0c0',
  GOLD: '#ffd700',
};

const LOOT_TYPE_LABELS: Record<string, string> = {
  scroll: 'SYSTEM SCROLL',
  title: 'TITLE UNLOCKED',
  accessory: 'ACCESSORY',
  cosmetic_variant: 'COSMETIC VARIANT',
  background: 'BACKGROUND UNLOCKED',
  equipment_tier: 'EQUIPMENT UPGRADE',
  aura_variant: 'AURA VARIANT',
};

export default function MandateReveal() {
  const navigation = useNavigation<Nav>();
  const { pendingMandate, openMandate, currentTheme: theme } = useSystemStore();
  const [loot, setLoot] = useState<{ type: string; name: string } | null>(null);
  const [opened, setOpened] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const lootAnim = useRef(new Animated.Value(0)).current;

  const tierColor =
    pendingMandate ? TIER_COLORS[pendingMandate.tier] ?? '#b87333' : '#b87333';

  React.useEffect(() => {
    // idle pulse on chest
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [glowAnim]);

  const handleTapChest = async () => {
    if (opened) return;

    // Shake animation
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start(async () => {
      const result = await openMandate();
      if (result) {
        setLoot(result);
        setOpened(true);
        Animated.spring(lootAnim, { toValue: 1, useNativeDriver: true }).start();
      }
    });
  };

  const handleDismiss = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.overlay}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: tierColor }]}>
          {pendingMandate?.tier ?? 'BRONZE'} MANDATE
        </Text>

        {!opened ? (
          <>
            <Animated.View
              style={[
                styles.chestArea,
                {
                  transform: [{ translateX: shakeAnim }],
                  opacity: glowAnim,
                },
              ]}
            >
              {/* Pixel chest representation */}
              <View style={[styles.chestPixel, { backgroundColor: tierColor }]}>
                <View style={[styles.chestLid, { backgroundColor: tierColor, borderBottomColor: theme.background }]} />
                <View style={styles.chestLock} />
              </View>
            </Animated.View>
            <Text style={[styles.tapHint, { color: theme.textSecondary }]}>
              TAP TO OPEN
            </Text>
            <TouchableOpacity style={styles.chestTouchArea} onPress={handleTapChest} />
          </>
        ) : (
          <Animated.View
            style={[
              styles.lootContainer,
              {
                opacity: lootAnim,
                transform: [{ scale: lootAnim }],
              },
            ]}
          >
            <Text style={[styles.lootCategory, { color: tierColor }]}>
              {loot ? LOOT_TYPE_LABELS[loot.type] ?? loot.type.toUpperCase() : ''}
            </Text>
            <Text style={[styles.lootName, { color: theme.text }]}>
              {loot?.name ?? ''}
            </Text>
            <View style={[styles.divider, { backgroundColor: tierColor }]} />
            <TouchableOpacity
              style={[styles.dismissButton, { borderColor: tierColor }]}
              onPress={handleDismiss}
            >
              <Text style={[styles.dismissText, { color: tierColor }]}>
                MANDATE RECEIVED
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {!opened && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleDismiss}>
            <Text style={[styles.cancelText, { color: theme.textSecondary }]}>
              CLOSE
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.85,
    padding: 32,
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#333',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 32,
  },
  chestArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  chestPixel: {
    width: 80,
    height: 64,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chestLid: {
    position: 'absolute',
    top: 0,
    width: 80,
    height: 28,
    borderBottomWidth: 3,
    borderRadius: 4,
  },
  chestLock: {
    width: 16,
    height: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    marginTop: 8,
  },
  chestTouchArea: {
    position: 'absolute',
    width: 120,
    height: 120,
  },
  tapHint: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 8,
  },
  lootContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  lootCategory: {
    fontSize: 10,
    letterSpacing: 3,
    marginBottom: 12,
  },
  lootName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  divider: {
    width: 60,
    height: 2,
    marginBottom: 24,
  },
  dismissButton: {
    borderWidth: 2,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  dismissText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  cancelButton: {
    marginTop: 24,
    padding: 8,
  },
  cancelText: {
    fontSize: 10,
    letterSpacing: 1,
  },
});
```

- [ ] **Step 2: Write test**

Create `the-system/__tests__/screens/MandateReveal.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';

// MandateReveal relies on navigation and store — test render with mocks
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

jest.mock('../../src/store/useSystemStore', () => ({
  useSystemStore: () => ({
    pendingMandate: { id: 1, tier: 'BRONZE', opened: 0, granted_at: '2026-01-01T00:00:00Z' },
    openMandate: jest.fn().mockResolvedValue({ type: 'scroll', name: 'Test scroll' }),
    currentTheme: {
      background: '#1a1a1a', primary: '#2a2a2a', accent: '#666', text: '#aaa',
      textSecondary: '#777', borderStyle: 'cracked_stone', auraColor: null,
      particleType: 'dust', particleCount: 8, avatarFloat: false, screenGlow: false,
    },
  }),
}));

import MandateReveal from '../../src/screens/MandateReveal';

describe('MandateReveal', () => {
  it('renders without crashing', () => {
    render(<MandateReveal />);
  });
});
```

Run: `cd the-system && npx jest __tests__/screens/MandateReveal.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 3: Commit**

```powershell
cd the-system
git add src/screens/MandateReveal.tsx __tests__/screens/MandateReveal.test.tsx
git commit -m "feat: add MandateReveal modal screen with chest opening animation"
```

---

## Task 4: LevelUpSplash + RankUpSplash Modals

**Files:**
- Create: `the-system/src/screens/LevelUpSplash.tsx`

- [ ] **Step 1: Write LevelUpSplash**

Create `the-system/src/screens/LevelUpSplash.tsx`:
```tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp, RouteProp } from '@react-navigation/stack';
import { useSystemStore } from '../store/useSystemStore';
import { RANK_TITLES } from '../engine/xpConstants';
import type { RootStackParamList } from '../navigation/types';
import type { Rank } from '../types';

type Nav = StackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'LevelUpSplash'>;

const RANK_COLORS: Record<string, string> = {
  E: '#666666',
  D: '#b87333',
  C: '#f0a500',
  B: '#ffd700',
  A: '#ffe566',
  S: '#ffffff',
};

export default function LevelUpSplash() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { level, xpGained, rankChanged, newRank } = route.params;
  const theme = useSystemStore((s) => s.currentTheme);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const rankColor = RANK_COLORS[newRank] ?? theme.accent;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.15, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();

    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [scaleAnim, fadeAnim, glowAnim]);

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: theme.background, opacity: fadeAnim },
        ]}
      >
        {rankChanged ? (
          <>
            <Text style={[styles.rankUpLabel, { color: rankColor }]}>RANK UP!</Text>
            <Animated.Text
              style={[
                styles.rankLetter,
                { color: rankColor, transform: [{ scale: scaleAnim }] },
              ]}
            >
              {newRank}
            </Animated.Text>
            <Text style={[styles.rankTitle, { color: theme.text }]}>
              {RANK_TITLES[newRank as Rank] ?? ''}
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.levelUpLabel, { color: rankColor }]}>LEVEL UP!</Text>
            <Animated.Text
              style={[
                styles.levelNumber,
                { color: theme.accent, transform: [{ scale: scaleAnim }] },
              ]}
            >
              {level}
            </Animated.Text>
          </>
        )}

        <Animated.Text style={[styles.xpLabel, { color: theme.textSecondary, opacity: glowAnim }]}>
          +{xpGained} XP
        </Animated.Text>

        <TouchableOpacity
          style={[styles.continueButton, { borderColor: rankColor }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.continueText, { color: rankColor }]}>CONTINUE</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.85,
    padding: 40,
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#333',
  },
  rankUpLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 4,
    marginBottom: 16,
  },
  levelUpLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 4,
    marginBottom: 16,
  },
  rankLetter: {
    fontSize: 80,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rankTitle: {
    fontSize: 14,
    letterSpacing: 2,
    marginBottom: 24,
  },
  levelNumber: {
    fontSize: 80,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  xpLabel: {
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 32,
  },
  continueButton: {
    borderWidth: 2,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  continueText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
});
```

- [ ] **Step 2: Write test**

Create `the-system/__tests__/screens/LevelUpSplash.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
  useRoute: () => ({
    params: { level: 5, xpGained: 150, rankChanged: false, newRank: 'E' },
  }),
}));

jest.mock('../../src/store/useSystemStore', () => ({
  useSystemStore: () => ({
    currentTheme: {
      background: '#1a1a1a', primary: '#2a2a2a', accent: '#666', text: '#aaa',
      textSecondary: '#777', borderStyle: 'cracked_stone', auraColor: null,
      particleType: 'dust', particleCount: 8, avatarFloat: false, screenGlow: false,
    },
  }),
}));

import LevelUpSplash from '../../src/screens/LevelUpSplash';

describe('LevelUpSplash', () => {
  it('renders level up without crashing', () => {
    render(<LevelUpSplash />);
  });
});
```

Run: `cd the-system && npx jest __tests__/screens/LevelUpSplash.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 3: Commit**

```powershell
cd the-system
git add src/screens/LevelUpSplash.tsx __tests__/screens/LevelUpSplash.test.tsx
git commit -m "feat: add LevelUpSplash and RankUpSplash modal screens"
```

---

## Task 5: Settings Modal

**Files:**
- Create: `the-system/src/screens/Settings.tsx`

- [ ] **Step 1: Write Settings screen**

Create `the-system/src/screens/Settings.tsx`:
```tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSystemStore } from '../store/useSystemStore';
import { getSystemState, setSystemState } from '../db/queries';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { version } from 'expo/package.json';

type Nav = { goBack: () => void };

const INTERVALS = [1, 2, 3, 4, 6];

export default function Settings() {
  const navigation = useNavigation<Nav>();
  const { hero, currentTheme: theme, initialize } = useSystemStore();

  const [notifInterval, setNotifInterval] = useState(3);
  const [quietStart, setQuietStart] = useState('00:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [resetConfirm, setResetConfirm] = useState('');

  useEffect(() => {
    (async () => {
      const interval = await getSystemState('notification_interval');
      const qs = await getSystemState('quiet_start');
      const qe = await getSystemState('quiet_end');
      if (interval) setNotifInterval(parseInt(interval, 10));
      if (qs) setQuietStart(qs);
      if (qe) setQuietEnd(qe);
    })();
  }, []);

  const saveInterval = async (v: number) => {
    setNotifInterval(v);
    await setSystemState('notification_interval', String(v));
  };

  const handleResetJourney = async () => {
    if (resetConfirm !== 'I ACCEPT THE RESET') {
      Alert.alert('TYPE THE PHRASE', 'Type exactly: I ACCEPT THE RESET');
      return;
    }
    Alert.alert(
      'FINAL WARNING',
      'This will wipe ALL data. There is no undo.',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'RESET',
          style: 'destructive',
          onPress: async () => {
            const db = (await import('../db/database')).getDb();
            await db.runAsync('DELETE FROM hero');
            await db.runAsync('DELETE FROM discipline_logs');
            await db.runAsync('DELETE FROM silence_streak');
            await db.runAsync('DELETE FROM cosmetics');
            await db.runAsync('DELETE FROM mandates');
            await db.runAsync("DELETE FROM system_state WHERE key != 'notification_interval'");
            await initialize();
          },
        },
      ]
    );
  };

  const journeyDays = hero
    ? differenceInCalendarDays(new Date(), parseISO(hero.journey_start_date)) + 1
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>SETTINGS</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.closeBtn, { color: theme.textSecondary }]}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Notifications */}
        <Text style={[styles.sectionHeader, { color: theme.accent }]}>NOTIFICATIONS</Text>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Interval (hours)</Text>
        <View style={styles.intervalRow}>
          {INTERVALS.map((v) => (
            <TouchableOpacity
              key={v}
              style={[
                styles.intervalBtn,
                {
                  borderColor: notifInterval === v ? theme.accent : theme.textSecondary,
                  backgroundColor: notifInterval === v ? theme.accent + '30' : 'transparent',
                },
              ]}
              onPress={() => saveInterval(v)}
            >
              <Text
                style={[
                  styles.intervalText,
                  { color: notifInterval === v ? theme.accent : theme.textSecondary },
                ]}
              >
                {v}h
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: theme.textSecondary }]}>
          Quiet hours: {quietStart} – {quietEnd}
        </Text>

        {/* About */}
        <Text style={[styles.sectionHeader, { color: theme.accent }]}>ABOUT</Text>
        <Text style={[styles.infoText, { color: theme.text }]}>
          Player: {hero?.name ?? 'Unknown'}
        </Text>
        <Text style={[styles.infoText, { color: theme.text }]}>
          Journey start: {hero?.journey_start_date ?? '—'}
        </Text>
        <Text style={[styles.infoText, { color: theme.text }]}>
          Day {journeyDays} of 180
        </Text>
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          Expo SDK {version}
        </Text>

        {/* Danger Zone */}
        <Text style={[styles.sectionHeader, { color: '#ff4444' }]}>DANGER ZONE</Text>
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          Type "I ACCEPT THE RESET" to enable reset:
        </Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: '#ff4444' }]}
          value={resetConfirm}
          onChangeText={setResetConfirm}
          placeholder="Type here..."
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="characters"
        />
        <TouchableOpacity
          style={[
            styles.resetButton,
            {
              backgroundColor:
                resetConfirm === 'I ACCEPT THE RESET' ? '#ff4444' : '#333',
            },
          ]}
          onPress={handleResetJourney}
        >
          <Text style={styles.resetText}>RESET JOURNEY</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: { fontSize: 14, fontWeight: 'bold', letterSpacing: 3 },
  closeBtn: { fontSize: 18, padding: 4 },
  scroll: { flex: 1, padding: 16 },
  sectionHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginTop: 24,
    marginBottom: 12,
  },
  label: { fontSize: 11, marginBottom: 8 },
  intervalRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  intervalBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 2,
  },
  intervalText: { fontSize: 11, fontWeight: 'bold' },
  infoText: { fontSize: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 2,
    padding: 8,
    marginBottom: 12,
    fontSize: 12,
  },
  resetButton: {
    padding: 14,
    alignItems: 'center',
    borderRadius: 2,
    marginBottom: 16,
  },
  resetText: { color: '#fff', fontSize: 12, fontWeight: 'bold', letterSpacing: 2 },
  bottomPadding: { height: 64 },
});
```

- [ ] **Step 2: Write test**

Create `the-system/__tests__/screens/Settings.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

jest.mock('../../src/store/useSystemStore', () => ({
  useSystemStore: () => ({
    hero: {
      name: 'Test', hero_class: 'Warrior', global_xp: 0,
      global_level: 1, rank: 'E', journey_start_date: '2026-01-01', journey_complete: 0,
    },
    currentTheme: {
      background: '#1a1a1a', primary: '#2a2a2a', accent: '#666', text: '#aaa',
      textSecondary: '#777', borderStyle: 'cracked_stone', auraColor: null,
      particleType: 'dust', particleCount: 8, avatarFloat: false, screenGlow: false,
    },
    initialize: jest.fn(),
  }),
}));

jest.mock('../../src/db/queries', () => ({
  getSystemState: jest.fn().mockResolvedValue(null),
  setSystemState: jest.fn().mockResolvedValue(undefined),
}));

import Settings from '../../src/screens/Settings';

describe('Settings', () => {
  it('renders without crashing', () => {
    render(<Settings />);
  });
});
```

Run: `cd the-system && npx jest __tests__/screens/Settings.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 3: Commit**

```powershell
cd the-system
git add src/screens/Settings.tsx __tests__/screens/Settings.test.tsx
git commit -m "feat: add Settings modal (notifications, about, danger zone reset)"
```

---

## Task 6: Mirror Screen

**Files:**
- Modify: `the-system/src/screens/Mirror.tsx`

- [ ] **Step 1: Replace Mirror stub**

Replace `the-system/src/screens/Mirror.tsx` entirely:
```tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSystemStore } from '../store/useSystemStore';
import { getCosmetics } from '../db/queries';
import { RANK_TITLES } from '../engine/xpConstants';
import type { Cosmetic } from '../types';
import type { Rank } from '../types';

// AvatarDisplay from Phase 2 — import if available, otherwise placeholder
let AvatarDisplay: React.ComponentType<{ heroClass: string; mood: string; weaponTier: number; armorTier: number; rank: string }> | null = null;
try {
  AvatarDisplay = require('../components/avatar/AvatarDisplay').default;
} catch {
  AvatarDisplay = null;
}

type MoodState = 'radiant' | 'steady' | 'worn' | 'broken';

const COSMETIC_LABELS: Record<string, string> = {
  weapon: 'WEAPON',
  armor: 'ARMOR',
  crown: 'CROWN',
  title: 'TITLE',
  background: 'BG',
  accessory: 'ACCESSORY',
};

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

  const weaponTier = equippedWeapon?.tier ?? 1;
  const armorTier = equippedArmor?.tier ?? 1;

  // Compute mood from today's completion rate
  const completedToday = todayLogs.filter((l) => l.completed).length;
  const activeDisciplines = disciplines.filter((d) => d.is_active).length;
  const completionRate = activeDisciplines > 0 ? completedToday / activeDisciplines : 0;
  const mood = computeMood(completionRate);

  const titles = cosmetics.filter((c) => c.type === 'title' && c.unlocked);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.heroName, { color: theme.text }]}>{hero.name}</Text>
          <View style={[styles.rankBadge, { borderColor: theme.accent }]}>
            <Text style={[styles.rankText, { color: theme.accent }]}>{hero.rank}</Text>
          </View>
        </View>
        <Text style={[styles.rankTitle, { color: theme.textSecondary }]}>
          {RANK_TITLES[hero.rank as Rank]}
        </Text>

        {/* Avatar Area */}
        <View style={styles.avatarArea}>
          {AvatarDisplay ? (
            <AvatarDisplay
              heroClass={hero.hero_class}
              mood={mood}
              weaponTier={weaponTier}
              armorTier={armorTier}
              rank={hero.rank}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { borderColor: theme.accent }]}>
              <Text style={[styles.avatarClass, { color: theme.accent }]}>
                {hero.hero_class.toUpperCase()}
              </Text>
              <Text style={[styles.avatarMood, { color: theme.textSecondary }]}>
                [{mood.toUpperCase()}]
              </Text>
            </View>
          )}
        </View>

        {/* Equipment Slots */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>EQUIPMENT</Text>
        <View style={styles.equipRow}>
          {[
            { label: 'WEAPON', item: equippedWeapon, tier: weaponTier },
            { label: 'ARMOR', item: equippedArmor, tier: armorTier },
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

        {/* Stats Panel */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>STATS</Text>
        {STAT_DISCIPLINES.map(({ label, code }) => {
          const discipline = disciplines.find((d) => d.code === code);
          const log = todayLogs.find((l) => l.discipline_id === discipline?.id);
          const completed = log?.completed === 1;
          const fillPct = completed ? 1 : 0.3;
          const BAR_WIDTH = 120;
          return (
            <View key={code} style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
              <View style={[styles.statBarBg, { backgroundColor: '#333' }]}>
                <View
                  style={[
                    styles.statBarFill,
                    { width: BAR_WIDTH * fillPct, backgroundColor: theme.accent },
                  ]}
                />
              </View>
              <Text style={[styles.statValue, { color: theme.accent }]}>
                Lv.{hero.global_level}
              </Text>
            </View>
          );
        })}

        {/* Titles */}
        {titles.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>TITLES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {titles.map((t) => (
                <View
                  key={t.id}
                  style={[styles.titleChip, { borderColor: theme.accent }]}
                >
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  heroName: { fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  rankBadge: { borderWidth: 2, paddingHorizontal: 10, paddingVertical: 2 },
  rankText: { fontSize: 16, fontWeight: 'bold' },
  rankTitle: { fontSize: 10, paddingHorizontal: 16, marginTop: 2, marginBottom: 16, letterSpacing: 2 },
  avatarArea: { alignItems: 'center', marginVertical: 24 },
  avatarPlaceholder: {
    width: 96,
    height: 128,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  avatarClass: { fontSize: 14, fontWeight: 'bold' },
  avatarMood: { fontSize: 10, marginTop: 4 },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  equipRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  equipSlot: {
    flex: 1,
    borderWidth: 1,
    padding: 8,
    alignItems: 'center',
    minHeight: 80,
  },
  equipLabel: { fontSize: 9, letterSpacing: 1, marginBottom: 4 },
  equipTier: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  equipName: { fontSize: 9, textAlign: 'center' },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statLabel: { fontSize: 10, width: 90 },
  statBarBg: { height: 8, width: 120, borderRadius: 1, overflow: 'hidden', flex: 1 },
  statBarFill: { height: 8 },
  statValue: { fontSize: 10, marginLeft: 8, width: 40 },
  titleChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 16,
    marginRight: 4,
  },
  titleText: { fontSize: 10 },
  bottomPadding: { height: 64 },
});
```

- [ ] **Step 2: Write test**

Create `the-system/__tests__/screens/Mirror.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../../src/store/useSystemStore', () => ({
  useSystemStore: () => ({
    hero: {
      id: 1, name: 'Test Hero', hero_class: 'Warrior', global_xp: 0,
      global_level: 1, rank: 'E', journey_start_date: '2026-01-01', journey_complete: 0,
    },
    todayLogs: [],
    disciplines: [
      { id: 1, code: 'FORGE', name: 'Iron Temple', is_active: 1, difficulty: 'HARD',
        xp_gain: 60, xp_loss: 35, deadline_time: '23:59', is_custom: 0, frequency: 'daily',
        active_days: null, description: '', created_at: '' },
    ],
    currentTheme: {
      background: '#1a1a1a', primary: '#2a2a2a', accent: '#666', text: '#aaa',
      textSecondary: '#777', borderStyle: 'cracked_stone', auraColor: null,
      particleType: 'dust', particleCount: 8, avatarFloat: false, screenGlow: false,
    },
  }),
}));

jest.mock('../../src/db/queries', () => ({
  getCosmetics: jest.fn().mockResolvedValue([]),
}));

import Mirror from '../../src/screens/Mirror';

describe('Mirror', () => {
  it('renders without crashing', () => {
    render(<Mirror />);
  });
});
```

Run: `cd the-system && npx jest __tests__/screens/Mirror.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 3: Commit**

```powershell
cd the-system
git add src/screens/Mirror.tsx __tests__/screens/Mirror.test.tsx
git commit -m "feat: implement Mirror screen with avatar room, equipment slots, and stats"
```

---

## Task 7: AscensionPath Screen

**Files:**
- Modify: `the-system/src/screens/AscensionPath.tsx`

- [ ] **Step 1: Replace AscensionPath stub**

Replace `the-system/src/screens/AscensionPath.tsx` entirely:
```tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';
import { useSystemStore } from '../store/useSystemStore';
import { getWeekCompletionRate } from '../db/queries';
import { differenceInCalendarDays, parseISO } from 'date-fns';

const TOTAL_NODES = 24;

const ZONE_LABELS = [
  'UNDERGROUND CAVERN',   // nodes 1-4
  'RUINED KINGDOM',       // nodes 5-8
  'IRON MOUNTAINS',       // nodes 9-12
  'CASTLE IN THE CLOUDS', // nodes 13-16
  'STAR FIELDS',          // nodes 17-20
  'DIVINE APPROACH',      // nodes 21-24
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

function NodeRow({ nodeNum, completionRate, isCurrent, isLocked, onPress, theme }: {
  nodeNum: number;
  completionRate: number;
  isCurrent: boolean;
  isLocked: boolean;
  onPress: () => void;
  theme: { accent: string; text: string; textSecondary: string; primary: string };
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
              borderColor: isLocked ? '#444' : isCurrent ? theme.accent : theme.accent + '80',
              backgroundColor: isLocked
                ? '#222'
                : isCurrent
                ? theme.accent + '30'
                : completionRate >= 0.7
                ? theme.accent + '20'
                : 'transparent',
              transform: [{ scale: isCurrent ? pulseAnim : 1 }],
            },
          ]}
        >
          <Text style={[styles.nodeNum, { color: isLocked ? '#444' : theme.accent }]}>
            {nodeNum}
          </Text>
          {!isLocked && (
            <Text style={[styles.nodePct, { color: theme.textSecondary }]}>{pct}%</Text>
          )}
          {isLocked && (
            <Text style={[styles.nodeLock, { color: '#444' }]}>🔒</Text>
          )}
          {isCurrent && (
            <View style={[styles.currentDot, { backgroundColor: theme.accent }]} />
          )}
        </Animated.View>
      </TouchableOpacity>
      <View style={[styles.pathLine, { backgroundColor: isLocked ? '#333' : theme.accent + '40' }]} />
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
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          WEEK {currentWeek} OF {TOTAL_NODES}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.pathContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Render nodes in reverse (top = final, bottom = start) */}
        {Array.from({ length: TOTAL_NODES }, (_, i) => {
          const nodeNum = TOTAL_NODES - i; // 24 down to 1
          const zoneIdx = Math.floor((nodeNum - 1) / 4);
          const zoneColor = ZONE_COLORS[zoneIdx] ?? '#000';
          const isCurrent = nodeNum === currentWeek;
          const isLocked = nodeNum > currentWeek;
          const rate = completionRates[nodeNum - 1] ?? 0;

          return (
            <View key={nodeNum} style={[styles.zoneSection, { backgroundColor: zoneColor }]}>
              {nodeNum % 4 === 1 && (
                <Text style={[styles.zoneLabel, { color: '#555' }]}>
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

      {/* Lore Modal */}
      <Modal
        visible={selectedNode !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNode(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.background, borderColor: theme.accent }]}>
            <Text style={[styles.modalTitle, { color: theme.accent }]}>
              WEEK {selectedNode}
            </Text>
            <Text style={[styles.modalLore, { color: theme.text }]}>
              {selectedNode ? LORE[selectedNode - 1] : ''}
            </Text>
            {selectedNode && (
              <Text style={[styles.modalPct, { color: theme.textSecondary }]}>
                Completion: {Math.round((completionRates[selectedNode - 1] ?? 0) * 100)}%
              </Text>
            )}
            <TouchableOpacity
              style={[styles.modalClose, { borderColor: theme.accent }]}
              onPress={() => setSelectedNode(null)}
            >
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
  header: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: { fontSize: 14, fontWeight: 'bold', letterSpacing: 3 },
  subtitle: { fontSize: 10, marginTop: 2, letterSpacing: 2 },
  scroll: { flex: 1 },
  pathContainer: { paddingBottom: 32 },
  zoneSection: { paddingVertical: 4 },
  zoneLabel: {
    fontSize: 9,
    letterSpacing: 3,
    paddingHorizontal: 16,
    paddingVertical: 4,
    textAlign: 'center',
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginVertical: 8,
  },
  nodeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeNum: { fontSize: 18, fontWeight: 'bold' },
  nodePct: { fontSize: 9 },
  nodeLock: { fontSize: 14 },
  currentDot: {
    position: 'absolute',
    bottom: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pathLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: 300,
    padding: 24,
    borderWidth: 2,
  },
  modalTitle: { fontSize: 14, fontWeight: 'bold', letterSpacing: 2, marginBottom: 12 },
  modalLore: { fontSize: 12, lineHeight: 20, marginBottom: 12 },
  modalPct: { fontSize: 10, marginBottom: 16 },
  modalClose: { borderWidth: 1, padding: 10, alignItems: 'center' },
  modalCloseText: { fontSize: 11, fontWeight: 'bold', letterSpacing: 2 },
});
```

- [ ] **Step 2: Write test**

Create `the-system/__tests__/screens/AscensionPath.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../../src/store/useSystemStore', () => ({
  useSystemStore: () => ({
    hero: {
      id: 1, name: 'Test', hero_class: 'Warrior', global_xp: 0,
      global_level: 1, rank: 'E', journey_start_date: '2026-01-01', journey_complete: 0,
    },
    currentTheme: {
      background: '#1a1a1a', primary: '#2a2a2a', accent: '#666', text: '#aaa',
      textSecondary: '#777', borderStyle: 'cracked_stone', auraColor: null,
      particleType: 'dust', particleCount: 8, avatarFloat: false, screenGlow: false,
    },
  }),
}));

jest.mock('../../src/db/queries', () => ({
  getWeekCompletionRate: jest.fn().mockResolvedValue(0),
}));

import AscensionPath from '../../src/screens/AscensionPath';

describe('AscensionPath', () => {
  it('renders without crashing', () => {
    render(<AscensionPath />);
  });
});
```

Run: `cd the-system && npx jest __tests__/screens/AscensionPath.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 3: Commit**

```powershell
cd the-system
git add src/screens/AscensionPath.tsx __tests__/screens/AscensionPath.test.tsx
git commit -m "feat: implement AscensionPath with 24-node world map, zone backgrounds, lore modals"
```

---

## Task 8: Archive Screen

**Files:**
- Modify: `the-system/src/screens/Archive.tsx`

- [ ] **Step 1: Replace Archive stub**

Replace `the-system/src/screens/Archive.tsx` entirely:
```tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSystemStore } from '../store/useSystemStore';
import {
  getLogsForRange,
  getAllMandates,
  getDisciplineLogsAll,
  getSilenceStreak,
} from '../db/queries';
import { differenceInCalendarDays, parseISO, format, subDays } from 'date-fns';
import type { DisciplineLog, Discipline, Mandate } from '../types';
import type { Rank } from '../types';
import { RANK_TITLES } from '../engine/xpConstants';

type Tab = 'overview' | 'disciplines' | 'streaks' | 'history';

function HeatmapRow({ discipline, logs }: { discipline: Discipline; logs: DisciplineLog[] }) {
  // Last 28 days in a 7-wide grid
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
              {
                backgroundColor: day.completed
                  ? '#4caf50'
                  : day.failed
                  ? '#f44336'
                  : '#2a2a2a',
              },
            ]}
          />
        ))}
      </View>
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

    // Fetch last 28 days of logs
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

      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: theme.accent }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabBtn,
              activeTab === tab && { borderBottomWidth: 2, borderBottomColor: theme.accent },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? theme.accent : theme.textSecondary },
              ]}
            >
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              JOURNEY PROGRESS
            </Text>
            <View style={[styles.progressBg, { backgroundColor: '#333' }]}>
              <View
                style={[styles.progressFill, { width: `${progressPct * 100}%`, backgroundColor: theme.accent }]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.text }]}>
              Day {daysElapsed} of 180
            </Text>

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>RANK</Text>
            <Text style={[styles.bigStat, { color: theme.accent }]}>{hero.rank}-Rank</Text>
            <Text style={[styles.subStat, { color: theme.textSecondary }]}>
              {RANK_TITLES[hero.rank as Rank]}
            </Text>

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              TOTAL XP
            </Text>
            <Text style={[styles.bigStat, { color: theme.accent }]}>
              {hero.global_xp.toLocaleString()}
            </Text>

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              MANDATES RECEIVED
            </Text>
            <Text style={[styles.bigStat, { color: theme.accent }]}>
              {mandates.length}
            </Text>
          </View>
        )}

        {/* ── DISCIPLINES ── */}
        {activeTab === 'disciplines' && (
          <View style={styles.section}>
            {disciplines.map((d) => {
              const logs = disciplineLogs[d.id] ?? [];
              const completed = logs.filter((l) => l.completed).length;
              const failed = logs.filter((l) => l.failed).length;
              const recentForThisDiscipline = recentLogs.filter(
                (l) => l.discipline_id === d.id
              );
              return (
                <View key={d.id} style={[styles.disciplineCard, { borderColor: theme.accent + '40' }]}>
                  <Text style={[styles.disciplineName, { color: theme.text }]}>{d.name}</Text>
                  <HeatmapRow discipline={d} logs={recentForThisDiscipline} />
                  <View style={styles.statsRow}>
                    <Text style={[styles.statChip, { color: '#4caf50' }]}>
                      ✓ {completed}
                    </Text>
                    <Text style={[styles.statChip, { color: '#f44336' }]}>
                      ✗ {failed}
                    </Text>
                    <Text style={[styles.statChip, { color: theme.textSecondary }]}>
                      Total: {logs.length}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── STREAKS ── */}
        {activeTab === 'streaks' && (
          <View style={styles.section}>
            <SilenceStreakPanel theme={theme} />
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              ALL DISCIPLINES
            </Text>
            {disciplines.map((d) => {
              const logs = disciplineLogs[d.id] ?? [];
              return (
                <View key={d.id} style={styles.streakRow}>
                  <Text style={[styles.streakName, { color: theme.text }]}>{d.name}</Text>
                  <Text style={[styles.streakVal, { color: theme.accent }]}>
                    {logs.filter((l) => l.completed).length} completed
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── HISTORY ── */}
        {activeTab === 'history' && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              LAST 28 DAYS
            </Text>
            {[...new Set(recentLogs.map((l) => l.log_date))]
              .sort()
              .reverse()
              .map((date) => {
                const dayLogs = recentLogs.filter((l) => l.log_date === date);
                const completedCount = dayLogs.filter((l) => l.completed).length;
                const xpEarned = dayLogs.reduce((sum, l) => sum + (l.xp_delta > 0 ? l.xp_delta : 0), 0);
                return (
                  <View key={date} style={[styles.historyRow, { borderBottomColor: '#333' }]}>
                    <Text style={[styles.historyDate, { color: theme.textSecondary }]}>{date}</Text>
                    <Text style={[styles.historyCompleted, { color: '#4caf50' }]}>
                      {completedCount}/{disciplines.length}
                    </Text>
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

function SilenceStreakPanel({ theme }: { theme: { accent: string; text: string; textSecondary: string } }) {
  const [streak, setStreak] = useState<{ current_streak: number; longest_streak: number; total_relapses: number } | null>(null);

  useEffect(() => {
    getSilenceStreak().then(setStreak);
  }, []);

  if (!streak) return null;

  return (
    <View style={styles.silencePanel}>
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>SILENCE PROTOCOL</Text>
      <Text style={[styles.bigStat, { color: theme.accent }]}>
        {streak.current_streak} days
      </Text>
      <Text style={[styles.subStat, { color: theme.textSecondary }]}>
        Best: {streak.longest_streak} | Relapses: {streak.total_relapses}
      </Text>
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
  sectionLabel: {
    fontSize: 9, letterSpacing: 3, fontWeight: 'bold',
    marginTop: 20, marginBottom: 8,
  },
  progressBg: { height: 8, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: 8 },
  progressText: { fontSize: 11, marginBottom: 16 },
  bigStat: { fontSize: 28, fontWeight: 'bold' },
  subStat: { fontSize: 10, marginBottom: 16 },
  disciplineCard: {
    borderWidth: 1, padding: 12, marginBottom: 12, borderRadius: 2,
  },
  disciplineName: { fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  heatRow: { marginBottom: 8 },
  heatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  heatCell: { width: 10, height: 10, borderRadius: 1 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statChip: { fontSize: 11 },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  streakName: { fontSize: 12 },
  streakVal: { fontSize: 12 },
  silencePanel: { marginBottom: 16 },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  historyDate: { fontSize: 11 },
  historyCompleted: { fontSize: 11 },
  historyXP: { fontSize: 11 },
  bottomPadding: { height: 64 },
});
```

- [ ] **Step 2: Write test**

Create `the-system/__tests__/screens/Archive.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../../src/store/useSystemStore', () => ({
  useSystemStore: () => ({
    hero: {
      id: 1, name: 'Test', hero_class: 'Warrior', global_xp: 500,
      global_level: 3, rank: 'E', journey_start_date: '2026-01-01', journey_complete: 0,
    },
    disciplines: [],
    currentTheme: {
      background: '#1a1a1a', primary: '#2a2a2a', accent: '#666', text: '#aaa',
      textSecondary: '#777', borderStyle: 'cracked_stone', auraColor: null,
      particleType: 'dust', particleCount: 8, avatarFloat: false, screenGlow: false,
    },
  }),
}));

jest.mock('../../src/db/queries', () => ({
  getLogsForRange: jest.fn().mockResolvedValue([]),
  getAllMandates: jest.fn().mockResolvedValue([]),
  getDisciplineLogsAll: jest.fn().mockResolvedValue([]),
  getSilenceStreak: jest.fn().mockResolvedValue({
    current_streak: 7, longest_streak: 14, total_relapses: 0,
  }),
}));

import Archive from '../../src/screens/Archive';

describe('Archive', () => {
  it('renders without crashing', () => {
    render(<Archive />);
  });
});
```

Run: `cd the-system && npx jest __tests__/screens/Archive.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 3: Commit**

```powershell
cd the-system
git add src/screens/Archive.tsx __tests__/screens/Archive.test.tsx
git commit -m "feat: implement Archive with overview, discipline heatmaps, streaks, history"
```

---

## Task 9: Codex Screen

**Files:**
- Modify: `the-system/src/screens/Codex.tsx`

- [ ] **Step 1: Replace Codex stub**

Replace `the-system/src/screens/Codex.tsx` entirely:
```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSystemStore } from '../store/useSystemStore';
import {
  setDisciplineActive,
  createCustomDiscipline,
  deleteDiscipline,
  getAllDisciplines,
} from '../db/queries';
import type { Discipline } from '../types';

const DIFFICULTY_OPTIONS = ['EASY', 'NORMAL', 'HARD', 'LEGENDARY'] as const;
const DIFFICULTY_COLORS = {
  EASY: '#4caf50',
  NORMAL: '#2196f3',
  HARD: '#ff9800',
  LEGENDARY: '#f44336',
};

const XP_DEFAULTS = { EASY: [10, 5], NORMAL: [25, 15], HARD: [50, 30], LEGENDARY: [100, 0] };

interface AddForm {
  name: string;
  description: string;
  difficulty: 'EASY' | 'NORMAL' | 'HARD' | 'LEGENDARY';
  deadlineTime: string;
}

const BLANK_FORM: AddForm = {
  name: '',
  description: '',
  difficulty: 'NORMAL',
  deadlineTime: '23:59',
};

export default function Codex() {
  const { disciplines, refresh, currentTheme: theme } = useSystemStore();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddForm>(BLANK_FORM);

  const handleToggleActive = async (d: Discipline) => {
    if (d.code === 'SILENCE' && d.is_active) {
      Alert.alert(
        'DISABLE SILENCE?',
        'Disabling SILENCE Protocol removes streak tracking. You cannot undo a relapse.',
        [
          { text: 'CANCEL', style: 'cancel' },
          {
            text: 'DISABLE',
            style: 'destructive',
            onPress: async () => {
              await setDisciplineActive(d.id, !d.is_active);
              await refresh();
            },
          },
        ]
      );
    } else {
      await setDisciplineActive(d.id, !d.is_active);
      await refresh();
    }
  };

  const handleDelete = (d: Discipline) => {
    if (!d.is_custom) {
      Alert.alert('CANNOT DELETE', 'Core disciplines cannot be deleted. You can disable them.');
      return;
    }
    Alert.alert(
      'DELETE DISCIPLINE',
      `Delete "${d.name}"? All logs for this discipline will also be deleted.`,
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'DELETE',
          style: 'destructive',
          onPress: async () => {
            await deleteDiscipline(d.id);
            await refresh();
          },
        },
      ]
    );
  };

  const handleAddSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert('NAME REQUIRED', 'Enter a name for this discipline.');
      return;
    }
    const [xpGain, xpLoss] = XP_DEFAULTS[form.difficulty];
    await createCustomDiscipline({
      name: form.name.trim(),
      description: form.description.trim(),
      difficulty: form.difficulty,
      xpGain,
      xpLoss,
      deadlineTime: form.deadlineTime || '23:59',
    });
    await refresh();
    setForm(BLANK_FORM);
    setShowAdd(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>THE CODEX</Text>
        <TouchableOpacity
          style={[styles.addBtn, { borderColor: theme.accent }]}
          onPress={() => setShowAdd(true)}
        >
          <Text style={[styles.addBtnText, { color: theme.accent }]}>+ ADD</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {disciplines.map((d) => {
          const diffColor = DIFFICULTY_COLORS[d.difficulty] ?? theme.accent;
          return (
            <View key={d.id} style={[styles.row, { borderBottomColor: '#222' }]}>
              {/* Icon placeholder */}
              <View style={[styles.iconBox, { borderColor: diffColor }]}>
                <Text style={[styles.iconCode, { color: diffColor }]}>
                  {d.code.slice(0, 3)}
                </Text>
              </View>

              {/* Info */}
              <View style={styles.rowInfo}>
                <Text style={[styles.rowName, { color: theme.text }]}>{d.name}</Text>
                <View style={styles.rowMeta}>
                  <View style={[styles.diffBadge, { backgroundColor: diffColor + '30', borderColor: diffColor }]}>
                    <Text style={[styles.diffText, { color: diffColor }]}>{d.difficulty}</Text>
                  </View>
                  <Text style={[styles.xpText, { color: '#4caf50' }]}>+{d.xp_gain}</Text>
                  <Text style={[styles.xpText, { color: '#f44336' }]}>-{d.xp_loss}</Text>
                </View>
                {d.deadline_time && (
                  <Text style={[styles.deadlineText, { color: theme.textSecondary }]}>
                    Deadline: {d.deadline_time}
                  </Text>
                )}
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor: d.is_active ? theme.accent + '20' : '#333',
                      borderColor: d.is_active ? theme.accent : '#444',
                    },
                  ]}
                  onPress={() => handleToggleActive(d)}
                >
                  <Text style={[styles.toggleText, { color: d.is_active ? theme.accent : '#666' }]}>
                    {d.is_active ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
                {d.is_custom && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(d)}
                  >
                    <Text style={styles.deleteText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Modal */}
      <Modal
        visible={showAdd}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdd(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.background, borderColor: theme.accent }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>ADD DISCIPLINE</Text>

            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>NAME</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.accent }]}
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              placeholder="Discipline name"
              placeholderTextColor={theme.textSecondary}
              maxLength={40}
            />

            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.accent }]}
              value={form.description}
              onChangeText={(v) => setForm({ ...form, description: v })}
              placeholder="Brief description"
              placeholderTextColor={theme.textSecondary}
              maxLength={100}
            />

            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>DIFFICULTY</Text>
            <View style={styles.diffRow}>
              {DIFFICULTY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.diffOption,
                    {
                      borderColor: form.difficulty === opt ? DIFFICULTY_COLORS[opt] : '#444',
                      backgroundColor:
                        form.difficulty === opt ? DIFFICULTY_COLORS[opt] + '30' : 'transparent',
                    },
                  ]}
                  onPress={() => setForm({ ...form, difficulty: opt })}
                >
                  <Text
                    style={[
                      styles.diffOptionText,
                      { color: form.difficulty === opt ? DIFFICULTY_COLORS[opt] : '#666' },
                    ]}
                  >
                    {opt.slice(0, 4)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>DEADLINE (HH:MM)</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.accent }]}
              value={form.deadlineTime}
              onChangeText={(v) => setForm({ ...form, deadlineTime: v })}
              placeholder="23:59"
              placeholderTextColor={theme.textSecondary}
              maxLength={5}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: '#666' }]}
                onPress={() => { setShowAdd(false); setForm(BLANK_FORM); }}
              >
                <Text style={[styles.cancelText, { color: '#666' }]}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: theme.accent }]}
                onPress={handleAddSubmit}
              >
                <Text style={styles.submitText}>CREATE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: { fontSize: 14, fontWeight: 'bold', letterSpacing: 3 },
  addBtn: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  scroll: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconCode: { fontSize: 10, fontWeight: 'bold' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  diffBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 2 },
  diffText: { fontSize: 9, fontWeight: 'bold' },
  xpText: { fontSize: 10 },
  deadlineText: { fontSize: 10, marginTop: 2 },
  actions: { alignItems: 'center', gap: 4 },
  toggleBtn: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  toggleText: { fontSize: 10, fontWeight: 'bold' },
  deleteBtn: { padding: 4 },
  deleteText: { color: '#f44336', fontSize: 14 },
  bottomPadding: { height: 64 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalBox: { padding: 24, borderTopWidth: 2 },
  modalTitle: { fontSize: 14, fontWeight: 'bold', letterSpacing: 2, marginBottom: 16 },
  formLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderRadius: 2, padding: 8,
    fontSize: 12, marginBottom: 4,
  },
  diffRow: { flexDirection: 'row', gap: 8 },
  diffOption: {
    flex: 1, borderWidth: 1, padding: 6, alignItems: 'center', borderRadius: 2,
  },
  diffOptionText: { fontSize: 9, fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1, padding: 12, alignItems: 'center' },
  cancelText: { fontSize: 11, fontWeight: 'bold' },
  submitBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 2 },
  submitText: { color: '#000', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
});
```

- [ ] **Step 2: Write test**

Create `the-system/__tests__/screens/Codex.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../../src/store/useSystemStore', () => ({
  useSystemStore: () => ({
    disciplines: [
      { id: 1, code: 'RISE', name: 'Wake Before Dawn', difficulty: 'HARD',
        xp_gain: 50, xp_loss: 30, deadline_time: '08:30', is_active: 1, is_custom: 0,
        frequency: 'daily', active_days: null, description: '', created_at: '' },
    ],
    refresh: jest.fn(),
    currentTheme: {
      background: '#1a1a1a', primary: '#2a2a2a', accent: '#666', text: '#aaa',
      textSecondary: '#777', borderStyle: 'cracked_stone', auraColor: null,
      particleType: 'dust', particleCount: 8, avatarFloat: false, screenGlow: false,
    },
  }),
}));

jest.mock('../../src/db/queries', () => ({
  setDisciplineActive: jest.fn().mockResolvedValue(undefined),
  createCustomDiscipline: jest.fn().mockResolvedValue(undefined),
  deleteDiscipline: jest.fn().mockResolvedValue(undefined),
  getAllDisciplines: jest.fn().mockResolvedValue([]),
}));

import Codex from '../../src/screens/Codex';

describe('Codex', () => {
  it('renders without crashing', () => {
    render(<Codex />);
  });
});
```

Run: `cd the-system && npx jest __tests__/screens/Codex.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 3: Commit**

```powershell
cd the-system
git add src/screens/Codex.tsx __tests__/screens/Codex.test.tsx
git commit -m "feat: implement Codex discipline manager with toggle, add custom, delete"
```

---

## Task 10: CommandHall Updates

**Files:**
- Modify: `the-system/src/screens/CommandHall.tsx`

- [ ] **Step 1: Update CommandHall**

Replace `the-system/src/screens/CommandHall.tsx` entirely:
```tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSystemStore } from '../store/useSystemStore';
import { RANK_TITLES } from '../engine/xpConstants';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import XPBar from '../components/ui/XPBar';
import DisciplineCard from '../components/ui/DisciplineCard';
import type { Rank } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

export default function CommandHall() {
  const navigation = useNavigation<Nav>();
  const {
    hero,
    disciplines,
    todayLogs,
    silenceStreak,
    pendingMandate,
    currentTheme: theme,
    completeDiscipline,
    failDiscipline,
    triggerRelapse,
  } = useSystemStore();

  const floatAnim = React.useRef(new Animated.Value(0)).current;

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

  const handleComplete = async (id: number) => {
    const result = await completeDiscipline(id);
    if (result.levelUp) {
      navigation.navigate('LevelUpSplash', {
        level: result.levelUp.newLevel,
        xpGained: result.xpGained,
        rankChanged: result.levelUp.rankChanged,
        newRank: result.levelUp.newRank,
      });
    }
  };

  const handleFail = (id: number, code: string) => {
    if (code === 'SILENCE') {
      // Use Alert for relapse — it's a serious destructive action
      const { Alert } = require('react-native');
      Alert.alert(
        'SILENCE PROTOCOL BROKEN',
        'This will reset ALL progress. XP to 0. Level to 1. Rank to E. All streaks reset. There is no undo.',
        [
          { text: 'CANCEL', style: 'cancel' },
          {
            text: 'I HAVE FALLEN',
            style: 'destructive',
            onPress: () => triggerRelapse(),
          },
        ]
      );
    } else {
      failDiscipline(id);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={[styles.rankBadge, { borderColor: theme.accent }]}>
          <Text style={[styles.rankText, { color: theme.accent }]}>{hero.rank}</Text>
        </View>
        <Text style={[styles.dayText, { color: theme.text }]}>DAY {dayNumber} OF 180</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.settingsBtn}
        >
          <Text style={[styles.settingsIcon, { color: theme.textSecondary }]}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar area + floating mandate chest */}
      <View style={styles.avatarArea}>
        <View style={styles.avatarPlaceholder}>
          <Text style={[styles.avatarText, { color: theme.accent }]}>
            {hero.hero_class.toUpperCase()}
          </Text>
          <Text style={[styles.titleText, { color: theme.textSecondary }]}>
            {RANK_TITLES[hero.rank as Rank]}
          </Text>
        </View>

        {pendingMandate && (
          <Animated.View
            style={[styles.chestFloat, { transform: [{ translateY: floatAnim }] }]}
          >
            <TouchableOpacity onPress={() => navigation.navigate('MandateReveal')}>
              <View style={[styles.chestBadge, { borderColor: theme.accent, backgroundColor: theme.accent + '30' }]}>
                <Text style={{ fontSize: 24 }}>📦</Text>
                <Text style={[styles.chestLabel, { color: theme.accent }]}>
                  {pendingMandate.tier}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      <XPBar />

      {silenceStreak && (
        <View style={styles.streakSection}>
          <Text style={[styles.streakNumber, { color: theme.accent }]}>
            {silenceStreak.current_streak}
          </Text>
          <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>
            DAYS OF SILENCE
          </Text>
        </View>
      )}

      <ScrollView style={styles.questLog}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>DAILY QUEST LOG</Text>
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
    marginBottom: 16,
  },
  rankBadge: { borderWidth: 2, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 4 },
  rankText: { fontSize: 18, fontWeight: 'bold' },
  dayText: { fontSize: 12 },
  settingsBtn: { padding: 8 },
  settingsIcon: { fontSize: 20 },
  avatarArea: { alignItems: 'center', paddingVertical: 16 },
  avatarPlaceholder: { alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold' },
  titleText: { fontSize: 12, marginTop: 4 },
  chestFloat: {
    position: 'absolute',
    right: 32,
    top: 0,
  },
  chestBadge: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  chestLabel: { fontSize: 9, fontWeight: 'bold', marginTop: 2 },
  streakSection: { alignItems: 'center', marginVertical: 8 },
  streakNumber: { fontSize: 36, fontWeight: 'bold' },
  streakLabel: { fontSize: 10, marginTop: 2 },
  questLog: { flex: 1, marginTop: 8 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
});
```

Note: The `Alert` import is done inline in `handleFail` to avoid a lint warning about using it as a module. If the linter complains, add `import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';` to the imports and remove the `require` call.

- [ ] **Step 2: Write test**

Create `the-system/__tests__/screens/CommandHall.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('../../src/store/useSystemStore', () => ({
  useSystemStore: () => ({
    hero: {
      id: 1, name: 'Test', hero_class: 'Warrior', global_xp: 0,
      global_level: 1, rank: 'E', journey_start_date: '2026-01-01', journey_complete: 0,
    },
    disciplines: [],
    todayLogs: [],
    silenceStreak: { current_streak: 5, longest_streak: 10, total_relapses: 0 },
    pendingMandate: null,
    currentTheme: {
      background: '#1a1a1a', primary: '#2a2a2a', accent: '#666', text: '#aaa',
      textSecondary: '#777', borderStyle: 'cracked_stone', auraColor: null,
      particleType: 'dust', particleCount: 8, avatarFloat: false, screenGlow: false,
    },
    completeDiscipline: jest.fn().mockResolvedValue({ xpGained: 50, levelUp: null }),
    failDiscipline: jest.fn().mockResolvedValue(undefined),
    triggerRelapse: jest.fn().mockResolvedValue(undefined),
  }),
}));

import CommandHall from '../../src/screens/CommandHall';

describe('CommandHall', () => {
  it('renders without crashing', () => {
    render(<CommandHall />);
  });
});
```

Run: `cd the-system && npx jest __tests__/screens/CommandHall.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 3: Run all Phase 3 tests together**

```powershell
cd the-system
npx jest __tests__/screens/ __tests__/navigation/ __tests__/db/queries-phase3.test.ts --no-coverage
```
Expected: All PASS

- [ ] **Step 4: Commit**

```powershell
cd the-system
git add src/screens/CommandHall.tsx __tests__/screens/CommandHall.test.tsx
git commit -m "feat: update CommandHall with settings icon, floating mandate chest, modal navigation"
```

---

## Completion Checklist

After all 10 tasks pass tests and are committed:

- [ ] `src/navigation/types.ts` exists with `RootStackParamList`
- [ ] `AppNavigator.tsx` has MandateReveal, LevelUpSplash, Settings in root stack
- [ ] All 4 previously stubbed screens are fully functional
- [ ] MandateReveal, LevelUpSplash, Settings modals exist
- [ ] CommandHall navigates to modals via `useNavigation()`
- [ ] All tests pass: `npx jest --no-coverage`
