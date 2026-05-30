import {
  BASE_PIXELS,
  getPalette,
  getWeaponOverlay,
  applyOverlay,
  rankToArmorTier,
  type HeroClass,
  type ArmorTier,
} from '../../../src/components/avatar/avatarData';

const CLASSES: HeroClass[] = ['Warrior', 'Mage', 'Rogue'];
const TIERS: ArmorTier[] = [1, 2, 3, 4, 5];
const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];

describe('avatarData', () => {
  it('all base pixel grids are 24 rows of 16 chars', () => {
    for (const cls of CLASSES) {
      const pixels = BASE_PIXELS[cls];
      expect(pixels).toHaveLength(24);
      pixels.forEach((row, i) => {
        expect(row).toHaveLength(16);
      });
    }
  });

  it('getPalette returns palette with required keys for all classes and tiers', () => {
    const requiredKeys = ['S', 'F', 'H', 'A', 'L', 'B', 'D'];
    for (const cls of CLASSES) {
      for (const tier of TIERS) {
        const palette = getPalette(cls, tier);
        for (const key of requiredKeys) {
          expect(palette).toHaveProperty(key);
        }
      }
    }
  });

  it('getWeaponOverlay returns overlay for all classes and tiers', () => {
    for (const cls of CLASSES) {
      for (const tier of TIERS) {
        const overlay = getWeaponOverlay(cls, tier);
        expect(overlay).toHaveProperty('pixels');
        expect(overlay).toHaveProperty('colors');
        expect(Array.isArray(overlay.pixels)).toBe(true);
      }
    }
  });

  it('applyOverlay does not change row count or row length', () => {
    const base = BASE_PIXELS['Warrior'];
    const overlay = getWeaponOverlay('Warrior', 1);
    const palette = getPalette('Warrior', 1);
    const result = applyOverlay(base, overlay.pixels, palette);
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

  it('applyOverlay col indices stay in bounds', () => {
    for (const cls of CLASSES) {
      for (const tier of TIERS) {
        const base = BASE_PIXELS[cls];
        const overlay = getWeaponOverlay(cls, tier);
        const palette = getPalette(cls, tier);
        // Should not throw
        expect(() => applyOverlay(base, overlay.pixels, palette)).not.toThrow();
      }
    }
  });
});
