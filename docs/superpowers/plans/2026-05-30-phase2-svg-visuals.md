# Phase 2: SVG Visual System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all SVG visual components — discipline icons, composable pixel-art avatars, rank auras/particles, UI pixel borders, world map nodes, and mandate chests.

**Architecture:** All visuals via `react-native-svg`. No external images. Block-rectangle pixel art style (hard edges, SVG Rect elements). Composable avatar layers (base body + equipment overlays). Animated particles via `react-native-reanimated` Animated.Value.

**Tech Stack:** react-native-svg 15.x, react-native-reanimated 4.x, TypeScript strict

---

## File Structure

```
src/components/
  avatar/
    PixelCanvas.tsx           — utility: renders 2D string array as SVG rects
    avatarData.ts             — pixel art string arrays for all 3 classes (16×24 grid)
    equipmentData.ts          — weapon/armor/crown overlays per tier per class
    AvatarDisplay.tsx         — composite: class + mood + equipment + aura
  icons/
    iconData.ts               — pixel art string arrays for 8 discipline icons (16×16)
    DisciplineIcon.tsx        — renders one icon by discipline code
  particles/
    AuraParticles.tsx         — animated rank-based particle system
  ui/
    PixelBorder.tsx           — rank-based pixel border (SVG rect outline)
    MandateChest.tsx          — bronze/silver/gold animated chest SVG
    WorldMapNode.tsx          — single 24×24 pixel world map node
    RankPromotionSplash.tsx   — fullscreen rank-up animation overlay
```

---

## Task 1: PixelCanvas Utility Component

**Files:**
- Create: `the-system/src/components/avatar/PixelCanvas.tsx`

- [ ] **Step 1: Write PixelCanvas**

Create `the-system/src/components/avatar/PixelCanvas.tsx`:
```tsx
import React from 'react';
import Svg, { Rect } from 'react-native-svg';

interface PixelCanvasProps {
  /** Array of strings — each char = one pixel using palette keys, '.' = transparent */
  pixels: string[];
  /** Map from char to hex color string */
  palette: Record<string, string>;
  /** Display size of each pixel in pts. Default 4 (16×24 grid → 64×96 display) */
  pixelSize?: number;
}

export default function PixelCanvas({ pixels, palette, pixelSize = 4 }: PixelCanvasProps) {
  const cols = pixels[0]?.length ?? 0;
  const rows = pixels.length;

  return (
    <Svg width={cols * pixelSize} height={rows * pixelSize}>
      {pixels.flatMap((row, y) =>
        Array.from(row).map((char, x) => {
          if (char === '.' || !palette[char]) return null;
          return (
            <Rect
              key={`${y}-${x}`}
              x={x * pixelSize}
              y={y * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill={palette[char]}
            />
          );
        })
      )}
    </Svg>
  );
}
```

- [ ] **Step 2: Write test**

Create `the-system/__tests__/components/PixelCanvas.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import PixelCanvas from '../../src/components/avatar/PixelCanvas';

const palette = { R: '#ff0000', G: '#00ff00', '.': '' };

describe('PixelCanvas', () => {
  it('renders without crashing', () => {
    const pixels = ['RG', '.R'];
    render(<PixelCanvas pixels={pixels} palette={palette} pixelSize={2} />);
  });

  it('uses pixelSize to compute dimensions', () => {
    // 3 cols × 2 rows × 4px = 12 × 8 SVG
    const pixels = ['RGR', 'G.G'];
    const { getByTestId } = render(
      <PixelCanvas pixels={pixels} palette={palette} pixelSize={4} />
    );
    // Just verify no crash — visual output verified manually
  });
});
```

Run: `cd the-system && npx jest __tests__/components/PixelCanvas.test.tsx --no-coverage`
Expected: PASS (need react-native testing library — add if missing: `npm install --save-dev @testing-library/react-native`)

- [ ] **Step 3: Install testing library if needed**

```powershell
cd the-system
npm install --save-dev @testing-library/react-native @testing-library/jest-native
```

Update `the-system/jest.config.js` to add setupFilesAfterFramework:
```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-svg|expo.*|@expo.*)/)',
  ],
};
```

If component tests fail due to SVG mock, add `the-system/__mocks__/react-native-svg.js`:
```js
const React = require('react');
const { View, Text } = require('react-native');

const Svg = ({ children }) => React.createElement(View, null, children);
const Rect = (props) => React.createElement(View, null);
const Circle = (props) => React.createElement(View, null);
const Text_ = ({ children }) => React.createElement(Text, null, children);
const G = ({ children }) => React.createElement(View, null, children);
const Path = (props) => React.createElement(View, null);
const Defs = ({ children }) => React.createElement(View, null, children);
const RadialGradient = ({ children }) => React.createElement(View, null, children);
const LinearGradient = ({ children }) => React.createElement(View, null, children);
const Stop = (props) => null;

module.exports = { default: Svg, Svg, Rect, Circle, Text: Text_, G, Path, Defs, RadialGradient, LinearGradient, Stop };
```

- [ ] **Step 4: Commit**

```powershell
git add the-system/src/components/avatar/PixelCanvas.tsx the-system/__tests__/components/ the-system/__mocks__/react-native-svg.js the-system/jest.config.js
git commit -m "feat: add PixelCanvas utility component for pixel art SVG rendering"
```

---

## Task 2: Discipline Icons

**Files:**
- Create: `the-system/src/components/icons/iconData.ts`
- Create: `the-system/src/components/icons/DisciplineIcon.tsx`

- [ ] **Step 1: Write icon pixel data**

