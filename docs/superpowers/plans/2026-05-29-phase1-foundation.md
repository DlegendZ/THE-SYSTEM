# THE SYSTEM — Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working React Native Expo app with SQLite database, XP/rank engine, discipline tracking, Zustand store, and two functional screens (Command Hall + Awakening onboarding).

**Architecture:** Monolithic Zustand store hydrated from SQLite via write-through pattern. Schema migration system ensures data survives APK updates. All engines are pure TypeScript operating on SQLite, triggered by store actions.

**Tech Stack:** Expo 53, React Native 0.79, TypeScript, expo-sqlite 15, Zustand 5, React Navigation 7, date-fns 4

**Prerequisites:** Node.js 20+, Android Studio with SDK 34+, Java 17+, an Android device or emulator.

---

## Task 1: Project Scaffolding

**Files:**
- Create: `the-system/` (Expo project root inside THE-SYSTEM repo)
- Modify: `the-system/package.json`
- Modify: `the-system/tsconfig.json`
- Modify: `the-system/app.json`

- [ ] **Step 1: Create Expo project**

Run from `E:\Work\THE-SYSTEM`:
```powershell
npx create-expo-app@latest the-system --template blank-typescript
```

- [ ] **Step 2: Install core dependencies**

Run from `E:\Work\THE-SYSTEM\the-system`:
```powershell
npx expo install expo-sqlite expo-notifications expo-font expo-keep-awake expo-device expo-application react-native-svg react-native-reanimated react-native-gesture-handler react-native-screens react-native-safe-area-context
```

```powershell
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack date-fns zustand react-native-device-info
```

- [ ] **Step 3: Configure app.json**

Replace `the-system/app.json`:
```json
{
  "expo": {
    "name": "THE SYSTEM",
    "slug": "the-system",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#000000"
      },
      "package": "com.thesystem",
      "versionCode": 1,
      "permissions": [
        "POST_NOTIFICATIONS",
        "SCHEDULE_EXACT_ALARM",
        "RECEIVE_BOOT_COMPLETED"
      ]
    },
    "plugins": [
      "expo-sqlite",
      "expo-notifications",
      "expo-font",
      [
        "react-native-reanimated/plugin"
      ]
    ]
  }
}
```

- [ ] **Step 4: Configure TypeScript**

Replace `the-system/tsconfig.json`:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", "src/**/*"]
}
```

- [ ] **Step 5: Create source directory structure**

```powershell
mkdir -p src/assets/fonts, src/assets/sounds, src/components/avatar, src/components/ui, src/components/particles, src/components/icons, src/screens, src/engine, src/db/migrations, src/store, src/theme, src/notifications, src/native, src/types
```

- [ ] **Step 6: Generate Android native project**

```powershell
npx expo prebuild --platform android
```

- [ ] **Step 7: Commit**

```powershell
git add the-system/
git commit -m "feat: initialize Expo 53 project with dependencies and Android prebuild"
```

---

## Task 2: Type Definitions

**Files:**
- Create: `the-system/src/types/index.ts`

- [ ] **Step 1: Write all shared types**

Create `the-system/src/types/index.ts`:
```typescript
export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export type Difficulty = 'EASY' | 'NORMAL' | 'HARD' | 'LEGENDARY';

export type DisciplineCode =
  | 'RISE'
  | 'REST'
  | 'NOURISH'
  | 'SILENCE'
  | 'FORGE'
  | 'KNOWLEDGE'
  | 'PRESENCE'
  | 'RITUAL';

export type HeroClass = 'Warrior' | 'Mage' | 'Rogue';

export type MandateTier = 'BRONZE' | 'SILVER' | 'GOLD';

export type CosmeticType =
  | 'weapon'
  | 'armor'
  | 'crown'
  | 'title'
  | 'background'
  | 'accessory';

export type NotificationCategory =
  | 'SILENCE'
  | 'FORGE'
  | 'HEALTH'
  | 'GENERAL'
  | 'MILESTONE';

export type MoodState = 'radiant' | 'steady' | 'worn' | 'broken';

export interface Hero {
  id: number;
  name: string;
  hero_class: HeroClass;
  global_xp: number;
  global_level: number;
  rank: Rank;
  journey_start_date: string;
  journey_complete: number;
}

export interface Discipline {
  id: number;
  code: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  xp_gain: number;
  xp_loss: number;
  deadline_time: string | null;
  is_active: number;
  is_custom: number;
  frequency: string;
  active_days: string | null;
  created_at: string;
}

export interface DisciplineLog {
  id: number;
  discipline_id: number;
  log_date: string;
  completed: number;
  failed: number;
  xp_delta: number;
  notes: string | null;
  logged_at: string;
}

export interface SilenceStreak {
  id: number;
  current_streak: number;
  longest_streak: number;
  last_success_date: string | null;
  total_relapses: number;
  last_relapse_date: string | null;
}

export interface Cosmetic {
  id: number;
  type: CosmeticType;
  tier: number;
  name: string;
  unlocked: number;
  equipped: number;
  unlocked_at: string | null;
}

export interface Mandate {
  id: number;
  tier: MandateTier;
  opened: number;
  granted_at: string;
  opened_at: string | null;
  loot_type: string | null;
  loot_id: number | null;
}

export interface SystemState {
  key: string;
  value: string;
}

export interface SchemaVersion {
  version: number;
  applied_at: string;
}
```

- [ ] **Step 2: Commit**

```powershell
git add the-system/src/types/
git commit -m "feat: add shared TypeScript type definitions"
```

---

## Task 3: Database Migration System

**Files:**
- Create: `the-system/src/db/database.ts`
- Create: `the-system/src/db/migrations/index.ts`
- Create: `the-system/src/db/migrations/001_initial.ts`

- [ ] **Step 1: Write database connection module**

Create `the-system/src/db/database.ts`:
```typescript
import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('thesystem.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await runMigrations(db);
}
```

- [ ] **Step 2: Write migration runner**

Create `the-system/src/db/migrations/index.ts`:
```typescript
import type { SQLiteDatabase } from 'expo-sqlite';
import { migration001 } from './001_initial';

export interface Migration {
  version: number;
  name: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

const migrations: Migration[] = [
  migration001,
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const result = await db.getFirstAsync<{ max_version: number | null }>(
    'SELECT MAX(version) as max_version FROM schema_version'
  );
  const currentVersion = result?.max_version ?? 0;

  const pending = migrations.filter((m) => m.version > currentVersion);
  pending.sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.runAsync(
        'INSERT INTO schema_version (version, applied_at) VALUES (?, ?)',
        [migration.version, new Date().toISOString()]
      );
    });
  }
}
```

- [ ] **Step 3: Write initial migration (all tables + seed data)**

Create `the-system/src/db/migrations/001_initial.ts`:
```typescript
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Migration } from './index';

