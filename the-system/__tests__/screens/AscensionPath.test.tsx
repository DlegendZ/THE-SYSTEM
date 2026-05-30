import React from 'react';
import renderer from 'react-test-renderer';

jest.mock('../../src/store/useSystemStore', () => ({
  useSystemStore: () => ({
    hero: {
      id: 1, name: 'Test', hero_class: 'Warrior', global_xp: 0,
      global_level: 1, rank: 'E', journey_start_date: '2026-01-01', journey_complete: 0,
    },
    currentTheme: {
      background: '#1a1a1a', primary: '#2a2a2a', accent: '#666', text: '#aaa',
      textSecondary: '#777', borderStyle: 'cracked_stone', auraColor: null,
      particleType: 'dust', particleCount: 8, avatarFloat: false, screenGlow: false,
    },
  }),
}));

jest.mock('../../src/db/queries', () => ({
  getWeekCompletionRate: jest.fn().mockResolvedValue(0),
}));

import AscensionPath from '../../src/screens/AscensionPath';

describe('AscensionPath', () => {
  it('renders without crashing', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => { tree = renderer.create(<AscensionPath />); });
    expect(tree!.toJSON()).not.toBeNull();
  });
});