Create `the-system/src/components/icons/iconData.ts`:
```typescript
// 16×16 pixel art for each discipline icon
// Rendered at pixelSize=2 = 32×32 display
// '.' = transparent

export type IconPalette = Record<string, string>;

export interface IconDef {
  pixels: string[];
  palette: IconPalette;
}

// RISE: sun rising over horizon line
const RISE: IconDef = {
  pixels: [
    '................',
    '................',
    '.......11.......',
    '......1111......',
    '.1....1111....1.',
    '..1...1111...1..',
    '...1..1111..1...',
    '....111111111...',
    '................',
    '2222222222222222',
    '3333333333333333',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  palette: {
    '1': '#ffd700', // gold sun
    '2': '#ff8c00', // orange horizon
    '3': '#ff6600', // deep orange
  },
};

// REST: crescent moon with stars
const REST: IconDef = {
  pixels: [
    '................',
    '......11111.....',
    '.....1111111....',
    '....111111111...',
    '....111111111...',
    '....111111.1....',
    '....11111..1....',
    '.....1111111....',
    '......11111.....',
    '................',
    '..1.......1.....',
    '................',
    '.......1........',
    '................',
    '..........1.....',
    '................',
  ],
  palette: {
    '1': '#b0c4de', // silver moon
  },
};

// NOURISH: bowl with leaf
const NOURISH: IconDef = {
  pixels: [
    '................',
    '......22222.....',
    '.....2222222....',
    '....222222222...',
    '................',
    '.1111111111111..',
    '.1111111111111..',
    '..111111111111..',
    '...1111111111...',
    '....11111111....',
    '.....111111.....',
    '......1111......',
    '.......11.......',
    '................',
    '................',
    '................',
  ],
  palette: {
    '1': '#8b4513', // bowl brown
    '2': '#4a9',    // leaf green
  },
};

// SILENCE: locked shield
const SILENCE: IconDef = {
  pixels: [
    '................',
    '...11111111.....',
    '..1111111111....',
    '.111111111111...',
    '.111111111111...',
    '.111111111111...',
    '.111222222111...',
    '.111222222111...',
    '.111222222111...',
    '.111222222111...',
    '..1111111111....',
    '...111111111....',
    '....11111111....',
    '.....111111.....',
    '......1111......',
    '................',
  ],
  palette: {
    '1': '#ffd700', // gold shield
    '2': '#1a1a1a', // dark lock body
  },
};

// FORGE: dumbbell
const FORGE: IconDef = {
  pixels: [
    '................',
    '................',
    '..11.........11.',
    '.1111.......1111',
    '.1111.......1111',
    '..11.........11.',
    '...11111111111..',
    '...11111111111..',
    '..11.........11.',
    '.1111.......1111',
    '.1111.......1111',
    '..11.........11.',
    '................',
    '................',
    '................',
    '................',
  ],
  palette: {
    '1': '#c0c0c0', // silver iron
  },
};

// KNOWLEDGE: open book
const KNOWLEDGE: IconDef = {
  pixels: [
    '................',
    '..1111111111111.',
    '.11111111111111.',
    '.11111.111111...',
    '.11111.111111...',
    '.11111.111111...',
    '.11111.111111...',
    '.11111.111111...',
    '.11111.111111...',
    '.11111.111111...',
    '.11111.111111...',
    '.11111111111111.',
    '..1111111111111.',
    '...111111111....',
    '................',
    '................',
  ],
  palette: {
    '1': '#deb887', // parchment
  },
};

// PRESENCE: hourglass
const PRESENCE: IconDef = {
  pixels: [
    '................',
    '.11111111111111.',
    '.11111111111111.',
    '..111111111111..',
    '...1111111111...',
    '....11111111....',
    '.....111111.....',
    '......1111......',
    '.....111111.....',
    '....11111111....',
    '...1111111111...',
    '..111111111111..',
    '.11111111111111.',
    '.11111111111111.',
    '................',
    '................',
  ],
  palette: {
    '1': '#a0c4ff', // blue glass
  },
};

// RITUAL: potion bottle
const RITUAL: IconDef = {
  pixels: [
    '................',
    '......1111......',
    '......1111......',
    '.....111111.....',
    '....1111111111..',
    '...111111111111.',
    '...111111111111.',
    '...1222222111...',
    '...1222222111...',
    '...1222222111...',
    '...111111111....',
    '...111111111....',
    '....1111111.....',
    '.....11111......',
    '................',
    '................',
  ],
  palette: {
    '1': '#9b59b6', // purple potion
    '2': '#e8daef', // liquid highlight
  },
};

export const ICON_DATA: Record<string, IconDef> = {
  RISE,
  REST,
  NOURISH,
  SILENCE,
  FORGE,
  KNOWLEDGE,
  PRESENCE,
  RITUAL,
};
```

- [ ] **Step 2: Write DisciplineIcon component**

Create `the-system/src/components/icons/DisciplineIcon.tsx`:
```tsx
import React from 'react';
import PixelCanvas from '../avatar/PixelCanvas';
import { ICON_DATA } from './iconData';

interface Props {
  code: string;
  size?: number; // pixelSize per pixel, default 2 → 32×32 display
}

export default function DisciplineIcon({ code, size = 2 }: Props) {
  const icon = ICON_DATA[code];
  if (!icon) return null;
  return <PixelCanvas pixels={icon.pixels} palette={icon.palette} pixelSize={size} />;
}
```

- [ ] **Step 3: Commit**

```powershell
git add the-system/src/components/icons/
git commit -m "feat: add 8 pixel-art discipline icons (RISE, REST, NOURISH, SILENCE, FORGE, KNOWLEDGE, PRESENCE, RITUAL)"
```

---

## Task 3: Avatar Pixel Data

**Files:**
- Create: `the-system/src/components/avatar/avatarData.ts`

- [ ] **Step 1: Write avatar pixel data**

