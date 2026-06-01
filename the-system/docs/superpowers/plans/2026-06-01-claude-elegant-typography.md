# Claude-Elegant Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish THE SYSTEM app with Claude-elegant typography: Lora serif headings in sentence case + letterSpacing ~0.3, fix Archive TITLE stat truncation, and replace Codex code boxes with tinted ClaudeSpark glyphs.

**Architecture:** Three independent concerns applied across 12 files: (1) ClaudeSpark gains optional `tint` prop; (2) BigStat in Archive gains `numberOfLines`; (3) all heading/label styles get `fontFamily: FONTS.display` + reduced letterSpacing + sentence-case strings.

**Tech Stack:** React Native 0.85, React 19, Expo, TypeScript, `src/theme/typography.ts` (FONTS export), Lora_600SemiBold font already loaded in App.tsx.

---

### Task 1: Fix Archive TITLE truncation (BigStat value + wrap)

**Files:**
- Modify: `src/screens/Archive.tsx:58-74,176`

- [ ] **Step 1: Fix the value prop** — change `.split(' ')[0]` to full title, add numberOfLines and fontSize shrink to BigStat.

In `Archive.tsx`, line 176: change `RANK_TITLES[hero.rank as Rank].split(' ')[0]` → `RANK_TITLES[hero.rank as Rank]`

In `bigStatStyles`, change `value` style: add `numberOfLines={2}` on the `<Text>` in BigStat component (line ~63) and reduce fontSize from 32 to 22 for that text so longer values fit.

- [ ] **Step 2: Verify** — run `npx jest __tests__/screens/Archive.test.tsx` and confirm pass.

---

### Task 2: Add `tint` prop to ClaudeSpark

**Files:**
- Modify: `src/components/avatar/ClaudeSpark.tsx`

- [ ] **Step 1: Add optional tint prop to interface and use it**

Add `tint?: string` to Props interface. When `tint` is provided, override `spec.tip` and `spec.core` with `tint`. Keep all existing behavior when `tint` is undefined.

- [ ] **Step 2: Verify** — `npx jest __tests__/components/avatar/AvatarDisplay.test.tsx` should still pass.

---

### Task 3: Replace Codex code boxes with ClaudeSpark

**Files:**
- Modify: `src/screens/Codex.tsx`

- [ ] **Step 1: Import ClaudeSpark and replace iconCode Text**

Add import: `import ClaudeSpark from '../components/avatar/ClaudeSpark';`
Replace `<Text style={[styles.iconCode,{color:diffColor}]}>{d.code.slice(0,3)}</Text>` with `<ClaudeSpark rank="C" size={26} tint={diffColor} />`
Remove unused `iconCode` style from StyleSheet.

- [ ] **Step 2: Verify** — `npx jest __tests__/screens/Codex.test.tsx` pass.

---

### Task 4: Add FONTS import + Lora to SectionDivider

**Files:**
- Modify: `src/components/ui/SectionDivider.tsx`

- [ ] **Step 1: Import FONTS, update label style, sentence-case passed titles**

Add: `import { FONTS } from '../../theme/typography';`
In `styles.label`: add `fontFamily: FONTS.display`, change `letterSpacing: 3` → `letterSpacing: 0.5`.
Note: SectionDivider `title` prop strings are changed in each caller (Tasks 5–12).

---

### Task 5: Archive.tsx — full typography sweep

**Files:**
- Modify: `src/screens/Archive.tsx`

- [ ] **Step 1: Import FONTS**
Add: `import { FONTS } from '../theme/typography';`

