# THE SYSTEM — Design Spec

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| SDK | Expo 53 + RN 0.79 | Latest stable, better tooling/security |
| Architecture | Monolithic Zustand + SQLite write-through | Simple, matches SRD, sufficient for single-user offline app |
| Shield Protocol | Screen lock only (no browser kill) | No AccessibilityService needed, simpler permissions |
| Sound effects | Generated retro placeholders | Code-generated beep/chime tones, replaceable later |
| Build order | Core engine first | DB + engines + basic UI shell, then screens |
| Update safety | Schema migrations + Android data persistence | APK updates preserve /data/data/, migrations handle schema changes |

## 1. Data Layer

### SQLite (expo-sqlite v15+)

Schema matches SRD Section 3 with one addition:

```sql
CREATE TABLE schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);
```

### Migration System

```
src/db/migrations/
  ├── index.ts          -- runner: reads max version, runs unapplied in order
  ├── 001_initial.ts    -- all SRD tables + seed 8 disciplines
  ├── 002_future.ts     -- example: future schema changes
```

Each migration runs in a transaction. Failure rolls back, shows error screen.

### Zustand Store

Single `useSystemStore` with slices:
- `hero` — player identity, XP, level, rank
- `disciplines` — 8 core + custom disciplines
- `todayLogs` — today's completion state
- `silenceStreak` — current/longest/relapses
- `currentTheme` — derived from hero.rank
- `pendingMandate` — unopened chest if any

Hydrates from SQLite after migrations. All mutations write to SQLite first, then update store.

## 2. Core Engines

### XP Engine (`src/engine/xpEngine.ts`)

- `completeDiscipline(id, date)` — streak multiplier → insert log → add XP → check level-up
- `failDiscipline(id, date)` — deduct XP (floor 0) → reset streak
- `triggerRelapse(date)` — XP=0, level=1, rank=E, all streaks reset, weapon tier 1 cracked
- `checkLevelUp()` — XP table lookup → rank promotion → mandate grant
- `getStreakMultiplier(days)` — 1-6: x1.0, 7-13: x1.5, 14-29: x2.0, 30-89: x3.0, 90+: x4.0

### Midnight Engine (`src/engine/midnightEngine.ts`)

Triggers at 00:01 via expo-notifications scheduled trigger.

1. Iterate active disciplines for yesterday
2. Auto-fail any without completion log
3. Check PRESENCE via UsageStats module
4. Increment SILENCE streak if no relapse
5. Weekly milestone check on Mondays

### Mandate Engine (`src/engine/mandateEngine.ts`)

- Grant: GOLD every 10 levels, SILVER every 5, BRONZE otherwise
- Open: roll loot table per tier (SRD Section 15)
- Manual: once per 7 days, always BRONZE
- Constraint: no stacking — new mandate blocked while one unopened

### Theme Engine (`src/theme/rankThemes.ts`)

Static RANK_THEMES object (SRD Section 17). `useTheme()` hook reads hero.rank → returns theme. All UI components consume via this hook.

## 3. Native Modules

### ShieldModule (Java)

- `activate()` — `DevicePolicyManager.lockNow()` + start 10-min countdown
- Requires BIND_DEVICE_ADMIN permission
- Overlay rendered in React Native (avatar + countdown timer)
- No AccessibilityService, no browser kill

### UsageStatsModule (Java)

- `getScrollingTimeToday()` — reads UsageStatsManager for tracked packages, returns minutes
- Tracked: Chrome, Firefox, Instagram, Twitter, Facebook, TikTok, Reddit, YouTube
- Requires PACKAGE_USAGE_STATS permission

### AndroidManifest Permissions

- BIND_DEVICE_ADMIN (Shield)
- PACKAGE_USAGE_STATS (PRESENCE)
- POST_NOTIFICATIONS + SCHEDULE_EXACT_ALARM (notifications)
- RECEIVE_BOOT_COMPLETED (reschedule on reboot)

## 4. Screens & Navigation

```
Root Stack:
  ├── Awakening (onboarding) — if onboarding_complete !== '1'
  └── MainTabs (5 tabs)
        ├── CommandHall (home)
        ├── AscensionPath (world map)
        ├── Mirror (avatar room)
        ├── Codex (discipline manager)
        └── Archive (stats)

Modal Stack:
  ├── MandateReveal
  ├── ShieldOverlay
  ├── LevelUpSplash
  ├── RankUpSplash
  └── Settings (via header icon in CommandHall)
```

### Build Order

1. CommandHall — avatar placeholder, XP bar, quest log, complete/fail buttons
2. Awakening — onboarding (name, class, permissions)
3. Mirror — avatar + equipment slots
4. Archive — stats/history/heatmap
5. AscensionPath — world map 24 nodes
6. Codex — discipline add/edit/delete
7. Modals — mandate, shield, rank-up, level-up

## 5. SVG Asset System

All visuals via `react-native-svg`. No external images.

### Avatar (composable layers)