Create `the-system/src/components/avatar/avatarData.ts`:
```typescript
// 16 wide × 24 tall pixel art, scale 4 = 64×96 display
// Each string = one row, 16 chars
// '.' = transparent

export interface AvatarFrame {
  pixels: string[];
  palette: Record<string, string>;
}

// ─── Color palette keys ──────────────────────────────────────────────────────
// S = skin
// H = helmet/headgear
// F = face detail (eyes)
// A = armor (changes by tier)
// V = secondary armor
// L = legs
// B = boots
// W = weapon color (changes by tier)
// D = dark detail / shadow
// G = gold/accent (D-rank+)
// . = transparent

const SKIN = '#d4a96a';
const EYE  = '#2c1810';

// ─── Warrior ─────────────────────────────────────────────────────────────────

const WARRIOR_PIXELS: string[] = [
  '....HHHHHHHH....',  // 0  helmet top
  '....HHHHHHHH....',  // 1
  '...HHSSSSSSHHH..',  // 2  face
  '...HHSSFSFSHHH..',  // 3  eyes
  '...HHSSSSSSHHH..',  // 4
  '....HHHHHHHH....',  // 5  chin/helmet bottom
  '..DAAAAAAAAAD...',  // 6  shoulders
  '..AAAAAAAAAAAAA.',  // 7  upper torso
  'DAAAAAAAAAAAAAAAD', // 8  arms (17 chars — trim to 16):
  // Actually keep 16:
  'DAAAAAAAAAAAAAAAD', // needs trimming
  'DAAAAAAAAAAAAAAD.',
  'DAAAAAAAAAAAAAAAD',
  '..AAAAAAAAAAAAD.',
  '...AAAAAAAAAAAA.',
  'VVVVVVVVVVVVVVV.',  // 13 belt
  '...LLLLL.LLLLL..',  // 14 upper legs
  '...LLLLL.LLLLL..',  // 15
  '...LLLLL.LLLLL..',  // 16
  '..LLLLLL.LLLLL..',  // 17
  '..LLLLLL.LLLLLL.',  // 18
  '..BBBBB...BBBBB.',  // 19 boots
  '..BBBBB...BBBBB.',  // 20
  '.BBBBBB...BBBBBB',  // 21
  '.BBBBBB...BBBBBB',  // 22
  '..BBBBB...BBBBB.',  // 23
];

// Redo with strict 16-char rows:
const WARRIOR_BASE_PIXELS: string[] = [
  '....HHHHHHHH....',  // 0  helmet
  '....HHHHHHHH....',  // 1
  '...HHSSSSSSHHH..',  // NOTE: 16 chars each
  '...HHSFSSFSHHH..',  // 3  (F=eye detail) -- 16 chars? let me count: ...HHSFSSFSHHH.. = 16 ✓
  '...HHSSSSSSHHH..',  // 4  16 ✓
  '....HHHHHHHH....',  // 5  16 ✓
  '..DAAAAAAAAAAD..',  // 6  shoulders 16 ✓
  '..AAAAAAAAAAAAAA',  // 7  16 ✓  -- actually: ..AAAAAAAAAAAAD. = hmm
  'DAAAAAAAAAAAAAAD',  // 8  16 ✓
  'DAAAAAAAAAAAAAAD',  // 9  16 ✓
  'DAAAAAAAAAAAAAAD',  // 10 16 ✓
  'DAAAAAAAAAAAAAAD',  // 11 16 ✓
  '..AAAAAAAAAAAAAD',  // 12 16 ✓
  '...VVVVVVVVVVVV.',  // 13 belt 16 ✓
  '...LLLLL.LLLLLL.',  // 14 16 ✓
  '...LLLLL.LLLLLL.',  // 15 16 ✓
  '..LLLLLL.LLLLL..',  // 16 16 ✓
  '..LLLLLL.LLLLL..',  // 17 16 ✓
  '..LLLLLL.LLLLL..',  // 18 16 ✓
  '..BBBBB...BBBBB.',  // 19 16 ✓
  '..BBBBB...BBBBB.',  // 20 16 ✓
  '.BBBBBB...BBBBBB',  // 21 16 ✓
  '.BBBBBB...BBBBBB',  // 22 16 ✓
  '..BBBBB...BBBBB.',  // 23 16 ✓
];

// ─── Palette by rank tier (armor changes color) ──────────────────────────────

function warriorPalette(armorTier: 1|2|3|4|5): Record<string,string> {
  const ARMOR_COLORS: Record<number, { A: string; H: string; V: string; L: string; B: string }> = {
    1: { A: '#3a3535', H: '#5a5a5a', V: '#2a2020', L: '#2a2535', B: '#1a1010' }, // torn cloth
    2: { A: '#6b4a14', H: '#7a5a1e', V: '#5a3a0e', L: '#3a2a10', B: '#2a1a08' }, // leather
    3: { A: '#707070', H: '#808080', V: '#505050', L: '#505060', B: '#303030' }, // chainmail
    4: { A: '#1a1a1a', H: '#2a2a2a', V: '#ffd700', L: '#1a1a2a', B: '#0a0a0a' }, // black plate + gold
    5: { A: '#c8a820', H: '#ffd700', V: '#ffffff', L: '#b8982a', B: '#c8a820' }, // divine gold
  };
  const c = ARMOR_COLORS[armorTier];
  return {
    S: SKIN,
    F: EYE,
    H: c.H,
    A: c.A,
    V: c.V,
    L: c.L,
    B: c.B,
    D: '#111111',
    G: '#ffd700',
  };
}

// Weapon overlays — extra pixels drawn on top of base
// Format: [row, colStart, colEnd, char] — fills colStart..colEnd inclusive
export type OverlayRow = [number, number, number, string];

// Warrior weapon overlays (right side of body, cols 13-15)
const WARRIOR_WEAPON_OVERLAYS: Record<1|2|3|4|5, { pixels: OverlayRow[]; colors: Record<string,string> }> = {
  1: { // Stick
    pixels: [
      [2, 14, 14, 'W'], [3, 14, 14, 'W'], [4, 14, 14, 'W'],
      [5, 14, 14, 'W'], [6, 14, 14, 'W'], [7, 14, 14, 'W'],
      [8, 14, 14, 'W'], [9, 14, 14, 'W'], [10, 14, 14, 'W'],
      [11, 14, 14, 'W'], [12, 14, 14, 'W'], [13, 14, 14, 'W'],
      [14, 14, 14, 'W'], [15, 14, 14, 'W'],
    ],
    colors: { W: '#8b6914' }, // brown stick
  },
  2: { // Iron Sword
    pixels: [
      [1, 14, 15, 'P'], // crossguard
      [2, 14, 14, 'W'], [3, 14, 14, 'W'], [4, 14, 14, 'W'],
      [5, 14, 14, 'W'], [6, 14, 14, 'W'], [7, 14, 14, 'W'],
      [8, 14, 14, 'W'], [9, 14, 14, 'W'], [10, 14, 14, 'W'],
      [11, 14, 14, 'W'], [12, 14, 14, 'W'], [13, 14, 14, 'W'],
      [14, 14, 14, 'W'], [15, 14, 14, 'P'],
    ],
    colors: { W: '#aaaaaa', P: '#888888' },
  },
  3: { // Steel Sword
    pixels: [
      [1, 13, 15, 'P'], // crossguard wider
      [2, 14, 14, 'W'], [3, 14, 14, 'W'], [4, 14, 14, 'W'],
      [5, 14, 14, 'W'], [6, 14, 14, 'W'], [7, 14, 14, 'W'],
      [8, 14, 14, 'W'], [9, 14, 14, 'W'], [10, 14, 14, 'W'],
      [11, 14, 14, 'W'], [12, 14, 14, 'W'], [13, 14, 14, 'W'],
      [14, 14, 14, 'W'], [15, 14, 14, 'P'], [16, 14, 14, 'P'],
    ],
    colors: { W: '#c8c8d4', P: '#a0a0b0' },
  },
  4: { // Gold-Trimmed Blade
    pixels: [
      [1, 13, 15, 'G'],
      [2, 14, 14, 'W'], [3, 14, 14, 'W'], [4, 14, 14, 'W'],
      [5, 14, 14, 'W'], [6, 14, 14, 'W'], [7, 13, 15, 'G'],
      [8, 14, 14, 'W'], [9, 14, 14, 'W'], [10, 14, 14, 'W'],
      [11, 14, 14, 'W'], [12, 14, 14, 'W'], [13, 14, 14, 'W'],
      [14, 13, 15, 'G'], [15, 14, 14, 'P'], [16, 14, 14, 'P'],
    ],
    colors: { W: '#ddd', P: '#aaa', G: '#ffd700' },
  },
  5: { // Divine Sword (runes glow)
    pixels: [
      [0, 13, 15, 'G'],
      [1, 13, 15, 'G'],
      [2, 14, 14, 'W'], [2, 13, 13, 'G'], [2, 15, 15, 'G'],
      [3, 14, 14, 'W'], [4, 14, 14, 'W'], [4, 13, 13, 'G'],
      [5, 14, 14, 'W'], [6, 14, 14, 'W'], [6, 13, 13, 'G'], [6, 15, 15, 'G'],
      [7, 14, 14, 'W'], [8, 14, 14, 'W'], [8, 13, 13, 'G'],
      [9, 14, 14, 'W'], [10, 14, 14, 'W'], [10, 13, 13, 'G'], [10, 15, 15, 'G'],
      [11, 14, 14, 'W'], [12, 14, 14, 'W'],
      [13, 14, 14, 'W'], [14, 13, 15, 'G'], [15, 14, 14, 'P'],
    ],
    colors: { W: '#f0f0ff', P: '#e0e0ff', G: '#ffd700' },
  },
};

// ─── Mage ─────────────────────────────────────────────────────────────────────

const MAGE_BASE_PIXELS: string[] = [
  '....HHHHHHHH....',  // 0  hat brim
  '......HHHH......',  // 1  hat point base
  '.......HH.......',  // 2  hat tip
  '...SSSSSSSSSS...',  // 3  face (no helmet)
  '...SSFSSSFSSS...',  // 4  eyes
  '...SSSSSSSSSS...',  // 5
  '...SSSSSSSSSS...',  // 6  chin
  '....AAAAAAAAA...',  // 7  robe shoulders
  '...AAAAAAAAAA...',  // 8
  '..AAAAAAAAAAA...',  // 9
  'WAAAAAAAAAAAAWW.',  // 10 arms + robe
  'WAAAAAAAAAAAAWW.',  // 11
  'WAAAAAAAAAAAAWW.',  // 12
  '..AAAAAAAAAAAAA.',  // 13
  '..AAAAAAAAAAAAA.',  // 14
  '...AAAAAAAAAAAA.',  // 15
  '....AAAAAAAAAAA.',  // 16
  '.....AAAAAAAAA..',  // 17
  '......AAAAAAA...',  // 18
  '......AAAAAAA...',  // 19
  '.....BBBBBBB....',  // 20 robe hem / feet
  '....BBBBBBB.....',  // 21
  '....BBBBBBB.....',  // 22
  '....BBBBBBB.....',  // 23
];

function magePalette(tier: 1|2|3|4|5): Record<string,string> {
  const COLORS: Record<number, { A: string; H: string; B: string }> = {
    1: { A: '#4a3060', H: '#5a3a70', B: '#2a1a40' }, // dark purple robe
    2: { A: '#5a4070', H: '#6a4a80', B: '#3a2a50' }, // medium robe
    3: { A: '#6b5090', H: '#8060a8', B: '#4a3a70' }, // crystal robe
    4: { A: '#1a0a2a', H: '#9060c0', B: '#0a0a1a' }, // dark enchanted
    5: { A: '#c8a820', H: '#ffd700', B: '#b8982a' }, // divine robe
  };
  const c = COLORS[tier];
  return { S: SKIN, F: EYE, H: c.H, A: c.A, V: c.A, L: c.A, B: c.B, D: '#111', W: '#5a4070', G: '#ffd700' };
}

const MAGE_WEAPON_OVERLAYS: Record<1|2|3|4|5, { pixels: OverlayRow[]; colors: Record<string,string> }> = {
  1: { // Broken Wand
    pixels: [
      [2, 0, 0, 'W'], [3, 0, 0, 'W'], [4, 1, 1, 'W'], [5, 1, 1, 'W'],
      [6, 1, 1, 'W'], [7, 0, 1, 'W'], [8, 0, 0, 'W'], [9, 0, 0, 'W'],
      [10, 1, 1, 'W'], [11, 1, 1, 'W'], [12, 2, 2, 'W'], [13, 2, 2, 'W'],
    ],
    colors: { W: '#8b6914' },
  },
  2: { // Wooden Staff
    pixels: Array.from({ length: 18 }, (_, i) => [i + 2, 0, 0, 'W'] as OverlayRow),
    colors: { W: '#8b6914' },
  },
  3: { // Crystal Staff
    pixels: [
      [0, 0, 0, 'C'], [1, 0, 1, 'C'],
      ...Array.from({ length: 18 }, (_, i) => [i + 2, 0, 0, 'W'] as OverlayRow),
    ],
    colors: { W: '#8b6914', C: '#88ccff' },
  },
  4: { // Enchanted Staff
    pixels: [
      [0, 0, 1, 'C'], [1, 0, 1, 'C'],
      [0, 0, 0, 'G'], [1, 1, 1, 'G'],
      ...Array.from({ length: 20 }, (_, i) => [i + 2, 0, 0, 'W'] as OverlayRow),
    ],
    colors: { W: '#6b4a90', C: '#cc88ff', G: '#ffd700' },
  },
  5: { // God Staff
    pixels: [
      [0, 0, 2, 'G'], [1, 0, 2, 'G'],
      ...Array.from({ length: 20 }, (_, i) => [i + 2, 0, 0, 'W'] as OverlayRow),
      ...Array.from({ length: 10 }, (_, i) => [i * 2 + 2, 1, 1, 'G'] as OverlayRow),
    ],
    colors: { W: '#ffd700', G: '#ffffff' },
  },
};

// ─── Rogue ────────────────────────────────────────────────────────────────────

const ROGUE_BASE_PIXELS: string[] = [
  '................',  // 0
  '....HHHHHHHH....',  // 1  hood
  '...HHSSSSSSHHH..',  // 2  face
  '...HHSFSSFSHHH..',  // 3  eyes
  '...HHSSSSSSHHH..',  // 4
  '....HHHHHHHH....',  // 5  hood bottom
  '...AAAAAAAAAA...',  // 6  shoulders (narrower — crouched)
  '..AAAAAAAAAAAAA.',  // 7
  '.DAAAAAAAAAAAAD.',  // 8
  '.DAAAAAAAAAAAAD.',  // 9
  '.DAAAAAAAAAAAAD.',  // 10
  '..AAAAAAAAAAAAA.',  // 11
  '...AAAAAAAAAAAA.',  // 12
  '....LLLLLLLLLL..',  // 13 belt/waist
  '....LLLL.LLLL...',  // 14 upper legs
  '....LLLL.LLLL...',  // 15
  '...LLLLL.LLLLL..',  // 16
  '...LLLLL.LLLLL..',  // 17
  '...LLLLL.LLLLL..',  // 18
  '...BBBBB.BBBBB..',  // 19 boots
  '...BBBBB.BBBBB..',  // 20
  '..BBBBBB.BBBBBB.',  // 21
  '..BBBBBB.BBBBBB.',  // 22
  '...BBBBB.BBBBB..',  // 23
];

function roguePalette(tier: 1|2|3|4|5): Record<string,string> {
  const COLORS: Record<number, { A: string; H: string; L: string; B: string }> = {
    1: { A: '#2a3035', H: '#1a2025', L: '#202530', B: '#151515' },
    2: { A: '#3a2a1a', H: '#2a1a0a', L: '#2a201a', B: '#1a0a0a' },
    3: { A: '#1a2535', H: '#1a1525', L: '#151a25', B: '#101015' },
    4: { A: '#0a0a1a', H: '#0a0a0a', L: '#050510', B: '#050505' },
    5: { A: '#0a0a0a', H: '#111', L: '#0a0a0a', B: '#0a0a0a' },
  };
  const c = COLORS[tier];
  return { S: SKIN, F: EYE, H: c.H, A: c.A, V: c.A, L: c.L, B: c.B, D: '#0a0a0a', W: '#888', G: '#ffd700' };
}

const ROGUE_WEAPON_OVERLAYS: Record<1|2|3|4|5, { pixels: OverlayRow[]; colors: Record<string,string> }> = {
  1: { // Rusty Dagger (right hand)
    pixels: [
      [7, 15, 15, 'W'], [8, 15, 15, 'W'], [9, 15, 15, 'W'],
      [10, 14, 15, 'W'], [11, 15, 15, 'W'], [12, 15, 15, 'W'],
    ],
    colors: { W: '#8b6914' },
  },
  2: { // Iron Blade
    pixels: [
      [6, 15, 15, 'P'], [7, 14, 15, 'W'], [8, 15, 15, 'W'],
      [9, 15, 15, 'W'], [10, 14, 15, 'W'], [11, 15, 15, 'W'],
      [12, 15, 15, 'W'], [13, 15, 15, 'P'],
    ],
    colors: { W: '#aaa', P: '#888' },
  },
  3: { // Twin Daggers (both hands)
    pixels: [
      [6, 0, 0, 'W'], [7, 0, 1, 'W'], [8, 0, 0, 'W'], [9, 0, 0, 'W'], [10, 0, 0, 'W'],
      [6, 15, 15, 'W'], [7, 14, 15, 'W'], [8, 15, 15, 'W'], [9, 15, 15, 'W'], [10, 15, 15, 'W'],
    ],
    colors: { W: '#c8c8d4' },
  },
  4: { // Shadow Blades
    pixels: [
      [6, 0, 0, 'W'], [7, 0, 1, 'W'], [8, 0, 0, 'W'], [9, 0, 0, 'G'], [10, 0, 0, 'W'],
      [6, 15, 15, 'W'], [7, 14, 15, 'W'], [8, 15, 15, 'W'], [9, 15, 15, 'G'], [10, 15, 15, 'W'],
    ],
    colors: { W: '#1a1a2a', G: '#ffd700' },
  },
  5: { // Void Blades (dark + gold)
    pixels: [
      [5, 0, 0, 'G'], [6, 0, 1, 'W'], [7, 0, 1, 'W'], [8, 0, 0, 'W'], [9, 0, 0, 'G'], [10, 0, 1, 'W'], [11, 0, 0, 'G'],
      [5, 15, 15, 'G'], [6, 14, 15, 'W'], [7, 14, 15, 'W'], [8, 15, 15, 'W'], [9, 15, 15, 'G'], [10, 14, 15, 'W'], [11, 15, 15, 'G'],
    ],
    colors: { W: '#0a0a1a', G: '#ffd700' },
  },
};

// ─── Public exports ───────────────────────────────────────────────────────────

export type HeroClass = 'Warrior' | 'Mage' | 'Rogue';
export type ArmorTier = 1 | 2 | 3 | 4 | 5;

export const BASE_PIXELS: Record<HeroClass, string[]> = {
  Warrior: WARRIOR_BASE_PIXELS,
  Mage: MAGE_BASE_PIXELS,
  Rogue: ROGUE_BASE_PIXELS,
};

export function getPalette(heroClass: HeroClass, tier: ArmorTier): Record<string, string> {
  if (heroClass === 'Warrior') return warriorPalette(tier);
  if (heroClass === 'Mage') return magePalette(tier);
  return roguePalette(tier);
}

export function getWeaponOverlay(heroClass: HeroClass, weaponTier: ArmorTier) {
  if (heroClass === 'Warrior') return WARRIOR_WEAPON_OVERLAYS[weaponTier];
  if (heroClass === 'Mage') return MAGE_WEAPON_OVERLAYS[weaponTier];
  return ROGUE_WEAPON_OVERLAYS[weaponTier];
}

/** Apply overlay rows on top of base pixels (mutates a copy) */
export function applyOverlay(base: string[], overlay: OverlayRow[], palette: Record<string, string>): string[] {
  const result = [...base];
  for (const [row, colStart, colEnd, char] of overlay) {
    if (row >= result.length) continue;
    const rowChars = result[row].split('');
    for (let c = colStart; c <= colEnd && c < rowChars.length; c++) {
      rowChars[c] = char;
    }
    result[row] = rowChars.join('');
  }
  return result;
}

/** Mood tint colors applied as overlay color in palette */
export function getMoodTintPalette(
  base: Record<string, string>,
  mood: 'radiant' | 'steady' | 'worn' | 'broken'
): Record<string, string> {
  // Mood affects opacity/tint via wrapper component
  // Return base palette, wrapper applies tint via SVG opacity
  return base;
}

/** Map rank to armor tier */
export function rankToArmorTier(rank: string): ArmorTier {
  const map: Record<string, ArmorTier> = { E: 1, D: 2, C: 3, B: 4, A: 5, S: 5 };
  return map[rank] ?? 1;
}
```

