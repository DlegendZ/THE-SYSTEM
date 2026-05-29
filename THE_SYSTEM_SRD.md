# THE SYSTEM — Software Requirements Document (SRD)
### Version 1.0 | For Claude Code
---

## 0. OVERVIEW

**App Name:** THE SYSTEM  
**Player:** Raynald Arvan Lim  
**Platform:** Android APK (Android 12+, Portrait only)  
**Framework:** React Native — Expo Bare Workflow  
**Internet Required:** Never. 100% offline.  
**Duration:** 6 months from onboarding date  
**Goal:** Build a pixel-art RPG productivity app that tracks 8 life disciplines, ranks the player from E to S over 180 days, and transforms the entire UI/avatar/aura at each rank tier.

---

## 1. PROJECT STRUCTURE

```
the-system/
├── android/                      # Bare workflow Android native files
├── src/
│   ├── assets/
│   │   ├── fonts/                # Press Start 2P (bundled .ttf)
│   │   ├── svg/                  # All SVG assets (see Section 8)
│   │   └── sounds/               # Local .mp3 sound effects
│   ├── components/               # Reusable UI components
│   ├── screens/                  # One file per screen
│   ├── engine/                   # Core logic modules
│   ├── db/                       # SQLite schema + queries
│   ├── notifications/            # Local notification scheduler
│   ├── native/                   # Android-specific modules
│   └── theme/                    # Rank-based theme definitions
├── app.json
├── package.json
└── index.js
```

---

## 2. DEPENDENCIES

```json
{
  "expo": "~51.0.0",
  "react-native": "0.74.x",
  "expo-sqlite": "^14.0.0",
  "expo-notifications": "^0.28.0",
  "expo-font": "^12.0.0",
  "expo-keep-awake": "^13.0.0",
  "expo-device": "^6.0.0",
  "expo-application": "^5.8.0",
  "react-native-svg": "^15.0.0",
  "react-native-reanimated": "^3.10.0",
  "react-native-gesture-handler": "^2.16.0",
  "@react-navigation/native": "^6.1.0",
  "@react-navigation/stack": "^6.3.0",
  "react-native-screens": "^3.31.0",
  "react-native-safe-area-context": "^4.10.0",
  "react-native-device-info": "^10.13.0",
  "react-native-permissions": "^4.1.0",
  "expo-usage-stats": "^1.0.0",
  "react-native-vector-icons": "^10.1.0",
  "date-fns": "^3.6.0",
  "zustand": "^4.5.0"
}
```

**Native modules required (Bare Workflow only):**
- `DevicePolicyManager` via custom Android module — for screen lock
- `UsageStatsManager` via custom Android module — for screen time tracking
- `AccessibilityService` via custom Android module — for browser kill

---

## 3. DATABASE SCHEMA (SQLite via expo-sqlite)

```sql
-- Hero table (single row, player identity)
CREATE TABLE hero (
  id INTEGER PRIMARY KEY DEFAULT 1,
  name TEXT NOT NULL DEFAULT 'Raynald Arvan Lim',
  hero_class TEXT NOT NULL DEFAULT 'Warrior',
  global_xp INTEGER NOT NULL DEFAULT 0,
  global_level INTEGER NOT NULL DEFAULT 1,
  rank TEXT NOT NULL DEFAULT 'E',
  journey_start_date TEXT NOT NULL,  -- ISO8601
  journey_complete INTEGER NOT NULL DEFAULT 0
);

-- Disciplines (the 8 core habits)
CREATE TABLE disciplines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,          -- RISE, REST, NOURISH, SILENCE, FORGE, KNOWLEDGE, PRESENCE, RITUAL
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL,           -- EASY, NORMAL, HARD, LEGENDARY
  xp_gain INTEGER NOT NULL,
  xp_loss INTEGER NOT NULL,
  deadline_time TEXT,                 -- HH:MM format, NULL if not time-based
  is_active INTEGER NOT NULL DEFAULT 1,
  is_custom INTEGER NOT NULL DEFAULT 0,
  frequency TEXT NOT NULL DEFAULT 'daily',  -- always 'daily' for all disciplines
  active_days TEXT,                   -- reserved, unused (all disciplines are daily)
  created_at TEXT NOT NULL
);

-- Discipline logs (one row per discipline per day)
CREATE TABLE discipline_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discipline_id INTEGER NOT NULL REFERENCES disciplines(id),
  log_date TEXT NOT NULL,             -- YYYY-MM-DD
  completed INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  xp_delta INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  logged_at TEXT NOT NULL,
  UNIQUE(discipline_id, log_date)
);

-- Silence Protocol (PMO streak)
CREATE TABLE silence_streak (
  id INTEGER PRIMARY KEY DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_success_date TEXT,             -- YYYY-MM-DD
  total_relapses INTEGER NOT NULL DEFAULT 0,
  last_relapse_date TEXT
);

-- Cosmetics
CREATE TABLE cosmetics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,                 -- weapon | armor | crown | title | background | accessory
  tier INTEGER NOT NULL DEFAULT 1,   -- 1-5
  name TEXT NOT NULL,
  unlocked INTEGER NOT NULL DEFAULT 0,
  equipped INTEGER NOT NULL DEFAULT 0,
  unlocked_at TEXT
);

-- Mandates (reward chests)
CREATE TABLE mandates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tier TEXT NOT NULL,                 -- BRONZE | SILVER | GOLD
  opened INTEGER NOT NULL DEFAULT 0,
  granted_at TEXT NOT NULL,
  opened_at TEXT,
  loot_type TEXT,
  loot_id INTEGER
);

-- Notifications log
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  category TEXT NOT NULL,            -- SILENCE | FORGE | HEALTH | GENERAL | MILESTONE
  scheduled_at TEXT NOT NULL,
  fired INTEGER NOT NULL DEFAULT 0
);

-- Manual mandate cooldown
CREATE TABLE system_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Keys: last_manual_mandate_date, onboarding_complete, shield_active
```

