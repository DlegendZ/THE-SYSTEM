import type { RootStackParamList } from '../../src/navigation/types';

describe('RootStackParamList types', () => {
  it('LevelUpSplash params have required fields', () => {
    const params: RootStackParamList['LevelUpSplash'] = {
      level: 5,
      xpGained: 300,
      rankChanged: false,
      newRank: 'E',
    };
    expect(params.level).toBe(5);
    expect(params.xpGained).toBe(300);
    expect(params.rankChanged).toBe(false);
    expect(params.newRank).toBe('E');
  });
});