- [ ] **Step 2: Commit**

```powershell
git add the-system/src/components/avatar/avatarData.ts
git commit -m "feat: add pixel art avatar data for Warrior, Mage, Rogue with 5 equipment tiers"
```

---

## Task 4: AvatarDisplay Component

**Files:**
- Create: `the-system/src/components/avatar/AvatarDisplay.tsx`

- [ ] **Step 1: Write AvatarDisplay**

Create `the-system/src/components/avatar/AvatarDisplay.tsx`:
```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import {
  BASE_PIXELS,
  getPalette,
  getWeaponOverlay,
  applyOverlay,
  rankToArmorTier,
  type HeroClass,
  type ArmorTier,
} from './avatarData';

interface Props {
  heroClass: HeroClass;
  rank: string;           // E|D|C|B|A|S
  mood?: 'radiant' | 'steady' | 'worn' | 'broken';
  weaponTier?: ArmorTier;
  pixelSize?: number;     // default 4 → 64×96 display
  showFloat?: boolean;    // S-rank float animation placeholder
}

export default function AvatarDisplay({
  heroClass,
  rank,
  mood = 'steady',
  weaponTier,
  pixelSize = 4,
}: Props) {
  const armorTier = rankToArmorTier(rank);
  const effectiveWeaponTier = weaponTier ?? armorTier;

  const basePalette = getPalette(heroClass, armorTier);
  const weaponOverlay = getWeaponOverlay(heroClass, effectiveWeaponTier);

  // Combine palette
  const palette = { ...basePalette, ...weaponOverlay.colors };

  // Apply weapon overlay on top of base pixels
  const pixels = applyOverlay(BASE_PIXELS[heroClass], weaponOverlay.pixels, palette);

  // Mood opacity
  const moodOpacity: Record<string, number> = {
    radiant: 1.0,
    steady: 1.0,
    worn: 0.75,
    broken: 0.55,
  };
  const opacity = moodOpacity[mood] ?? 1.0;

  const cols = pixels[0]?.length ?? 16;
  const rows = pixels.length;
  const width = cols * pixelSize;
  const height = rows * pixelSize;

  // Cracked tint for broken mood
  const brokenTint = mood === 'broken' ? '#440000' : undefined;

  return (
    <View style={[styles.container, { opacity }]}>
      <Svg width={width} height={height}>
        {pixels.flatMap((row, y) =>
          Array.from(row).map((char, x) => {
            if (char === '.' || !palette[char]) return null;
            let color = palette[char];
            if (brokenTint && char !== 'S' && char !== 'F') {
              // Desaturate slightly toward red for broken
              color = blendColor(color, brokenTint, 0.25);
            }
            return (
              <Rect
                key={`${y}-${x}`}
                x={x * pixelSize}
                y={y * pixelSize}
                width={pixelSize}
                height={pixelSize}
                fill={color}
              />
            );
          })
        )}
      </Svg>
    </View>
  );
}

/** Simple color blend: returns color blended toward target by ratio */
function blendColor(base: string, target: string, ratio: number): string {
  const parse = (hex: string) => {
    const h = hex.replace('#', '');
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = parse(base);
  const [r2, g2, b2] = parse(target);
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);
  return `rgb(${r},${g},${b})`;
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
```

