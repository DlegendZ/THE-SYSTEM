# Claude Reskin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin THE SYSTEM from dark blue/cyan Solo-Leveling into Claude's identity — warm-charcoal dark mode, coral accent, Lora/Inter type, an SVG Claude-spark avatar, calm FX, smooth transitions, no sound — with rank-driven progression flourishes.

**Architecture:** Pure front-end reskin. Engine/store/db/scheduler logic untouched. Most FX recolor automatically because `SystemBackground`/`Particles`/glows read `color`/`background` from `useSystemStore(s => s.currentTheme)`; so the palette swap in `rankThemes.ts` cascades. Discrete work: fonts, spark avatar, sound deletion, Scanlines removal, navigation transitions, regenerated icon/splash/notification assets, release build.

**Tech Stack:** React Native 0.85 / React 19, Expo (bare workflow, committed `android/`), react-native-svg, react-navigation, `@expo-google-fonts/lora` + `@expo-google-fonts/inter`, expo-notifications + native Java RichNotification, Jest.

**Verification baseline:** `cd the-system && npx jest` must pass after each task. Device verify (USB, input injection enabled) via screenshots at the end. Build per `the-system-prebuild` memory: prebuild WITHOUT `--clean`, build with JBR 21.

---

### Task 1: Remove sound

**Files:**
- Modify: `the-system/src/screens/CommandHall.tsx` (lines 23, 167, 171, 179, 202)
- Modify: `the-system/src/screens/ShieldOverlay.tsx` (lines 8, 74, 81)
- Modify: `the-system/App.tsx:17,39`
- Modify: `the-system/app.json` (remove `expo-audio` plugin)
- Delete: `the-system/src/audio/sounds.ts` (and `src/audio/` if empty)

- [ ] **Step 1: Remove playSound from CommandHall**

Delete the import line `import { playSound } from '../audio/sounds';`. Delete each `await playSound(...)` / `playSound(...)` statement (4 total). Where a `playSound` is the only statement in a branch, leave the surrounding logic intact (remove just the call). After edits, no `playSound` token remains in the file.

- [ ] **Step 2: Remove playSound from ShieldOverlay**

Delete `import { playSound } from '../audio/sounds';` and the two `playSound('levelUp')` / `playSound('fail')` calls.

- [ ] **Step 3: Remove preloadSounds from App.tsx**

Delete `import { preloadSounds } from './src/audio/sounds';` (line 17) and the `preloadSounds();` call plus its `// fire and forget` comment (line 39). Leave `initialize();` in the effect.

- [ ] **Step 4: Delete the audio module + plugin**

```bash
rm the-system/src/audio/sounds.ts
rmdir the-system/src/audio 2>/dev/null || true
```

In `the-system/app.json`, remove the `"expo-audio"` string from the `plugins` array (and the dangling comma).

- [ ] **Step 5: Verify no references remain**

Run: `cd the-system && grep -rn "playSound\|preloadSounds\|audio/sounds\|expo-audio" src App.tsx app.json`
Expected: no matches.

- [ ] **Step 6: Run tests**

Run: `cd the-system && npx jest CommandHall ShieldOverlay`
Expected: PASS (or the same pass/skip state as before — no new failures).

- [ ] **Step 7: Commit**

```bash
git add the-system/src the-system/App.tsx the-system/app.json
git commit -m "feat: remove all sound effects"
```

---

### Task 2: Dark-warm Claude palette

**Files:**
- Modify: `the-system/src/theme/rankThemes.ts:22-60`
- Modify: `the-system/app.json` (splash + adaptiveIcon bg, notification color)
- Test: `the-system/__tests__/` (run existing theme/screen suites)

- [ ] **Step 1: Replace RANK_THEMES**

Keep the `RankTheme` interface and `getThemeForRank`. Replace the `RANK_THEMES` object body with (note the leading comment above it should be updated to describe the Claude palette):

