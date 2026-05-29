import {
  XP_TABLE,
  getStreakMultiplier,
  getRankForLevel,
  getXpForLevel,
} from '../../src/engine/xpConstants';

describe('XP_TABLE', () => {
  it('has 30 levels', () => {
    expect(Object.keys(XP_TABLE).length).toBe(30);
  });
  it('level 1 starts at 0 XP', () => {
    expect(XP_TABLE[1]).toBe(0);
  });
  it('level 30 (S-Rank max) is 87500', () => {
    expect(XP_TABLE[30]).toBe(87500);
  });
  it('XP values are strictly increasing', () => {
    for (let i = 2; i <= 30; i++) {
      expect(XP_TABLE[i]).toBeGreaterThan(XP_TABLE[i - 1]);
    }
  });
});

describe('getStreakMultiplier', () => {
  it('returns 1.0 for 0 days', () => { expect(getStreakMultiplier(0)).toBe(1.0); });
  it('returns 1.0 for 6 days', () => { expect(getStreakMultiplier(6)).toBe(1.0); });
  it('returns 1.5 for 7 days', () => { expect(getStreakMultiplier(7)).toBe(1.5); });
  it('returns 1.5 for 13 days', () => { expect(getStreakMultiplier(13)).toBe(1.5); });
  it('returns 2.0 for 14 days', () => { expect(getStreakMultiplier(14)).toBe(2.0); });
  it('returns 3.0 for 30 days', () => { expect(getStreakMultiplier(30)).toBe(3.0); });
  it('returns 4.0 for 90 days', () => { expect(getStreakMultiplier(90)).toBe(4.0); });
  it('returns 4.0 for 180 days', () => { expect(getStreakMultiplier(180)).toBe(4.0); });
});

describe('getRankForLevel', () => {
  it('levels 1-5 are E-Rank', () => { for (let i = 1; i <= 5; i++) expect(getRankForLevel(i)).toBe('E'); });
  it('levels 6-10 are D-Rank', () => { for (let i = 6; i <= 10; i++) expect(getRankForLevel(i)).toBe('D'); });
  it('levels 11-15 are C-Rank', () => { for (let i = 11; i <= 15; i++) expect(getRankForLevel(i)).toBe('C'); });
  it('levels 16-20 are B-Rank', () => { for (let i = 16; i <= 20; i++) expect(getRankForLevel(i)).toBe('B'); });
  it('levels 21-25 are A-Rank', () => { for (let i = 21; i <= 25; i++) expect(getRankForLevel(i)).toBe('A'); });
  it('levels 26-30 are S-Rank', () => { for (let i = 26; i <= 30; i++) expect(getRankForLevel(i)).toBe('S'); });
});

describe('getXpForLevel', () => {
  it('returns 0 for level 1', () => { expect(getXpForLevel(1)).toBe(0); });
  it('returns 300 for level 2', () => { expect(getXpForLevel(2)).toBe(300); });
  it('returns null for level 31', () => { expect(getXpForLevel(31)).toBeNull(); });
});