---

## 4. THE EIGHT DISCIPLINES

Seed these into the `disciplines` table on first launch.

| Code | Name (Display) | Description | Difficulty | XP Gain | XP Loss | Deadline |
|---|---|---|---|---|---|---|
| RISE | Wake Before Dawn | Out of bed by 08:30. The day belongs to those who claim it first. | HARD | 50 | 30 | 08:30 |
| REST | Night Silence | Phone down, lights off before 23:00. Recovery is strategy. | HARD | 50 | 30 | 23:00 |
| NOURISH | Clean Fuel | One clean meal log. No processed poison. Your body is armor. | NORMAL | 25 | 15 | 23:59 |
| SILENCE | The Silence Protocol | The war against the mind's weakest impulse. Streak is sacred. | LEGENDARY | 100 | RESET_ALL | — |
| FORGE | Iron Temple | Every day is a gym day. Lifting or cardio — the Iron Temple does not close. | HARD | 60 | 35 | 23:59 |
| KNOWLEDGE | The Scroll | Minimum 10 pages of a real book read today. | NORMAL | 25 | 15 | 23:59 |
| PRESENCE | The Veil | Screen scrolling under 30 minutes. Auto-tracked via UsageStats. | NORMAL | 25 | 15 | 23:59 |
| RITUAL | The Ritual | Daily skincare routine completed. Discipline in small things. | EASY | 10 | 5 | 23:59 |

**SILENCE special rules:**
- `xp_loss` of `RESET_ALL` means: on relapse, set `hero.global_xp = 0`, `hero.global_level = 1`, `hero.rank = 'E'`, reset all sub-ranks, reset all streaks, reset all cosmetic tiers except already-unlocked titles.
- SILENCE does not have a deadline — it is a persistent streak measured in days.

**PRESENCE auto-tracking:**
- Read screen time daily from `UsageStatsManager` at midnight.
- If total social/browser screen time > 30 minutes → auto-fail PRESENCE for that day.
- Show live screen time counter on home screen.

**FORGE — daily, no exceptions:**
- FORGE is a daily discipline. Lifting days and cardio/treadmill days both count as Iron Temple sessions.
- No training day selector. No rest days. The gym appears in the quest log every single day.
- Penalty applies every day if not completed by 23:59.
- The discipline description on the card reads: "Lifting or cardio. The Iron Temple does not close."

---

## 5. RANK SYSTEM

### Global Levels and Ranks

Total: 30 levels across 6 ranks over ~180 days.

| Rank | Levels | Approx Days | Title |
|---|---|---|---|
| E-Rank | 1–5 | 0–20 | The Awakened |
| D-Rank | 6–10 | 21–50 | The Tested |
| C-Rank | 11–15 | 51–90 | The Disciplined |
| B-Rank | 16–20 | 91–130 | The Forged |
| A-Rank | 21–25 | 131–160 | The Sovereign |
| S-Rank | 26–30 | 161–180 | The Transcendent |

### XP Requirements Per Level

```javascript
const XP_TABLE = {
  1:  0,
  2:  300,
  3:  700,
  4:  1200,
  5:  1800,   // E-Rank max
  6:  2500,
  7:  3400,
  8:  4400,
  9:  5600,
  10: 7000,   // D-Rank max
  11: 8600,
  12: 10400,
  13: 12400,
  14: 14600,
  15: 17000,  // C-Rank max
  16: 19600,
  17: 22500,
  18: 25700,
  19: 29200,
  20: 33000,  // B-Rank max
  21: 37100,
  22: 41500,
  23: 46200,
  24: 51200,
  25: 56500,  // A-Rank max
  26: 62100,
  27: 68000,
  28: 74200,
  29: 80700,
  30: 87500,  // S-Rank max — JOURNEY COMPLETE
};
```

### Streak Multipliers (applied per discipline)

| Streak Days | Multiplier |
|---|---|
| 1–6 | x1.0 |
| 7–13 | x1.5 |
| 14–29 | x2.0 |
| 30–89 | x3.0 |
| 90+ | x4.0 |

---

## 6. RANK VISUAL IDENTITY

Every rank changes: background, aura color, particle effects, avatar appearance, UI borders, UI color palette. All assets are SVG, inline in code.

