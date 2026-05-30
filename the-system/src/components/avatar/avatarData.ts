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

const WARRIOR_BASE_PIXELS: string[] = [
  '....HHHHHHHH....',  // 0  helmet
  '....HHHHHHHH....',  // 1
  '...HHSSSSSSHHH..',  // 2  face
  '...HHSFSSFSHHH..',  // 3  eyes (F=eye detail) 16 chars
  '...HHSSSSSSHHH..',  // 4
  '....HHHHHHHH....',  // 5  helmet bottom
  '..DAAAAAAAAAAD..',  // 6  shoulders
  '..AAAAAAAAAAAAAA',  // 7
  'DAAAAAAAAAAAAAAD',  // 8
  'DAAAAAAAAAAAAAAD',  // 9
  'DAAAAAAAAAAAAAAD',  // 10
  'DAAAAAAAAAAAAAAD',  // 11
  '..AAAAAAAAAAAAAD',  // 12
  '...VVVVVVVVVVVV.',  // 13 belt
  '...LLLLL.LLLLLL.',  // 14
  '...LLLLL.LLLLLL.',  // 15
  '..LLLLLL.LLLLL..',  // 16
  '..LLLLLL.LLLLL..',  // 17
  '..LLLLLL.LLLLL..',  // 18
  '..BBBBB...BBBBB.',  // 19 boots
  '..BBBBB...BBBBB.',  // 20
  '.BBBBBB...BBBBBB',  // 21
  '.BBBBBB...BBBBBB',  // 22
  '..BBBBB...BBBBB.',  // 23
];

// ─── Palette by rank tier (armor changes color) ──────────────────────────────

function warriorPalette(armorTier: 1|2|3|4|5): Record<string,string> {
  const ARMOR_COLORS: Record<number, { A: string; H: string; V: string; L: string; B: string }> = {
    1: { A: '#3a3535', H: '#5a5a5a', V: '#2a2020', L: '#2a2535', B: '#1a1010' },
    2: { A: '#6b4a14', H: '#7a5a1e', V: '#5a3a0e', L: '#3a2a10', B: '#2a1a08' },
    3: { A: '#707070', H: '#808080', V: '#505050', L: '#505060', B: '#303030' },
    4: { A: '#1a1a1a', H: '#2a2a2a', V: '#ffd700', L: '#1a1a2a', B: '#0a0a0a' },
    5: { A: '#c8a820', H: '#ffd700', V: '#ffffff', L: '#b8982a', B: '#c8a820' },
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

const WARRIOR_WEAPON_OVERLAYS: Record<1|2|3|4|5, { pixels: OverlayRow[]; colors: Record<string,string> }> = {
  1: { // Stick
    pixels: [
      [2, 14, 14, 'W'], [3, 14, 14, 'W'], [4, 14, 14, 'W'],
      [5, 14, 14, 'W'], [6, 14, 14, 'W'], [7, 14, 14, 'W'],
      [8, 14, 14, 'W'], [9, 14, 14, 'W'], [10, 14, 14, 'W'],
      [11, 14, 14, 'W'], [12, 14, 14, 'W'], [13, 14, 14, 'W'],
      [14, 14, 14, 'W'], [15, 14, 14, 'W'],
    ],
    colors: { W: '#8b6914' },
  },
  2: { // Iron Sword
    pixels: [
      [1, 14, 15, 'P'],
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
      [1, 13, 15, 'P'],
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
    colors: { W: '#dddddd', P: '#aaaaaa', G: '#ffd700' },
  },
  5: { // Divine Sword
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
  '...SSSSSSSSSS...',  // 3  face
  '...SSFSSSFSSS...',  // 4  eyes
  '...SSSSSSSSSS...',  // 5
  '...SSSSSSSSSS...',  // 6  chin
  '....AAAAAAAAA...',  // 7  robe shoulders
  '...AAAAAAAAAA...',  // 8
  '..AAAAAAAAAAA...',  // 9
  'WAAAAAAAAAAAAWW.',  // 10
  'WAAAAAAAAAAAAWW.',  // 11
  'WAAAAAAAAAAAAWW.',  // 12
  '..AAAAAAAAAAAAA.',  // 13
  '..AAAAAAAAAAAAA.',  // 14
  '...AAAAAAAAAAAA.',  // 15
  '....AAAAAAAAAAA.',  // 16
  '.....AAAAAAAAA..',  // 17
  '......AAAAAAA...',  // 18
  '......AAAAAAA...',  // 19
  '.....BBBBBBB....',  // 20
  '....BBBBBBB.....',  // 21
  '....BBBBBBB.....',  // 22
  '....BBBBBBB.....',  // 23
];

function magePalette(tier: 1|2|3|4|5): Record<string,string> {
  const COLORS: Record<number, { A: string; H: string; B: string }> = {
    1: { A: '#4a3060', H: '#5a3a70', B: '#2a1a40' },
    2: { A: '#5a4070', H: '#6a4a80', B: '#3a2a50' },
    3: { A: '#6b5090', H: '#8060a8', B: '#4a3a70' },
    4: { A: '#1a0a2a', H: '#9060c0', B: '#0a0a1a' },
    5: { A: '#c8a820', H: '#ffd700', B: '#b8982a' },
  };
  const c = COLORS[tier];
  return { S: SKIN, F: EYE, H: c.H, A: c.A, V: c.A, L: c.A, B: c.B, D: '#111111', W: '#5a4070', G: '#ffd700' };
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
  '...AAAAAAAAAA...',  // 6  shoulders
  '..AAAAAAAAAAAAA.',  // 7
  '.DAAAAAAAAAAAAD.',  // 8
  '.DAAAAAAAAAAAAD.',  // 9
  '.DAAAAAAAAAAAAD.',  // 10
  '..AAAAAAAAAAAAA.',  // 11
  '...AAAAAAAAAAAA.',  // 12
  '....LLLLLLLLLL..',  // 13
  '....LLLL.LLLL...',  // 14
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
    5: { A: '#0a0a0a', H: '#111111', L: '#0a0a0a', B: '#0a0a0a' },
  };
  const c = COLORS[tier];
  return { S: SKIN, F: EYE, H: c.H, A: c.A, V: c.A, L: c.L, B: c.B, D: '#0a0a0a', W: '#888888', G: '#ffd700' };
}

const ROGUE_WEAPON_OVERLAYS: Record<1|2|3|4|5, { pixels: OverlayRow[]; colors: Record<string,string> }> = {
  1: { // Rusty Dagger
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
    colors: { W: '#aaaaaa', P: '#888888' },
  },
  3: { // Twin Daggers
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
  5: { // Void Blades
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

export function getWeaponOverlay(
  heroClass: HeroClass,
  weaponTier: ArmorTier
): { pixels: OverlayRow[]; colors: Record<string, string> } {
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

/** Map rank to armor tier */
export function rankToArmorTier(rank: string): ArmorTier {
  const map: Record<string, ArmorTier> = { E: 1, D: 2, C: 3, B: 4, A: 5, S: 5 };
  return map[rank] ?? 1;
}
