// Chibi pixel avatars — 16 wide × 18 tall. Big head, big eyes, tiny body.
// Each string = one row of exactly 16 chars. '.' = transparent.
//
// Palette keys:
//   S skin   F eye   H hair/helmet/hood   A armor   V belt/secondary
//   L legs   B boots W weapon   D dark/shadow   G gold/glow accent
//   C crystal/gem (mage)   R regalia (crown/halo/wings, rank-based)

export interface AvatarFrame {
  pixels: string[];
  palette: Record<string, string>;
}

const SKIN = '#f2c79a';
const EYE = '#1b2740';

// ─── Chibi base sprites (weapon baked in) ─────────────────────────────────────

const WARRIOR_BASE_PIXELS: string[] = [
  '......HHHH......', // 0  helmet crest
  '....HHHHHHHH....', // 1  helmet
  '...HHHHHHHHHH...', // 2  helmet
  '..HHHHHHHHHHHH..', // 3  helmet brow
  '..HHSSSSSSSSHH..', // 4  forehead
  '..HSSSSSSSSSSH..', // 5  face
  '..HSSFFSSFFSSH..', // 6  big eyes
  '..HSSFFSSFFSSH..', // 7  big eyes
  '..HSSSSSSSSSSH..', // 8  cheeks
  '..HSSSDDDDSSSH..', // 9  mouth
  '...HSSSSSSSSH...', // 10 chin
  '....DSSSSD..W...', // 11 neck + weapon hilt
  '...AAAAAAAA.WW..', // 12 shoulders + blade
  '..DAAAAAAAAD W..', // 13 arms + blade
  '...VVVVVVVV.W...', // 14 belt + blade
  '...LLL..LLL.W...', // 15 legs + blade tip
  '...LLL..LLL.....', // 16 legs
  '...BB....BB.....', // 17 boots
];

const MAGE_BASE_PIXELS: string[] = [
  '.......HH.......', // 0  hat tip
  '......HHHH......', // 1  hat
  '.....HHHHHH.....', // 2  hat
  '....HHHHHHHH....', // 3  hat
  '..HHHHHHHHHHHH..', // 4  hat brim
  '...SSSSSSSSSS...', // 5  forehead
  '...SSFFSSFFSS...', // 6  big eyes
  '...SSFFSSFFSS...', // 7  big eyes
  '...SSSSSSSSSS...', // 8  cheeks
  '...SSSDDDDSSS...', // 9  mouth
  '....SSSSSSSS....', // 10 chin
  '.W..DSSSSD......', // 11 neck + staff
  'WC.AAAAAAAA.....', // 12 robe + staff gem
  '.W.AAAAAAAAAA...', // 13 robe
  '.W..AAAAAAAA....', // 14 robe
  '.W...AAAAAA.....', // 15 robe hem
  '.....BBBBBB.....', // 16 robe base
  '.....BBBBBB.....', // 17 robe base
];

const ROGUE_BASE_PIXELS: string[] = [
  '....HHHHHHHH....', // 0  hood
  '...HHHHHHHHHH...', // 1  hood
  '..HHHHHHHHHHHH..', // 2  hood
  '..HHHHHHHHHHHH..', // 3  hood
  '..HHSSSSSSSSHH..', // 4  forehead
  '..HSSSSSSSSSSH..', // 5  face
  '..HSSFFSSFFSSH..', // 6  big eyes
  '..HSSFFSSFFSSH..', // 7  big eyes
  '..HHSSSSSSSSHH..', // 8  hood cheeks
  '...HSSDDDDSSH...', // 9  mouth (masked)
  '....SSSSSSSS....', // 10 chin
  'W...DSSSSD...W..', // 11 neck + twin daggers
  'W..AAAAAAAA..W..', // 12 shoulders + blades
  '..DAAAAAAAAD....', // 13 arms
  '...VVVVVVVV.....', // 14 belt
  '...LLL..LLL.....', // 15 legs
  '...LLL..LLL.....', // 16 legs
  '...BB....BB.....', // 17 boots
];

// ─── Per-tier palettes (armor + weapon evolve with rank) ──────────────────────

function warriorPalette(t: 1 | 2 | 3 | 4 | 5): Record<string, string> {
  const C: Record<number, { A: string; H: string; V: string; L: string; B: string; W: string; G: string }> = {
    1: { A: '#46484f', H: '#6a6e78', V: '#33363d', L: '#2f3340', B: '#1c1f26', W: '#9aa0aa', G: '#7fd4ff' },
    2: { A: '#4a6c8f', H: '#6f93b8', V: '#33506e', L: '#2c4258', B: '#1c2c3c', W: '#bfe3ff', G: '#9fe6ff' },
    3: { A: '#2f86c8', H: '#5cb4ef', V: '#1f5e92', L: '#214e74', B: '#143350', W: '#d8f2ff', G: '#bff0ff' },
    4: { A: '#1f6fff', H: '#6aa8ff', V: '#1850c0', L: '#173f9a', B: '#0f2766', W: '#eaf6ff', G: '#aef2ff' },
    5: { A: '#9fb8ff', H: '#dfe9ff', V: '#7d8fe0', L: '#6f7fd0', B: '#aef2ff', W: '#ffffff', G: '#ffffff' },
  };
  const c = C[t];
  return { S: SKIN, F: EYE, D: '#10131a', ...c };
}