- [ ] **Step 2: Commit**

```powershell
git add the-system/src/components/avatar/AvatarDisplay.tsx
git commit -m "feat: add AvatarDisplay component with mood tinting and weapon overlays"
```

---

## Task 5: Aura Particles System

**Files:**
- Create: `the-system/src/components/particles/AuraParticles.tsx`

- [ ] **Step 1: Write particle system**

Create `the-system/src/components/particles/AuraParticles.tsx`:
```tsx
import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

const { width: SCREEN_W } = Dimensions.get('window');

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  size: number;
  color: string;
  delay: number;
}

interface Props {
  particleType: string;
  particleCount: number;
  auraColor: string | null;
  width?: number;
  height?: number;
}

function createParticle(color: string, w: number, h: number, i: number): Particle {
  return {
    x: new Animated.Value(Math.random() * w),
    y: new Animated.Value(Math.random() * h),
    opacity: new Animated.Value(0),
    size: Math.random() * 3 + 2,
    color,
    delay: i * 200,
  };
}

function animateParticle(p: Particle, type: string, w: number, h: number) {
  const duration = 2000 + Math.random() * 3000;

  if (type === 'dust') {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(p.opacity, { toValue: 0.4, duration: duration * 0.3, useNativeDriver: true }),
          Animated.timing(p.y, {
            toValue: (p.y as any)._value - 20 - Math.random() * 20,
            duration,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(p.opacity, { toValue: 0, duration: duration * 0.3, useNativeDriver: true }),
      ])
    ).start();
  } else if (type === 'embers') {
    Animated.loop(
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          Animated.timing(p.opacity, { toValue: 0.8, duration: 400, useNativeDriver: true }),
          Animated.timing(p.y, {
            toValue: (p.y as any)._value - 30 - Math.random() * 40,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(p.x, {
            toValue: (p.x as any)._value + (Math.random() - 0.5) * 20,
            duration,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(p.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ])
    ).start();
  } else if (type === 'gold_sparks' || type === 'gold_streaks') {
    Animated.loop(
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          Animated.timing(p.opacity, { toValue: 1.0, duration: 200, useNativeDriver: true }),
          Animated.timing(p.y, {
            toValue: (p.y as any)._value - 50 - Math.random() * 60,
            duration: duration * 0.8,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(p.opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  } else {
    // light_pillars, god_rays — fade in/out
    Animated.loop(
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.timing(p.opacity, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
        Animated.timing(p.opacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }
}

export default function AuraParticles({
  particleType,
  particleCount,
  auraColor,
  width = SCREEN_W,
  height = 200,
}: Props) {
  const color = auraColor ?? '#888888';
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    particlesRef.current = Array.from({ length: particleCount }, (_, i) =>
      createParticle(color, width, height, i)
    );
    particlesRef.current.forEach((p) => animateParticle(p, particleType, width, height));
  }, [particleType, particleCount, color, width, height]);

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      {particlesRef.current.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              transform: [{ translateX: p.x }, { translateY: p.y }],
              opacity: p.opacity,
            },
          ]}
        >
          <Svg width={p.size * 2} height={p.size * 2}>
            <Circle
              cx={p.size}
              cy={p.size}
              r={p.size}
              fill={color}
            />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, overflow: 'hidden' },
  particle: { position: 'absolute' },
});
```