```ts
// Claude palette: warm-charcoal dark mode with a coral/clay accent that
// deepens E→S, warming toward gold at the top. Shared warm off-white text.
export const RANK_THEMES: Record<Rank, RankTheme> = {
  E: {
    background: '#222220', primary: '#2C2B28', accent: '#B98E78',
    text: '#EDEAE0', textSecondary: '#9A968B', borderStyle: 'system_panel',
    auraColor: '#B98E78', particleType: 'motes', particleCount: 7,
    avatarFloat: false, screenGlow: true, screenGlowColor: '#B98E7818',
  },
  D: {
    background: '#252320', primary: '#2F2D29', accent: '#C68F70',
    text: '#EDEAE0', textSecondary: '#9A968B', borderStyle: 'system_panel',
    auraColor: '#C68F70', particleType: 'motes', particleCount: 9,
    avatarFloat: false, screenGlow: true, screenGlowColor: '#C68F7022',
  },
  C: {
    background: '#262624', primary: '#30302E', accent: '#D97757',
    text: '#EDEAE0', textSecondary: '#9A968B', borderStyle: 'system_panel',
    auraColor: '#D97757', particleType: 'motes', particleCount: 11,
    avatarFloat: false, screenGlow: true, screenGlowColor: '#D9775726',
  },
  B: {
    background: '#272421', primary: '#322E29', accent: '#E07F54',
    text: '#EDEAE0', textSecondary: '#9A968B', borderStyle: 'system_panel',
    auraColor: '#E07F54', particleType: 'sparks', particleCount: 13,
    avatarFloat: false, screenGlow: true, screenGlowColor: '#E07F5430',
  },
  A: {
    background: '#2A2622', primary: '#34302A', accent: '#E88A5A',
    text: '#F2EFE6', textSecondary: '#A8A395', borderStyle: 'arcane_panel',
    auraColor: '#E3B341', particleType: 'sparks', particleCount: 15,
    avatarFloat: false, screenGlow: true, screenGlowColor: '#E88A5A30',
  },
  S: {
    background: '#2C2722', primary: '#36302A', accent: '#F0A368',
    text: '#FBF8F0', textSecondary: '#C4BCA8', borderStyle: 'monarch_panel',
    auraColor: '#E3B341', particleType: 'god_rays', particleCount: 18,
    avatarFloat: true, screenGlow: true, screenGlowColor: '#E3B34128',
    borderAnimated: true,
  },
};
```

- [ ] **Step 2: Update app.json colors**

In `the-system/app.json`:
- `splash.backgroundColor`: `#000000` → `#262624`
- `splash.image` stays (regenerated in Task 7)
- `android.adaptiveIcon.backgroundColor`: `#000000` → `#262624`
- `expo-notifications` plugin `color`: `#3bc9ff` → `#D97757`
- `expo-splash-screen` plugin `backgroundColor`: `#000000` → `#262624`

- [ ] **Step 3: Run tests**

Run: `cd the-system && npx jest`
Expected: PASS — palette is data; no structural change.

- [ ] **Step 4: Commit**

```bash
git add the-system/src/theme/rankThemes.ts the-system/app.json
git commit -m "feat: dark-warm Claude palette (coral accent, rank-warming)"
```

---

### Task 3: Lora + Inter typography

**Files:**
- Modify: `the-system/package.json` (add deps)
- Modify: `the-system/App.tsx:29-32` (useFonts)
- Modify: `the-system/src/theme/applyGlobalFont.ts:57` (default family)
- Create: `the-system/src/theme/typography.ts`
- Modify: `the-system/src/components/ui/PixelText.tsx:30`
- Modify: `the-system/src/screens/LevelUpSplash.tsx`, `the-system/src/components/ui/RankPromotionSplash.tsx`, `the-system/src/screens/ShieldOverlay.tsx` (Animated.Text families)
- Delete: `the-system/src/assets/fonts/Cinzel.ttf`, `PressStart2P-Regular.ttf`

- [ ] **Step 1: Install Expo Google Fonts**

Run: `cd the-system && npm install @expo-google-fonts/lora @expo-google-fonts/inter`
Expected: both added to `dependencies`.

- [ ] **Step 2: Create typography helper**

