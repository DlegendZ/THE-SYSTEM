import React from 'react';
import renderer from 'react-test-renderer';

jest.mock('../../src/store/useSystemStore', () => ({
  useSystemStore: () => ({
    disciplines: [
      { id: 1, code: 'RISE', name: 'Wake Before Dawn', difficulty: 'HARD',
        xp_gain: 50, xp_loss: 30, deadline_time: '08:30', is_active: 1, is_custom: 0,
        frequency: 'daily', active_days: null, description: '', created_at: '' },
    ],
    refresh: jest.fn(),
    currentTheme: {
      background: '#1a1a1a', primary: '#2a2a2a', accent: '#666', text: '#aaa',
      textSecondary: '#777', borderStyle: 'cracked_stone', auraColor: null,
      particleType: 'dust', particleCount: 8, avatarFloat: false, screenGlow: false,
    },
  }),
}));

jest.mock('../../src/db/queries', () => ({
  setDisciplineActive: jest.fn().mockResolvedValue(undefined),
  createCustomDiscipline: jest.fn().mockResolvedValue(undefined),
  deleteDiscipline: jest.fn().mockResolvedValue(undefined),
}));

import Codex from '../../src/screens/Codex';

describe('Codex', () => {
  it('renders without crashing', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => { tree = renderer.create(<Codex />); });
    expect(tree!.toJSON()).not.toBeNull();
  });
});
