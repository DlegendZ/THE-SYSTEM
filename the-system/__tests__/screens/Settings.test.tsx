import React from 'react';
import renderer from 'react-test-renderer';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

jest.mock('../../src/store/useSystemStore', () => ({
  useSystemStore: () => ({
    hero: {
      name: 'Test', hero_class: 'Warrior', global_xp: 0,
      global_level: 1, rank: 'E', journey_start_date: '2026-01-01', journey_complete: 0,
    },
    currentTheme: {
      background: '#1a1a1a', primary: '#2a2a2a', accent: '#666', text: '#aaa',
      textSecondary: '#777', borderStyle: 'cracked_stone', auraColor: null,
      particleType: 'dust', particleCount: 8, avatarFloat: false, screenGlow: false,
    },
    initialize: jest.fn(),
  }),
}));

jest.mock('../../src/db/queries', () => ({
  getSystemState: jest.fn().mockResolvedValue(null),
  setSystemState: jest.fn().mockResolvedValue(undefined),
}));

import Settings from '../../src/screens/Settings';

describe('Settings', () => {
  it('renders without crashing', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => { tree = renderer.create(<Settings />); });
    expect(tree!.toJSON()).not.toBeNull();
  });
});
