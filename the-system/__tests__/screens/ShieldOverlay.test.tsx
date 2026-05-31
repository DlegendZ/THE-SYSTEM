import React from 'react';
import renderer from 'react-test-renderer';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
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

jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: jest.fn().mockResolvedValue(undefined),
  deactivateKeepAwake: jest.fn(),
}));

jest.mock('../../src/audio/sounds', () => ({ playSound: jest.fn() }));

import ShieldOverlay from '../../src/screens/ShieldOverlay';

describe('ShieldOverlay', () => {
  it('renders without crashing', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => { tree = renderer.create(<ShieldOverlay />); });
    expect(tree!.toJSON()).not.toBeNull();
  });
});
