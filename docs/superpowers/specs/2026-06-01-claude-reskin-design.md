# THE SYSTEM → Claude Reskin — Design

**Date:** 2026-06-01
**Scope:** Front-end visual reskin only. Rank/leveling/discipline/notification *logic* unchanged. No data-model or engine changes.

## Goal

Re-theme THE SYSTEM (currently a dark blue/cyan Solo-Leveling "System") into Claude's visual identity: warm-charcoal dark mode, coral/clay accent, clean serif+sans typography, a Claude "spark" avatar, calm minimal FX, smooth transitions, no sound. Progression (rank E→S) drives both a warming palette and unlocked UI flourishes.

## Decisions (locked with user)

- **Base mode:** dark warm (Claude dark mode), warm charcoal not navy.
- **Progression payoff:** BOTH — palette warms AND UI elements unlock at rank thresholds.
- **Typography:** fully clean — drop PressStart2P (pixel) and Cinzel entirely.
- **Avatar:** Claude spark mark (SVG radial burst), not human; replaces pixel chibi.
- **Verify:** full release APK build (JBR 21) + install over USB, screenshot-verify.

## 1. Palette — `src/theme/rankThemes.ts`

Replace `RANK_THEMES` values (keep the `RankTheme` interface and `getThemeForRank`). Dark warm, accent intensifies E→S; bg subtly warms.

| Rank | background | primary (surface) | accent | secondary/gold |
|---|---|---|---|---|
| E | `#222220` | `#2C2B28` | `#B98E78` | — |
| D | `#252320` | `#2F2D29` | `#C68F70` | — |
| C | `#262624` | `#30302E` | `#D97757` | — |
| B | `#272421` | `#322E29` | `#E07F54` | — |
| A | `#2A2622` | `#34302A` | `#E88A5A` | gold `#E3B341` hint |
| S | `#2C2722` | `#36302A` | `#F0A368` | gold `#E3B341`, animated |

Shared: `text: #EDEAE0`, `textSecondary: #9A968B`, `border: #3A3733`.
- `auraColor` = accent (warm). `particleType`/`particleCount` kept but counts lowered (calm); `screenGlowColor` = accent at low alpha. `borderAnimated` stays true only at S.
- `app.json`: `userInterfaceStyle: "dark"` stays "dark" (warm dark); splash `backgroundColor` `#000000` → `#262624`; adaptiveIcon background → `#262624`; expo-notifications `color` `#3bc9ff` → `#D97757`.

## 2. Typography — `src/theme/applyGlobalFont.ts`, fonts, `PixelText`

- Bundle two fonts into `src/assets/fonts/`: **Lora** (serif, display/headers/big numerals) and **Inter** (sans, body/UI). Source: Google Fonts (OFL, redistributable). Register in `App.tsx` `useFonts` alongside removal of `PressStart2P`/`Cinzel`.
- `applyGlobalFont.ts`: change the injected global default family from `Cinzel` → `Inter` (same getter-override mechanism; mechanism proven under RN 0.85/React 19 — keep it).
- A small `typography.ts` helper exports `{ display: 'Lora', body: 'Inter' }` so headers opt into serif explicitly.
- `src/components/ui/PixelText.tsx`: stop using `PressStart2P`; render `Lora` (display serif). Keep the component name/API so call-sites (3) don't churn.
- `Animated.Text` instances (LevelUpSplash, RankPromotionSplash, ShieldOverlay) set explicit family (serif for display lines) — required because Animated.Text bypasses the getter override.
- Delete `Cinzel.ttf`, `PressStart2P-Regular.ttf` after wiring.

## 3. Avatar — Claude spark (SVG), replaces pixel system

