import React from 'react';
import renderer from 'react-test-renderer';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

jest.mock('../../src/store/useSystemStore', () => ({
  useSystemStore: () => ({
    pendingMandate: { id: 1, tier: 'BRONZE', opened: 0, granted_at: '2026-01-01T00:00:00Z' },
    openMandate: jest.fn().mockResolvedValue({ type: 'scroll', name: 'Test scroll' }),
    currentTheme: {
      background: '#1a1a1a', primary: '#2a2a2a', accent: '#666', text: '#aaa',
      textSecondary: '#777', borderStyle: 'cracked_stone', auraColor: null,
      particleType: 'dust', particleCount: 8, avatarFloat: false, screenGlow: false,
    },
  }),
}));

import MandateReveal from '../../src/screens/MandateReveal';

describe('MandateReveal', () => {
  it('renders without crashing', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => { tree = renderer.create(<MandateReveal />); });
    expect(tree!.toJSON()).not.toBeNull();
  });
});
