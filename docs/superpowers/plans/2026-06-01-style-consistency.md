# Style Consistency Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every text render in one font (Lora, provably), give every bordered box the same cap-corner style (corners thicker than edges), bump fonts ~+2px, restyle the first-run onboarding (elegant intro + background orbit), and regenerate the splash with Lora instead of a pixel font — across every screen, UI component, and the first-run flow.

**Architecture:** Front-end only; no engine/data/store changes. Two new reusable components (`CornerBox`, `OnboardingOrbit`). The font fix stops relying on the fragile runtime monkeypatch (`applyGlobalFont.ts`) and instead makes `fontFamily` explicit in every text style, enforced by a Jest gate test that fails if any text style omits a Lora family. The +2px bump stays centralized in the monkeypatch wrapper (kept as a safety net). Splash PNG regenerated from the real Lora TTF via `@resvg/resvg-js`.

**Tech Stack:** React Native 0.85 / React 19, react-native-svg, react-navigation, Jest. Build: `expo prebuild` (no `--clean`) + JBR 21 release APK per `the-system-prebuild` memory. Splash gen: `@resvg/resvg-js` (dev-only).

**Branch:** `style-consistency` (off `main`).

---

### Task 1: `CornerBox` component (cap-corner border)

**Files:**
- Create: `the-system/src/components/ui/CornerBox.tsx`
- Test: `the-system/__tests__/CornerBox.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import React from 'react';
import renderer from 'react-test-renderer';
import { Text } from 'react-native';
import CornerBox from '../src/components/ui/CornerBox';

describe('CornerBox', () => {
  it('renders children', () => {
    const tree = renderer.create(
      <CornerBox color="#D97757"><Text>hi</Text></CornerBox>
    );
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('hi');
  });

  it('renders four corner brackets thicker than the edge border', () => {
    const tree = renderer.create(<CornerBox color="#D97757" borderWidth={1} cornerThickness={2} />);
    const json = tree.toJSON();
    // Flatten all style objects in the tree.
    const styles: any[] = [];
    const walk = (n: any) => {
      if (!n) return;
      if (Array.isArray(n)) return n.forEach(walk);
      if (n.props && n.props.style) {
        const s = Array.isArray(n.props.style) ? Object.assign({}, ...n.props.style.filter(Boolean)) : n.props.style;
        styles.push(s);
      }
      if (n.children) n.children.forEach(walk);
    };
    walk(json);
    const corners = styles.filter((s) => s && (s.borderTopWidth === 2 || s.borderBottomWidth === 2));
    expect(corners.length).toBe(4);
    // Edge border present and thinner.
    const edge = styles.find((s) => s && s.borderWidth === 1);
    expect(edge).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd the-system && npx jest CornerBox`
Expected: FAIL — `Cannot find module '../src/components/ui/CornerBox'`.

- [ ] **Step 3: Write the component**

Create `the-system/src/components/ui/CornerBox.tsx` exactly:

```tsx
import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';

interface Props {
  /** Edge + corner color (corner overridable via cornerColor). */
  color: string;
  /** Thin full-edge border width. */
  borderWidth?: number;
  /** Thicker corner bracket stroke. */
  cornerThickness?: number;
  /** Length of each corner bracket leg. */
  cornerLength?: number;
  cornerColor?: string;
  radius?: number;
  /** Background fill. */
  fill?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Bordered box with a thin full border on all edges plus four thicker corner
 * brackets, so the corners read heavier than the edges — the app-wide
 * "cap-corner" frame (CommandHall rank badge / shield panel style).
 */
export default function CornerBox({
  color,
  borderWidth = 1,
  cornerThickness = 2,
  cornerLength = 14,
  cornerColor,
  radius,
  fill,
  style,
  children,
}: Props) {
  const cc = cornerColor ?? color;
  const corner = { position: 'absolute' as const, width: cornerLength, height: cornerLength, borderColor: cc };
  return (
    <View
      style={[
        { borderWidth, borderColor: color, position: 'relative' },
        radius != null && { borderRadius: radius },
        fill != null && { backgroundColor: fill },
        style,
      ]}
    >
      <View style={[corner, { top: -borderWidth, left: -borderWidth, borderTopWidth: cornerThickness, borderLeftWidth: cornerThickness }]} />
      <View style={[corner, { top: -borderWidth, right: -borderWidth, borderTopWidth: cornerThickness, borderRightWidth: cornerThickness }]} />
      <View style={[corner, { bottom: -borderWidth, left: -borderWidth, borderBottomWidth: cornerThickness, borderLeftWidth: cornerThickness }]} />
      <View style={[corner, { bottom: -borderWidth, right: -borderWidth, borderBottomWidth: cornerThickness, borderRightWidth: cornerThickness }]} />
      {children}
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd the-system && npx jest CornerBox`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add the-system/src/components/ui/CornerBox.tsx the-system/__tests__/CornerBox.test.tsx
git commit -m "feat: CornerBox cap-corner border component"
```

---

### Task 2: Central +2px font bump in the wrapper

**Files:**
- Modify: `the-system/src/theme/applyGlobalFont.ts`
- Test: `the-system/__tests__/fontBump.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { bumpFontSize } from '../src/theme/applyGlobalFont';

