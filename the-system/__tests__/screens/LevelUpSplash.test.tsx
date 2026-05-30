import React from 'react';
import renderer from 'react-test-renderer';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
  useRoute: () => ({ params: { level: 5, xpGained: 150, rankChanged: false, newRank: 'E' } }),
}));

jest.mock('../../src/store/useSystemStore', () => ({
  useSystemStore: () => ({
    currentTheme: {
      background: '#1a1a1a', primary: '#2a2a2a', accent: '#666', text: '#aaa',
      textSecondary: '#777', borderStyle: 'cracked_stone', auraColor: null,
      particleType: 'dust', particleCount: 8, avatarFloat: false, screenGlow: false,
    },
  }),
}));

import LevelUpSplash from '../../src/screens/LevelUpSplash';

describe('LevelUpSplash', () => {
  it('renders level up without crashing', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => { tree = renderer.create(<LevelUpSplash />); });
    expect(tree!.toJSON()).not.toBeNull();
  });
});
