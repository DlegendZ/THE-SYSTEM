import {
  BASE_PIXELS,
  getPalette,
  getRegalia,
  applyOverlay,
  rankToArmorTier,
  type HeroClass,
  type ArmorTier,
} from '../../../src/components/avatar/avatarData';

const CLASSES: HeroClass[] = ['Warrior', 'Mage', 'Rogue'];
const TIERS: ArmorTier[] = [1, 2, 3, 4, 5];
const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];

describe('avatarData', () => {
  it('all base pixel grids are 18 rows of 16 chars', () => {
    for (const cls of CLASSES) {
      const pixels = BASE_PIXELS[cls];
      expect(pixels).toHaveLength(18);
      pixels.forEach((row) => {
        expect(row).toHaveLength(16);
      });
    }
  });

  it('getPalette returns palette with required keys for all classes and tiers', () => {
    const requiredKeys = ['S', 'F', 'H', 'A', 'V', 'L', 'B', 'D', 'W', 'G'];
    for (const cls of CLASSES) {
      for (const tier of TIERS) {
        const palette = getPalette(cls, tier);
        for (const key of requiredKeys) {
          expect(palette).toHaveProperty(key);
        }
      }
    }
  });

  it('getRegalia returns pixels + color for every rank', () => {
    for (const rank of RANKS) {
      const regalia = getRegalia(rank);
      expect(regalia).toHaveProperty('pixels');
      expect(regalia).toHaveProperty('color');
      expect(Array.isArray(regalia.pixels)).toBe(true);
    }
  });

  it('applyOverlay does not change row count or row length', () => {
    const base = BASE_PIXELS['Warrior'];
    const result = applyOverlay(base, getRegalia('S').pixels);
    expect(result).toHaveLength(base.length);
    result.forEach((row, i) => {
      expect(row).toHaveLength(base[i].length);
    });
  });

  it('rankToArmorTier maps correctly', () => {
    expect(rankToArmorTier('E')).toBe(1);
    expect(rankToArmorTier('D')).toBe(2);
    expect(rankToArmorTier('C')).toBe(3);
    expect(rankToArmorTier('B')).toBe(4);
    expect(rankToArmorTier('A')).toBe(5);
    expect(rankToArmorTier('S')).toBe(5);
    expect(rankToArmorTier('X')).toBe(1); // unknown defaults to 1
  });

  it('applyOverlay stays in bounds for every rank regalia', () => {
    for (const cls of CLASSES) {
      for (const rank of RANKS) {
        const base = BASE_PIXELS[cls];
        expect(() => applyOverlay(base, getRegalia(rank).pixels)).not.toThrow();
      }
    }
  });
});