export const migration001: Migration = {
  version: 1,
  name: 'initial_schema',
  up: async (db: SQLiteDatabase) => {
    await db.execAsync(`
      CREATE TABLE hero (
        id INTEGER PRIMARY KEY DEFAULT 1,
        name TEXT NOT NULL DEFAULT 'Raynald Arvan Lim',
        hero_class TEXT NOT NULL DEFAULT 'Warrior',
        global_xp INTEGER NOT NULL DEFAULT 0,
        global_level INTEGER NOT NULL DEFAULT 1,
        rank TEXT NOT NULL DEFAULT 'E',
        journey_start_date TEXT NOT NULL,
        journey_complete INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE disciplines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        xp_gain INTEGER NOT NULL,
        xp_loss INTEGER NOT NULL,
        deadline_time TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_custom INTEGER NOT NULL DEFAULT 0,
        frequency TEXT NOT NULL DEFAULT 'daily',
        active_days TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE discipline_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discipline_id INTEGER NOT NULL REFERENCES disciplines(id),
        log_date TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        failed INTEGER NOT NULL DEFAULT 0,
        xp_delta INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        logged_at TEXT NOT NULL,
        UNIQUE(discipline_id, log_date)
      );

      CREATE TABLE silence_streak (
        id INTEGER PRIMARY KEY DEFAULT 1,
        current_streak INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        last_success_date TEXT,
        total_relapses INTEGER NOT NULL DEFAULT 0,
        last_relapse_date TEXT
      );

      CREATE TABLE cosmetics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        tier INTEGER NOT NULL DEFAULT 1,
        name TEXT NOT NULL,
        unlocked INTEGER NOT NULL DEFAULT 0,
        equipped INTEGER NOT NULL DEFAULT 0,
        unlocked_at TEXT
      );

      CREATE TABLE mandates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tier TEXT NOT NULL,
        opened INTEGER NOT NULL DEFAULT 0,
        granted_at TEXT NOT NULL,
        opened_at TEXT,
        loot_type TEXT,
        loot_id INTEGER
      );

      CREATE TABLE notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        category TEXT NOT NULL,
        scheduled_at TEXT NOT NULL,
        fired INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE system_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    const now = new Date().toISOString();
    const disciplines = [
      ['RISE', 'Wake Before Dawn', 'Out of bed by 08:30. The day belongs to those who claim it first.', 'HARD', 50, 30, '08:30'],
      ['REST', 'Night Silence', 'Phone down, lights off before 23:00. Recovery is strategy.', 'HARD', 50, 30, '23:00'],
      ['NOURISH', 'Clean Fuel', 'One clean meal log. No processed poison. Your body is armor.', 'NORMAL', 25, 15, '23:59'],
      ['SILENCE', 'The Silence Protocol', 'The war against the mind\'s weakest impulse. Streak is sacred.', 'LEGENDARY', 100, 0, null],
      ['FORGE', 'Iron Temple', 'Lifting or cardio. The Iron Temple does not close.', 'HARD', 60, 35, '23:59'],
      ['KNOWLEDGE', 'The Scroll', 'Minimum 10 pages of a real book read today.', 'NORMAL', 25, 15, '23:59'],
      ['PRESENCE', 'The Veil', 'Screen scrolling under 30 minutes. Auto-tracked via UsageStats.', 'NORMAL', 25, 15, '23:59'],
      ['RITUAL', 'The Ritual', 'Daily skincare routine completed. Discipline in small things.', 'EASY', 10, 5, '23:59'],
    ];

    for (const d of disciplines) {
      await db.runAsync(
        `INSERT INTO disciplines (code, name, description, difficulty, xp_gain, xp_loss, deadline_time, is_active, is_custom, frequency, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 'daily', ?)`,
        [...d, now]
      );
    }

    await db.runAsync(
      'INSERT INTO silence_streak (id, current_streak, longest_streak, total_relapses) VALUES (1, 0, 0, 0)'
    );

    await db.runAsync(
      "INSERT INTO system_state (key, value) VALUES ('onboarding_complete', '0')"
    );
    await db.runAsync(
      "INSERT INTO system_state (key, value) VALUES ('shield_active', '0')"
    );
  },
};
```

- [ ] **Step 4: Commit**

```powershell
git add the-system/src/db/
git commit -m "feat: add SQLite database layer with migration system and initial schema"
```

---

## Task 4: Database Query Helpers

**Files:**
- Create: `the-system/src/db/queries.ts`

- [ ] **Step 1: Write all query helpers**

Create `the-system/src/db/queries.ts`:
```typescript
import { getDb } from './database';
import type {
  Hero,
  Discipline,
  DisciplineLog,
  SilenceStreak,
  Cosmetic,
  Mandate,
} from '../types';

export async function getHero(): Promise<Hero | null> {
  return getDb().getFirstAsync<Hero>('SELECT * FROM hero WHERE id = 1');
}

export async function createHero(
  name: string,
  heroClass: string,
  journeyStartDate: string
): Promise<void> {
  await getDb().runAsync(
    `INSERT OR REPLACE INTO hero (id, name, hero_class, global_xp, global_level, rank, journey_start_date, journey_complete)
     VALUES (1, ?, ?, 0, 1, 'E', ?, 0)`,
    [name, heroClass, journeyStartDate]
  );
}

export async function updateHero(
  fields: Partial<Pick<Hero, 'global_xp' | 'global_level' | 'rank' | 'journey_complete'>>
): Promise<void> {
  const sets: string[] = [];
  const values: (string | number)[] = [];
  for (const [key, value] of Object.entries(fields)) {
    sets.push(`${key} = ?`);
    values.push(value as string | number);
  }
  if (sets.length === 0) return;
  await getDb().runAsync(`UPDATE hero SET ${sets.join(', ')} WHERE id = 1`, values);
}

export async function getAllDisciplines(): Promise<Discipline[]> {
  return getDb().getAllAsync<Discipline>('SELECT * FROM disciplines ORDER BY id');
}

export async function getActiveDisciplines(): Promise<Discipline[]> {
  return getDb().getAllAsync<Discipline>(
    'SELECT * FROM disciplines WHERE is_active = 1 ORDER BY id'
  );
}

export async function getDiscipline(id: number): Promise<Discipline | null> {
  return getDb().getFirstAsync<Discipline>('SELECT * FROM disciplines WHERE id = ?', [id]);
}

export async function getDisciplineByCode(code: string): Promise<Discipline | null> {
  return getDb().getFirstAsync<Discipline>('SELECT * FROM disciplines WHERE code = ?', [code]);
}

export async function getLog(
  disciplineId: number,
  date: string
): Promise<DisciplineLog | null> {
  return getDb().getFirstAsync<DisciplineLog>(
    'SELECT * FROM discipline_logs WHERE discipline_id = ? AND log_date = ?',
    [disciplineId, date]
  );
}

export async function getLogsForDate(date: string): Promise<DisciplineLog[]> {
  return getDb().getAllAsync<DisciplineLog>(
    'SELECT * FROM discipline_logs WHERE log_date = ?',
    [date]
  );
}

export async function insertLog(
  disciplineId: number,
  date: string,
  completed: boolean,
  failed: boolean,
  xpDelta: number
): Promise<void> {
  await getDb().runAsync(
    `INSERT OR REPLACE INTO discipline_logs (discipline_id, log_date, completed, failed, xp_delta, logged_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [disciplineId, date, completed ? 1 : 0, failed ? 1 : 0, xpDelta, new Date().toISOString()]
  );
}

export async function getStreak(disciplineId: number, beforeDate: string): Promise<number> {
  const logs = await getDb().getAllAsync<DisciplineLog>(
    `SELECT * FROM discipline_logs
     WHERE discipline_id = ? AND log_date < ? AND completed = 1
     ORDER BY log_date DESC`,
    [disciplineId, beforeDate]
  );

  let streak = 0;
  const date = new Date(beforeDate);
  for (let i = 0; i < logs.length; i++) {
    date.setDate(date.getDate() - 1);
    const expected = date.toISOString().slice(0, 10);
    if (logs[i].log_date === expected) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export async function resetAllStreaks(): Promise<void> {
  // Streaks are computed from logs — resetting means we don't delete logs,
  // but the streak counter restarts because consecutive chain is broken.
  // For SILENCE, we reset the dedicated table.
}

export async function getSilenceStreak(): Promise<SilenceStreak | null> {
  return getDb().getFirstAsync<SilenceStreak>('SELECT * FROM silence_streak WHERE id = 1');
}

export async function updateSilenceStreak(
  fields: Partial<SilenceStreak>
): Promise<void> {
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'id') continue;
    sets.push(`${key} = ?`);
    values.push(value as string | number | null);
  }
  if (sets.length === 0) return;
  await getDb().runAsync(`UPDATE silence_streak SET ${sets.join(', ')} WHERE id = 1`, values);
}

export async function getPendingMandate(): Promise<Mandate | null> {
  return getDb().getFirstAsync<Mandate>(
    'SELECT * FROM mandates WHERE opened = 0 ORDER BY granted_at DESC LIMIT 1'
  );
}

export async function createMandate(tier: string): Promise<number> {
  const result = await getDb().runAsync(
    'INSERT INTO mandates (tier, opened, granted_at) VALUES (?, 0, ?)',
    [tier, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

export async function openMandate(
  id: number,
  lootType: string,
  lootId: number
): Promise<void> {
  await getDb().runAsync(
    'UPDATE mandates SET opened = 1, opened_at = ?, loot_type = ?, loot_id = ? WHERE id = ?',
    [new Date().toISOString(), lootType, lootId, id]
  );
}

export async function getSystemState(key: string): Promise<string | null> {
  const row = await getDb().getFirstAsync<{ value: string }>(
    'SELECT value FROM system_state WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setSystemState(key: string, value: string): Promise<void> {
  await getDb().runAsync(
    'INSERT OR REPLACE INTO system_state (key, value) VALUES (?, ?)',
    [key, value]
  );
}

export async function getCosmetics(): Promise<Cosmetic[]> {
  return getDb().getAllAsync<Cosmetic>('SELECT * FROM cosmetics ORDER BY type, tier');
}

export async function getEquippedCosmetics(): Promise<Cosmetic[]> {
  return getDb().getAllAsync<Cosmetic>(
    'SELECT * FROM cosmetics WHERE equipped = 1 ORDER BY type'
  );
}

export async function unlockCosmetic(id: number): Promise<void> {
  await getDb().runAsync(
    'UPDATE cosmetics SET unlocked = 1, unlocked_at = ? WHERE id = ?',
    [new Date().toISOString(), id]
  );
}

export async function equipCosmetic(id: number, type: string): Promise<void> {
  const db = getDb();
  await db.runAsync('UPDATE cosmetics SET equipped = 0 WHERE type = ?', [type]);
  await db.runAsync('UPDATE cosmetics SET equipped = 1 WHERE id = ?', [id]);
}

export async function getWeekCompletionRate(
  journeyStartDate: string,
  weekNumber: number
): Promise<number> {
  const start = new Date(journeyStartDate);
  start.setDate(start.getDate() + (weekNumber - 1) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  const total = await getDb().getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM discipline_logs
     WHERE log_date >= ? AND log_date < ?`,
    [startStr, endStr]
  );
  const completed = await getDb().getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM discipline_logs
     WHERE log_date >= ? AND log_date < ? AND completed = 1`,
    [startStr, endStr]
  );

  const totalCount = total?.cnt ?? 0;
  if (totalCount === 0) return 0;
  return (completed?.cnt ?? 0) / totalCount;
}

export async function get180DayConsistencyRate(): Promise<number> {
  const total = await getDb().getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM discipline_logs'
  );
  const completed = await getDb().getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM discipline_logs WHERE completed = 1'
  );
  const totalCount = total?.cnt ?? 0;
  if (totalCount === 0) return 0;
  return (completed?.cnt ?? 0) / totalCount;
}
```

- [ ] **Step 2: Commit**

```powershell
git add the-system/src/db/queries.ts
git commit -m "feat: add database query helpers for all tables"
```

---

## Task 5: XP Constants and Pure Helpers (with tests)

**Files:**
- Create: `the-system/src/engine/xpConstants.ts`
- Create: `the-system/__tests__/engine/xpConstants.test.ts`

- [ ] **Step 1: Write failing tests for XP pure functions**

Create `the-system/__tests__/engine/xpConstants.test.ts`:
```typescript
import {
  XP_TABLE,
  getStreakMultiplier,
  getRankForLevel,
  getXpForLevel,
} from '../../src/engine/xpConstants';

describe('XP_TABLE', () => {
  it('has 30 levels', () => {
    expect(Object.keys(XP_TABLE).length).toBe(30);
  });

  it('level 1 starts at 0 XP', () => {
    expect(XP_TABLE[1]).toBe(0);
  });

  it('level 30 (S-Rank max) is 87500', () => {
    expect(XP_TABLE[30]).toBe(87500);
  });

  it('XP values are strictly increasing', () => {
    for (let i = 2; i <= 30; i++) {
      expect(XP_TABLE[i]).toBeGreaterThan(XP_TABLE[i - 1]);
    }
  });
});

describe('getStreakMultiplier', () => {
  it('returns 1.0 for 0 days', () => {
    expect(getStreakMultiplier(0)).toBe(1.0);
  });

  it('returns 1.0 for 6 days', () => {
    expect(getStreakMultiplier(6)).toBe(1.0);
  });

  it('returns 1.5 for 7 days', () => {
    expect(getStreakMultiplier(7)).toBe(1.5);
  });

  it('returns 1.5 for 13 days', () => {
    expect(getStreakMultiplier(13)).toBe(1.5);
  });

  it('returns 2.0 for 14 days', () => {
    expect(getStreakMultiplier(14)).toBe(2.0);
  });

  it('returns 3.0 for 30 days', () => {
    expect(getStreakMultiplier(30)).toBe(3.0);
  });

  it('returns 4.0 for 90 days', () => {
    expect(getStreakMultiplier(90)).toBe(4.0);
  });

  it('returns 4.0 for 180 days', () => {
    expect(getStreakMultiplier(180)).toBe(4.0);
  });
});

describe('getRankForLevel', () => {
  it('levels 1-5 are E-Rank', () => {
    for (let i = 1; i <= 5; i++) {
      expect(getRankForLevel(i)).toBe('E');
    }
  });

  it('levels 6-10 are D-Rank', () => {
    for (let i = 6; i <= 10; i++) {
      expect(getRankForLevel(i)).toBe('D');
    }
  });

  it('levels 11-15 are C-Rank', () => {
    for (let i = 11; i <= 15; i++) {
      expect(getRankForLevel(i)).toBe('C');
    }
  });

  it('levels 16-20 are B-Rank', () => {
    for (let i = 16; i <= 20; i++) {
      expect(getRankForLevel(i)).toBe('B');
    }
  });

  it('levels 21-25 are A-Rank', () => {
    for (let i = 21; i <= 25; i++) {
      expect(getRankForLevel(i)).toBe('A');
    }
  });

  it('levels 26-30 are S-Rank', () => {
    for (let i = 26; i <= 30; i++) {
      expect(getRankForLevel(i)).toBe('S');
    }
  });
});

describe('getXpForLevel', () => {
  it('returns 0 for level 1', () => {
    expect(getXpForLevel(1)).toBe(0);
  });

  it('returns 300 for level 2', () => {
    expect(getXpForLevel(2)).toBe(300);
  });

  it('returns null for level 31', () => {
    expect(getXpForLevel(31)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```powershell
cd the-system; npx jest __tests__/engine/xpConstants.test.ts --no-coverage
```
Expected: FAIL — module not found.

- [ ] **Step 3: Write XP constants implementation**

Create `the-system/src/engine/xpConstants.ts`:
```typescript
import type { Rank } from '../types';

export const XP_TABLE: Record<number, number> = {
  1: 0,
  2: 300,
  3: 700,
  4: 1200,
  5: 1800,
  6: 2500,
  7: 3400,
  8: 4400,
  9: 5600,
  10: 7000,
  11: 8600,
  12: 10400,
  13: 12400,
  14: 14600,
  15: 17000,
  16: 19600,
  17: 22500,
  18: 25700,
  19: 29200,
  20: 33000,
  21: 37100,
  22: 41500,
  23: 46200,
  24: 51200,
  25: 56500,
  26: 62100,
  27: 68000,
  28: 74200,
  29: 80700,
  30: 87500,
};

export function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 90) return 4.0;
  if (streakDays >= 30) return 3.0;
  if (streakDays >= 14) return 2.0;
  if (streakDays >= 7) return 1.5;
  return 1.0;
}

export function getRankForLevel(level: number): Rank {
  if (level <= 5) return 'E';
  if (level <= 10) return 'D';
  if (level <= 15) return 'C';
  if (level <= 20) return 'B';
  if (level <= 25) return 'A';
  return 'S';
}

export function getXpForLevel(level: number): number | null {
  return XP_TABLE[level] ?? null;
}

export const RANK_TITLES: Record<Rank, string> = {
  E: 'The Awakened',
  D: 'The Tested',
  C: 'The Disciplined',
  B: 'The Forged',
  A: 'The Sovereign',
  S: 'The Transcendent',
};
```

- [ ] **Step 4: Run tests to verify they pass**

```powershell
cd the-system; npx jest __tests__/engine/xpConstants.test.ts --no-coverage
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add the-system/src/engine/xpConstants.ts the-system/__tests__/
git commit -m "feat: add XP table, streak multiplier, rank lookup with tests"
```

---

## Task 6: XP Engine

**Files:**
- Create: `the-system/src/engine/xpEngine.ts`

- [ ] **Step 1: Write XP engine**

Create `the-system/src/engine/xpEngine.ts`:
```typescript
import { getDb } from '../db/database';
import {
  getHero,
  getDiscipline,
  getStreak,
  insertLog,
  updateHero,
  getSilenceStreak,
  updateSilenceStreak,
  createMandate,
  getPendingMandate,
} from '../db/queries';
import { getStreakMultiplier, getRankForLevel, getXpForLevel } from './xpConstants';
import type { Hero, Rank } from '../types';

export interface LevelUpEvent {
  newLevel: number;
  newRank: Rank;
  rankChanged: boolean;
}

export async function completeDiscipline(
  disciplineId: number,
  date: string
): Promise<{ xpGained: number; levelUp: LevelUpEvent | null }> {
  const discipline = await getDiscipline(disciplineId);
  if (!discipline) throw new Error(`Discipline ${disciplineId} not found`);

  const streak = await getStreak(disciplineId, date);
  const multiplier = getStreakMultiplier(streak);
  const xpGained = Math.round(discipline.xp_gain * multiplier);

  await insertLog(disciplineId, date, true, false, xpGained);
  await addGlobalXP(xpGained);

  const levelUp = await checkLevelUp();
  return { xpGained, levelUp };
}

export async function failDiscipline(
  disciplineId: number,
  date: string
): Promise<void> {
  const discipline = await getDiscipline(disciplineId);
  if (!discipline) throw new Error(`Discipline ${disciplineId} not found`);

  if (discipline.code === 'SILENCE') {
    await triggerRelapse(date);
    return;
  }

  const xpLost = discipline.xp_loss;
  await insertLog(disciplineId, date, false, true, -xpLost);
  await deductGlobalXP(xpLost);
}

export async function triggerRelapse(date: string): Promise<void> {
  const db = getDb();

  await db.runAsync(
    "UPDATE hero SET global_xp = 0, global_level = 1, rank = 'E' WHERE id = 1"
  );

  await updateSilenceStreak({
    current_streak: 0,
    last_relapse_date: date,
  });

  await db.runAsync(
    `UPDATE silence_streak SET total_relapses = total_relapses + 1 WHERE id = 1`
  );

  await db.runAsync(
    "UPDATE cosmetics SET equipped = 0 WHERE type = 'weapon'"
  );

  const silenceDiscipline = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM disciplines WHERE code = 'SILENCE'"
  );
  if (silenceDiscipline) {
    await insertLog(silenceDiscipline.id, date, false, true, 0);
  }
}

async function addGlobalXP(amount: number): Promise<void> {
  const hero = await getHero();
  if (!hero) return;
  const newXP = hero.global_xp + amount;
  await updateHero({ global_xp: newXP });
}

async function deductGlobalXP(amount: number): Promise<void> {
  const hero = await getHero();
  if (!hero) return;
  const newXP = Math.max(0, hero.global_xp - amount);
  await updateHero({ global_xp: newXP });
}

async function checkLevelUp(): Promise<LevelUpEvent | null> {
  const hero = await getHero();
  if (!hero) return null;

  const nextLevelXP = getXpForLevel(hero.global_level + 1);
  if (nextLevelXP === null) return null;
  if (hero.global_xp < nextLevelXP) return null;

  const newLevel = hero.global_level + 1;
  const newRank = getRankForLevel(newLevel);
  const rankChanged = newRank !== hero.rank;

  await updateHero({
    global_level: newLevel,
    rank: newRank,
  });

  const pendingMandate = await getPendingMandate();
  if (!pendingMandate) {
    await grantMandate(newLevel);
  }

  return { newLevel, newRank, rankChanged };
}

async function grantMandate(newLevel: number): Promise<void> {
  let tier = 'BRONZE';
  if (newLevel % 10 === 0) tier = 'GOLD';
  else if (newLevel % 5 === 0) tier = 'SILVER';

  await createMandate(tier);
}
```

- [ ] **Step 2: Commit**

```powershell
git add the-system/src/engine/xpEngine.ts
git commit -m "feat: add XP engine with complete/fail/relapse and level-up logic"
```

---

## Task 7: Mandate Engine (with tests)

**Files:**
- Create: `the-system/src/engine/mandateEngine.ts`
- Create: `the-system/__tests__/engine/mandateEngine.test.ts`

- [ ] **Step 1: Write failing tests for loot table logic**

Create `the-system/__tests__/engine/mandateEngine.test.ts`:
```typescript
import { rollLoot, LOOT_TABLES } from '../../src/engine/mandateEngine';

describe('LOOT_TABLES', () => {
  it('BRONZE probabilities sum to 1.0', () => {
    const sum = LOOT_TABLES.BRONZE.reduce((acc, entry) => acc + entry.weight, 0);
    expect(sum).toBeCloseTo(1.0);
  });

  it('SILVER probabilities sum to 1.0', () => {
    const sum = LOOT_TABLES.SILVER.reduce((acc, entry) => acc + entry.weight, 0);
    expect(sum).toBeCloseTo(1.0);
  });

  it('GOLD probabilities sum to 1.0', () => {
    const sum = LOOT_TABLES.GOLD.reduce((acc, entry) => acc + entry.weight, 0);
    expect(sum).toBeCloseTo(1.0);
  });
});

describe('rollLoot', () => {
  it('BRONZE returns a valid loot type', () => {
    const validTypes = ['scroll', 'title', 'accessory'];
    for (let i = 0; i < 50; i++) {
      const loot = rollLoot('BRONZE');
      expect(validTypes).toContain(loot.type);
      expect(loot.name).toBeTruthy();
    }
  });

  it('SILVER returns a valid loot type', () => {
    const validTypes = ['cosmetic_variant', 'background', 'title'];
    for (let i = 0; i < 50; i++) {
      const loot = rollLoot('SILVER');
      expect(validTypes).toContain(loot.type);
    }
  });

  it('GOLD returns a valid loot type', () => {
    const validTypes = ['equipment_tier', 'aura_variant', 'title'];
    for (let i = 0; i < 50; i++) {
      const loot = rollLoot('GOLD');
      expect(validTypes).toContain(loot.type);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```powershell
cd the-system; npx jest __tests__/engine/mandateEngine.test.ts --no-coverage
```

- [ ] **Step 3: Write mandate engine**

Create `the-system/src/engine/mandateEngine.ts`:
```typescript
import {
  getPendingMandate,
  openMandate as openMandateQuery,
  createMandate,
  getSystemState,
  setSystemState,
} from '../db/queries';
import type { MandateTier } from '../types';
import { differenceInDays, parseISO } from 'date-fns';

export interface LootEntry {
  type: string;
  weight: number;
  items: string[];
}

export interface LootResult {
  type: string;
  name: string;
}

const SCROLLS = [
  'The man who moves a mountain begins by carrying small stones.',
  'Your discipline today is your freedom tomorrow.',
  'The forge does not ask if you are ready. It only asks if you will step in.',
  'Weakness is a choice. So is strength.',
  'You are not built in the moments of ease. You are built in the fire.',
  'The System sees what others cannot: your potential.',
  'Every sunrise you claim is a victory against your former self.',
  'Silence is not absence. It is mastery.',
  'The iron remembers every rep. So does your future.',
  'A king is not crowned. He crowns himself through daily conquest.',
  'The scroll opens for those who seek. You sought. You found.',
  'Consistency is the throne upon which greatness sits.',
  'The night belongs to those who earned their rest.',
  'Your covenant is not with others. It is with yourself.',
  'When the world sleeps, the disciplined rise.',
  'There is no shortcut to the summit. Only steps.',
  'The System does not judge your past. Only your present.',
  'What you resist today becomes what you conquer tomorrow.',
  'An empire is built one disciplined day at a time.',
  'You were not chosen at random. The System sees your fire.',
];

const TITLES_COMMON = [
  'Stone Breaker', 'Dawn Riser', 'Iron Will', 'Night Watcher',
  'Path Walker', 'Ember Keeper', 'Dust Shaker', 'Oath Bound',
  'Grit Bearer', 'Steel Minded',
];

const TITLES_RARE = [
  'Shadow Conqueror', 'Flame Forged', 'Crown Seeker',
  'Void Walker', 'Storm Bringer',
];

const TITLES_LEGENDARY = [
  'The Sovereign', 'Chosen of the System', 'The Unbroken',
  'Divine Will', 'The Transcendent',
];

const ACCESSORIES = [
  'Battle Scar', 'Iron Earring', 'War Paint', 'Pixel Tattoo',
  'Eye Patch', 'Chain Pendant',
];

export const LOOT_TABLES: Record<string, LootEntry[]> = {
  BRONZE: [
    { type: 'scroll', weight: 0.6, items: SCROLLS },
    { type: 'title', weight: 0.3, items: TITLES_COMMON },
    { type: 'accessory', weight: 0.1, items: ACCESSORIES },
  ],
  SILVER: [
    { type: 'cosmetic_variant', weight: 0.5, items: ['Weapon Skin: Crimson', 'Weapon Skin: Frost', 'Armor Skin: Shadow', 'Armor Skin: Bronze'] },
    { type: 'background', weight: 0.3, items: ['Volcanic Ruins', 'Frozen Throne', 'Desert Citadel', 'Ocean Depths'] },
    { type: 'title', weight: 0.2, items: TITLES_RARE },
  ],
  GOLD: [
    { type: 'equipment_tier', weight: 0.4, items: ['Weapon Tier Unlock', 'Armor Tier Unlock'] },
    { type: 'aura_variant', weight: 0.4, items: ['Crimson Aura', 'Frost Aura', 'Shadow Aura', 'Divine Aura'] },
    { type: 'title', weight: 0.2, items: TITLES_LEGENDARY },
  ],
};

export function rollLoot(tier: string): LootResult {
  const table = LOOT_TABLES[tier] ?? LOOT_TABLES.BRONZE;
  const roll = Math.random();

  let cumulative = 0;
  for (const entry of table) {
    cumulative += entry.weight;
    if (roll <= cumulative) {
      const item = entry.items[Math.floor(Math.random() * entry.items.length)];
      return { type: entry.type, name: item };
    }
  }

  const fallback = table[0];
  return {
    type: fallback.type,
    name: fallback.items[Math.floor(Math.random() * fallback.items.length)],
  };
}

export async function openCurrentMandate(): Promise<LootResult | null> {
  const mandate = await getPendingMandate();
  if (!mandate) return null;

  const loot = rollLoot(mandate.tier);
  await openMandateQuery(mandate.id, loot.type, 0);
  return loot;
}

export async function requestManualMandate(today: string): Promise<boolean> {
  const lastDate = await getSystemState('last_manual_mandate_date');

  if (lastDate) {
    const daysSince = differenceInDays(parseISO(today), parseISO(lastDate));
    if (daysSince < 7) return false;
  }

  const pending = await getPendingMandate();
  if (pending) return false;

  await createMandate('BRONZE');
  await setSystemState('last_manual_mandate_date', today);
  return true;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```powershell
cd the-system; npx jest __tests__/engine/mandateEngine.test.ts --no-coverage
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add the-system/src/engine/mandateEngine.ts the-system/__tests__/engine/mandateEngine.test.ts
git commit -m "feat: add mandate engine with loot tables and manual mandate cooldown"
```

---

## Task 8: Midnight Engine

**Files:**
- Create: `the-system/src/engine/midnightEngine.ts`

- [ ] **Step 1: Write midnight engine**

Create `the-system/src/engine/midnightEngine.ts`:
```typescript
import {
  getActiveDisciplines,
  getLog,
  getSilenceStreak,
  updateSilenceStreak,
  getHero,
} from '../db/queries';
import { failDiscipline } from './xpEngine';
import { format, subDays, parseISO, differenceInCalendarDays, getDay } from 'date-fns';

export async function runMidnightCheck(): Promise<void> {
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const disciplines = await getActiveDisciplines();

  for (const discipline of disciplines) {
    if (discipline.code === 'SILENCE') continue;
    if (discipline.code === 'PRESENCE') continue;

    const log = await getLog(discipline.id, yesterday);
    if (log && (log.completed || log.failed)) continue;

    await failDiscipline(discipline.id, yesterday);
  }

  await checkPresenceDiscipline(yesterday);
  await incrementSilenceStreak(yesterday);

  const dayOfWeek = getDay(new Date());
  if (dayOfWeek === 1) {
    await checkWeeklyMilestone();
  }
}

async function checkPresenceDiscipline(date: string): Promise<void> {
  const disciplines = await getActiveDisciplines();
  const presence = disciplines.find((d) => d.code === 'PRESENCE');
  if (!presence) return;

  const log = await getLog(presence.id, date);
  if (log && (log.completed || log.failed)) return;

  // UsageStats check would go here — for now, skip auto-check
  // Native module integration in Phase 4
  // If no manual completion, auto-fail
  await failDiscipline(presence.id, date);
}

async function incrementSilenceStreak(date: string): Promise<void> {
  const disciplines = await getActiveDisciplines();
  const silence = disciplines.find((d) => d.code === 'SILENCE');
  if (!silence) return;

  const log = await getLog(silence.id, date);
  if (log && log.failed) return;

  const streak = await getSilenceStreak();
  if (!streak) return;

  const newStreak = streak.current_streak + 1;
  const newLongest = Math.max(newStreak, streak.longest_streak);

  await updateSilenceStreak({
    current_streak: newStreak,
    longest_streak: newLongest,
    last_success_date: date,
  });
}

async function checkWeeklyMilestone(): Promise<void> {
  const hero = await getHero();
  if (!hero) return;

  const startDate = parseISO(hero.journey_start_date);
  const now = new Date();
  const daysElapsed = differenceInCalendarDays(now, startDate);
  const weekNumber = Math.floor(daysElapsed / 7) + 1;

  if (weekNumber > 24) return;

  if (weekNumber === 25 && !hero.journey_complete) {
    await checkFinalJudgement();
  }
}

async function checkFinalJudgement(): Promise<void> {
  const { get180DayConsistencyRate } = await import('../db/queries');
  const rate = await get180DayConsistencyRate();
  const { updateHero } = await import('../db/queries');
  await updateHero({ journey_complete: 1 });
}
```

- [ ] **Step 2: Commit**

```powershell
git add the-system/src/engine/midnightEngine.ts
git commit -m "feat: add midnight engine for daily auto-fail and streak tracking"
```

---

## Task 9: Theme Engine

**Files:**
- Create: `the-system/src/theme/rankThemes.ts`

- [ ] **Step 1: Write theme engine**

Create `the-system/src/theme/rankThemes.ts`:
```typescript
import type { Rank } from '../types';

export interface RankTheme {
  background: string;
  primary: string;
  accent: string;
  text: string;
  textSecondary: string;
  borderStyle: string;
  auraColor: string | null;
  particleType: string;
  particleCount: number;
  avatarFloat: boolean;
  screenGlow: boolean;
  screenGlowColor?: string;
  borderAnimated?: boolean;
}

export const RANK_THEMES: Record<Rank, RankTheme> = {
  E: {
    background: '#1a1a1a',
    primary: '#2a2a2a',
    accent: '#666666',
    text: '#aaaaaa',
    textSecondary: '#777777',
    borderStyle: 'cracked_stone',
    auraColor: null,
    particleType: 'dust',
    particleCount: 8,
    avatarFloat: false,
    screenGlow: false,
  },
  D: {
    background: '#1a0f00',
    primary: '#1a0f00',
    accent: '#b87333',
    text: '#d4a96a',
    textSecondary: '#9a6a3a',
    borderStyle: 'worn_iron',
    auraColor: '#b87333',
    particleType: 'embers',
    particleCount: 12,
    avatarFloat: false,
    screenGlow: false,
  },
  C: {
    background: '#0d0900',
    primary: '#0d0900',
    accent: '#f0a500',
    text: '#f5c842',
    textSecondary: '#c49020',
    borderStyle: 'engraved_gold',
    auraColor: '#f0a500',
    particleType: 'gold_sparks',
    particleCount: 16,
    avatarFloat: false,
    screenGlow: false,
  },
  B: {
    background: '#080600',
    primary: '#080600',
    accent: '#ffd700',
    text: '#fff4b0',
    textSecondary: '#ccaa00',
    borderStyle: 'gilded_ornate',
    auraColor: '#ffd700',
    particleType: 'gold_streaks',
    particleCount: 24,
    avatarFloat: false,
    screenGlow: true,
    screenGlowColor: '#ffd70030',
  },
  A: {
    background: '#050406',
    primary: '#050406',
    accent: '#ffe566',
    text: '#ffffff',
    textSecondary: '#ccb84d',
    borderStyle: 'celestial_rune',
    auraColor: '#ffe566',
    particleType: 'light_pillars',
    particleCount: 32,
    avatarFloat: false,
    screenGlow: true,
    screenGlowColor: '#ffe56640',
  },
  S: {
    background: '#000000',
    primary: '#000000',
    accent: '#ffffff',
    text: '#ffffff',
    textSecondary: '#cccccc',
    borderStyle: 'divine_mandala',
    auraColor: '#ffffff',
    particleType: 'god_rays',
    particleCount: 48,
    avatarFloat: true,
    screenGlow: true,
    screenGlowColor: '#ffffff20',
    borderAnimated: true,
  },
};

export function getThemeForRank(rank: Rank): RankTheme {
  return RANK_THEMES[rank];
}
```

- [ ] **Step 2: Commit**

```powershell
git add the-system/src/theme/
git commit -m "feat: add rank theme engine with visual properties for all 6 ranks"
```

---

## Task 10: Notification Scheduler

**Files:**
- Create: `the-system/src/notifications/scheduler.ts`

- [ ] **Step 1: Write notification scheduler**

Create `the-system/src/notifications/scheduler.ts`:
```typescript
import * as Notifications from 'expo-notifications';
import type { Rank } from '../types';

const NOTIFICATION_POOL: Record<string, string[]> = {
  SILENCE: [
    'Day {streak}. Your streak is your sword. Do not drop it.',
    'The war against weakness is won one day at a time. Today is that day.',
    'Every man who built something great fought this same war. Win it.',
    'The urge is a test. You have passed it before. Pass it again.',
    'Day {streak} of the Silence Protocol. The System is watching.',
  ],
  FORGE: [
    'The Iron Temple awaits. Your muscles do not grow in this chair.',
    'The bar does not care how you feel. Neither does your future self.',
    'You paid for that gym membership. Go collect what is yours.',
    'Soreness is your armor being forged. Embrace it.',
    'Your body is being recast. The furnace is today\'s session.',
  ],
  HEALTH: [
    '23:00 approaches. Night Silence begins. Prepare.',
    '08:30. The System is watching. Rise.',
    'Screen time is the invisible thief. Check your Veil discipline.',
    'The Scroll has not been opened today. Knowledge is power.',
    'Clean fuel only. Your body is your weapon.',
  ],
  GENERAL: [
    'You were selected because something in you is capable of greatness. Prove the System right.',
    '6 months from now you will wish you started today harder.',
    'No one is coming to save you. That is the good news.',
    'The forge does not stop. Neither do you.',
    '180 days. That is all it takes to become unrecognizable.',
    'Discipline is choosing what you want most over what you want now.',
    'The System does not reward the almost-disciplined.',
    'Level {level}. Rank {rank}. The ascension continues.',
  ],
  MILESTONE: [
    '{streak}-day streak. The System registers your resolve.',
    '30 days of silence. The System is impressed. Do not stop here.',
    'Rank {rank} achieved. The world below you is getting smaller.',
  ],
};

interface NotificationContext {
  streak?: number;
  level?: number;
  rank?: Rank;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickCategory(): string {
  const categories = ['SILENCE', 'FORGE', 'HEALTH', 'GENERAL'];
  return pickRandom(categories);
}

function fillTemplate(message: string, ctx: NotificationContext): string {
  return message
    .replace(/{streak}/g, String(ctx.streak ?? 0))
    .replace(/{level}/g, String(ctx.level ?? 1))
    .replace(/{rank}/g, ctx.rank ?? 'E');
}

export async function scheduleNotifications(
  intervalHours: number,
  quietStart: number,
  quietEnd: number,
  ctx: NotificationContext
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  const hoursToSchedule = 48;
  const slots: Date[] = [];

  for (let h = 0; h < hoursToSchedule; h += intervalHours) {
    const slot = new Date(now.getTime() + h * 60 * 60 * 1000);
    const hour = slot.getHours();
    if (hour >= quietStart && hour < quietEnd && quietStart < quietEnd) continue;
    if (quietStart > quietEnd && (hour >= quietStart || hour < quietEnd)) continue;
    slots.push(slot);
  }

  for (const slot of slots) {
    const category = pickCategory();
    const pool = NOTIFICATION_POOL[category];
    const message = fillTemplate(pickRandom(pool), ctx);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'THE SYSTEM',
        body: message.toUpperCase(),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: slot,
      },
    });
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}
```

- [ ] **Step 2: Commit**

```powershell
git add the-system/src/notifications/
git commit -m "feat: add notification scheduler with message pool and quiet hours"
```

---

## Task 11: Zustand Store

**Files:**
- Create: `the-system/src/store/useSystemStore.ts`

- [ ] **Step 1: Write Zustand store**

Create `the-system/src/store/useSystemStore.ts`:
```typescript
import { create } from 'zustand';
import { initDatabase } from '../db/database';
import {
  getHero,
  createHero,
  getAllDisciplines,
  getLogsForDate,
  getSilenceStreak,
  getPendingMandate,
  getSystemState,
  setSystemState,
} from '../db/queries';
import {
  completeDiscipline as xpComplete,
  failDiscipline as xpFail,
  triggerRelapse as xpRelapse,
} from '../engine/xpEngine';
import { openCurrentMandate, requestManualMandate } from '../engine/mandateEngine';
import { getThemeForRank } from '../theme/rankThemes';
import { format } from 'date-fns';
import type {
  Hero,
  Discipline,
  DisciplineLog,
  SilenceStreak,
  Mandate,
  HeroClass,
  Rank,
} from '../types';
import type { RankTheme } from '../theme/rankThemes';
import type { LevelUpEvent } from '../engine/xpEngine';
import type { LootResult } from '../engine/mandateEngine';

interface SystemState {
  initialized: boolean;
  hero: Hero | null;
  disciplines: Discipline[];
  todayLogs: DisciplineLog[];
  silenceStreak: SilenceStreak | null;
  currentTheme: RankTheme;
  pendingMandate: Mandate | null;
  onboardingComplete: boolean;

  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  createNewHero: (name: string, heroClass: HeroClass) => Promise<void>;
  completeDiscipline: (id: number) => Promise<{ xpGained: number; levelUp: LevelUpEvent | null }>;
  failDiscipline: (id: number) => Promise<void>;
  triggerRelapse: () => Promise<void>;
  openMandate: () => Promise<LootResult | null>;
  requestMandate: () => Promise<boolean>;
  completeOnboarding: () => Promise<void>;
}

const today = () => format(new Date(), 'yyyy-MM-dd');

export const useSystemStore = create<SystemState>((set, get) => ({
  initialized: false,
  hero: null,
  disciplines: [],
  todayLogs: [],
  silenceStreak: null,
  currentTheme: getThemeForRank('E'),
  pendingMandate: null,
  onboardingComplete: false,

  initialize: async () => {
    await initDatabase();
    const onboarding = await getSystemState('onboarding_complete');
    const hero = await getHero();

    set({
      initialized: true,
      onboardingComplete: onboarding === '1',
      hero,
      currentTheme: getThemeForRank((hero?.rank as Rank) ?? 'E'),
    });

    if (hero) {
      await get().refresh();
    }
  },

  refresh: async () => {
    const hero = await getHero();
    const disciplines = await getAllDisciplines();
    const todayLogs = await getLogsForDate(today());
    const silenceStreak = await getSilenceStreak();
    const pendingMandate = await getPendingMandate();

    set({
      hero,
      disciplines,
      todayLogs,
      silenceStreak,
      pendingMandate,
      currentTheme: getThemeForRank((hero?.rank as Rank) ?? 'E'),
    });
  },

  createNewHero: async (name: string, heroClass: HeroClass) => {
    await createHero(name, heroClass, new Date().toISOString().slice(0, 10));
    await get().refresh();
  },

  completeDiscipline: async (id: number) => {
    const result = await xpComplete(id, today());
    await get().refresh();
    return result;
  },

  failDiscipline: async (id: number) => {
    await xpFail(id, today());
    await get().refresh();
  },

  triggerRelapse: async () => {
    await xpRelapse(today());
    await get().refresh();
  },

  openMandate: async () => {
    const loot = await openCurrentMandate();
    await get().refresh();
    return loot;
  },

  requestMandate: async () => {
    const success = await requestManualMandate(today());
    if (success) await get().refresh();
    return success;
  },

  completeOnboarding: async () => {
    await setSystemState('onboarding_complete', '1');
    set({ onboardingComplete: true });
  },
}));
```

- [ ] **Step 2: Commit**

```powershell
git add the-system/src/store/
git commit -m "feat: add Zustand store with SQLite hydration and all core actions"
```

---

## Task 12: Navigation Shell + Screen Stubs

**Files:**
- Create: `the-system/src/navigation/AppNavigator.tsx`
- Create: `the-system/src/screens/CommandHall.tsx` (stub)
- Create: `the-system/src/screens/AscensionPath.tsx` (stub)
- Create: `the-system/src/screens/Mirror.tsx` (stub)
- Create: `the-system/src/screens/Codex.tsx` (stub)
- Create: `the-system/src/screens/Archive.tsx` (stub)
- Create: `the-system/src/screens/Awakening.tsx` (stub)
- Modify: `the-system/App.tsx`

- [ ] **Step 1: Write screen stubs**

Create `the-system/src/screens/AscensionPath.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSystemStore } from '../store/useSystemStore';

export default function AscensionPath() {
  const theme = useSystemStore((s) => s.currentTheme);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>THE ASCENSION PATH</Text>
      <Text style={[styles.sub, { color: theme.textSecondary }]}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16, fontWeight: 'bold' },
  sub: { fontSize: 12, marginTop: 8 },
});
```

Create `the-system/src/screens/Mirror.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSystemStore } from '../store/useSystemStore';

export default function Mirror() {
  const theme = useSystemStore((s) => s.currentTheme);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>THE MIRROR</Text>
      <Text style={[styles.sub, { color: theme.textSecondary }]}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16, fontWeight: 'bold' },
  sub: { fontSize: 12, marginTop: 8 },
});
```

Create `the-system/src/screens/Codex.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSystemStore } from '../store/useSystemStore';

export default function Codex() {
  const theme = useSystemStore((s) => s.currentTheme);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>THE CODEX</Text>
      <Text style={[styles.sub, { color: theme.textSecondary }]}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16, fontWeight: 'bold' },
  sub: { fontSize: 12, marginTop: 8 },
});
```

Create `the-system/src/screens/Archive.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSystemStore } from '../store/useSystemStore';

export default function Archive() {
  const theme = useSystemStore((s) => s.currentTheme);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>THE ARCHIVE</Text>
      <Text style={[styles.sub, { color: theme.textSecondary }]}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16, fontWeight: 'bold' },
  sub: { fontSize: 12, marginTop: 8 },
});
```

- [ ] **Step 2: Write navigation**

Create `the-system/src/navigation/AppNavigator.tsx`:
```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useSystemStore } from '../store/useSystemStore';

import CommandHall from '../screens/CommandHall';
import AscensionPath from '../screens/AscensionPath';
import Mirror from '../screens/Mirror';
import Codex from '../screens/Codex';
import Archive from '../screens/Archive';
import Awakening from '../screens/Awakening';

const Stack = createStackNavigator();
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
          <Stack.Screen name="Main" component={MainTabs} />
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

- [ ] **Step 3: Update App.tsx entry point**

Replace `the-system/App.tsx`:
```tsx
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { useSystemStore } from './src/store/useSystemStore';

export default function App() {
  const initialize = useSystemStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <AppNavigator />
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 4: Commit**

```powershell
git add the-system/src/navigation/ the-system/src/screens/ the-system/App.tsx
git commit -m "feat: add navigation shell with 5-tab layout and screen stubs"
```

---

## Task 13: Command Hall Screen (Functional)

**Files:**
- Create: `the-system/src/screens/CommandHall.tsx` (overwrite stub)
- Create: `the-system/src/components/ui/XPBar.tsx`
- Create: `the-system/src/components/ui/DisciplineCard.tsx`

- [ ] **Step 1: Write XP bar component**

Create `the-system/src/components/ui/XPBar.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSystemStore } from '../../store/useSystemStore';
import { getXpForLevel, XP_TABLE } from '../../engine/xpConstants';

export default function XPBar() {
  const hero = useSystemStore((s) => s.hero);
  const theme = useSystemStore((s) => s.currentTheme);

  if (!hero) return null;

  const currentXP = hero.global_xp;
  const currentLevelXP = XP_TABLE[hero.global_level] ?? 0;
  const nextLevelXP = getXpForLevel(hero.global_level + 1);

  let progress = 1;
  let xpText = 'MAX LEVEL';
  if (nextLevelXP !== null) {
    const range = nextLevelXP - currentLevelXP;
    const earned = currentXP - currentLevelXP;
    progress = range > 0 ? Math.min(1, Math.max(0, earned / range)) : 0;
    xpText = `${currentXP} / ${nextLevelXP} XP`;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.barBg, { borderColor: theme.accent }]}>
        <View
          style={[
            styles.barFill,
            { width: `${progress * 100}%`, backgroundColor: theme.accent },
          ]}
        />
      </View>
      <Text style={[styles.text, { color: theme.text }]}>
        LVL {hero.global_level} — {xpText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginVertical: 8 },
  barBg: {
    height: 16,
    borderWidth: 2,
    borderRadius: 2,
    backgroundColor: '#111',
    overflow: 'hidden',
  },
  barFill: { height: '100%' },
  text: { fontSize: 10, textAlign: 'center', marginTop: 4 },
});
```

- [ ] **Step 2: Write discipline card component**

Create `the-system/src/components/ui/DisciplineCard.tsx`:
```tsx
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
```

- [ ] **Step 3: Write Command Hall screen**

Create `the-system/src/screens/CommandHall.tsx`:
```tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSystemStore } from '../store/useSystemStore';
import { RANK_TITLES } from '../engine/xpConstants';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import XPBar from '../components/ui/XPBar';
import DisciplineCard from '../components/ui/DisciplineCard';
import type { Rank } from '../types';

export default function CommandHall() {
  const {
    hero,
    disciplines,
    todayLogs,
    silenceStreak,
    currentTheme: theme,
    completeDiscipline,
    failDiscipline,
    triggerRelapse,
  } = useSystemStore();

  if (!hero) return null;

  const daysElapsed = differenceInCalendarDays(
    new Date(),
    parseISO(hero.journey_start_date)
  );
  const dayNumber = Math.min(daysElapsed + 1, 180);

  const activeDisciplines = disciplines.filter((d) => d.is_active);

  const handleComplete = async (id: number) => {
    const result = await completeDiscipline(id);
    if (result.levelUp?.rankChanged) {
      Alert.alert('RANK UP', `You have ascended to ${result.levelUp.newRank}-Rank!`);
    } else if (result.levelUp) {
      Alert.alert('LEVEL UP', `Level ${result.levelUp.newLevel} reached!`);
    }
  };

  const handleFail = (id: number, code: string) => {
    if (code === 'SILENCE') {
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
      <View style={styles.headerRow}>
        <View style={[styles.rankBadge, { borderColor: theme.accent }]}>
          <Text style={[styles.rankText, { color: theme.accent }]}>{hero.rank}</Text>
        </View>
        <Text style={[styles.dayText, { color: theme.text }]}>
          DAY {dayNumber} OF 180
        </Text>
      </View>

      <View style={styles.avatarPlaceholder}>
        <Text style={[styles.avatarText, { color: theme.accent }]}>
          {hero.hero_class.toUpperCase()}
        </Text>
        <Text style={[styles.titleText, { color: theme.textSecondary }]}>
          {RANK_TITLES[hero.rank as Rank]}
        </Text>
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
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          DAILY QUEST LOG
        </Text>
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
  rankBadge: {
    borderWidth: 2,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  rankText: { fontSize: 18, fontWeight: 'bold' },
  dayText: { fontSize: 12 },
  avatarPlaceholder: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarText: { fontSize: 20, fontWeight: 'bold' },
  titleText: { fontSize: 12, marginTop: 4 },
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

- [ ] **Step 4: Commit**

```powershell
git add the-system/src/screens/CommandHall.tsx the-system/src/components/
git commit -m "feat: add functional Command Hall with XP bar, discipline cards, and quest log"
```

---

## Task 14: Awakening (Onboarding)

**Files:**
- Create: `the-system/src/screens/Awakening.tsx` (overwrite stub)

- [ ] **Step 1: Write Awakening screen**

Create `the-system/src/screens/Awakening.tsx`:
```tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useSystemStore } from '../store/useSystemStore';
import { requestNotificationPermissions } from '../notifications/scheduler';
import type { HeroClass } from '../types';

const { width } = Dimensions.get('window');

type Step = 'intro' | 'name' | 'class' | 'permissions' | 'accept';

const CLASSES: { name: HeroClass; desc: string }[] = [
  { name: 'Warrior', desc: 'Heavy armor, sword & shield, strong stance' },
  { name: 'Mage', desc: 'Robes, staff, arcane symbols' },
  { name: 'Rogue', desc: 'Light armor, dual blades, crouched stance' },
];

export default function Awakening() {
  const { createNewHero, completeOnboarding } = useSystemStore();

  const [step, setStep] = useState<Step>('intro');
  const [name, setName] = useState('Raynald Arvan Lim');
  const [heroClass, setHeroClass] = useState<HeroClass | null>(null);
  const [introText, setIntroText] = useState('');
  const opacity = useRef(new Animated.Value(0)).current;

  const fullIntro = 'THE SYSTEM HAS DETECTED A CANDIDATE.';

  useEffect(() => {
    if (step === 'intro') {
      let i = 0;
      const interval = setInterval(() => {
        setIntroText(fullIntro.slice(0, i + 1));
        i++;
        if (i >= fullIntro.length) clearInterval(interval);
      }, 60);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleAccept = async () => {
    if (!heroClass) return;
    await createNewHero(name, heroClass);
    await completeOnboarding();
  };

  return (
    <View style={styles.container}>
      {step === 'intro' && (
        <TouchableOpacity style={styles.fullScreen} onPress={() => setStep('name')}>
          <Animated.View style={{ opacity }}>
            <Text style={styles.introText}>{introText}</Text>
            {introText.length >= fullIntro.length && (
              <Text style={styles.tapHint}>TAP TO CONTINUE</Text>
            )}
          </Animated.View>
        </TouchableOpacity>
      )}

      {step === 'name' && (
        <View style={styles.section}>
          <Text style={styles.prompt}>IDENTIFY YOURSELF.</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholderTextColor="#666"
            selectionColor="#ffd700"
          />
          <TouchableOpacity
            style={styles.goldBtn}
            onPress={() => name.trim() && setStep('class')}
          >
            <Text style={styles.goldBtnText}>CONFIRM</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'class' && (
        <View style={styles.section}>
          <Text style={styles.prompt}>SELECT YOUR CLASS.</Text>
          {CLASSES.map((c) => (
            <TouchableOpacity
              key={c.name}
              style={[
                styles.classCard,
                heroClass === c.name && styles.classCardSelected,
              ]}
              onPress={() => setHeroClass(c.name)}
            >
              <Text style={styles.className}>{c.name.toUpperCase()}</Text>
              <Text style={styles.classDesc}>{c.desc}</Text>
            </TouchableOpacity>
          ))}
          {heroClass && (
            <TouchableOpacity
              style={styles.goldBtn}
              onPress={() => setStep('permissions')}
            >
              <Text style={styles.goldBtnText}>CONFIRM</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {step === 'permissions' && (
        <View style={styles.section}>
          <Text style={styles.prompt}>
            THE SYSTEM REQUIRES CERTAIN PERMISSIONS TO ENFORCE YOUR COVENANT.
          </Text>
          <TouchableOpacity
            style={styles.permBtn}
            onPress={async () => {
              await requestNotificationPermissions();
            }}
          >
            <Text style={styles.permBtnText}>GRANT NOTIFICATIONS</Text>
            <Text style={styles.permDesc}>Required to deliver system mandates.</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.goldBtn, { marginTop: 24 }]}
            onPress={() => setStep('accept')}
          >
            <Text style={styles.goldBtnText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'accept' && (
        <View style={styles.section}>
          <Text style={styles.prompt}>YOUR COVENANT BEGINS.</Text>
          <Text style={styles.dateText}>
            {new Date().toISOString().slice(0, 10)}
          </Text>
          <TouchableOpacity style={styles.goldBtn} onPress={handleAccept}>
            <Text style={styles.goldBtnText}>I ACCEPT</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  fullScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  section: { flex: 1, justifyContent: 'center', padding: 32 },
  introText: { color: '#ffd700', fontSize: 20, textAlign: 'center', fontWeight: 'bold' },
  tapHint: { color: '#666', fontSize: 10, textAlign: 'center', marginTop: 32 },
  prompt: { color: '#ffd700', fontSize: 16, textAlign: 'center', marginBottom: 24, fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#ffd700',
    color: '#fff',
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  goldBtn: {
    backgroundColor: '#ffd700',
    padding: 14,
    alignItems: 'center',
    borderRadius: 4,
  },
  goldBtnText: { color: '#000', fontSize: 14, fontWeight: 'bold' },
  classCard: {
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    marginVertical: 6,
    borderRadius: 4,
  },
  classCardSelected: { borderColor: '#ffd700', backgroundColor: '#1a1500' },
  className: { color: '#ffd700', fontSize: 14, fontWeight: 'bold' },
  classDesc: { color: '#999', fontSize: 11, marginTop: 4 },
  permBtn: {
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    marginVertical: 6,
    borderRadius: 4,
  },
  permBtnText: { color: '#ffd700', fontSize: 12, fontWeight: 'bold' },
  permDesc: { color: '#666', fontSize: 10, marginTop: 4 },
  dateText: { color: '#ffd700', fontSize: 24, textAlign: 'center', marginBottom: 24, fontWeight: 'bold' },
});
```

- [ ] **Step 2: Commit**

```powershell
git add the-system/src/screens/Awakening.tsx
git commit -m "feat: add Awakening onboarding flow with name, class, permissions, and covenant"
```

---

## Task 15: Verify Build

- [ ] **Step 1: Run TypeScript check**

```powershell
cd the-system; npx tsc --noEmit
```
Expected: No errors. Fix any type errors found.

- [ ] **Step 2: Run tests**

```powershell
cd the-system; npx jest --no-coverage
```
Expected: All tests pass.

- [ ] **Step 3: Start Metro bundler to verify bundling**

```powershell
cd the-system; npx expo start
```
Expected: Metro bundler starts without errors.

- [ ] **Step 4: Build Android debug APK**

```powershell
cd the-system/android; .\gradlew assembleDebug
```
Expected: BUILD SUCCESSFUL. APK at `android/app/build/outputs/apk/debug/app-debug.apk`.

- [ ] **Step 5: Final commit**

```powershell
git add -A
git commit -m "chore: verify build passes (TypeScript, tests, Metro, Android)"
```

---

## Future Phases

**Phase 2: SVG Visual System** — Avatar sprites (composable layers), discipline icons, rank auras/particles, UI pixel borders, world map nodes, mandate chests

**Phase 3: Remaining Screens** — Mirror (avatar room), Archive (stats/heatmap), AscensionPath (24-node world map), Codex (discipline manager), modals (mandate reveal, shield, rank-up, level-up)

**Phase 4: Native Android Modules** — ShieldModule (DevicePolicyManager lockNow), UsageStatsModule (PRESENCE auto-tracking), permissions flow

**Phase 5: Polish & Release** — Press Start 2P font, generated retro sound effects, app icon generation, final cutscene, data export/import, Settings screen, release APK build