function magePalette(t: 1 | 2 | 3 | 4 | 5): Record<string, string> {
  const C: Record<number, { A: string; H: string; B: string; W: string; C: string; G: string }> = {
    1: { A: '#3a4a72', H: '#4a5c88', B: '#28324f', W: '#8a6a3a', C: '#7fd4ff', G: '#7fd4ff' },
    2: { A: '#3f5f9a', H: '#4f72b2', B: '#2c4068', W: '#8a6a3a', C: '#9fe6ff', G: '#9fe6ff' },
    3: { A: '#3a6fc0', H: '#5a92e0', B: '#274a86', W: '#9a7a4a', C: '#bff0ff', G: '#bff0ff' },
    4: { A: '#2f5fd8', H: '#6a90ff', B: '#1f3f9a', W: '#b89a5a', C: '#cde6ff', G: '#aef2ff' },
    5: { A: '#b0a8ff', H: '#e6ddff', B: '#8f8fe0', W: '#ffffff', C: '#ffffff', G: '#ffffff' },
  };
  const c = C[t];
  return { S: SKIN, F: EYE, D: '#10131a', V: c.A, L: c.A, ...c };
}

function roguePalette(t: 1 | 2 | 3 | 4 | 5): Record<string, string> {
  const C: Record<number, { A: string; H: string; V: string; L: string; B: string; W: string; G: string }> = {
    1: { A: '#2b3340', H: '#1d2530', V: '#222a36', L: '#202833', B: '#141820', W: '#aab0ba', G: '#7fd4ff' },
    2: { A: '#26384a', H: '#1a2632', V: '#203040', L: '#1d2c3a', B: '#121c26', W: '#bfe3ff', G: '#9fe6ff' },
    3: { A: '#21405c', H: '#172a3e', V: '#1b3550', L: '#193048', B: '#0f2236', W: '#d8f2ff', G: '#bff0ff' },
    4: { A: '#1a3a6e', H: '#122a52', V: '#163060', L: '#132a55', B: '#0c1d40', W: '#eaf6ff', G: '#aef2ff' },
    5: { A: '#7d8fe0', H: '#3a3f66', V: '#6f7fd0', L: '#6470c0', B: '#aef2ff', W: '#ffffff', G: '#ffffff' },
  };
  const c = C[t];
  return { S: SKIN, F: EYE, D: '#0c0f16', ...c };
}

// ─── Rank regalia overlays (crown / halo / wings) ─────────────────────────────
// Drawn on top of the base for higher ranks. Format: [row, colStart, colEnd, char].

export type OverlayRow = [number, number, number, string];

const REGALIA: Record<string, OverlayRow[]> = {
  // B-rank: small crown above the head
  B: [
    [0, 5, 5, 'R'], [0, 8, 8, 'R'], [0, 10, 10, 'R'],
    [1, 5, 10, 'R'],
  ],
  // A-rank: halo ring above the head
  A: [
    [0, 4, 11, 'R'],
    [1, 4, 4, 'R'], [1, 11, 11, 'R'],
  ],
  // S-rank: crown + energy wings flanking the body
  S: [
    [0, 5, 5, 'R'], [0, 8, 8, 'R'], [0, 10, 10, 'R'],
    [1, 5, 10, 'R'],
    [11, 0, 1, 'R'], [12, 0, 0, 'R'], [10, 1, 2, 'R'],
    [11, 14, 15, 'R'], [12, 15, 15, 'R'], [10, 13, 14, 'R'],
    [13, 1, 1, 'R'], [13, 14, 14, 'R'],
  ],
};

const REGALIA_COLOR: Record<string, string> = {
  B: '#bff0ff',
  A: '#e6f6ff',
  S: '#ffffff',
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

/** Regalia overlay + its color for a given rank (empty for E/D/C). */
export function getRegalia(rank: string): { pixels: OverlayRow[]; color: string } {
  return { pixels: REGALIA[rank] ?? [], color: REGALIA_COLOR[rank] ?? '#ffffff' };
}

/** Apply overlay rows on top of base pixels (returns a copy). */
export function applyOverlay(base: string[], overlay: OverlayRow[]): string[] {
  const result = [...base];
  for (const [row, colStart, colEnd, char] of overlay) {
    if (row < 0 || row >= result.length) continue;
    const chars = result[row].split('');
    for (let c = colStart; c <= colEnd && c < chars.length; c++) chars[c] = char;
    result[row] = chars.join('');
  }
  return result;
}

/** Map rank to armor/weapon tier. */
export function rankToArmorTier(rank: string): ArmorTier {
  const map: Record<string, ArmorTier> = { E: 1, D: 2, C: 3, B: 4, A: 5, S: 5 };
  return map[rank] ?? 1;
}