- [ ] **Step 2: Sentence-case inline strings**
- `'THE ARCHIVE'` → `'The Archive'`
- `'RECORD OF BECOMING'` → `'Record of becoming'`
- `TAB_LABELS`: `'OVERVIEW'→'Overview'`, `'MISSIONS'→'Missions'`, `'STREAKS'→'Streaks'`, `'HISTORY'→'History'`
- SectionDivider titles: `'JOURNEY'→'Journey'`, `'STATISTICS'→'Statistics'`, `'SILENCE PROTOCOL'→'Silence protocol'`, `'ALL DISCIPLINES'→'All disciplines'`, `'LAST 28 DAYS'→'Last 28 days'`
- BigStat labels: `'CURRENT RANK'→'Current rank'`, `'TITLE'→'Title'`, `'TOTAL XP'→'Total XP'`, `'MANDATES'→'Mandates'`
- `'CURRENT STREAK'→'Current streak'`, `'BEST STREAK'→'Best streak'`, `'RELAPSES'→'Relapses'`
- `'% COMPLETE'` can stay (it's dynamic)

- [ ] **Step 3: Apply Lora + reduced letterSpacing to heading styles**
- `styles.title`: add `fontFamily: FONTS.display`, change `letterSpacing: 4` → `letterSpacing: 0.3`
- `styles.subtitle`: change `letterSpacing: 3` → `letterSpacing: 0.5`
- `styles.tabTxt`: change `letterSpacing: 1` → `letterSpacing: 0.3`
- `bigStatStyles.value`: add `fontFamily: FONTS.display`
- `bigStatStyles.label`: change `letterSpacing: 2` → `letterSpacing: 0.5`
- `styles.journeyPct`: change `letterSpacing: 2` → `letterSpacing: 0.3`

---

### Task 6: AscensionPath.tsx — typography sweep

**Files:**
- Modify: `src/screens/AscensionPath.tsx`

- [ ] **Step 1: Import FONTS**
Add: `import { FONTS } from '../theme/typography';`

- [ ] **Step 2: Sentence-case strings**
- `'ASCENSION PATH'` → `'Ascension path'`
- `'WEEK {selectedNode}'` stays as is (it's dynamic with number)
- `'COMPLETION'` → `'Completion'`
- `'STATUS'` → `'Status'`
- `'CLOSE'` → `'Close'`
- `'% AVG'` stays (dynamic)

- [ ] **Step 3: Apply Lora + reduced letterSpacing**
- `styles.title`: add `fontFamily: FONTS.display`, `letterSpacing: 4` → `letterSpacing: 0.3`
- `styles.modalWeek`: add `fontFamily: FONTS.display`, `letterSpacing: 2` → `letterSpacing: 0.3`
- `styles.modalStatLabel`: `letterSpacing: 1` → `letterSpacing: 0.5`
- `styles.modalCloseTxt`: `letterSpacing: 2` → `letterSpacing: 0.5`
- `styles.zoneLabel`: `letterSpacing: 3` → `letterSpacing: 0.5`

---

### Task 7: Awakening.tsx — typography sweep

**Files:**
- Modify: `src/screens/Awakening.tsx`

- [ ] **Step 1: Import FONTS**
Add: `import { FONTS } from '../theme/typography';`

- [ ] **Step 2: Sentence-case strings**
- `'TAP TO CONTINUE'` → `'Tap to continue'`
- `'CONFIRM'` → `'Confirm'` (both occurrences)
- `'CONTINUE'` → `'Continue'`
- `'GRANT NOTIFICATIONS'` → `'Grant notifications'`
- `'I ACCEPT'` → `'I accept'`
- `.toUpperCase()` on `c.name` (line ~106): remove it so class names render naturally (e.g. "Warrior")

- [ ] **Step 3: Apply Lora + reduced letterSpacing**
- `styles.introText`: add `fontFamily: FONTS.display`
- `styles.goldBtnText`: add `fontFamily: FONTS.display`

---

### Task 8: Codex.tsx — typography sweep

**Files:**
- Modify: `src/screens/Codex.tsx`

- [ ] **Step 1: Import FONTS** (if not already added in Task 3)
Add: `import { FONTS } from '../theme/typography';`

- [ ] **Step 2: Sentence-case strings**
- `'THE CODEX'` → `'The Codex'`
- `'+ ADD'` → `'+ Add'`
- `'ADD DISCIPLINE'` → `'Add discipline'`
- `'NAME'` → `'Name'`
- `'DESCRIPTION'` → `'Description'`
- `'DIFFICULTY'` → `'Difficulty'`
- `'CANCEL'` → `'Cancel'`
- `'CREATE'` → `'Create'`
- Alert strings `'DISABLE SILENCE?'`, `'CANCEL'`, `'DISABLE'`, `'CANNOT DELETE'`, `'DELETE DISCIPLINE'`, `'DELETE'`, `'NAME REQUIRED'` — keep alert titles as-is (they're system alerts, not chrome headings). Only change the visible button/label chrome.
  Actually per spec, buttons: `'CANCEL'→'Cancel'`, `'CREATE'→'Create'` apply.

- [ ] **Step 3: Apply Lora + reduced letterSpacing**
- `styles.title`: add `fontFamily: FONTS.display`, `letterSpacing: 3` → `letterSpacing: 0.3`
- `styles.modalTitle`: add `fontFamily: FONTS.display`, `letterSpacing: 2` → `letterSpacing: 0.3`
- `styles.formLabel`: `letterSpacing: 2` → `letterSpacing: 0.5`
- `styles.addBtnText`: `letterSpacing: 1` → `letterSpacing: 0.3`

---

### Task 9: CommandHall.tsx — typography sweep

**Files:**
- Modify: `src/screens/CommandHall.tsx`

- [ ] **Step 1: Import FONTS**
Add: `import { FONTS } from '../theme/typography';`

- [ ] **Step 2: Sentence-case strings**
- `'SCREEN TIME'` → `'Screen time'` (presenceLabel)
- `'DAYS CLEAN'` → `'Days clean'`
- `'DAILY OBJECTIVES'` → `'Daily objectives'` (SectionDivider title)
- `'SHIELD PROTOCOL'` → `'Shield protocol'` (shieldText)
- `'ENGAGE DIGITAL FORTRESS'` → `'Engage digital fortress'`
- `'{completedToday}/{activeDisciplines.length} COMPLETE'` → `'... Complete'` — change `'COMPLETE'` → `'complete'` in questCount

- [ ] **Step 3: Apply Lora + reduced letterSpacing**
- `styles.rankTitle`: `letterSpacing: 2` → `letterSpacing: 0.5`
- `styles.streakLabel`: `letterSpacing: 2` → `letterSpacing: 0.5`
- `styles.presenceLabel`: `letterSpacing: 2` → `letterSpacing: 0.5`
- `styles.shieldText`: add `fontFamily: FONTS.display`, `letterSpacing: 2` → `letterSpacing: 0.3`
- `styles.shieldSub`: `letterSpacing: 2` → `letterSpacing: 0.5`

---

### Task 10: LevelUpSplash.tsx — typography sweep

**Files:**
- Modify: `src/screens/LevelUpSplash.tsx`

- [ ] **Step 1: Import FONTS**
Add: `import { FONTS } from '../theme/typography';`

- [ ] **Step 2: Sentence-case strings**
- `'RANK ASCENSION'` → `'Rank ascension'`
- `'LEVEL ACHIEVED'` → `'Level achieved'`
- `'CONTINUE'` → `'Continue'`

- [ ] **Step 3: Apply Lora + reduced letterSpacing**
- `styles.eventLabel`: add `fontFamily: FONTS.display`, `letterSpacing: 4` → `letterSpacing: 0.3`
- `styles.rankName`: `letterSpacing: 3` → `letterSpacing: 0.3`
- `styles.continueTxt`: add `fontFamily: FONTS.display`, `letterSpacing: 3` → `letterSpacing: 0.3`
- `styles.xpText`: `letterSpacing: 2` → `letterSpacing: 0.5`

---

### Task 11: MandateReveal.tsx — typography sweep

**Files:**
- Modify: `src/screens/MandateReveal.tsx`

- [ ] **Step 1: Import FONTS**
Add: `import { FONTS } from '../theme/typography';`

- [ ] **Step 2: Sentence-case strings**
- `'MANDATE'` → `'Mandate'` (mandateWord)
- `'MANDATE RECEIVED'` → `'Mandate received'` (dismissTxt)
- `'CLOSE'` → `'Close'` (closeTxt)

- [ ] **Step 3: Apply Lora + reduced letterSpacing**
- `styles.tier`: add `fontFamily: FONTS.display`, `letterSpacing: 3` → `letterSpacing: 0.3`
- `styles.lootCategory`: `letterSpacing: 3` → `letterSpacing: 0.5`
- `styles.dismissTxt`: add `fontFamily: FONTS.display`, `letterSpacing: 2` → `letterSpacing: 0.3`

---

### Task 12: Mirror.tsx — typography sweep

**Files:**
- Modify: `src/screens/Mirror.tsx`

- [ ] **Step 1: Import FONTS**
Add: `import { FONTS } from '../theme/typography';`

- [ ] **Step 2: Sentence-case strings**
- SectionDivider titles: `'EQUIPMENT'→'Equipment'`, `'ATTRIBUTES'→'Attributes'`, `'TITLES'→'Titles'`
- `{mood.toUpperCase()}` → `{mood}` (capitalize first letter: use `mood.charAt(0).toUpperCase() + mood.slice(1)` so "Radiant" etc.)
- EquipSlot labels: `'WEAPON'→'Weapon'`, `'ARMOR'→'Armor'`, `'CROWN'→'Crown'`
- Keep STAT_DISCIPLINES labels as-is (WILLPOWER etc. — these are attribute names, could be ambiguous; spec says "attribute labels" should have `.toUpperCase()` removed — but these don't use `.toUpperCase()`, they're hardcoded. They look like game content names, not chrome.)
- `{hero.hero_class.toUpperCase()}` in rankTitle Text → `{hero.hero_class}` 

- [ ] **Step 3: Apply Lora + reduced letterSpacing**
- `styles.heroName`: add `fontFamily: FONTS.display`, `letterSpacing: 2` → `letterSpacing: 0.3`
- `styles.rankTitle` (Mirror): `letterSpacing: 2` → `letterSpacing: 0.5`
- `statStyles.label`: `letterSpacing: 1` → `letterSpacing: 0.3`
- `equipStyles.slotLabel`: `letterSpacing: 2` → `letterSpacing: 0.5`
- `styles.moodText`: add `fontFamily: FONTS.display`, `letterSpacing: 3` → `letterSpacing: 0.3`

---

### Task 13: Settings.tsx — typography sweep

**Files:**
- Modify: `src/screens/Settings.tsx`

- [ ] **Step 1: Import FONTS**
Add: `import { FONTS } from '../theme/typography';`

- [ ] **Step 2: Sentence-case strings**
- `'SETTINGS'` → `'Settings'`
- `'NOTIFICATIONS'` → `'Notifications'`
- `'ABOUT'` → `'About'`
- `'DATA'` → `'Data'`
- `'EXPORT DATA (JSON)'` → `'Export data (JSON)'`
- `'TEST NOTIFICATION'` → `'Test notification'`
- `'DANGER ZONE'` → `'Danger zone'`
- `'RESET JOURNEY'` → `'Reset journey'`

- [ ] **Step 3: Apply Lora + reduced letterSpacing**
- `styles.title`: add `fontFamily: FONTS.display`, `letterSpacing: 3` → `letterSpacing: 0.3`
- `styles.sectionHeader`: add `fontFamily: FONTS.display`, `letterSpacing: 3` → `letterSpacing: 0.5`
- `styles.exportText`: `letterSpacing: 2` → `letterSpacing: 0.3`
- `styles.resetText`: `letterSpacing: 2` → `letterSpacing: 0.3`

---

### Task 14: ShieldOverlay.tsx — typography sweep

**Files:**
- Modify: `src/screens/ShieldOverlay.tsx`

- [ ] **Step 1: Import FONTS**
Add: `import { FONTS } from '../theme/typography';`

- [ ] **Step 2: Sentence-case strings**
- `'SHIELD PROTOCOL'` → `'Shield protocol'`
- `'ENGAGE FORTRESS'` → `'Engage fortress'`
- `'CANCEL'` → `'Cancel'`
- `'FORTRESS HELD'` → `'Fortress held'`
- `'RETURN'` → `'Return'`
- `'FORTRESS BREACHED'` → `'Fortress breached'`
- `'TRY AGAIN'` → `'Try again'`

- [ ] **Step 3: Apply Lora + reduced letterSpacing**
- `styles.title`: add `fontFamily: FONTS.display`, `letterSpacing: 3` → `letterSpacing: 0.3`
- `styles.lockBtnText`: add `fontFamily: FONTS.display`, `letterSpacing: 2` → `letterSpacing: 0.3`
- `styles.resultBig`: add `fontFamily: FONTS.display`, `letterSpacing: 2` → `letterSpacing: 0.3`

---

### Task 15: AppNavigator.tsx — tab labels + loading screen

**Files:**
- Modify: `src/navigation/AppNavigator.tsx`

- [ ] **Step 1: Import FONTS**
Add: `import { FONTS } from '../theme/typography';`

- [ ] **Step 2: Sentence-case tab labels**
- `'COMMAND'` → `'Command'`
- `'ASCEND'` → `'Ascend'`
- `'MIRROR'` → `'Mirror'`
- `'CODEX'` → `'Codex'`
- `'ARCHIVE'` → `'Archive'`
- `'INITIALIZING...'` → `'Initializing…'`

- [ ] **Step 3: Apply Lora + reduced letterSpacing**
- `tabBarLabelStyle`: `letterSpacing: 1.5` → `letterSpacing: 0.3`, add `fontFamily: FONTS.display`
- `styles.loadingTitle`: add `fontFamily: FONTS.display`, `letterSpacing: 6` → `letterSpacing: 0.3`
- `styles.loadingSub`: `letterSpacing: 3` → `letterSpacing: 0.5`

---

### Task 16: Run tests + commit

- [ ] **Step 1: Run full test suite**
```
cd E:\Work\THE-SYSTEM\the-system && npx jest
```
Expected: 90 tests pass. If any fail due to string assertions, update test expectation to match new sentence-case string.

- [ ] **Step 2: Verify FONTS imports wired**
```
grep -rn "FONTS" src/screens src/components/ui src/navigation | head
```

- [ ] **Step 3: Commit**
```
cd E:\Work\THE-SYSTEM && git add the-system/src && git commit -m "feat: Claude-elegant typography (Lora serif, sentence case) + Codex spark glyph + fix Archive title"
```