New `src/components/avatar/ClaudeSpark.tsx` (react-native-svg): a radial burst of N tapered petals around a center, coral-filled with soft glow. Props: `rank`, `heroClass`, `size`.
- **Rank evolution:** ray count + length + glow grow E→S; tip color shifts toward gold at A/S; S adds slow rotation + float.
- **HeroClass** (Warrior/Mage/Rogue from store) maps to a ray-style variant: sharp / rounded / wavy. Keeps the existing class data meaningful without human sprites.
- `AvatarDisplay.tsx` swaps `PixelCanvas` sprite rendering for `ClaudeSpark`. `AvatarOrbit.tsx` kept, recolored coral, gated to C+.
- Retire `avatarData.ts` pixel sprites + `PixelCanvas.tsx` from the avatar path (delete once no references remain; check `src/components/avatar/` + notification banner script).
- **Notification banners:** `scripts/genAvatarBanners.js` regenerated to draw the spark (transparent bg, rank-colored radial aura, 360×360, 18 files `notif_<class>_<rank>.png`). Re-run `node scripts/genAvatarBanners.js`; copies into `android/.../res/drawable/`. Native `RichNotificationReceiver.java` accent `#3bc9ff` → `#D97757`.

## 4. FX — calm/minimal

- **Remove `Scanlines.tsx`** from the global overlay in `App.tsx` (CRT effect is un-Claude). Delete component + its `__mocks__/react-native-svg` Pattern dependency note (keep mock exports to avoid breaking other suites).
- `SystemBackground.tsx`: blueprint grid + cool radial → soft warm radial glow + very faint warm dot grid (subtle, low alpha). Per-screen usage unchanged.
- `Particles.tsx`: recolor warm cream/coral, lower count (calm dust, not "mana").

## 5. Smooth transitions

- React-navigation: fade/slide screen transitions (configure in `AppNavigator`).
- Splash: crossfade (already an Animated fade in `App.tsx`) — keep, retune to cream.
- Cards (`DisciplineCard`): `FadeInView` entrance (exists) + button press-scale (Animated/Pressable) for actions.
- Splash reskins: `LevelUpSplash`, `RankPromotionSplash`, `SRankCutscene`, `MandateReveal`, `ShieldOverlay` retuned to warm palette + serif, smooth fades.

## 6. Sound — removed

- Delete `playSound` calls: `CommandHall.tsx` (complete/rankUp/levelUp/fail — 4) and `ShieldOverlay.tsx` (levelUp/fail — 2).
- Delete `src/audio/sounds.ts`; remove `preloadSounds` import + call in `App.tsx`.
- `app.json`: remove `expo-audio` plugin. (Haptics untouched — out of scope.)

## 7. Icon / splash / notification assets

- `generate_assets.py`: regenerate as coral spark on warm charcoal — `icon.png`, `adaptive-icon.png` (foreground spark), `android-icon-foreground/background/monochrome.png`, `splash-icon.png`, `splash-native.png`, `notification-icon.png` (monochrome spark), `favicon.png`.
- Re-run `npx expo prebuild` (**NEVER `--clean`** — committed android/ res; per project memory) to embed.
- Build release APK with **JBR 21** (not JDK 25), install over USB, screenshot-verify each screen + a fired notification.

## Progression unlock thresholds (the "something different")

Driven by current rank (rank is driven by user progress):
- **E–D:** small still spark, muted clay, minimal bg glow.
- **C+:** orbiting coral motes (`AvatarOrbit`) appear; accent reaches signature coral.
- **B+:** soft halo ring behind spark; richer card glow.
- **A+:** gold ray-tips; warmer/brighter home header strip.
- **S:** dense burst, slow rotation + float, gold glow, animated panel border.

## Out of scope / non-goals

- No change to engine, store, db, midnight settling, scheduling logic, discipline data.
- No new screens or features. No haptics change. No copy rewrite beyond palette/font.
- Signing key unchanged (preserves on-device SQLite data).

## Risks / notes

- Font download must be OFL TTFs placed in `src/assets/fonts/` before build.
- `react-native-svg` mock must keep all element exports or screen test suites fail to load.
- Prebuild must not use `--clean`; build requires JBR 21 (per `the-system-prebuild` memory).
- Removing `expo-audio` plugin requires prebuild regen of native config.
