import { rollLoot, LOOT_TABLES } from '../../src/engine/mandateEngine';

describe('LOOT_TABLES', () => {
  it('BRONZE probabilities sum to 1.0', () => {
    const sum = LOOT_TABLES.BRONZE.reduce((acc, entry) => acc + entry.weight, 0);
    expect(sum).toBeCloseTo(1.0);
  });
  it('SILVER probabilities sum to 1.0', () => {
    const sum = LOOT_TABLES.SILVER.reduce((acc, entry) => acc + entry.weight, 0);
    expect(sum).toBeCloseTo(1.0);
  });
  it('GOLD probabilities sum to 1.0', () => {
    const sum = LOOT_TABLES.GOLD.reduce((acc, entry) => acc + entry.weight, 0);
    expect(sum).toBeCloseTo(1.0);
  });
});

describe('rollLoot', () => {
  it('BRONZE returns a valid loot type', () => {
    const validTypes = ['scroll', 'title', 'accessory'];
    for (let i = 0; i < 50; i++) {
      const loot = rollLoot('BRONZE');
      expect(validTypes).toContain(loot.type);
      expect(loot.name).toBeTruthy();
    }
  });
  it('SILVER returns a valid loot type', () => {
    const validTypes = ['cosmetic_variant', 'background', 'title'];
    for (let i = 0; i < 50; i++) {
      const loot = rollLoot('SILVER');
      expect(validTypes).toContain(loot.type);
    }
  });
  it('GOLD returns a valid loot type', () => {
    const validTypes = ['equipment_tier', 'aura_variant', 'title'];
    for (let i = 0; i < 50; i++) {
      const loot = rollLoot('GOLD');
      expect(validTypes).toContain(loot.type);
    }
  });
});
