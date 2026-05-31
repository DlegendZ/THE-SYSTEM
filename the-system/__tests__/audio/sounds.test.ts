jest.mock('expo-audio', () => ({
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    remove: jest.fn(),
  })),
}));

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: '/tmp/test/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: { Base64: 'base64' },
}));

import { playSound, preloadSounds } from '../../src/audio/sounds';

describe('sounds', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('playSound does not throw', async () => {
    await expect(playSound('complete')).resolves.toBeUndefined();
  });

  it('playSound handles unknown sound gracefully', async () => {
    // @ts-ignore
    await expect(playSound('unknown')).resolves.toBeUndefined();
  });

  it('preloadSounds does not throw', async () => {
    await expect(preloadSounds()).resolves.toBeUndefined();
  });
});