### E-Rank
- **Background:** Deep black stone texture, pixel cracks
- **Aura:** None (avatar has no glow)
- **Particles:** Faint grey dust motes, slow drift
- **Avatar:** Plain silhouette, torn cloth, no weapon glow
- **UI borders:** Cracked stone pixel border, grey (#4a4a4a)
- **Primary color:** #2a2a2a (near black)
- **Accent:** #666666 (dim grey)
- **Text:** #aaaaaa

### D-Rank
- **Background:** Dark dungeon brick, faint orange torch glow at edges
- **Aura:** Faint bronze outline shimmer on avatar
- **Particles:** Ember sparks floating upward, slow
- **Avatar:** Bronze-tinted armor pieces appearing
- **UI borders:** Worn iron border, rivets visible
- **Primary color:** #1a0f00
- **Accent:** #b87333 (bronze)
- **Text:** #d4a96a

### C-Rank
- **Background:** Stone with gold veins running through it
- **Aura:** Gold pulse ring around avatar, slow breathe effect
- **Particles:** Gold sparks, slow orbit around avatar
- **Avatar:** Chain mail, iron sword, faint gold circlet
- **UI borders:** Engraved gold border
- **Primary color:** #0d0900
- **Accent:** #f0a500 (gold)
- **Text:** #f5c842

### B-Rank
- **Background:** Dark marble with gold trim panels
- **Aura:** Bright gold, continuous pulse + wing shadows forming behind avatar
- **Particles:** Gold streaks, faster orbit, occasional light burst
- **Avatar:** Full plate armor (black + gold trim), wings outline forming, crown forming
- **UI borders:** Gilded ornate border, corner flourishes
- **Primary color:** #080600
- **Accent:** #ffd700 (bright gold)
- **Text:** #fff4b0

### A-Rank
- **Background:** Black void with gold constellation lines connecting
- **Aura:** Royal gold + white combined, double ring pulse
- **Particles:** Light pillars from ground, falling star streaks
- **Avatar:** Full gold aura, wings extended, floating crown above head
- **UI borders:** Celestial rune border, animated shimmer sweep
- **Primary color:** #050406
- **Accent:** #ffe566 (celestial gold)
- **Text:** #ffffff
- **Special:** Subtle screen edge glow (gold vignette)

### S-Rank
- **Background:** Heaven gate — black sky, divine gold beams radiating from top center
- **Aura:** Blinding gold + pure white combined, rapid pulse
- **Particles:** God rays, orbiting pixel crowns, rising light columns, constant
- **Avatar:** Full divine transformation — radiates white-gold light, floats 4px off ground (loop), full wings, divine crown, weapon glows with runes
- **UI borders:** Divine mandala border, animated rotation (slow, majestic)
- **Primary color:** #000000
- **Accent:** #ffffff (white gold alternating)
- **Text:** #ffffff
- **Special:** Entire app has a subtle breathing glow effect on the outer frame

---

## 7. AVATAR SYSTEM

### Hero Classes (chosen at onboarding)
- **Warrior** — Heavy armor, sword + shield, strong stance
- **Mage** — Robes, staff, arcane symbols
- **Rogue** — Light armor, dual blades, crouched stance

### Equipment Slots and Visual Tiers (5 tiers per slot)

**Weapon Slot (Willpower / Silence Protocol)**

| Tier | Warrior | Mage | Rogue |
|---|---|---|---|
| 1 (E) | Stick | Broken Wand | Rusty Dagger |
| 2 (D) | Iron Sword | Wooden Staff | Iron Blade |
| 3 (C) | Steel Sword | Crystal Staff | Twin Daggers |
| 4 (B) | Gold-Trimmed Blade | Enchanted Staff | Shadow Blades |
| 5 (S) | Divine Sword (runes glow) | God Staff (light emanating) | Void Blades (dark + gold) |

**Armor Slot (Strength / FORGE)**

| Tier | All Classes |
|---|---|
| 1 (E) | Torn cloth / Peasant robe |
| 2 (D) | Leather armor |
| 3 (C) | Chain mail |
| 4 (B) | Black plate armor (gold trim) |
| 5 (S) | Divine sovereign armor (radiating) |

**Crown/Aura Slot (overall rank)**

| Tier | All |
|---|---|
| 1 (E) | Nothing |
| 2 (D) | Faint glow outline |
| 3 (C) | Gold circlet, pulsing aura ring |
| 4 (B) | Wing shadows, crown forming |
| 5 (S) | Full divine crown, full wings, floating |

### Avatar Mood States

Computed from last 3 days completion rate:
- **Radiant (90–100%):** Gold glow, upright proud stance, sparkles
- **Steady (60–89%):** Normal stance, faint glow
- **Worn (30–59%):** Slight slump, desaturated slightly, no glow
- **Broken (<30%):** Hunched stance, cracked armor, dark tint, slow dust particles

### Relapse Visual State (Silence Protocol)

When SILENCE is relapsed:
- Weapon sprite switches to cracked/darkened variant
- Avatar drops to Broken mood regardless of other stats
- Dark tint overlay on weapon slot in Mirror screen
- Restored after 7 consecutive clean SILENCE days

---

## 8. ASSETS — ALL SVG, ALL GENERATED IN CODE

No external image files. Every visual element is SVG rendered via `react-native-svg`.

### Required SVG Assets to Build

**App Icon (1024x1024)**
- Black background
- Gold pixel-art crown center
- Below crown: pixel text "THE SYSTEM" in gold
- Outer border: pixel mandala ring in gold
- Corner runes in each quadrant

**Avatar Sprites (per class x 5 weapon tiers x 5 armor tiers x 4 mood states)**
- Each avatar is a 64x96 pixel grid, rendered as SVG rectangles
- Pixel art style — hard edges, no anti-aliasing
- Each pixel is a 2x2 or 3x3 SVG rect
- Warrior, Mage, Rogue silhouettes differ in shape and stance

**Aura Layers (animated SVG, per rank)**
- Rendered as SVG circles with animated opacity/scale
- Gold radial gradients for C-Rank+
- Particle systems: SVG circles with randomized position animations

**World Map Nodes (24 nodes)**
- Each node: 24x24 pixel SVG
- Locked: grey stone circle with pixel lock icon
- Unlocked: gold circle with rank rune
- Current: animated gold pulse ring

**Mandate Chests**
- Bronze: brown pixel chest, iron lock, 48x48
- Silver: silver pixel chest, glowing edges, 48x48
- Gold: black pixel chest, gold trim, animated glow, 48x48

**Discipline Icons (8 icons, each 32x32 pixel SVG)**
- RISE: pixel sun rising over horizon
- REST: pixel crescent moon
- NOURISH: pixel leaf / bowl
- SILENCE: pixel locked shield
- FORGE: pixel dumbbell
- KNOWLEDGE: pixel open book
- PRESENCE: pixel hourglass
- RITUAL: pixel potion bottle

**UI Frame Elements**
- 9-slice pixel borders per rank (corner pieces + edge pieces)
- XP bar: pixel segmented bar, gold fill
- Rank badge: pixel hexagon with rank letter

**Rank Promotion Splash (fullscreen SVG animation)**
- When rank changes: fullscreen black, gold rays burst from center
- Rank letter appears large in pixel font
- Title text fades in below

**S-Rank Final Cutscene (SVG animation sequence)**
- 6-frame pixel animation: hero stands, light descends, wings spread, crown descends, full glow
- System text scrolls: "RAYNALD ARVAN LIM. THE SYSTEM HAS RENDERED ITS VERDICT. YOU ARE TRANSCENDENT."

---

## 9. SCREENS

### Screen 9.1 — THE AWAKENING (Onboarding)

Flow (single linear sequence, cannot be skipped):

1. **Frame 1:** Black screen. Gold text fades in letter by letter: "THE SYSTEM HAS DETECTED A CANDIDATE." 3 second pause. Tap to continue.
2. **Frame 2:** "IDENTIFY YOURSELF." Text input appears. Pre-filled: "Raynald Arvan Lim". Player can edit. Confirm button.
3. **Frame 3:** "SELECT YOUR CLASS." Three pixel character cards: Warrior / Mage / Rogue. Tap to select. Confirm.
4. **Frame 4:** "THE SYSTEM REQUIRES CERTAIN PERMISSIONS TO ENFORCE YOUR COVENANT." List of permissions with explanations:
   - Notifications: "Required to deliver system mandates."
   - Usage Stats: "Required to track The Veil discipline."
   - Device Admin: "Required for Shield Protocol. Grants the ability to lock your screen."
   - Accessibility Service: "Required for Shield Protocol browser kill."
   Each has a "Grant" button that opens the system dialog.
5. **Frame 5:** "YOUR COVENANT BEGINS." Display start date. Gold button: "I ACCEPT." Journey timer starts. Navigate to Command Hall.

### Screen 9.2 — COMMAND HALL (Home Screen)

Layout (top to bottom):

```
[RANK BADGE]              [DAY X OF 180]    [SETTINGS ICON]
─────────────────────────────────────────────
        [AVATAR — animated, centered]
        [AURA PARTICLES around avatar]
─────────────────────────────────────────────
[XP BAR — full width, segmented, shows XP/next level]
─────────────────────────────────────────────
[SILENCE PROTOCOL STREAK — large pixel number]
[subtitle: "DAYS OF SILENCE"]
─────────────────────────────────────────────
[DAILY QUEST LOG — scrollable list]
  Each discipline card shows:
  - Pixel icon (left)
  - Discipline name (pixel font)
  - Difficulty badge
  - Deadline or status
  - Complete button (right) — tap to check off
  - Streak counter (small, below name)
─────────────────────────────────────────────
[SHIELD BUTTON — large red pixel button, bottom]
[label: "SHIELD PROTOCOL"]
─────────────────────────────────────────────
[BOTTOM NAV: Command Hall | Ascension Path | Mirror | Archive]
```

**Quest log discipline card states:**
- Default: dark background, white text, pixel icon, complete button gold
- Completed: green-tinted background, checkmark icon, no button
- Failed (past deadline): red-tinted background, X icon, penalty shown

**Mandate notification:** If an unopened mandate exists, golden animated chest icon appears floating above the avatar. Tap navigates to Mandate Reveal screen.

### Screen 9.3 — THE ASCENSION PATH (World Map)

Vertical scroll. Bottom = start (underground cavern). Top = end (divine throne).

- 24 weekly nodes arranged on a winding pixel path
- Current week node has animated gold pulse ring
- Completed nodes: gold, filled, show week number + completion %
- Locked nodes: grey, locked icon
- Tapping a completed node: shows lore text for that week (system message style)
- Background changes zone as player scrolls (matches rank zones)
- Player position indicator: small pixel avatar icon on current node

Zone backgrounds:
- Nodes 1–4: Underground cavern (black + grey)
- Nodes 5–8: Ruined kingdom surface (dark brown + orange sky)
- Nodes 9–12: Iron Mountain range (dark + storm grey)
- Nodes 13–16: Castle in clouds (dark blue + gold)
- Nodes 17–20: Above clouds, star fields (deep blue + gold stars)
- Nodes 21–24: Divine throne approach (black + gold divine beams)

### Screen 9.4 — THE MIRROR (Avatar Room)

Layout:
```
[PLAYER NAME]      [RANK BADGE]
────────────────────────────────
     [LARGE AVATAR — centered, full aura active]
     [floating above slight ground shadow]
────────────────────────────────
[EQUIPMENT SLOTS — horizontal row]
[Weapon] [Armor] [Crown]
Each shows current equipped item as pixel thumbnail
Tap to open cosmetic selection drawer
────────────────────────────────
[STATS PANEL]
  Willpower:  ████░░░░  Level X
  Strength:   ███░░░░░  Level X
  Vitality:   █████░░░  Level X
────────────────────────────────
[TITLES — horizontal scroll of unlocked titles]
```

### Screen 9.5 — THE CODEX (Discipline Manager)

- List of all 8 disciplines + any custom ones added
- Each row: icon, name, frequency, difficulty, XP values, edit pencil icon, delete icon
- "ADD DISCIPLINE" button at bottom
- Add/Edit modal: name input, description, difficulty picker, deadline time picker, frequency picker, active days multi-select
- Cannot delete SILENCE. Can disable it temporarily.

### Screen 9.6 — MANDATE REVEAL (Chest Opening)

Triggered when unopened mandate exists and player taps the floating chest.

Sequence:
1. Full black screen
2. Chest SVG appears center, animates: shaking, glow pulsing
3. Player taps chest
4. Chest bursts open (pixel explosion animation)
5. Loot item rises from chest with golden light rays
6. Item name appears in pixel font, category text below
7. Loot types:
   - Cosmetic unlock (weapon/armor tier unlock, title, accessory)
   - Motivational system scroll (single message, styled as ancient scroll SVG)
   - Avatar title grant
8. "MANDATE RECEIVED" button to dismiss

### Screen 9.7 — THE ARCHIVE (Statistics)

Tabs: Overview | Disciplines | Streaks | History

**Overview tab:**
- Journey progress: pixel progress bar (days elapsed / 180)
- Global XP chart: line graph, pixel dots, gold line
- Rank badge + title + promotion dates
- Total mandates received

**Disciplines tab:**
- Per discipline: completion heatmap (7 weeks wide pixel grid, darker = completed)
- Streak: current / best
- Total completions / total failures
- XP earned from this discipline

**Streaks tab:**
- SILENCE Protocol: large pixel counter, best streak, relapse count
- All disciplines ranked by current streak
- Hall of Records: best streaks with dates

**History tab:**
- Calendar view (monthly pixel grid)
- Tap a day to see that day's completions and XP earned

### Screen 9.8 — SYSTEM SETTINGS

- Notification schedule: slider for interval (1–6 hours, default 3)
- Quiet hours: set a no-notification window (e.g. 00:00–07:00)
- Export data: writes JSON to device Downloads folder
- Permissions: re-open any permission grant if denied
- About: version, player name, journey start date
- Reset journey: DANGER zone, requires typing "I ACCEPT THE RESET" to confirm

---

## 10. XP ENGINE

```javascript
// src/engine/xpEngine.js

/**
 * Complete a discipline for today
 * @param {number} disciplineId
 * @param {string} date - YYYY-MM-DD
 */
async function completeDisipline(disciplineId, date) {
  const discipline = await getDisipline(disciplineId);
  const streak = await getStreak(disciplineId, date);
  const multiplier = getStreakMultiplier(streak);
  const xpGained = Math.round(discipline.xp_gain * multiplier);

  await insertLog(disciplineId, date, true, false, xpGained);
  await addGlobalXP(xpGained);
  await incrementStreak(disciplineId, date);
  await checkLevelUp();
}

/**
 * Fail a discipline (called at midnight or manually)
 * @param {number} disciplineId
 * @param {string} date - YYYY-MM-DD
 */
async function failDiscipline(disciplineId, date) {
  const discipline = await getDisipline(disciplineId);

  if (discipline.code === 'SILENCE') {
    await triggerRelapse(date);
    return;
  }

  const xpLost = discipline.xp_loss;
  await insertLog(disciplineId, date, false, true, -xpLost);
  await deductGlobalXP(xpLost);
  await resetStreak(disciplineId);
}

/**
 * SILENCE relapse — total reset, no mercy
 */
async function triggerRelapse(date) {
  await db.runAsync(`UPDATE hero SET global_xp = 0, global_level = 1, rank = 'E'`);
  await db.runAsync(`UPDATE disciplines SET -- reset all streak counts`);
  await db.runAsync(`UPDATE silence_streak SET current_streak = 0, total_relapses = total_relapses + 1, last_relapse_date = ?`, [date]);
  await db.runAsync(`UPDATE cosmetics SET equipped = 0 WHERE type = 'weapon'`);
  // Set weapon to tier 1 cracked variant
  await db.runAsync(`UPDATE system_state SET value = 'cracked' WHERE key = 'weapon_state'`);
  // Trigger relapse animation via event emitter
  EventEmitter.emit('RELAPSE_TRIGGERED');
}

function getStreakMultiplier(streakDays) {
  if (streakDays >= 90) return 4.0;
  if (streakDays >= 30) return 3.0;
  if (streakDays >= 14) return 2.0;
  if (streakDays >= 7)  return 1.5;
  return 1.0;
}

async function checkLevelUp() {
  const hero = await getHero();
  const nextLevelXP = XP_TABLE[hero.global_level + 1];
  if (nextLevelXP && hero.global_xp >= nextLevelXP) {
    await levelUp(hero);
  }
}

async function levelUp(hero) {
  const newLevel = hero.global_level + 1;
  const newRank = getRankForLevel(newLevel);
  const rankChanged = newRank !== hero.rank;

  await db.runAsync(
    `UPDATE hero SET global_level = ?, rank = ? WHERE id = 1`,
    [newLevel, newRank]
  );

  await grantMandate(newLevel);
  EventEmitter.emit('LEVEL_UP', { newLevel, newRank, rankChanged });
}
```

---

## 11. MIDNIGHT ENGINE (Consistency Checker)

Runs every night at 00:00 via a scheduled local notification that triggers an in-app background task.

```javascript
// src/engine/midnightEngine.js

async function runMidnightCheck(date) {
  // date = yesterday's date (YYYY-MM-DD)

  const disciplines = await getActiveDisiplines();
  const today = getWeekDay(); // 0=Sun...6=Sat

  for (const discipline of disciplines) {
    // Check if already logged
    const log = await getLog(discipline.id, date);
    if (log && log.completed) continue;
    if (log && log.failed) continue;

    // Not completed and not already failed — auto-fail
    await failDiscipline(discipline.id, date);
  }

  // PRESENCE: check UsageStats for yesterday
  await checkPresenceDiscipline(date);

  // SILENCE: increment streak if no relapse today
  await incrementSilenceStreak(date);

  // Check journey milestone
  await checkWeeklyMilestone(date);
}
```

---

## 12. SHIELD PROTOCOL

### Behavior
1. Player taps Shield Protocol button on home screen
2. Confirmation modal: pixel art overlay, dark background
   - Text: "ACTIVATE SHIELD PROTOCOL?"
   - Sub-text: "10 minutes. Hold the line."
   - Two buttons: "ACTIVATE" (red pixel) | "CANCEL" (grey pixel)
3. On ACTIVATE:
   - Call native Android module `ShieldModule.activate()`
   - Native module executes `DevicePolicyManager.lockNow()`
   - Native module sends broadcast to `AccessibilityService` to kill browser processes
   - App shows fullscreen overlay (persists even after screen re-lock):
     - Avatar sprite (current state) holding weapon
     - Text in pixel font: "HOLD THE LINE. THIS FEELING PASSES IN 10 MINUTES."
     - Pixel countdown timer: 10:00 counting down
   - Play battle_horn.mp3 sound
4. After 10 minutes: overlay dismisses automatically, screen lock cleared

### Android Native Module — ShieldModule.java

```java
// android/app/src/main/java/com/thesystem/ShieldModule.java
public class ShieldModule extends ReactContextBaseJavaModule {
  
  @ReactMethod
  public void activate(Promise promise) {
    DevicePolicyManager dpm = (DevicePolicyManager) 
      getReactApplicationContext().getSystemService(Context.DEVICE_POLICY_SERVICE);
    
    ComponentName adminComponent = new ComponentName(
      getReactApplicationContext(), 
      DeviceAdminReceiver.class
    );
    
    if (dpm.isAdminActive(adminComponent)) {
      dpm.lockNow();
      promise.resolve(true);
    } else {
      promise.reject("NOT_ADMIN", "Device admin not granted");
    }
  }
}
```

### AccessibilityService for browser kill

```java
// android/app/src/main/java/com/thesystem/ShieldAccessibilityService.java
// Listens for SHIELD_ACTIVATE broadcast
// On receive: calls performGlobalAction(GLOBAL_ACTION_HOME) to force-home
// Kills known browser packages: com.android.chrome, org.mozilla.firefox, com.brave.browser
```

---

## 13. SCREEN TIME TRACKING (PRESENCE Discipline)

```java
// android/app/src/main/java/com/thesystem/UsageStatsModule.java

@ReactMethod
public void getScrollingTimeToday(Promise promise) {
  UsageStatsManager usm = (UsageStatsManager) 
    getReactApplicationContext().getSystemService(Context.USAGE_STATS_SERVICE);
  
  // Packages considered "scrolling" apps
  String[] SCROLL_PACKAGES = {
    "com.android.chrome",
    "org.mozilla.firefox",
    "com.instagram.android",
    "com.twitter.android",
    "com.facebook.katana",
    "com.zhiliaoapp.musically",  // TikTok
    "com.reddit.frontpage",
    "com.google.android.youtube"
  };
  
  long startOfDay = // midnight today in ms
  long now = System.currentTimeMillis();
  
  Map<String, UsageStats> stats = usm.queryAndAggregateUsageStats(startOfDay, now);
  
  long totalMs = 0;
  for (String pkg : SCROLL_PACKAGES) {
    if (stats.containsKey(pkg)) {
      totalMs += stats.get(pkg).getTotalTimeInForeground();
    }
  }
  
  promise.resolve(totalMs / 1000 / 60); // return minutes
}
```

---

## 14. LOCAL NOTIFICATIONS

### Scheduler

Runs on every app open. Schedules next 48 hours of notifications at 3-hour intervals (configurable in settings).

```javascript
// src/notifications/scheduler.js

const NOTIFICATION_POOL = {
  SILENCE: [
    "Day {streak}. Your streak is your sword. Do not drop it.",
    "The war against weakness is won one day at a time. Today is that day.",
    "Every man who built something great fought this same war. Win it.",
    "The urge is a test. You have passed it before. Pass it again.",
    "Day {streak} of the Silence Protocol. The System is watching.",
  ],
  FORGE: [
    "The Iron Temple awaits. Your muscles do not grow in this chair.",
    "The bar does not care how you feel. Neither does your future self.",
    "You paid for that gym membership. Go collect what is yours.",
    "Soreness is your armor being forged. Embrace it.",
    "Your body is being recast. The furnace is today's session.",
  ],
  HEALTH: [
    "23:00 approaches. Night Silence begins. Prepare.",
    "08:30. The System is watching. Rise.",
    "Screen time is the invisible thief. Check your Veil discipline.",
    "The Scroll has not been opened today. Knowledge is power.",
    "Clean fuel only. Your body is your weapon.",
  ],
  GENERAL: [
    "You were selected because something in you is capable of greatness. Prove the System right.",
    "6 months from now you will wish you started today harder.",
    "No one is coming to save you. That is the good news.",
    "The forge does not stop. Neither do you.",
    "180 days. That is all it takes to become unrecognizable.",
    "Discipline is choosing what you want most over what you want now.",
    "The System does not reward the almost-disciplined.",
    "Level {level}. Rank {rank}. The ascension continues.",
  ],
  MILESTONE: [
    "{streak}-day streak. The System registers your resolve.",
    "30 days of silence. The System is impressed. Do not stop here.",
    "Rank {rank} achieved. The world below you is getting smaller.",
  ],
};
```

### Notification Appearance
- Title: "THE SYSTEM"
- Body: message text (pixel font not possible in OS notifications — use caps)
- Icon: app icon (crown pixel art)
- No sound by default, vibration on

---

## 15. MANDATE (CHEST) SYSTEM

### Grant Logic
```javascript
async function grantMandate(newLevel) {
  let tier = 'BRONZE';
  if (newLevel % 10 === 0) tier = 'GOLD';
  else if (newLevel % 5 === 0) tier = 'SILVER';

  await db.runAsync(
    `INSERT INTO mandates (tier, opened, granted_at) VALUES (?, 0, ?)`,
    [tier, new Date().toISOString()]
  );
}
```

### Loot Tables

**BRONZE Mandate:**
- 60% chance: Motivational system scroll (one of 20 pre-written messages)
- 30% chance: Avatar title unlock (e.g. "Stone Breaker", "Dawn Riser", "Iron Will")
- 10% chance: Minor cosmetic accessory (scar, earring, battle mark pixel detail)

**SILVER Mandate:**
- 50% chance: Equipment cosmetic variant (alternate color skin for current tier weapon/armor)
- 30% chance: Background theme unlock (new world map background style)
- 20% chance: Rare title

**GOLD Mandate:**
- 40% chance: Full equipment tier unlock (jumps one visual tier on weapon or armor)
- 40% chance: Rank-specific aura color variant
- 20% chance: Legendary title (e.g. "The Sovereign", "Chosen of the System")

### Manual Mandate
- Once per 7 days, player can tap "REQUEST MANDATE" in settings
- Enforced: `last_manual_mandate_date` checked in `system_state` table
- Always grants a BRONZE tier mandate

---

## 16. 6-MONTH JOURNEY COMPLETION

### Weekly Milestone Check (runs in midnightEngine on Mondays)
```javascript
async function checkWeeklyMilestone(date) {
  const hero = await getHero();
  const weekNumber = getWeekNumber(hero.journey_start_date, date);
  
  if (weekNumber > 24) return; // Already complete
  
  // Calculate last week's completion %
  const completionRate = await getWeekCompletionRate(weekNumber - 1);
  
  // Unlock world map node
  await unlockWorldMapNode(weekNumber - 1, completionRate);
  
  // Check if 6 months complete
  if (weekNumber === 25) {
    await checkFinalJudgement();
  }
}
```

### Final Judgement (S-Rank Completion)
```javascript
async function checkFinalJudgement() {
  const overallConsistency = await get180DayConsistencyRate();
  
  await db.runAsync(`UPDATE hero SET journey_complete = 1`);
  
  if (overallConsistency >= 0.80) {
    EventEmitter.emit('JOURNEY_COMPLETE_VICTORY');
    // Trigger final cutscene
  } else {
    EventEmitter.emit('JOURNEY_COMPLETE_PARTIAL', { rate: overallConsistency });
  }
}
```

### Final Cutscene Sequence
- Frame 1: Black screen. "180 DAYS HAVE PASSED."
- Frame 2: Avatar appears, S-Rank full aura
- Frame 3: Gold light descends from top of screen
- Frame 4: Text: "THE SYSTEM RENDERS ITS VERDICT."
- Frame 5: Stats summary — consistency rate, total XP, longest streaks, gym sessions, total disciplines completed, total relapses
- Frame 6 (if >= 80% consistency): "RAYNALD ARVAN LIM. YOU ARE TRANSCENDENT." Full screen divine glow explosion
- Frame 6 (if < 80% consistency): "THE SYSTEM ACKNOWLEDGES YOUR EFFORT. THE JOURNEY CONTINUES." Option to begin New Journey (reset, keep cosmetics + titles)

---

## 17. THEME ENGINE

```javascript
// src/theme/rankThemes.js

export const RANK_THEMES = {
  E: {
    background: '#1a1a1a',
    primary: '#2a2a2a',
    accent: '#666666',
    text: '#aaaaaa',
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
    borderStyle: 'divine_mandala',
    auraColor: '#ffffff',
    particleType: 'god_rays',
    particleCount: 48,
    avatarFloat: true,    // avatar hovers 4px in loop
    screenGlow: true,
    screenGlowColor: '#ffffff20',
    borderAnimated: true,
  },
};
```

---

## 18. APP RULES (ENFORCED IN CODE)

1. **SILENCE relapse = total reset.** `global_xp = 0`, `global_level = 1`, `rank = 'E'`, all discipline streaks reset. No undo. No confirmation second chance after initial tap.
2. **No retroactive logging.** `discipline_logs` can only be inserted for today's date. Past dates are read-only.
3. **Missed deadline = auto-fail.** `midnightEngine` fires XP penalty for any uncompleted discipline at 00:00.
4. **FORGE is daily, no exceptions.** Lifting days and cardio days both count. No rest days. Penalty fires every day if not completed.
5. **Shield Protocol requires Device Admin.** If not granted, Shield button shows permission request screen instead.
6. **6-month timer is permanent.** No pause. No reset. The journey ends at `journey_start_date + 180 days`.
7. **Mandates do not stack.** New mandate cannot be granted while one is unopened. Level-up XP still counts.
8. **Manual mandate = once per 7 days.** `last_manual_mandate_date` checked strictly. No bypass.
9. **Global XP floor = 0.** `Math.max(0, currentXP - penalty)`. Cannot go negative.
10. **Notifications cannot be disabled** from within the app. Only schedule/quiet hours can be adjusted.

---

## 19. APP ICON

The app icon must be generated as a 1024x1024 PNG (converted from SVG):

```
Design:
- Background: pure black (#000000)
- Outer ring: gold pixel mandala (8-pointed, each point a pixel chevron)
- Inner background: deep black
- Center: pixel art crown (gold, 5-pointed, 32x32 pixel grid scaled up)
- Below crown: pixel text "THE SYSTEM" in gold (Press Start 2P style pixels)
- Four corner runes: small gold pixel symbols (arcane-looking, original designs)
- Overall feel: divine, ancient, sovereign
```

Generate this SVG programmatically in the build script and convert to PNG using `sharp` or `canvas`.

---

## 20. BUILD & DEPLOYMENT

### Build Steps

```bash
# 1. Install dependencies
npm install

# 2. Link native modules
npx expo prebuild --platform android

# 3. Add custom native modules to android/app/src/main/java/com/thesystem/
#    - ShieldModule.java
#    - ShieldPackage.java
#    - UsageStatsModule.java
#    - UsageStatsPackage.java
#    - ShieldAccessibilityService.java
#    - DeviceAdminReceiver.java

# 4. Update android/app/src/main/AndroidManifest.xml (see below)

# 5. Build APK
cd android && ./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

### AndroidManifest.xml additions

```xml
<!-- Device Admin -->
<receiver android:name=".DeviceAdminReceiver"
  android:permission="android.permission.BIND_DEVICE_ADMIN">
  <meta-data android:name="android.app.device_admin"
    android:resource="@xml/device_admin_policies"/>
  <intent-filter>
    <action android:name="android.app.action.DEVICE_ADMIN_ENABLED"/>
  </intent-filter>
</receiver>

<!-- Accessibility Service -->
<service android:name=".ShieldAccessibilityService"
  android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE">
  <intent-filter>
    <action android:name="android.accessibilityservice.AccessibilityService"/>
  </intent-filter>
  <meta-data android:name="android.accessibilityservice"
    android:resource="@xml/accessibility_service_config"/>
</service>

<!-- Usage Stats -->
<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS"
  tools:ignore="ProtectedPermissions"/>

<!-- Notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>

<!-- Boot receiver (reschedule notifications on reboot) -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
```

---

## 21. SOUND EFFECTS

All sounds are local .mp3 files bundled in `src/assets/sounds/`:

| File | Plays When |
|---|---|
| `level_up.mp3` | Level up occurs |
| `rank_up.mp3` | Rank promotion |
| `complete.mp3` | Discipline completed |
| `fail.mp3` | Discipline failed at midnight |
| `relapse.mp3` | SILENCE Protocol relapse |
| `shield.mp3` | Shield Protocol activated |
| `chest_open.mp3` | Mandate chest opened |
| `journey_complete.mp3` | 6-month journey end |

---

## 22. STATE MANAGEMENT (Zustand)

```javascript
// src/store/useSystemStore.js

const useSystemStore = create((set, get) => ({
  hero: null,
  disciplines: [],
  todayLogs: [],
  silenceStreak: null,
  currentTheme: RANK_THEMES['E'],
  pendingMandate: null,

  loadHero: async () => { /* load from SQLite */ },
  loadTodayDisciplines: async () => { /* load + filter by day */ },
  completeDisipline: async (id) => { /* call xpEngine */ },
  triggerRelapse: async () => { /* call xpEngine.triggerRelapse */ },
  openMandate: async (id) => { /* call mandateEngine */ },
  activateShield: async () => { /* call ShieldModule */ },
}));
```

---

## 23. NAVIGATION STRUCTURE

```javascript
// Stack Navigator (no header, custom pixel nav bar)
Root Stack:
  ├── Awakening (onboarding, shown only if onboarding_complete !== '1')
  └── MainApp (tab navigator)
        ├── CommandHall (home)
        ├── AscensionPath (world map)
        ├── Mirror (avatar)
        └── Archive (stats)
        
// Modal screens (pushed over MainApp):
  ├── MandateReveal
  ├── ShieldOverlay (fullscreen, no back button during active countdown)
  ├── RelapseConfirmation
  ├── LevelUpSplash
  └── RankUpSplash
```

---

## 24. SUMMARY CHECKLIST FOR CLAUDE CODE

- [ ] Expo Bare Workflow project initialized
- [ ] SQLite schema created and seeded with 8 disciplines
- [ ] XP Engine implemented with streak multipliers
- [ ] Midnight Engine scheduled and implemented
- [ ] SILENCE Protocol relapse triggers full reset
- [ ] Shield Protocol: Device Admin + Accessibility Service native modules
- [ ] UsageStats native module for PRESENCE tracking
- [ ] All 8 screens built with pixel art SVG components
- [ ] Rank theme engine applied globally (all 6 ranks)
- [ ] Avatar SVG sprites for 3 classes x 5 tiers x 4 moods
- [ ] Aura particle animations per rank
- [ ] World map 24-node vertical ascension
- [ ] Mandate chest system (3 tiers, loot tables)
- [ ] Local notifications scheduled every 3 hours (configurable)
- [ ] Notification message pool with context-aware selection
- [ ] App icon generated (1024x1024 PNG, pixel crown)
- [ ] Press Start 2P font bundled locally
- [ ] No emoji anywhere in app — all iconography SVG
- [ ] Data export to JSON in device Downloads
- [ ] Final cutscene at 6-month completion
- [ ] Android 12+ target, portrait only
- [ ] APK release build via Gradle

---

*End of SRD — THE SYSTEM v1.0*  
*Player: Raynald Arvan Lim*  
*Generated for Claude Code — pass this document in full as context.*
