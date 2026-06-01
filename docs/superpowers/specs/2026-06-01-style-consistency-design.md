# Style Consistency Pass — Design

**Date:** 2026-06-01
**Goal:** Kill the design inconsistency that has survived three prior attempts. Three pillars: (1) **every** text in **one** font (Lora), provably; (2) every bordered box uses the same cap-corner style (corners thicker than edges); (3) fonts ~+2px bigger. Plus onboarding (elegant intro + background orbit) and splash (Lora, not pixel font). Applies to every screen, every UI component, and the first-run flow.

---

## Why it kept failing (root cause)

The app makes text Lora through a single runtime monkeypatch — `src/theme/applyGlobalFont.ts` redefines the lazy `Text`/`TextInput` getters on the `react-native` module to inject `fontFamily: Lora` as a base style. ~90 bare `<Text>` elements set **no** `fontFamily` of their own and depend entirely on that patch.

With `newArchEnabled: true` (Fabric) on RN 0.85 + React 19, that module-getter override is **not reliable** — it silently no-ops for some render paths, so some text falls back to the system sans-serif. Rebuilds shuffle which text is affected, which is exactly the "still not fully consistent" symptom.

**Decision:** stop depending on the patch. Make Lora **explicit in every text style**, and add a static test that fails if any text style is missing a Lora family. The patch stays as a harmless safety net but is no longer the source of truth.

---

## Pillar 1 — One font, everywhere, provably

**Single source:** `FONTS` in `src/theme/typography.ts` (all values are `Lora_*`). No other family string may appear in the app.

**Changes:**
1. **Explicit Lora on every text style.** Every style object consumed by a `<Text>`/`<TextInput>`/`Animated.Text`/`SvgText` gets a `fontFamily: FONTS.*` (weight-appropriate: `body` for normal, `bodyMedium`/`bodySemibold`/`bold` for weighted, `display` for headings/labels/stat values, `italic` for italics). Inline `<Text style={{...}}>` literals (e.g. the chest emoji) that render glyphs/emoji only are exempt and noted.
2. **SVG text fix:** `WorldMapNode.tsx` `<SvgText>` gets `fontFamily={FONTS.display}` (SVG ignores the RN patch entirely — current real bug).
3. **Nav surfaces:** confirm `tabBarLabelStyle` and both loading-screen styles in `AppNavigator.tsx` carry `FONTS.*`.
4. **Keep** `applyGlobalFont.ts` as a safety net (now also does the +2 size bump, Pillar 3), but correctness no longer relies on it.

**Verification gate (the thing that ends the saga):**
- A Jest test scans `src/**/*.tsx` for text styles missing a Lora family and **fails** with a file:line list if any are found. (Heuristic: any `StyleSheet` style whose name/usage feeds a Text and that lacks `fontFamily`, plus any `fontFamily:` whose value is not `Lora_`/`FONTS.`.)
- `grep -rn "fontFamily" src` shows only `Lora_*` / `FONTS.*` — zero other families.
- On-device: screenshot **every** screen + first-run + both splashes, read each, confirm serif Lora. No screen skipped.

---

## Pillar 2 — Cap-corner borders on all bordered boxes

**Look (corrected per user):** the box keeps its thin full border on all four edges; **each corner gets a thicker bracket overlaid**, so corners read heavier than the edges. This is the CommandHall rank-badge / shield-panel style. Edges are *not* removed.

**New component:** `src/components/ui/CornerBox.tsx`
- Props: `color` (edge+corner, or split `cornerColor`), `borderWidth=1`, `cornerThickness=2`, `cornerLength=14`, `radius?`, `fill?`, `style`, `children`.
- Renders a `View` with the thin full border + four absolutely-positioned corner bracket Views (thicker). Themed `color` passed by caller.
- Replaces the ad-hoc corner code already duplicated in CommandHall (rank badge, shield), LevelUpSplash (CornerDeco/btn), CornerFrame — all normalized to one component/one thickness.

