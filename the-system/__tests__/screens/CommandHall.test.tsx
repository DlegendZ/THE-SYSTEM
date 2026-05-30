import React from 'react';
import renderer from 'react-test-renderer';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('../../src/store/useSystemStore', () => ({
  useSystemStore: () => ({
    hero: {
      id: 1, name: 'Test', hero_class: 'Warrior', global_xp: 0,
      global_level: 1, rank: 'E', journey_start_date: '2026-01-01', journey_complete: 0,
    },
    disciplines: [],
    todayLogs: [],
    silenceStreak: { current_streak: 5, longest_streak: 10, total_relapses: 0 },
    pendingMandate: null,
    currentTheme: {
      background: '#1a1a1a', primary: '#2a2a2a', accent: '#666', text: '#aaa',
      textSecondary: '#777', borderStyle: 'cracked_stone', auraColor: null,
      particleType: 'dust', particleCount: 8, avatarFloat: false, screenGlow: false,
    },
    completeDiscipline: jest.fn().mockResolvedValue({ xpGained: 50, levelUp: null }),
    failDiscipline: jest.fn().mockResolvedValue(undefined),
    triggerRelapse: jest.fn().mockResolvedValue(undefined),
  }),
}));

import CommandHall from '../../src/screens/CommandHall';

describe('CommandHall', () => {
  it('renders without crashing', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => { tree = renderer.create(<CommandHall />); });
    expect(tree!.toJSON()).not.toBeNull();
  });
});