Create `the-system/src/theme/typography.ts`:

```ts
// Claude typography: Lora (serif) for display/headers/big numerals,
// Inter (sans) for body/UI. Family names match the keys registered in
// App.tsx's useFonts so styles can reference them directly.
export const FONTS = {
  display: 'Lora_600SemiBold',
  displayRegular: 'Lora_400Regular',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
} as const;
```

- [ ] **Step 3: Register fonts, drop old ones in App.tsx**

Replace the `useFonts` block (lines 29-32) with:

```tsx
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Lora_400Regular,
    Lora_600SemiBold,
  });
```

Add imports near the top (after the existing `useFonts` import):

```tsx
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Lora_400Regular, Lora_600SemiBold } from '@expo-google-fonts/lora';
```

- [ ] **Step 4: Repoint global default font**

In `the-system/src/theme/applyGlobalFont.ts`: change the wrapped family from `'Cinzel'` to `'Inter_400Regular'` (the `wrapWithFont(Original, 'Cinzel')` call and the `displayName` string). Update the file's doc comment to say Inter instead of Cinzel.

- [ ] **Step 5: Repoint PixelText to serif display**

In `the-system/src/components/ui/PixelText.tsx`, change `styles.base.fontFamily` from `'PressStart2P'` to `FONTS.display`, and `color: color ?? '#ffffff'` to `color: color ?? '#EDEAE0'`. Add `import { FONTS } from '../../theme/typography';`.

- [ ] **Step 6: Fix Animated.Text families**

In each of `LevelUpSplash.tsx`, `RankPromotionSplash.tsx`, `ShieldOverlay.tsx`, find the `Animated.Text` style(s) that set `fontFamily: 'Cinzel'` and change to `fontFamily: 'Lora_600SemiBold'`. (Animated.Text bypasses the global getter override — must be explicit. Per `the-system-fonts-notif` memory.)

- [ ] **Step 7: Delete old font files**

```bash
rm the-system/src/assets/fonts/Cinzel.ttf the-system/src/assets/fonts/PressStart2P-Regular.ttf
```

Run: `cd the-system && grep -rn "Cinzel\|PressStart2P" src App.tsx`
Expected: no matches.

- [ ] **Step 8: Run tests**

Run: `cd the-system && npx jest`
Expected: PASS. If a test mocks `expo-font`/`useFonts`, ensure the mock still returns `[true, null]`.

- [ ] **Step 9: Commit**

```bash
git add the-system/package.json the-system/package-lock.json the-system/src the-system/App.tsx
git commit -m "feat: Claude typography — Lora display + Inter body, drop pixel/Cinzel"
```

---

### Task 4: Claude spark avatar

**Files:**
- Create: `the-system/src/components/avatar/ClaudeSpark.tsx`
- Modify: `the-system/src/components/avatar/AvatarDisplay.tsx` (swap pixel render for spark)
- Test: `the-system/__tests__/` (avatar/screen suites)

- [ ] **Step 1: Create ClaudeSpark component**

Create `the-system/src/components/avatar/ClaudeSpark.tsx`:

```tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import type { HeroClass } from './avatarData';

interface Props {
  rank: string;            // E|D|C|B|A|S
  heroClass?: HeroClass;   // ray-style variant
  size?: number;
  mood?: 'radiant' | 'steady' | 'worn' | 'broken';
}

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

// Rank → spark intensity. More/longer rays and warmer tips with progress.
const RANK_SPEC: Record<string, { rays: number; len: number; tip: string; core: string; rotate: boolean }> = {
  E: { rays: 6,  len: 0.62, tip: '#B98E78', core: '#C9A893', rotate: false },
  D: { rays: 8,  len: 0.68, tip: '#C68F70', core: '#D6A98C', rotate: false },
  C: { rays: 10, len: 0.74, tip: '#D97757', core: '#E89B7E', rotate: false },
  B: { rays: 12, len: 0.80, tip: '#E07F54', core: '#F0A782', rotate: false },
  A: { rays: 14, len: 0.86, tip: '#E88A5A', core: '#F3B98C', rotate: true },
  S: { rays: 16, len: 0.94, tip: '#F0A368', core: '#FBD9A6', rotate: true },
};

// HeroClass tweaks ray silhouette: Mage=slender, Rogue=sharp, Warrior=broad.
const CLASS_WIDTH: Record<string, number> = { Warrior: 0.16, Mage: 0.09, Rogue: 0.06 };

export default function ClaudeSpark({ rank, heroClass = 'Warrior', size = 96, mood = 'steady' }: Props) {
  const spec = RANK_SPEC[rank] ?? RANK_SPEC.E;
  const widthFrac = CLASS_WIDTH[heroClass] ?? 0.12;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!spec.rotate) return;
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 36000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spec.rotate, spin]);

  const moodOpacity = { radiant: 1, steady: 1, worn: 0.7, broken: 0.45 }[mood] ?? 1;
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // Build tapered petals: each ray is a thin diamond from center outward.
  const rays = Array.from({ length: spec.rays }).map((_, i) => {
    const a = (i / spec.rays) * Math.PI * 2;
    const tipR = maxR * spec.len;
    const w = maxR * widthFrac;
    const tx = cx + tipR * Math.cos(a);
    const ty = cy + tipR * Math.sin(a);
    // perpendicular base points
    const bx = cx + Math.cos(a + Math.PI / 2) * w;
    const by = cy + Math.sin(a + Math.PI / 2) * w;
    const bx2 = cx + Math.cos(a - Math.PI / 2) * w;
    const by2 = cy + Math.sin(a - Math.PI / 2) * w;
    const midR = maxR * spec.len * 0.45;
    const mx = cx + midR * Math.cos(a);
    const my = cy + midR * Math.sin(a);
    return `M ${bx} ${by} Q ${mx} ${my} ${tx} ${ty} Q ${mx} ${my} ${bx2} ${by2} Z`;
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', opacity: moodOpacity }}>
      <AnimatedSvg width={size} height={size} style={{ transform: [{ rotate }] }}>
        <Defs>
          <RadialGradient id="sparkCore" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={spec.core} stopOpacity={1} />
            <Stop offset="1" stopColor={spec.tip} stopOpacity={0.9} />
          </RadialGradient>
        </Defs>
        {rays.map((d, i) => (
          <Path key={i} d={d} fill={spec.tip} opacity={0.92} />
        ))}
        <Circle cx={cx} cy={cy} r={maxR * 0.2} fill="url(#sparkCore)" />
      </AnimatedSvg>
    </View>
  );
}
```

- [ ] **Step 2: Swap AvatarDisplay internals to the spark**

Replace the body of `the-system/src/components/avatar/AvatarDisplay.tsx` to render `ClaudeSpark` while keeping the SAME props interface (`heroClass`, `rank`, `mood`, `weaponTier?`, `pixelSize?`) so all call-sites are unchanged. Map `pixelSize` (default 4, sprite was 16 wide) to a spark size: `const size = (pixelSize ?? 4) * 24;`. New file:

```tsx
import React from 'react';
import { View } from 'react-native';
import ClaudeSpark from './ClaudeSpark';
import type { HeroClass, ArmorTier } from './avatarData';

interface Props {
  heroClass: HeroClass;
  rank: string;
  mood?: 'radiant' | 'steady' | 'worn' | 'broken';
  weaponTier?: ArmorTier;
  pixelSize?: number;
}

export default function AvatarDisplay({ heroClass, rank, mood = 'steady', pixelSize = 4 }: Props) {
  const size = pixelSize * 24;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <ClaudeSpark rank={rank} heroClass={heroClass} size={size} mood={mood} />
    </View>
  );
}
```

(`avatarData.ts` is retained for its `HeroClass`/`ArmorTier` types + the notification banner script. `PixelCanvas.tsx` becomes unused — leave it; deleting is optional cleanup in Task 7.)

- [ ] **Step 3: Run tests**

Run: `cd the-system && npx jest avatar CommandHall Mirror`
Expected: PASS. If a snapshot test pins the old sprite, update it: `npx jest -u <suite>`.