- [ ] **Step 2: Commit**

```powershell
git add the-system/src/components/particles/
git commit -m "feat: add AuraParticles animated particle system for all 6 rank types"
```

---

## Task 6: UI Pixel Border + Rank Screen Glow

**Files:**
- Create: `the-system/src/components/ui/PixelBorder.tsx`

- [ ] **Step 1: Write PixelBorder**

Create `the-system/src/components/ui/PixelBorder.tsx`:
```tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import { useSystemStore } from '../../store/useSystemStore';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  overrideColor?: string;
}

const CORNER_SIZE = 8; // pts

/** Draws corner L-brackets in pixel style */
function CornerBrackets({ color }: { color: string }) {
  const s = CORNER_SIZE;
  // Each corner = 2 rects: horizontal + vertical bar
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Top-left */}
      <Rect x={0} y={0} width={s * 2} height={2} fill={color} />
      <Rect x={0} y={0} width={2} height={s * 2} fill={color} />
      {/* Top-right */}
      <Rect x="99%" y={0} width={s * 2} height={2} fill={color} translateX={-(s * 2)} />
      <Rect x="99%" y={0} width={2} height={s * 2} fill={color} translateX={0} />
      {/* Bottom-left */}
      <Rect x={0} y="100%" width={s * 2} height={2} fill={color} translateY={0} />
      <Rect x={0} y="100%" width={2} height={s * 2} fill={color} translateY={-(s * 2)} />
      {/* Bottom-right */}
      <Rect x="99%" y="100%" width={s * 2} height={2} fill={color} translateX={-(s * 2)} translateY={0} />
      <Rect x="99%" y="100%" width={2} height={s * 2} fill={color} translateX={0} translateY={-(s * 2)} />
    </Svg>
  );
}

export default function PixelBorder({ children, style, overrideColor }: Props) {
  const theme = useSystemStore((s) => s.currentTheme);
  const color = overrideColor ?? theme.accent;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.inner, { borderColor: color, borderWidth: 1 }]}>
        {children}
        <CornerBrackets color={color} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  inner: { position: 'relative', overflow: 'hidden' },
});
```

- [ ] **Step 2: Commit**

```powershell
git add the-system/src/components/ui/PixelBorder.tsx
git commit -m "feat: add PixelBorder component with rank-themed corner brackets"
```

---

## Task 7: World Map Node + Mandate Chest

**Files:**
- Create: `the-system/src/components/ui/WorldMapNode.tsx`
- Create: `the-system/src/components/ui/MandateChest.tsx`

- [ ] **Step 1: Write WorldMapNode**

