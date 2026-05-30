import React from 'react';
import renderer from 'react-test-renderer';

jest.mock('../../src/store/useSystemStore', () => ({
  useSystemStore: () => ({
    hero: {
      id: 1, name: 'Test', hero_class: 'Warrior', global_xp: 500,
      global_level: 3, rank: 'E', journey_start_date: '2026-01-01', journey_complete: 0,
    },
    disciplines: [],
    currentTheme: {
      background: '#1a1a1a', primary: '#2a2a2a', accent: '#666', text: '#aaa',
      textSecondary: '#777', borderStyle: 'cracked_stone', auraColor: null,
      particleType: 'dust', particleCount: 8, avatarFloat: false, screenGlow: false,
    },
  }),
}));

jest.mock('../../src/db/queries', () => ({
  getLogsForRange: jest.fn().mockResolvedValue([]),
  getAllMandates: jest.fn().mockResolvedValue([]),
  getDisciplineLogsAll: jest.fn().mockResolvedValue([]),
  getSilenceStreak: jest.fn().mockResolvedValue({ current_streak: 7, longest_streak: 14, total_relapses: 0 }),
}));

import Archive from '../../src/screens/Archive';

describe('Archive', () => {
  it('renders without crashing', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => { tree = renderer.create(<Archive />); });
    expect(tree!.toJSON()).not.toBeNull();
  });
});