describe('bumpFontSize', () => {
  it('adds 2 to an explicit fontSize', () => {
    expect(bumpFontSize({ fontSize: 13 })).toEqual({ fontSize: 15 });
  });
  it('returns null when no own fontSize (so inheritance is untouched)', () => {
    expect(bumpFontSize({ color: 'red' })).toBeNull();
    expect(bumpFontSize(undefined)).toBeNull();
  });
  it('flattens arrays and bumps the resolved fontSize', () => {
    expect(bumpFontSize([{ fontSize: 20 }, { color: 'x' }])).toEqual({ fontSize: 22 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd the-system && npx jest fontBump`
Expected: FAIL — `bumpFontSize is not a function`.

- [ ] **Step 3: Add `bumpFontSize` and use it in the wrapper**

In `the-system/src/theme/applyGlobalFont.ts`, add the `StyleSheet` import and export the helper, then apply it inside `wrapWithFont`. Replace the existing `wrapWithFont` function and add the export:

```tsx
// add near the top, after the RN require:
const { StyleSheet } = RN;

/**
 * Returns `{ fontSize: n+2 }` when the caller's own style sets a fontSize, else
 * null. Null means "leave it" so nested text keeps inheriting its parent size.
 */
export function bumpFontSize(style: unknown): { fontSize: number } | null {
  if (!style) return null;
  const flat = StyleSheet.flatten(style as object) as { fontSize?: number } | undefined;
  if (flat && typeof flat.fontSize === 'number') return { fontSize: flat.fontSize + 2 };
  return null;
}

function wrapWithFont(Original: AnyComponent, fontFamily: string): AnyComponent {
  const Wrapped = ((props: { style?: unknown }) =>
    React.createElement(Original, {
      ...props,
      // base font first; caller style next; +2 size last so it always wins.
      style: [{ fontFamily }, props.style, bumpFontSize(props.style)],
    })) as AnyComponent;
  Wrapped.displayName = `Lora(${Original.displayName || Original.name || 'Component'})`;
  Wrapped.__interWrapped = true;
  return Wrapped;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd the-system && npx jest fontBump`
Expected: PASS (3 tests).

- [ ] **Step 5: Bump the Animated.Text styles the wrapper can't reach**

The wrapper only wraps `Text`/`TextInput`, not `Animated.Text`. Add +2 to each `Animated.Text` style so they match. Edit these styles:
- `the-system/src/screens/ShieldOverlay.tsx` `countdown`: `fontSize: 64` → `fontSize: 66`.
- `the-system/src/screens/LevelUpSplash.tsx` `rankLetter`: `96` → `98`; `rankLetterBg`: `120` → `122`; `levelNumber`: `96` → `98`.
- `the-system/src/components/ui/RankPromotionSplash.tsx` `rankLetter`: `120` → `122`; `rankLabel`: `24` → `26`; and its `title`/`tap` styles: `+2` each (read the file; whatever their fontSize is, add 2).

- [ ] **Step 6: Run full suite**

Run: `cd the-system && npx jest`
Expected: PASS (no behavior assertions on exact font sizes; if any test asserts a literal size you bumped, update it and report which).

- [ ] **Step 7: Commit**

```bash
git add the-system/src/theme/applyGlobalFont.ts the-system/__tests__/fontBump.test.tsx the-system/src/screens/ShieldOverlay.tsx the-system/src/screens/LevelUpSplash.tsx the-system/src/components/ui/RankPromotionSplash.tsx
git commit -m "feat: central +2px font bump (wrapper + Animated.Text)"
```

---

### Task 3: Font-consistency gate test + explicit-Lora sweep

This is the task that ends the recurring font drift. A test fails the build if any text style omits a Lora family; then we fix every offender.

**Files:**
- Test: `the-system/__tests__/fontConsistency.test.ts`
- Modify: every file the test flags (all 11 font screens + UI components), `the-system/src/components/ui/WorldMapNode.tsx` (SVG text), `the-system/src/navigation/AppNavigator.tsx` (`loadingSub`).

- [ ] **Step 1: Write the gate test**

Create `the-system/__tests__/fontConsistency.test.ts` exactly:

```ts
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.join(__dirname, '..', 'src');

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return /\.(t|j)sx?$/.test(e.name) ? [p] : [];
  });
}

/** Find each `{...}` object literal that contains `fontSize:` and check it also
 *  contains `fontFamily:`. Brace-matched so multi-line style objects work. */
function fontSizeWithoutFamily(src: string): number[] {
  const lines: number[] = [];
  for (let i = 0; i < src.length; i++) {
    if (src[i] !== '{') continue;
    let depth = 1; let j = i + 1;
    for (; j < src.length && depth > 0; j++) {
      if (src[j] === '{') depth++;
      else if (src[j] === '}') depth--;
    }
    const body = src.slice(i + 1, j - 1);
    // Only innermost objects (no nested brace) to avoid double-counting wrappers.
    if (!body.includes('{') && /\bfontSize\s*:/.test(body) && !/\bfontFamily\s*:/.test(body)) {
      lines.push(src.slice(0, i).split('\n').length);
    }
  }
  return lines;
}

describe('font consistency', () => {
  const files = walk(SRC);

  it('every style object with fontSize also sets fontFamily', () => {
    const offenders: string[] = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      for (const ln of fontSizeWithoutFamily(src)) {
        offenders.push(`${path.relative(SRC, f)}:${ln}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('every fontFamily value is a Lora family', () => {
    const bad: string[] = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      const re = /fontFamily\s*:\s*(['"][^'"]+['"]|FONTS\.\w+)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) {
        const v = m[1];
        if (v.startsWith('FONTS.')) continue;
        if (/Lora_/.test(v)) continue;
        bad.push(`${path.relative(SRC, f)}: ${v}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('every <SvgText> sets a fontFamily prop', () => {
    const bad: string[] = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      const re = /<SvgText\b([\s\S]*?)>/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) {
        if (!/fontFamily/.test(m[1])) {
          bad.push(`${path.relative(SRC, f)}:${src.slice(0, m.index).split('\n').length}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to see the offender list**

Run: `cd the-system && npx jest fontConsistency`
Expected: FAIL. The first assertion prints a `file:line` list of every text style missing `fontFamily`; the third prints the `WorldMapNode` `<SvgText>` lines. Capture the full list.

- [ ] **Step 3: Fix every offender with the weight-mapping rule**

For each flagged style, add `fontFamily: FONTS.<weight>` (import `FONTS` from the correct relative `../theme/typography` / `../../theme/typography` if not already imported). Pick the weight by what the style already implies:
- Heading / title / section header / stat value / nameplate / primary-button label / big number → `FONTS.display`.
- `fontWeight: '700'`/`'bold'` body → `FONTS.bold`.
- `fontWeight: '600'` → `FONTS.bodySemibold`; `'500'` → `FONTS.bodyMedium`.
- `fontStyle: 'italic'` → `FONTS.italic`.
- Everything else (body, caption, label, description, value text) → `FONTS.body`.

Apply to every flagged line across: `Archive.tsx`, `Codex.tsx`, `CommandHall.tsx`, `ShieldOverlay.tsx`, `Awakening.tsx`, `Settings.tsx`, `Mirror.tsx`, `MandateReveal.tsx`, `XPBar.tsx`, `DisciplineCard.tsx`, `SectionDivider.tsx`, `AppNavigator.tsx` (`loadingSub`), and any other file the test names. Do **not** remove existing `FONTS.display` entries.

- [ ] **Step 4: Fix the SVG text in WorldMapNode**

In `the-system/src/components/ui/WorldMapNode.tsx`, add `import { FONTS } from '../../theme/typography';` and add `fontFamily={FONTS.display}` to **both** `<SvgText>` elements (the week number at line ~53 and the percent at line ~61).

- [ ] **Step 5: Re-run the gate until green**

Run: `cd the-system && npx jest fontConsistency`
Expected: PASS (3 tests, offenders empty). Repeat Step 3 for any stragglers.

- [ ] **Step 6: Confirm no rogue families remain (manual grep)**

Run: `cd the-system && grep -rn "fontFamily" src | grep -v "Lora_" | grep -v "FONTS\."`
Expected: no output (only the doc-comment lines in `applyGlobalFont.ts`, which are comments — ignore those).

- [ ] **Step 7: Run full suite**

Run: `cd the-system && npx jest`
Expected: all pass. Update any test asserting an exact chrome string only if you changed copy (you did not).

- [ ] **Step 8: Commit**

```bash
git add the-system/__tests__/fontConsistency.test.ts the-system/src
git commit -m "feat: explicit Lora on every text style + SVG; gate test enforces single font"
```

---

### Task 4: Cap-corner border sweep (all bordered boxes → CornerBox)

Convert every **full-border rectangle box** to `CornerBox`. Leave accent lines (left-only/bottom-only borders, progress tracks, `SectionDivider` rule) untouched.

**Files (modify):** `ShieldOverlay.tsx`, `Awakening.tsx`, `Settings.tsx`, `Codex.tsx`, `Archive.tsx`, `Mirror.tsx`, `MandateReveal.tsx`, `SRankCutscene.tsx`, `AscensionPath.tsx`, `CommandHall.tsx`, `LevelUpSplash.tsx`, `DisciplineCard.tsx`, `XPBar.tsx`. Reconcile `CornerFrame.tsx` (keep, but make its default `thickness`/legs match CornerBox) and `PixelBorder.tsx`.

- [ ] **Step 1: Identify the boxes**

Run: `cd the-system && grep -rnE "borderWidth: ?[0-9]" src/screens src/components`
For each hit, classify: a `View`/`TouchableOpacity` whose style is a full enclosing border = **convert**. A bar/track/divider/badge-with-only-one-side = **leave**.

- [ ] **Step 2: Convert, one file at a time**

For each box to convert, replace the bordered `View` with `CornerBox` (import it). Pattern:

Before:
```tsx
<View style={[styles.someBox, { borderColor: theme.accent }]}>
  ...children...
</View>
```
After:
```tsx
<CornerBox color={theme.accent} fill={theme.accent + '12'} style={styles.someBox}>
  ...children...
</CornerBox>
```
And in the stylesheet, remove `borderWidth`/`borderColor` from `someBox` (CornerBox owns the border now); keep padding/layout/`borderRadius`. For boxes already drawing manual corner ticks (CommandHall `rankBadge` + `rankCorner`, CommandHall shield `shieldInner` + `shieldCorner`, LevelUpSplash `panel`/`continueBtn` + `CornerDeco`/`btnCorner`), delete the ad-hoc corner Views and the `*Corner`/`cornerDeco` styles and use `CornerBox` instead. AscensionPath’s modal already uses `CornerFrame`; switch it to `CornerBox` for one consistent component, or leave `CornerFrame` if its look is already corners-only (acceptable — corners-only is the same family). Keep all themed colors via the `color` prop.

Boxes to convert per file (from Step 1 — verify against grep output):
- `ShieldOverlay.tsx`: `container`, `durationBtn`, bordered `lockBtn`/`cancelBtn` only if they have a border (lockBtn is fill — leave; durationBtn convert).
- `Awakening.tsx`: `input`, `classCard`, `permBtn` (goldBtn is fill — leave).
- `Settings.tsx`: interval pills, reset/danger box, `TextInput`, export rows if bordered.
- `Codex.tsx`: discipline rows, modal panel, form `TextInput`s, difficulty pills.
- `Archive.tsx`: stat boxes/cards with borders.
- `Mirror.tsx`: stat/equip/title boxes with borders.
- `MandateReveal.tsx`: bordered panels/badges.
- `SRankCutscene.tsx`: bordered frame/box, `completeBtn` if bordered.
- `AscensionPath.tsx`: `weekBadge`, `modalStatBox`, `modalClose`, `modalBox` (CornerFrame→CornerBox).
- `CommandHall.tsx`: `rankBadge`, shield panel, `chestBtn`.
- `LevelUpSplash.tsx`: `panel`, `xpBadge`, `continueBtn`.
- `DisciplineCard.tsx`: the card border + any bordered buttons.
- `XPBar.tsx`: the bar frame if it has a full border (the fill track stays).

- [ ] **Step 3: Run tests**

Run: `cd the-system && npx jest`
Expected: PASS. If a snapshot/test asserts old corner Views, update it and report which.

- [ ] **Step 4: Commit**

```bash
git add the-system/src
git commit -m "feat: cap-corner borders app-wide via CornerBox (all bordered boxes)"
```

---

### Task 5: Onboarding — elegant intro + background orbit

**Files:**
- Create: `the-system/src/components/fx/OnboardingOrbit.tsx`
- Test: `the-system/__tests__/OnboardingOrbit.test.tsx`
- Modify: `the-system/src/screens/Awakening.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import React from 'react';
import renderer from 'react-test-renderer';
import OnboardingOrbit from '../src/components/fx/OnboardingOrbit';

it('renders without crashing and is non-interactive', () => {
  const tree = renderer.create(<OnboardingOrbit color="#D97757" />);
  const json = JSON.stringify(tree.toJSON());
  expect(json).toContain('"pointerEvents":"none"');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd the-system && npx jest OnboardingOrbit`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the component**

Create `the-system/src/components/fx/OnboardingOrbit.tsx` exactly:

```tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, Dimensions } from 'react-native';

interface Props {
  color: string;
}

const { width, height } = Dimensions.get('window');

const RINGS = [
  { radius: 150, count: 6, period: 26, size: 4, opacity: 0.5 },
  { radius: 210, count: 9, period: 38, size: 3, opacity: 0.35 },
  { radius: 280, count: 12, period: 52, size: 3, opacity: 0.22 },
];

function Ring({ color, radius, count, period, size, opacity }: { color: string } & typeof RINGS[number]) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: period * 1000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spin, period]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const box = radius * 2;
  return (
    <Animated.View style={[styles.ring, { width: box, height: box, marginLeft: -radius, marginTop: -radius, transform: [{ rotate }] }]}>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: radius + radius * Math.cos(a) - size / 2,
              top: radius + radius * Math.sin(a) - size / 2,
              width: size, height: size, borderRadius: size / 2,
              backgroundColor: color, opacity,
              shadowColor: color, shadowOpacity: 0.8, shadowRadius: size * 1.6, shadowOffset: { width: 0, height: 0 },
            }}
          />
        );
      })}
    </Animated.View>
  );
}

/** Large, slow, low-opacity concentric orbit for the onboarding background. */
export default function OnboardingOrbit({ color }: Props) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
      <View style={{ position: 'absolute', left: width / 2, top: height * 0.42 }}>
        {RINGS.map((r, i) => <Ring key={i} color={color} {...r} />)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute' },
});
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd the-system && npx jest OnboardingOrbit`
Expected: PASS.

- [ ] **Step 5: Rework the Awakening intro + add the orbit**

In `the-system/src/screens/Awakening.tsx`:

1. Import the orbit: `import OnboardingOrbit from '../components/fx/OnboardingOrbit';`.
2. Render it once, behind everything, just after `<SystemBackground ... />` in the returned JSX:
```tsx
<OnboardingOrbit color="#D97757" />
```
(It is absolute-fill + `pointerEvents="none"`, so it shows on all five steps.)
3. Replace the typewriter with an elegant entrance. Delete the `introText` state, the `fullIntro` slicing `setInterval`, and the `i`-based effect. Replace the intro effect with a fade+rise driven by `opacity` and a new `rise` value:
```tsx
const opacity = useRef(new Animated.Value(0)).current;
const rise = useRef(new Animated.Value(12)).current;

useEffect(() => {
  if (step !== 'intro') return;
  opacity.setValue(0);
  rise.setValue(12);
  Animated.parallel([
    Animated.timing(opacity, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    Animated.timing(rise, { toValue: 0, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
  ]).start();
}, [step, opacity, rise]);
```
Add `Easing` to the `react-native` import.
4. Render the intro line as the full string with the graceful transform (no per-char slicing):
```tsx
<Animated.View style={{ opacity, transform: [{ translateY: rise }] }}>
  <Text style={styles.introText}>{fullIntro}</Text>
  <Text style={styles.tapHint}>Tap to continue</Text>
</Animated.View>
```
Keep `const fullIntro = 'THE SYSTEM HAS DETECTED A CANDIDATE.';`.
5. Convert the bordered boxes in this screen (`input`, `classCard`, `permBtn`) to `CornerBox` per Task 4’s pattern (if not already done in Task 4). `goldBtn` stays a solid fill.

- [ ] **Step 6: Run tests**

Run: `cd the-system && npx jest`
Expected: PASS. If a test asserted the typewriter partial text, update it to expect the full `fullIntro` string and report it.

- [ ] **Step 7: Commit**

```bash
git add the-system/src/components/fx/OnboardingOrbit.tsx the-system/__tests__/OnboardingOrbit.test.tsx the-system/src/screens/Awakening.tsx
git commit -m "feat: onboarding elegant fade-in intro + large background orbit"
```

---

### Task 6: Regenerate splash with Lora

**Files:**
- Create: `the-system/scripts/gen-splash.mjs`
- Modify (regenerate): `the-system/assets/splash-native.png`
- Dev dep: `@resvg/resvg-js`

- [ ] **Step 1: Add the generator**

Install: `cd the-system && npm i -D @resvg/resvg-js`

Create `the-system/scripts/gen-splash.mjs` exactly:

```js
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const W = 1080, H = 2280;
const cx = W / 2, cy = 900;

// Coral 12-point spark (matches the in-app ClaudeSpark look).
function spark(cx, cy, rOuter, rInner, points = 12) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#262624"/>
  <circle cx="${cx}" cy="${cy}" r="220" fill="#D97757" opacity="0.10"/>
  <circle cx="${cx}" cy="${cy}" r="150" fill="#D97757" opacity="0.14"/>
  <polygon points="${spark(cx, cy, 170, 60)}" fill="#D97757"/>
  <circle cx="${cx}" cy="${cy}" r="46" fill="#F5D9C6"/>
  <text x="${cx}" y="${cy + 340}" font-family="Lora" font-weight="600" font-size="108"
        fill="#EDEAE0" text-anchor="middle" letter-spacing="6">THE SYSTEM</text>
  <text x="${cx}" y="${cy + 430}" font-family="Lora" font-weight="400" font-size="46"
        fill="#D97757" text-anchor="middle" letter-spacing="8">Ascend or perish</text>
</svg>`;

const fonts = [
  join(root, 'node_modules/@expo-google-fonts/lora/600SemiBold/Lora_600SemiBold.ttf'),
  join(root, 'node_modules/@expo-google-fonts/lora/400Regular/Lora_400Regular.ttf'),
];

const resvg = new Resvg(svg, {
  background: '#262624',
  font: { fontFiles: fonts, loadSystemFonts: false, defaultFontFamily: 'Lora' },
});
const png = resvg.render().asPng();
writeFileSync(join(root, 'assets/splash-native.png'), png);
console.log('wrote assets/splash-native.png', png.length, 'bytes');
```

- [ ] **Step 2: Generate**

Run: `cd the-system && node scripts/gen-splash.mjs`
Expected: `wrote assets/splash-native.png <N> bytes`. Open the PNG and confirm: warm bg, coral spark, "THE SYSTEM" in Lora serif (not pixel), "Ascend or perish" beneath. Adjust spark radii / font sizes / `cy` and re-run until it matches the liked layout. **Show the PNG to the user before continuing.**

- [ ] **Step 3: Commit**

```bash
git add the-system/scripts/gen-splash.mjs the-system/assets/splash-native.png the-system/package.json the-system/package-lock.json
git commit -m "feat: regenerate splash with Lora typeface (no pixel font)"
```

---

### Task 7: Prebuild, build, verify on device

**Files:** none (build/verify only). User connects the phone at this step.

- [ ] **Step 1: Prebuild (NEVER --clean) — splash asset changed**

Run (PowerShell): `cd the-system; npx expo prebuild --platform android`
Expected: completes; updated `splash-native.png` propagated into `android/app/src/main/res/drawable-*`. Per `the-system-prebuild` memory: never pass `--clean`.

- [ ] **Step 2: Release build (JBR 21)**

Run (PowerShell): `$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'; cd the-system/android; .\gradlew.bat assembleRelease`
Expected: BUILD SUCCESSFUL; APK at `the-system/android/app/build/outputs/apk/release/app-release.apk`.

- [ ] **Step 3: Install + launch**

```
adb install -r the-system/android/app/build/outputs/apk/release/app-release.apk
adb shell am force-stop com.thesystem
adb shell monkey -p com.thesystem -c android.intent.category.LAUNCHER 1
```

- [ ] **Step 4: Exhaustive screenshot sweep (font + border + size verification)**

For the splash, first-run onboarding (each step), and every screen (Command, Ascend, Mirror, Codex, Archive, Settings, Shield, a level-up/mandate overlay), capture and read each:
```
adb exec-out screencap -p > v.png
```
Confirm on every surface: (a) all text is serif Lora — zero sans-serif; (b) bordered boxes show thicker corners than edges; (c) text is the larger size; (d) onboarding shows the background orbit and a graceful (non-typed) intro; (e) splash text is Lora. Note any screen that fails and loop back to the relevant task.

- [ ] **Step 5: Final full suite**

Run: `cd the-system && npx jest`
Expected: all pass, including the three `fontConsistency` gate tests.

---

## Self-Review

- **Spec coverage:** Pillar 1 (one font, provable) → Task 3 (gate test + sweep) + Task 2 step 5 (Animated.Text) + WorldMapNode SVG fix; Pillar 2 (cap-corner borders) → Task 1 (CornerBox) + Task 4 (sweep); Pillar 3 (+2px) → Task 2; Pillar 4 (onboarding) → Task 5; Pillar 5 (splash) → Task 6; Pillar 6 (build+verify) → Task 7. All mapped.
- **Placeholders:** none — full code for every new component/test/script; sweeps are driven by greppable rules + an enforcing test rather than vague prose.
- **Type consistency:** `CornerBox` props (`color`, `borderWidth`, `cornerThickness`, `cornerLength`, `cornerColor`, `radius`, `fill`, `style`, `children`) used consistently in Tasks 1/4/5. `bumpFontSize` signature matches Task 2 test and wrapper usage. `FONTS.*` keys (`display`, `body`, `bodyMedium`, `bodySemibold`, `bold`, `italic`) all exist in `typography.ts`.
- **Ambiguity:** weight-mapping rule in Task 3 Step 3 makes each fix deterministic; "convert vs leave" rule in Task 4 Step 1 is explicit (full-border box vs accent line).
```