- [ ] **Step 4: Commit**

```bash
git add the-system/src/components/avatar
git commit -m "feat: Claude-spark SVG avatar replacing pixel chibi"
```

---

### Task 5: Calm FX — remove Scanlines

**Files:**
- Modify: `the-system/App.tsx:8,70` (drop Scanlines import + element)

- [ ] **Step 1: Remove Scanlines from the global overlay**

In `App.tsx`: delete `import Scanlines from './src/components/fx/Scanlines';` (line 8) and the `<Scanlines ... />` element inside the overlay `View` (line 70). Keep `<Particles ... />`. (Particle color/count already come warm from the new palette — no extra change. `SystemBackground` already renders a soft radial glow + faint grid driven by theme color, so it warms automatically.)

- [ ] **Step 2: Verify**

Run: `cd the-system && grep -rn "Scanlines" App.tsx`
Expected: no matches. (`src/components/fx/Scanlines.tsx` may stay on disk unused; the `react-native-svg` mock keeps its `Pattern` export — do NOT trim the mock, other suites depend on it.)

- [ ] **Step 3: Run tests**

Run: `cd the-system && npx jest`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add the-system/App.tsx
git commit -m "feat: drop CRT scanlines for calm Claude FX"
```

---

### Task 6: Smooth transitions

**Files:**
- Modify: `the-system/src/navigation/AppNavigator.tsx` (screen transition animation)
- Modify: `the-system/src/components/ui/DisciplineCard.tsx` (press-scale, if a Pressable/Touchable exists)

- [ ] **Step 1: Inspect navigator**

Run: `cd the-system && sed -n '1,80p' src/navigation/AppNavigator.tsx`
Identify the navigator type (Stack/Tab) and existing `screenOptions`.

- [ ] **Step 2: Add smooth screen transitions**

For each stack navigator, add to `screenOptions`: `animation: 'fade'` (native-stack) or `cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid` + `transitionSpec` with a ~280ms timing (JS stack). Keep tab navigators instant unless they already animate. Match whichever stack lib the file imports.

- [ ] **Step 3: Add card press-scale**

In `DisciplineCard.tsx`, if it uses `TouchableOpacity`/`Pressable`, wrap the press feedback with an `Animated.Value` scale (to `0.97` on pressIn, back to `1` on pressOut, `useNativeDriver: true`, spring). If it already uses `TouchableOpacity` with `activeOpacity`, leave it — opacity feedback is acceptable; only add scale if no feedback exists.

- [ ] **Step 4: Run tests**

Run: `cd the-system && npx jest navigation DisciplineCard CommandHall`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add the-system/src/navigation the-system/src/components/ui/DisciplineCard.tsx
git commit -m "feat: smooth fade screen transitions + card press feedback"
```

---

### Task 7: Icon / splash / notification assets + build

**Files:**
- Modify: `the-system/generate_assets.py` (spark art)
- Modify: `the-system/scripts/genAvatarBanners.js` (spark banners)
- Modify: `the-system/android/app/src/main/java/com/thesystem/RichNotificationReceiver.java` (accent color)
- Regenerate: `the-system/assets/*.png`, `the-system/android/.../res/drawable/notif_*.png`

- [ ] **Step 1: Inspect the asset generators**

Run: `cd the-system && sed -n '1,200p' generate_assets.py && echo '---BANNERS---' && sed -n '1,200p' scripts/genAvatarBanners.js`
Note: image sizes, output paths, how each PNG is drawn.

- [ ] **Step 2: Rewrite art to the Claude spark**

In `generate_assets.py`, replace the foreground/logo drawing with a coral spark on warm charcoal `#262624`: draw N tapered rays (PIL polygons) from center + a lighter core circle, accent `#D97757`, for `icon.png`, `adaptive-icon.png` / `android-icon-foreground.png` (spark, transparent or charcoal bg), `android-icon-background.png` (solid `#262624`), `android-icon-monochrome.png` (white spark on transparent), `splash-icon.png` + `splash-native.png` (centered spark on `#262624`), `notification-icon.png` (white spark silhouette on transparent — Android tints it), `favicon.png`. Keep existing output filenames/sizes.