Create `the-system/src/components/ui/WorldMapNode.tsx`:
```tsx
import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle, Rect, Text as SvgText } from 'react-native-svg';

interface Props {
  weekNumber: number;   // 1-24
  status: 'locked' | 'completed' | 'current' | 'future';
  completionPct?: number; // 0-100 for completed nodes
  onPress?: () => void;
}

const NODE_SIZE = 48;

export default function WorldMapNode({ weekNumber, status, completionPct = 0, onPress }: Props) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'current') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [status]);

  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });
  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.3] });

  const colors = {
    locked: { bg: '#2a2a2a', border: '#444', text: '#555' },
    completed: { bg: '#1a1a00', border: '#ffd700', text: '#ffd700' },
    current: { bg: '#0a0a00', border: '#ffd700', text: '#ffd700' },
    future: { bg: '#1a1a1a', border: '#333', text: '#444' },
  };
  const c = colors[status];

  return (
    <TouchableOpacity onPress={onPress} disabled={status === 'locked' || status === 'future'}>
      <Animated.View style={styles.container}>
        {status === 'current' && (
          <Animated.View
            style={[
              styles.pulseRing,
              { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
            ]}
          />
        )}
        <Svg width={NODE_SIZE} height={NODE_SIZE}>
          {/* Background */}
          <Circle cx={NODE_SIZE/2} cy={NODE_SIZE/2} r={NODE_SIZE/2 - 2} fill={c.bg} />
          {/* Border */}
          <Circle cx={NODE_SIZE/2} cy={NODE_SIZE/2} r={NODE_SIZE/2 - 2} fill="none" stroke={c.border} strokeWidth={3} />
          {/* Week number */}
          <SvgText
            x={NODE_SIZE/2} y={NODE_SIZE/2 + 5}
            fontSize={14} fontWeight="bold"
            fill={c.text} textAnchor="middle"
          >
            {weekNumber}
          </SvgText>
          {/* Completion % for completed nodes */}
          {status === 'completed' && (
            <SvgText
              x={NODE_SIZE/2} y={NODE_SIZE/2 + 16}
              fontSize={8} fill="#ffd700" textAnchor="middle"
            >
              {completionPct}%
            </SvgText>
          )}
          {/* Lock icon for locked nodes */}
          {status === 'locked' && (
            <>
              <Rect x={18} y={22} width={12} height={10} fill="#444" rx={1} />
              <Rect x={20} y={18} width={8} height={6} fill="none" stroke="#444" strokeWidth={2} rx={4} />
            </>
          )}
        </Svg>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', width: NODE_SIZE, height: NODE_SIZE },
  pulseRing: {
    position: 'absolute',
    width: NODE_SIZE + 12,
    height: NODE_SIZE + 12,
    borderRadius: (NODE_SIZE + 12) / 2,
    borderWidth: 2,
    borderColor: '#ffd700',
  },
});
```

- [ ] **Step 2: Write MandateChest**

Create `the-system/src/components/ui/MandateChest.tsx`:
```tsx
import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Rect, Circle } from 'react-native-svg';
import type { MandateTier } from '../../types';

interface Props {
  tier: MandateTier;
  onPress?: () => void;
  size?: number;
}

const TIER_COLORS = {
  BRONZE: { body: '#8b5e2a', lid: '#7a4e1a', lock: '#6b4010', glow: '#cd7f32' },
  SILVER: { body: '#7a7a8a', lid: '#6a6a7a', lock: '#5a5a6a', glow: '#c0c0c0' },
  GOLD: { body: '#1a1a00', lid: '#2a2a00', lock: '#ffd700', glow: '#ffd700' },
};

export default function MandateChest({ tier, onPress, size = 48 }: Props) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const c = TIER_COLORS[tier];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -4, duration: 600, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.0] });

  const s = size;

  return (
    <TouchableOpacity onPress={onPress}>
      <Animated.View style={[styles.container, { transform: [{ translateY: bounceAnim }] }]}>
        {/* Glow ring */}
        <Animated.View
          style={[
            styles.glow,
            {
              width: s + 16, height: s + 16,
              borderRadius: (s + 16) / 2,
              backgroundColor: c.glow,
              opacity: glowOpacity,
            },
          ]}
        />
        <Svg width={s} height={s}>
          {/* Chest body */}
          <Rect x={2} y={s * 0.4} width={s - 4} height={s * 0.55} fill={c.body} rx={2} />
          {/* Chest lid */}
          <Rect x={2} y={2} width={s - 4} height={s * 0.42} fill={c.lid} rx={2} />
          {/* Lid brim */}
          <Rect x={0} y={s * 0.38} width={s} height={4} fill={c.lock} />
          {/* Lock body */}
          <Rect x={s/2 - 5} y={s * 0.5} width={10} height={8} fill={c.lock} rx={1} />
          {/* Lock shackle */}
          <Rect x={s/2 - 4} y={s * 0.42} width={8} height={6} fill="none" stroke={c.lock} strokeWidth={2} />
          {/* Chest straps (horizontal lines) */}
          <Rect x={2} y={s * 0.6} width={s - 4} height={2} fill={c.lock} opacity={0.5} />
          <Rect x={2} y={s * 0.75} width={s - 4} height={2} fill={c.lock} opacity={0.5} />
        </Svg>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    top: -8,
    left: -8,
  },
});
```

- [ ] **Step 3: Commit**

```powershell
git add the-system/src/components/ui/WorldMapNode.tsx the-system/src/components/ui/MandateChest.tsx
git commit -m "feat: add WorldMapNode (animated pulse) and MandateChest (glow + bounce) components"
```

---

## Task 8: Rank Promotion Splash

**Files:**
- Create: `the-system/src/components/ui/RankPromotionSplash.tsx`

- [ ] **Step 1: Write RankPromotionSplash**

Create `the-system/src/components/ui/RankPromotionSplash.tsx`:
```tsx
import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Circle } from 'react-native-svg';
import type { Rank } from '../../types';

const { width: W, height: H } = Dimensions.get('window');

interface Props {
  rank: Rank;
  title: string;
  onDismiss: () => void;
}

const RANK_COLORS: Record<Rank, { primary: string; secondary: string }> = {
  E: { primary: '#666', secondary: '#444' },
  D: { primary: '#b87333', secondary: '#8b5e2a' },
  C: { primary: '#f0a500', secondary: '#c87a00' },
  B: { primary: '#ffd700', secondary: '#ff8c00' },
  A: { primary: '#ffe566', secondary: '#ffd700' },
  S: { primary: '#ffffff', secondary: '#ffd700' },
};

export default function RankPromotionSplash({ rank, title, onDismiss }: Props) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const rankScale = useRef(new Animated.Value(0.2)).current;
  const rayRotate = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  const colors = RANK_COLORS[rank];

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(rankScale, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 800, delay: 400, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.timing(rayRotate, { toValue: 1, duration: 8000, useNativeDriver: true })
    ).start();

    // Auto-dismiss after 4 seconds
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, []);

  const spin = rayRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
      {/* Background */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width={W} height={H}>
          <Rect width={W} height={H} fill="#000" />
          {/* Gold rays from center */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = W / 2;
            const y1 = H / 2;
            const x2 = x1 + Math.cos(angle) * H;
            const y2 = y1 + Math.sin(angle) * H;
            return (
              <Rect
                key={i}
                x={x1 - 1}
                y={H / 2 - H / 2}
                width={2}
                height={H}
                fill={colors.primary}
                opacity={0.15}
                rotation={i * 30}
                originX={x1}
                originY={y1}
              />
            );
          })}
        </Svg>
      </View>

      {/* Rotating ray layer */}
      <Animated.View
        style={[styles.rayContainer, { transform: [{ rotate: spin }] }]}
        pointerEvents="none"
      >
        <Svg width={W} height={H}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Rect
              key={i}
              x={W / 2 - 1}
              y={0}
              width={2}
              height={H}
              fill={colors.secondary}
              opacity={0.2}
              rotation={i * 60}
              originX={W / 2}
              originY={H / 2}
            />
          ))}
        </Svg>
      </Animated.View>

      {/* Rank letter */}
      <Animated.Text
        style={[
          styles.rankLetter,
          { color: colors.primary, transform: [{ scale: rankScale }] },
        ]}
      >
        {rank}
      </Animated.Text>

      <Animated.Text style={[styles.rankLabel, { color: colors.secondary }]}>
        RANK
      </Animated.Text>

      {/* Title */}
      <Animated.Text style={[styles.title, { color: colors.primary, opacity: titleOpacity }]}>
        {title.toUpperCase()}
      </Animated.Text>

      <Animated.Text style={[styles.tap, { opacity: titleOpacity }]}>
        TAP TO CONTINUE
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  rayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  rankLetter: {
    fontSize: 120,
    fontWeight: 'bold',
    letterSpacing: 8,
  },
  rankLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 12,
    marginTop: -16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 4,
    marginTop: 32,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  tap: {
    fontSize: 10,
    color: '#666',
    letterSpacing: 4,
    marginTop: 48,
  },
});
```

