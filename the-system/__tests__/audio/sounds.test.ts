jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: { replayAsync: jest.fn().mockResolvedValue(undefined) },
        status: {},
      }),
    },
  },
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