- [ ] **Step 3: Run the asset generator**

Run: `cd the-system && python generate_assets.py`
Expected: all PNGs in `assets/` rewritten. Spot-check `assets/icon.png` opens and shows the coral spark.

- [ ] **Step 4: Regenerate notification banners as sparks**

In `scripts/genAvatarBanners.js`, replace the chibi/sprite drawing with the spark (transparent bg, rank-colored radial aura, 360×360, 18 files `notif_<class>_<rank>.png`, rank colors matching `RANK_SPEC` tips). Then:
Run: `cd the-system && node scripts/genAvatarBanners.js`
Expected: 18 PNGs written to `android/app/src/main/res/drawable/notif_*.png`.

- [ ] **Step 5: Recolor native notification accent**

In `RichNotificationReceiver.java`, change the accent hex `#3bc9ff` → `#D97757` (the `setColor`/accent usage).
Run: `grep -rn "3bc9ff\|3BC9FF" the-system/android/app/src/main/java`
Expected: no matches.

- [ ] **Step 6: Prebuild (NEVER --clean)**

Run: `cd the-system && npx expo prebuild --platform android`
Expected: native config regenerated (picks up app.json color/splash + removed expo-audio), committed `android/` res preserved. Per `the-system-prebuild` memory: do NOT pass `--clean`.

- [ ] **Step 7: Build release APK with JBR 21**

Run (JBR 21 path per memory — JetBrains Runtime, not JDK 25):
```bash
cd the-system/android && JAVA_HOME="<JBR-21-path>" ./gradlew assembleRelease
```
Expected: BUILD SUCCESSFUL; APK at `android/app/build/outputs/apk/release/app-release.apk`.

- [ ] **Step 8: Install + verify on device**

```bash
adb install -r the-system/android/app/build/outputs/apk/release/app-release.apk
adb shell monkey -p com.thesystem -c android.intent.category.LAUNCHER 1
```
Screenshot-verify: splash (charcoal + spark), CommandHall (coral, Lora headers, Inter body, spark avatar), a discipline complete, Settings → TEST NOTIFICATION (coral accent + spark large icon). Capture with `adb exec-out screencap -p > /tmp/verify.png` and Read it.

- [ ] **Step 9: Commit**

```bash
git add the-system/generate_assets.py the-system/scripts/genAvatarBanners.js the-system/assets the-system/android
git commit -m "feat: Claude-spark icon/splash/notification assets + coral accent"
```

---

## Progression unlocks (verify, mostly emergent from palette + spark)

These should already work from Tasks 2 + 4 because they key off `rank`:
- Palette warms E→S (Task 2).
- Spark gains rays/glow, gold tips at A/S, rotation at A/S (Task 4 `RANK_SPEC`).
- `AvatarOrbit` (already mounted in CommandHall, count from `theme.particleCount`) shows orbiting coral motes that grow with rank — recolored automatically via theme accent.

- [ ] **Verify** by temporarily forcing a high rank in the store (or via existing dev affordance) and screenshotting E vs S CommandHall. If orbit/halo gating needs an explicit threshold (e.g. halo only B+), add a conditional in CommandHall keyed on `rank` — but only if it doesn't already read naturally from `theme.particleCount`/`avatarFloat`.

---

## Self-Review

- **Spec coverage:** Palette (T2), fonts (T3), avatar (T4), FX/scanlines (T5), transitions (T6), sound (T1), assets/build (T7), progression (T2+T4 + verify). All spec sections mapped.
- **Placeholders:** `<JBR-21-path>` in T7.S7 is an environment value the executor must supply from the `the-system-prebuild` memory — not a code placeholder. All code steps carry full code.
- **Type consistency:** `AvatarDisplay` props preserved across T4; `ClaudeSpark` `RANK_SPEC` keys match ranks E–S used in `rankThemes.ts`; `FONTS` family names match `useFonts` keys in `App.tsx` (T3).