**Convert every full-border rectangle box to `CornerBox`** across the 17 border-bearing files:
ShieldOverlay (container, duration pills, lock/cancel buttons-with-border), Mirror, SRankCutscene, MandateReveal, AscensionPath (weekBadge, modalBox→already CornerFrame, statBox, close), CommandHall (rankBadge, shield panel, chest), Settings (rows, interval pills, reset box, inputs), LevelUpSplash (panel, xpBadge, continue), Awakening (input, classCard, permBtn), Archive (cards/stat boxes), Codex (rows, modal, form inputs, diff pills), DisciplineCard, XPBar (frame), WorldMapNode, plus CornerFrame/PixelBorder reconciled.

**Not converted (accent lines, not boxes):** left-border quote strip (CommandHall), bottom-border HUD/header dividers, progress-bar tracks/fills, `SectionDivider` rule. These stay as-is.

---

## Pillar 3 — Fonts ~+2px bigger

Central bump in `applyGlobalFont.ts` wrapper: flatten the caller's own style; **only when it sets its own `fontSize`**, append `fontSize + 2` (so nested inheriting text is untouched, nothing is double-counted). The handful of `Animated.Text` not reached by the wrapper get `+2` by hand in their styles. Net effect: uniform ~+2px across all chrome with one central change plus a few explicit edits. Spot-check small boxes (badges, pills) for clipping after the bump and adjust padding where needed.

---

## Pillar 4 — Onboarding (Awakening, first-run)

1. **Intro animation:** remove the typewriter (`setInterval` slicing `fullIntro`). Replace with an elegant entrance: text fades in (opacity 0→1) and rises slightly (`translateY` ~12→0) over ~900ms, ease-out. Optional gentle per-line stagger for the multi-line prompts. No character-by-character typing.
2. **Background orbit:** new `OnboardingOrbit` (large, low-opacity, slow): concentric rings of motes rotating behind the content, radius ~150–230, accent (coral) at low alpha. Rendered behind content on **all five steps** (intro→name→class→permissions→accept), filling the empty space. Non-interactive, `pointerEvents="none"`.
3. Boxes (input, classCard, permBtn) → `CornerBox`. Fonts get Lora-explicit + the +2 bump like everywhere else. Copy/wording unchanged.

---

## Pillar 5 — Splash

Regenerate `assets/splash-native.png` (and `assets/splash-icon.png`): keep the coral spark, warm `#262624` background, and layout; **replace the pixel-font** "THE SYSTEM" / "ASCEND OR PERISH" with **Lora** ("THE SYSTEM" in Lora SemiBold, "Ascend or perish" beneath). Generated from the actual Lora TTF (already in `node_modules/@expo-google-fonts/lora`). Show the user the new PNG before building. Then `expo prebuild` (no `--clean`) to push into `android/.../res`, per the `the-system-prebuild` memory.

---

## Pillar 6 — Build + verify on device

Per `the-system-prebuild` memory: prebuild (no `--clean`) only because the splash asset changed; release build with **JBR 21** (`JAVA_HOME=.../Android Studio/jbr`), `gradlew assembleRelease`, `adb install -r`. Then the exhaustive screenshot sweep (Pillar 1 verification) — every screen, first-run, both splashes. User connects the phone at this step.

---

## Out of scope
Engine/data/store logic, navigation structure, color palette (stays Claude warm charcoal + coral), copy rewrites beyond what each pillar states.

## Files touched (inventory)
- New: `src/components/ui/CornerBox.tsx`, `src/components/fx/OnboardingOrbit.tsx`, font-consistency Jest test.
- Modified: `applyGlobalFont.ts`, `Awakening.tsx`, all 11 font screens + UI components with text styles (explicit Lora), all 17 border files (CornerBox), `WorldMapNode.tsx` (SVG font), `AppNavigator.tsx` (verify), `app.json`/assets (splash), `typography.ts` (if a weight/key is missing).