- Base body: 3 classes × 4 moods = 12 base SVG components
- Equipment overlays: weapon layer (5 tiers per class), armor layer (5 tiers), crown/aura (5 tiers)
- Each pixel = SVG `<Rect>` in 64×96 grid
- Mood computed from last 3 days completion rate

### Other SVGs

- 8 discipline icons (32×32 pixel art)
- 6 rank aura/particle systems (animated with reanimated)
- 6 UI border sets (9-slice pixel borders per rank)
- 24 world map nodes (locked/unlocked/current states)
- 3 mandate chests (Bronze/Silver/Gold) with animation
- Rank promotion splash (fullscreen gold rays)
- S-Rank final cutscene (6-frame sequence)
- App icon (1024×1024, generated in build script)

## 6. Update Safety

### Why It Works

Android APK updates (same package name, higher version code) preserve `/data/data/com.thesystem/`. SQLite DB lives there — data persists automatically. Only uninstall wipes data.

### Migration Strategy

1. App launch → open DB
2. Create `schema_version` if not exists
3. Read max applied version
4. Run unapplied migrations in version order, each in transaction
5. On success → hydrate store
6. On failure → show error, don't corrupt data

### Safeguards

- Package name: `com.thesystem` (never changes)
- Version code: increments each build
- No OTA updates (bare workflow, sideloaded)
- JSON export/import in Settings for manual backup
- Future patches: add migration file + bump version code + build APK

## 7. Notifications

expo-notifications scheduled at configurable intervals (1-6 hours, default 3).

- Message pool from SRD Section 14 with context-aware selection
- Quiet hours configurable (default 00:00-07:00)
- Reschedule on app open (next 48 hours)
- Reschedule on boot via RECEIVE_BOOT_COMPLETED

## 8. Project Structure

```
the-system/
├── android/                      # Bare workflow native files
│   └── app/src/main/java/com/thesystem/
│       ├── ShieldModule.java
│       ├── ShieldPackage.java
│       ├── UsageStatsModule.java
│       ├── UsageStatsPackage.java
│       └── DeviceAdminReceiver.java
├── src/
│   ├── assets/
│   │   ├── fonts/                # Press Start 2P .ttf
│   │   └── sounds/               # Generated .mp3 placeholders
│   ├── components/
│   │   ├── avatar/               # Composable avatar layers
│   │   ├── ui/                   # Pixel borders, XP bar, badges
│   │   ├── particles/            # Rank-based particle systems
│   │   └── icons/                # 8 discipline SVG icons
│   ├── screens/
│   │   ├── Awakening.tsx
│   │   ├── CommandHall.tsx
│   │   ├── AscensionPath.tsx
│   │   ├── Mirror.tsx
│   │   ├── Codex.tsx
│   │   ├── Archive.tsx
│   │   ├── MandateReveal.tsx
│   │   ├── ShieldOverlay.tsx
│   │   ├── LevelUpSplash.tsx
│   │   ├── RankUpSplash.tsx
│   │   └── Settings.tsx
│   ├── engine/
│   │   ├── xpEngine.ts
│   │   ├── midnightEngine.ts
│   │   └── mandateEngine.ts
│   ├── db/
│   │   ├── database.ts           # DB init + connection
│   │   ├── queries.ts            # All SQL queries
│   │   └── migrations/
│   │       ├── index.ts
│   │       └── 001_initial.ts
│   ├── store/
│   │   └── useSystemStore.ts
│   ├── theme/
│   │   └── rankThemes.ts
│   ├── notifications/
│   │   └── scheduler.ts
│   └── native/
│       └── ShieldModule.ts       # JS bridge to native
├── app.json
├── package.json
├── tsconfig.json
└── index.js
```

## 9. Dependencies (Updated for Expo 53)

```
expo ~53.0.0
react-native 0.79.x
expo-sqlite ~15.0.0
expo-notifications ~0.31.0
expo-font ~13.0.0
expo-keep-awake ~14.0.0
expo-device ~7.0.0
expo-application ~6.0.0
react-native-svg ~15.0.0
react-native-reanimated ~3.17.0
react-native-gesture-handler ~2.21.0
@react-navigation/native ~7.0.0
@react-navigation/bottom-tabs ~7.0.0
@react-navigation/stack ~7.0.0
react-native-screens ~4.5.0
react-native-safe-area-context ~5.0.0
react-native-device-info ~13.0.0
date-fns ~4.0.0
zustand ~5.0.0
```

## 10. App Rules (from SRD, enforced in code)

1. SILENCE relapse = total reset (XP=0, level=1, rank=E, all streaks reset)
2. No retroactive logging (today's date only)
3. Missed deadline = auto-fail at midnight
4. FORGE is daily, no exceptions
5. Shield requires Device Admin
6. 6-month timer is permanent, no pause/reset
7. Mandates don't stack
8. Manual mandate = once per 7 days
9. Global XP floor = 0
10. Notifications cannot be disabled in-app