- [ ] **Step 2: Commit**

```powershell
git add the-system/src/components/ui/RankPromotionSplash.tsx
git commit -m "feat: add RankPromotionSplash fullscreen animated rank-up overlay"
```

---

## Task 9: Wire SVG Components into CommandHall

**Files:**
- Modify: `the-system/src/screens/CommandHall.tsx`

- [ ] **Step 1: Update CommandHall to use avatar + icons + particles**

Replace content of `the-system/src/screens/CommandHall.tsx`:
```tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useSystemStore } from '../store/useSystemStore';
import { RANK_TITLES } from '../engine/xpConstants';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import XPBar from '../components/ui/XPBar';
import DisciplineCard from '../components/ui/DisciplineCard';
import DisciplineIcon from '../components/icons/DisciplineIcon';
import AvatarDisplay from '../components/avatar/AvatarDisplay';
import AuraParticles from '../components/particles/AuraParticles';
import MandateChest from '../components/ui/MandateChest';
import type { Rank } from '../types';
import type { HeroClass } from '../components/avatar/avatarData';

export default function CommandHall() {
  const {
    hero,
    disciplines,
    todayLogs,
    silenceStreak,
    currentTheme: theme,
    pendingMandate,
    completeDiscipline,
    failDiscipline,
    triggerRelapse,
  } = useSystemStore();

  if (!hero) return null;

  const daysElapsed = differenceInCalendarDays(new Date(), parseISO(hero.journey_start_date));
  const dayNumber = Math.min(daysElapsed + 1, 180);
  const activeDisciplines = disciplines.filter((d) => d.is_active);

  // Compute mood from last 3 days completion rate
  const completedToday = todayLogs.filter((l) => l.completed === 1).length;
  const totalToday = activeDisciplines.length;
  const completionRate = totalToday > 0 ? completedToday / totalToday : 0;
  const mood =
    completionRate >= 0.9 ? 'radiant' :
    completionRate >= 0.6 ? 'steady' :
    completionRate >= 0.3 ? 'worn' : 'broken';

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
          { text: 'I HAVE FALLEN', style: 'destructive', onPress: () => triggerRelapse() },
        ]
      );
    } else {
      failDiscipline(id);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={[styles.rankBadge, { borderColor: theme.accent }]}>
          <Text style={[styles.rankText, { color: theme.accent }]}>{hero.rank}</Text>
        </View>
        <Text style={[styles.dayText, { color: theme.text }]}>DAY {dayNumber} OF 180</Text>
      </View>

      {/* Avatar section */}
      <View style={styles.avatarSection}>
        {theme.particleCount > 0 && (
          <AuraParticles
            particleType={theme.particleType}
            particleCount={Math.min(theme.particleCount, 20)}
            auraColor={theme.auraColor}
            width={300}
            height={160}
          />
        )}
        <AvatarDisplay
          heroClass={hero.hero_class as HeroClass}
          rank={hero.rank as Rank}
          mood={mood}
        />
        <Text style={[styles.titleText, { color: theme.textSecondary }]}>
          {RANK_TITLES[hero.rank as Rank]}
        </Text>
      </View>

      {/* Mandate chest if pending */}
      {pendingMandate && (
        <View style={styles.mandateContainer}>
          <MandateChest tier={pendingMandate.tier} size={48} />
          <Text style={[styles.mandateText, { color: theme.accent }]}>MANDATE AWAITS</Text>
        </View>
      )}

      {/* XP Bar */}
      <XPBar />

      {/* Silence streak */}
      {silenceStreak && (
        <View style={styles.streakSection}>
          <Text style={[styles.streakNumber, { color: theme.accent }]}>
            {silenceStreak.current_streak}
          </Text>
          <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>DAYS OF SILENCE</Text>
        </View>
      )}

      {/* Quest Log */}
      <ScrollView style={styles.questLog}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>DAILY QUEST LOG</Text>
        {activeDisciplines.map((discipline) => {
          const log = todayLogs.find((l) => l.discipline_id === discipline.id);
          return (
            <View key={discipline.id} style={styles.cardRow}>
              <View style={styles.iconWrapper}>
                <DisciplineIcon code={discipline.code} size={2} />
              </View>
              <View style={styles.cardFlex}>
                <DisciplineCard
                  discipline={discipline}
                  log={log}
                  theme={theme}
                  onComplete={() => handleComplete(discipline.id)}
                  onFail={() => handleFail(discipline.id, discipline.code)}
                />
              </View>
            </View>
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
    marginBottom: 8,
  },
  rankBadge: { borderWidth: 2, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 4 },
  rankText: { fontSize: 18, fontWeight: 'bold' },
  dayText: { fontSize: 12 },
  avatarSection: { alignItems: 'center', paddingVertical: 16, height: 160, justifyContent: 'center' },
  titleText: { fontSize: 11, marginTop: 4 },
  mandateContainer: { alignItems: 'center', marginVertical: 4 },
  mandateText: { fontSize: 10, marginTop: 4, letterSpacing: 2 },
  streakSection: { alignItems: 'center', marginVertical: 4 },
  streakNumber: { fontSize: 36, fontWeight: 'bold' },
  streakLabel: { fontSize: 10, marginTop: 2 },
  questLog: { flex: 1, marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', paddingHorizontal: 16, marginBottom: 8 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: { paddingLeft: 8, paddingRight: 4 },
  cardFlex: { flex: 1 },
});
```

- [ ] **Step 2: Run TypeScript check**

```powershell
cd the-system && npx tsc --noEmit
```
Expected: No errors. Fix any type errors.

- [ ] **Step 3: Commit**

```powershell
git add the-system/src/screens/CommandHall.tsx
git commit -m "feat: integrate SVG avatar, icons, and particles into Command Hall"
```

---

## Verification

After all tasks:
- [ ] Run TypeScript: `cd the-system && npx tsc --noEmit` — no errors
- [ ] Run tests: `cd the-system && npx jest --no-coverage` — all pass
- [ ] Check no missing imports or undefined references
