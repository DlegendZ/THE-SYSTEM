import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

function writeUint32LE(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value, true);
}

function writeUint16LE(view: DataView, offset: number, value: number): void {
  view.setUint16(offset, value, true);
}

function generateWav(
  frequency: number,
  durationMs: number,
  volume = 0.6,
  sampleRate = 8000
): string {
  const numSamples = Math.floor((durationMs / 1000) * sampleRate);
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  view.setUint8(0, 0x52); view.setUint8(1, 0x49); view.setUint8(2, 0x46); view.setUint8(3, 0x46);
  writeUint32LE(view, 4, 36 + dataSize);
  view.setUint8(8, 0x57); view.setUint8(9, 0x41); view.setUint8(10, 0x56); view.setUint8(11, 0x45);

  // fmt chunk
  view.setUint8(12, 0x66); view.setUint8(13, 0x6d); view.setUint8(14, 0x74); view.setUint8(15, 0x20);
  writeUint32LE(view, 16, 16);
  writeUint16LE(view, 20, 1);
  writeUint16LE(view, 22, 1);
  writeUint32LE(view, 24, sampleRate);
  writeUint32LE(view, 28, sampleRate * 2);
  writeUint16LE(view, 32, 2);
  writeUint16LE(view, 34, 16);

  // data chunk
  view.setUint8(36, 0x64); view.setUint8(37, 0x61); view.setUint8(38, 0x74); view.setUint8(39, 0x61);
  writeUint32LE(view, 40, dataSize);

  const attackSamples = Math.floor(numSamples * 0.05);
  const releaseSamples = Math.floor(numSamples * 0.2);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let envelope = volume;
    if (i < attackSamples) {
      envelope = volume * (i / attackSamples);
    } else if (i > numSamples - releaseSamples) {
      envelope = volume * ((numSamples - i) / releaseSamples);
    }
    const sample = Math.floor(Math.sin(2 * Math.PI * frequency * t) * 32767 * envelope);
    view.setInt16(44 + i * 2, sample, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

const SOUND_DEFS = {
  complete: { frequency: 880, duration: 150, volume: 0.5 },
  fail: { frequency: 220, duration: 300, volume: 0.6 },
  levelUp: { frequency: 1047, duration: 400, volume: 0.7 },
  rankUp: { frequency: 1175, duration: 600, volume: 0.8 },
  relapse: { frequency: 110, duration: 500, volume: 0.7 },
  mandate: { frequency: 659, duration: 250, volume: 0.5 },
};

type SoundName = keyof typeof SOUND_DEFS;

let soundObjects: Partial<Record<SoundName, Audio.Sound>> = {};
let soundsInitialized = false;
let soundsDir = '';

async function ensureSoundsDir(): Promise<void> {
  soundsDir = `${FileSystem.cacheDirectory ?? '/tmp/'}sounds/`;
  const info = await FileSystem.getInfoAsync(soundsDir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(soundsDir, { intermediates: true });
  }
}

async function initSounds(): Promise<void> {
  if (soundsInitialized) return;
  await ensureSoundsDir();
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

  for (const [name, def] of Object.entries(SOUND_DEFS) as [SoundName, typeof SOUND_DEFS[SoundName]][]) {
    const filePath = `${soundsDir}${name}.wav`;
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (!fileInfo.exists) {
      const wavDataUri = generateWav(def.frequency, def.duration, def.volume);
      const base64 = wavDataUri.split(',')[1];
      await FileSystem.writeAsStringAsync(filePath, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
    const { sound } = await Audio.Sound.createAsync({ uri: filePath });
    soundObjects[name] = sound;
  }
  soundsInitialized = true;
}

export async function playSound(name: SoundName): Promise<void> {
  try {
    if (!soundsInitialized) await initSounds();
    const sound = soundObjects[name];
    if (sound) await sound.replayAsync();
  } catch {
    // Sound errors are non-fatal
  }
}

export async function preloadSounds(): Promise<void> {
  try {
    await initSounds();
  } catch {
    // Non-fatal
  }
}

export type { SoundName };
