import {
  attributeForCode,
  attributeProgressFromXP,
  computeAttributes,
  ATTR_XP_PER_LEVEL,
  ATTRIBUTES,
} from '../../src/engine/attributeEngine';
import type { DisciplineLog, Discipline } from '../../src/types';

const disc = (id: number, code: string): Pick<Discipline, 'id' | 'code'> => ({ id, code });
const log = (discipline_id: number, xp_delta: number): Pick<DisciplineLog, 'discipline_id' | 'xp_delta'> =>
  ({ discipline_id, xp_delta });

describe('attributeForCode', () => {
  it('maps core codes to attributes', () => {
    expect(attributeForCode('SILENCE')).toBe('Willpower');
    expect(attributeForCode('PRESENCE')).toBe('Willpower');
    expect(attributeForCode('FORGE')).toBe('Strength');
    expect(attributeForCode('RISE')).toBe('Strength');
    expect(attributeForCode('NOURISH')).toBe('Vitality');
    expect(attributeForCode('REST')).toBe('Vitality');
    expect(attributeForCode('RITUAL')).toBe('Vitality');
    expect(attributeForCode('KNOWLEDGE')).toBe('Knowledge');
  });
  it('maps custom/unknown codes to Willpower', () => {
    expect(attributeForCode('CUSTOM_123')).toBe('Willpower');
    expect(attributeForCode('WHATEVER')).toBe('Willpower');
  });
});

describe('attributeProgressFromXP', () => {
  it('level 1 at 0 XP', () => {
    const p = attributeProgressFromXP('Strength', 0);
    expect(p.level).toBe(1);
    expect(p.xpIntoLevel).toBe(0);
    expect(p.pct).toBe(0);
  });
  it('advances a level every ATTR_XP_PER_LEVEL', () => {
    expect(attributeProgressFromXP('Strength', ATTR_XP_PER_LEVEL - 1).level).toBe(1);
    expect(attributeProgressFromXP('Strength', ATTR_XP_PER_LEVEL).level).toBe(2);
    expect(attributeProgressFromXP('Strength', ATTR_XP_PER_LEVEL * 3 + 150).level).toBe(4);
  });
  it('reports progress within the current level', () => {
    const p = attributeProgressFromXP('Strength', ATTR_XP_PER_LEVEL + 150);
    expect(p.xpIntoLevel).toBe(150);
    expect(p.pct).toBeCloseTo(150 / ATTR_XP_PER_LEVEL);
  });
  it('clamps negative XP to 0', () => {
    expect(attributeProgressFromXP('Strength', -50).xp).toBe(0);
    expect(attributeProgressFromXP('Strength', -50).level).toBe(1);
  });
});

describe('computeAttributes', () => {
  const disciplines = [
    disc(1, 'FORGE'), disc(2, 'RISE'), disc(3, 'KNOWLEDGE'),
    disc(4, 'SILENCE'), disc(5, 'PRESENCE'), disc(6, 'CUSTOM_99'),
  ];

  it('sums positive deltas into the right attribute', () => {
    const logs = [log(1, 60), log(2, 50)]; // both Strength
    const attrs = computeAttributes(logs, disciplines);
    expect(attrs.Strength.xp).toBe(110);
    expect(attrs.Knowledge.xp).toBe(0);
  });

  it('ignores losses (negative/zero deltas)', () => {
    const logs = [log(1, 60), log(1, -35), log(1, 0)];
    const attrs = computeAttributes(logs, disciplines);
    expect(attrs.Strength.xp).toBe(60);
  });

  it('routes custom disciplines to Willpower', () => {
    const logs = [log(6, 10), log(4, 100)];
    const attrs = computeAttributes(logs, disciplines);
    expect(attrs.Willpower.xp).toBe(110);
  });

  it('returns all four attributes even with no logs', () => {
    const attrs = computeAttributes([], disciplines);
    for (const a of ATTRIBUTES) {
      expect(attrs[a].level).toBe(1);
      expect(attrs[a].xp).toBe(0);
    }
  });

  it('ignores logs whose discipline is unknown', () => {
    const logs = [log(999, 500)];
    const attrs = computeAttributes(logs, disciplines);
    expect(attrs.Willpower.xp).toBe(0);
  });
});
