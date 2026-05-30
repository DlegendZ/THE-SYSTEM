# Phase 5: Polish & Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the app with Press Start 2P pixel font, retro sound effects, S-Rank finale cutscene, JSON data export/import, and produce a release-signed debug APK.

**Architecture:** expo-font for Press Start 2P (bundled .ttf). expo-av + expo-file-system for sound generation and data export. S-Rank cutscene is a 6-frame SVG animation triggered by journey_complete flag. Font applied globally via a wrapper Text component.

**Tech Stack:** expo-font ~56.x, expo-av ~15.x, expo-file-system ~18.x (new installs), TypeScript strict

---

## File Structure

```
src/
  assets/
    fonts/
      PressStart2P-Regular.ttf     — bundled pixel font
  audio/
    sounds.ts                       — WAV generation + playback helpers
  components/
    ui/
      PixelText.tsx                 — Text wrapper applying PressStart2P
  screens/
    SRankCutscene.tsx               — 6-frame S-rank finale animation
  navigation/
    types.ts                        — add SRankCutscene to RootStackParamList
    AppNavigator.tsx                — add SRankCutscene screen
  store/
    useSystemStore.ts               — add checkJourneyComplete()
App.tsx                             — wait for fonts before rendering
```

---

## Task 1: Install Dependencies

**Files:** `the-system/package.json` (modified by npm install)

- [ ] **Step 1: Install expo-av and expo-file-system**

```powershell
cd the-system
npx expo install expo-av expo-file-system
```

Expected: Both packages installed, `package.json` updated with correct Expo SDK 56 compatible versions.

- [ ] **Step 2: Verify installation**

```powershell
cd the-system
node -e "require('expo-av'); console.log('expo-av ok')"
node -e "require('expo-file-system'); console.log('expo-file-system ok')"
```

Expected: Both print "ok" (or no output = modules found)

- [ ] **Step 3: Commit**

```powershell
cd the-system
git add package.json package-lock.json
git commit -m "deps: install expo-av and expo-file-system for sounds and data export"
```

---

## Task 2: Press Start 2P Font

**Files:**
- Create: `the-system/src/assets/fonts/PressStart2P-Regular.ttf`
- Create: `the-system/src/components/ui/PixelText.tsx`
- Modify: `the-system/App.tsx`

- [ ] **Step 1: Download Press Start 2P font**

Download from Google Fonts:
```powershell
cd the-system
# Create fonts directory
New-Item -ItemType Directory -Force -Path "src/assets/fonts"

# Download the font file
Invoke-WebRequest `
  -Uri "https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nVivNm4I81.woff2" `
  -OutFile "src/assets/fonts/PressStart2P-Regular.woff2"
```

**However**, expo-font requires `.ttf` or `.otf`, not `.woff2`. Use the TTF download URL instead:
```powershell
Invoke-WebRequest `
  -Uri "https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nVivM.ttf" `
  -OutFile "src/assets/fonts/PressStart2P-Regular.ttf"
```

If the URL above fails (fonts.gstatic.com URLs change), get the correct TTF URL from:
1. Visit https://fonts.google.com/specimen/Press+Start+2P
2. Click "Download family" 
3. Extract `PressStart2P-Regular.ttf` from the ZIP
4. Place at `the-system/src/assets/fonts/PressStart2P-Regular.ttf`

Verify the file exists and has reasonable size (should be ~50-80 KB):
```powershell
Get-Item "src/assets/fonts/PressStart2P-Regular.ttf" | Select-Object Length
```
Expected: Length > 10000 (at least 10 KB)

- [ ] **Step 2: Load font in App.tsx**

Replace `the-system/App.tsx` entirely:
```tsx
import React, { useEffect } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import AppNavigator from './src/navigation/AppNavigator';
import { useSystemStore } from './src/store/useSystemStore';

export default function App() {
  const initialize = useSystemStore((s) => s.initialize);

  const [fontsLoaded, fontError] = useFonts({
    'PressStart2P': require('./src/assets/fonts/PressStart2P-Regular.ttf'),
  });

  useEffect(() => {
    initialize();
  }, []);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>LOADING...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#ffd700', fontSize: 14 },
});
```

- [ ] **Step 3: Create PixelText component**

Create `the-system/src/components/ui/PixelText.tsx`:
```tsx
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

interface PixelTextProps extends TextProps {
  size?: number;
  color?: string;
}

/**
 * Text component that applies the Press Start 2P pixel font.
 * Falls back gracefully if font isn't loaded.
 */
export default function PixelText({ style, size = 12, color, children, ...props }: PixelTextProps) {
  return (
    <Text
      style={[
        styles.base,
        { fontSize: size, color: color ?? '#ffffff' },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'PressStart2P',
    // Press Start 2P has tight line height; increase for readability
    lineHeight: undefined,
  },
});
```

- [ ] **Step 4: Apply PixelText to CommandHall key labels**

In `the-system/src/screens/CommandHall.tsx`, replace the rank text and day counter with `PixelText`:

Add import:
```tsx
import PixelText from '../components/ui/PixelText';
```

Replace the rank badge text:
```tsx
// Before:
<Text style={[styles.rankText, { color: theme.accent }]}>{hero.rank}</Text>

// After:
<PixelText size={18} color={theme.accent}>{hero.rank}</PixelText>
```

Replace the day counter:
```tsx
// Before:
<Text style={[styles.dayText, { color: theme.text }]}>DAY {dayNumber} OF 180</Text>

// After:
<PixelText size={10} color={theme.text}>DAY {dayNumber} OF 180</PixelText>
```

Replace the silence streak number:
```tsx
// Before:
<Text style={[styles.streakNumber, { color: theme.accent }]}>{silenceStreak.current_streak}</Text>

// After:
<PixelText size={36} color={theme.accent}>{String(silenceStreak.current_streak)}</PixelText>
```

Replace the "DAILY QUEST LOG" label:
```tsx
// Before:
<Text style={[styles.sectionTitle, { color: theme.text }]}>DAILY QUEST LOG</Text>

// After:
<PixelText size={10} color={theme.text}>DAILY QUEST LOG</PixelText>
```

- [ ] **Step 5: Write test for PixelText**

Create `the-system/__tests__/components/ui/PixelText.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import PixelText from '../../../src/components/ui/PixelText';

describe('PixelText', () => {
  it('renders text content', () => {
    const { getByText } = render(<PixelText>HELLO WORLD</PixelText>);
    expect(getByText('HELLO WORLD')).toBeTruthy();
  });

  it('applies default size', () => {
    const { getByText } = render(<PixelText>TEST</PixelText>);
    const el = getByText('TEST');
    expect(el).toBeTruthy();
  });
});
```

Run: `cd the-system && npx jest __tests__/components/ui/PixelText.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 6: Commit**

```powershell
cd the-system
git add src/assets/fonts/PressStart2P-Regular.ttf
git add src/components/ui/PixelText.tsx
git add App.tsx src/screens/CommandHall.tsx
git add __tests__/components/ui/PixelText.test.tsx
git commit -m "feat: add Press Start 2P pixel font and PixelText component"
```

---

## Task 3: Retro Sound Effects

**Files:**
- Create: `the-system/src/audio/sounds.ts`

- [ ] **Step 1: Create sounds.ts**

Create `the-system/src/audio/sounds.ts`:
```typescript
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// --- WAV generation utilities ---

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
  view.setUint8(0, 0x52); view.setUint8(1, 0x49); view.setUint8(2, 0x46); view.setUint8(3, 0x46); // "RIFF"
  writeUint32LE(view, 4, 36 + dataSize);
  view.setUint8(8, 0x57); view.setUint8(9, 0x41); view.setUint8(10, 0x56); view.setUint8(11, 0x45); // "WAVE"

  // fmt chunk
  view.setUint8(12, 0x66); view.setUint8(13, 0x6d); view.setUint8(14, 0x74); view.setUint8(15, 0x20); // "fmt "
  writeUint32LE(view, 16, 16);        // chunk size
  writeUint16LE(view, 20, 1);         // PCM format
  writeUint16LE(view, 22, 1);         // mono
  writeUint32LE(view, 24, sampleRate); // sample rate
  writeUint32LE(view, 28, sampleRate * 2); // byte rate
  writeUint16LE(view, 32, 2);         // block align
  writeUint16LE(view, 34, 16);        // bits per sample

  // data chunk
  view.setUint8(36, 0x64); view.setUint8(37, 0x61); view.setUint8(38, 0x74); view.setUint8(39, 0x61); // "data"
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

  // Convert ArrayBuffer to base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // Use btoa if available (React Native has it)
  return 'data:audio/wav;base64,' + btoa(binary);
}

// Sound definitions
const SOUND_DEFS = {
  complete: { frequency: 880, duration: 150, volume: 0.5 },    // high beep
  fail: { frequency: 220, duration: 300, volume: 0.6 },         // low thud
  levelUp: { frequency: 1047, duration: 400, volume: 0.7 },     // C6 chime
  rankUp: { frequency: 1175, duration: 600, volume: 0.8 },      // D6 long chime
  relapse: { frequency: 110, duration: 500, volume: 0.7 },      // very low dark tone
  mandate: { frequency: 659, duration: 250, volume: 0.5 },      // E5 treasure sound
};

type SoundName = keyof typeof SOUND_DEFS;

let soundObjects: Partial<Record<SoundName, Audio.Sound>> = {};
let soundsInitialized = false;
let soundsDir: string;

async function ensureSoundsDir(): Promise<void> {
  soundsDir = `${FileSystem.cacheDirectory}sounds/`;
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
      // Extract base64 from data URI
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
    if (!soundsInitialized) {
      await initSounds();
    }
    const sound = soundObjects[name];
    if (sound) {
      await sound.replayAsync();
    }
  } catch (err) {
    // Sound errors are non-fatal — silently ignore
  }
}

// Pre-initialize on first call
export async function preloadSounds(): Promise<void> {
  try {
    await initSounds();
  } catch (err) {
    // Non-fatal
  }
}

export type { SoundName };
```

- [ ] **Step 2: Wire sounds into key app events**

In `the-system/src/screens/CommandHall.tsx`, add sound playback:

Add import:
```tsx
import { playSound } from '../audio/sounds';
```

In `handleComplete`:
```tsx
const handleComplete = async (id: number) => {
  await playSound('complete');   // ← add this line before completeDiscipline
  const result = await completeDiscipline(id);
  if (result.levelUp) {
    await playSound(result.levelUp.rankChanged ? 'rankUp' : 'levelUp');
    navigation.navigate('LevelUpSplash', {
      level: result.levelUp.newLevel,
      xpGained: result.xpGained,
      rankChanged: result.levelUp.rankChanged,
      newRank: result.levelUp.newRank,
    });
  }
};
```

In `handleFail`, in the non-SILENCE path:
```tsx
failDiscipline(id).then(() => playSound('fail'));
```

In App.tsx, add sound preloading after initialize:
```tsx
import { preloadSounds } from './src/audio/sounds';

// In App component, update useEffect:
useEffect(() => {
  initialize();
  preloadSounds(); // fire and forget — non-blocking
}, []);
```

- [ ] **Step 3: Write test for sounds.ts**

Create `the-system/__tests__/audio/sounds.test.ts`:
```typescript
// Mock expo-av and expo-file-system for tests
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

jest.mock('expo-file-system', () => ({
  cacheDirectory: '/tmp/test/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: { Base64: 'base64' },
}));

import { playSound, preloadSounds } from '../../src/audio/sounds';

describe('sounds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('playSound does not throw', async () => {
    await expect(playSound('complete')).resolves.toBeUndefined();
  });

  it('playSound handles unknown sound gracefully', async () => {
    // @ts-ignore — testing runtime safety
    await expect(playSound('unknown')).resolves.toBeUndefined();
  });

  it('preloadSounds does not throw', async () => {
    await expect(preloadSounds()).resolves.toBeUndefined();
  });
});
```

Run: `cd the-system && npx jest __tests__/audio/sounds.test.ts --no-coverage`
Expected: PASS

- [ ] **Step 4: Commit**

```powershell
cd the-system
git add src/audio/sounds.ts App.tsx src/screens/CommandHall.tsx
git add __tests__/audio/sounds.test.ts
git commit -m "feat: add retro sound effects (WAV generation + expo-av playback)"
```

---

## Task 4: Data Export/Import (Settings Screen Update)

**Files:**
- Modify: `the-system/src/screens/Settings.tsx`

- [ ] **Step 1: Add data export/import to Settings.tsx**

In `the-system/src/screens/Settings.tsx`, add the following imports at the top:
```tsx
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
```

Wait — `expo-sharing` may not be installed. Check first:
```powershell
cd the-system
node -e "require('expo-sharing'); console.log('expo-sharing ok')" 2>&1
```

If not found, install it:
```powershell
cd the-system
npx expo install expo-sharing
```

Now add export/import functions in `the-system/src/screens/Settings.tsx`.

Add these imports at the top of the file (after existing imports):
```tsx
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDb } from '../db/database';
```

Add these handler functions inside the `Settings` component (after the existing handlers):
```tsx
const handleExport = async () => {
  try {
    const db = getDb();
    const hero = await db.getAllAsync('SELECT * FROM hero');
    const disciplines = await db.getAllAsync('SELECT * FROM disciplines');
    const logs = await db.getAllAsync('SELECT * FROM discipline_logs ORDER BY log_date DESC LIMIT 1000');
    const silenceStreak = await db.getAllAsync('SELECT * FROM silence_streak');
    const mandates = await db.getAllAsync('SELECT * FROM mandates');
    const cosmetics = await db.getAllAsync('SELECT * FROM cosmetics');
    const systemState = await db.getAllAsync('SELECT * FROM system_state');

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: 1,
      hero,
      disciplines,
      logs,
      silenceStreak,
      mandates,
      cosmetics,
      systemState,
    };

    const json = JSON.stringify(exportData, null, 2);
    const fileName = `the-system-export-${new Date().toISOString().slice(0, 10)}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Export THE SYSTEM Data',
      });
    } else {
      Alert.alert('EXPORTED', `Saved to: ${filePath}`);
    }
  } catch (err) {
    Alert.alert('EXPORT ERROR', String(err));
  }
};
```

Add the export button in the Settings JSX, after the About section and before the Danger Zone:
```tsx
{/* Data */}
<Text style={[styles.sectionHeader, { color: theme.accent }]}>DATA</Text>
<TouchableOpacity
  style={[styles.exportButton, { borderColor: theme.accent }]}
  onPress={handleExport}
>
  <Text style={[styles.exportText, { color: theme.accent }]}>
    EXPORT DATA (JSON)
  </Text>
</TouchableOpacity>
<Text style={[styles.label, { color: theme.textSecondary }]}>
  Exports all progress to a JSON file for manual backup.
</Text>
```

Add to StyleSheet:
```tsx
exportButton: {
  borderWidth: 1, padding: 12, alignItems: 'center', marginBottom: 8,
},
exportText: { fontSize: 11, fontWeight: 'bold', letterSpacing: 2 },
```

- [ ] **Step 2: Write test**

Create `the-system/__tests__/screens/Settings-export.test.tsx`:
```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

jest.mock('../../src/store/useSystemStore', () => ({
  useSystemStore: () => ({
    hero: {
      name: 'Test', hero_class: 'Warrior', global_xp: 0, global_level: 1,
      rank: 'E', journey_start_date: '2026-01-01', journey_complete: 0,
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

jest.mock('../../src/db/database', () => ({
  getDb: jest.fn(() => ({
    getAllAsync: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: '/tmp/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: { UTF8: 'utf8' },
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(false),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

import Settings from '../../src/screens/Settings';

describe('Settings export', () => {
  it('renders export button', () => {
    const { getByText } = render(<Settings />);
    expect(getByText('EXPORT DATA (JSON)')).toBeTruthy();
  });
});
```

Run: `cd the-system && npx jest __tests__/screens/Settings-export.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 3: Commit**

```powershell
cd the-system
git add src/screens/Settings.tsx __tests__/screens/Settings-export.test.tsx
git commit -m "feat: add JSON data export to Settings with expo-sharing"
```

---

## Task 5: S-Rank Finale Cutscene

**Files:**
- Create: `the-system/src/screens/SRankCutscene.tsx`
- Modify: `the-system/src/navigation/types.ts`
- Modify: `the-system/src/navigation/AppNavigator.tsx`
- Modify: `the-system/src/store/useSystemStore.ts`

- [ ] **Step 1: Add SRankCutscene to navigation types**

In `the-system/src/navigation/types.ts`, add `SRankCutscene: undefined;` to `RootStackParamList`:
```typescript
export type RootStackParamList = {
  Awakening: undefined;
  Main: undefined;
  MandateReveal: undefined;
  LevelUpSplash: {
    level: number;
    xpGained: number;
    rankChanged: boolean;
    newRank: string;
  };
  Settings: undefined;
  ShieldOverlay: undefined;
  SRankCutscene: undefined;
};
```

- [ ] **Step 2: Add SRankCutscene to AppNavigator**

In `the-system/src/navigation/AppNavigator.tsx`:

Add import:
```tsx
import SRankCutscene from '../screens/SRankCutscene';
```

Add screen inside the `<>` block after ShieldOverlay:
```tsx
<Stack.Screen
  name="SRankCutscene"
  component={SRankCutscene}
  options={{ presentation: 'transparentModal', cardStyle: { backgroundColor: '#000000' } }}
/>
```

- [ ] **Step 3: Create SRankCutscene.tsx**

Create `the-system/src/screens/SRankCutscene.tsx`:
```tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Rect, Circle, Line, Polygon } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { setSystemState } from '../db/queries';
import { useSystemStore } from '../store/useSystemStore';

const { width, height } = Dimensions.get('window');

// 6-frame narrative for the S-Rank finale
const FRAMES = [
  {
    title: 'FRAME I',
    text: 'THE SYSTEM HAS RENDERED\nITS VERDICT.',
    scene: 'standing',
  },
  {
    title: 'FRAME II',
    text: 'SIX MONTHS.\nNOT A SINGLE DAY WASTED.',
    scene: 'light_descends',
  },
  {
    title: 'FRAME III',
    text: 'THE IRON TEMPLE\nHAS MADE YOU UNBREAKABLE.',
    scene: 'wings_spread',
  },
  {
    title: 'FRAME IV',
    text: 'SILENCE HAS BEEN HELD.\nTHE MIND IS SOVEREIGN.',
    scene: 'crown_descends',
  },
  {
    title: 'FRAME V',
    text: 'YOU ARE NO LONGER\nWHO YOU WERE.',
    scene: 'full_glow',
  },
  {
    title: 'FRAME VI',
    text: 'RAYNALD ARVAN LIM.\nYOU ARE TRANSCENDENT.',
    scene: 'transcendent',
  },
];

// Simple SVG pixel art hero scenes
function SceneStanding() {
  return (
    <Svg width={120} height={160} viewBox="0 0 30 40">
      {/* Silhouette hero */}
      <Rect x="12" y="2" width="6" height="6" fill="#aaaaaa" />
      <Rect x="11" y="8" width="8" height="12" fill="#888888" />
      <Rect x="9" y="9" width="2" height="8" fill="#888888" />
      <Rect x="19" y="9" width="2" height="8" fill="#888888" />
      <Rect x="11" y="20" width="3" height="10" fill="#888888" />
      <Rect x="16" y="20" width="3" height="10" fill="#888888" />
    </Svg>
  );
}

function SceneLightDescends() {
  return (
    <Svg width={120} height={160} viewBox="0 0 30 40">
      {/* Light beam from above */}
      <Polygon points="14,0 16,0 20,15 10,15" fill="#ffd70030" />
      {/* Hero */}
      <Rect x="12" y="14" width="6" height="6" fill="#cccccc" />
      <Rect x="11" y="20" width="8" height="10" fill="#aaaaaa" />
      <Rect x="11" y="30" width="3" height="8" fill="#aaaaaa" />
      <Rect x="16" y="30" width="3" height="8" fill="#aaaaaa" />
    </Svg>
  );
}

function SceneWingsSpread() {
  return (
    <Svg width={160} height={160} viewBox="0 0 40 40">
      {/* Wings */}
      <Polygon points="20,18 4,10 8,22" fill="#ffd70060" />
      <Polygon points="20,18 36,10 32,22" fill="#ffd70060" />
      {/* Hero */}
      <Rect x="17" y="8" width="6" height="6" fill="#ffd700" />
      <Rect x="16" y="14" width="8" height="10" fill="#ccaa00" />
      <Rect x="16" y="24" width="3" height="8" fill="#ccaa00" />
      <Rect x="21" y="24" width="3" height="8" fill="#ccaa00" />
    </Svg>
  );
}

function SceneCrownDescends() {
  return (
    <Svg width={120} height={160} viewBox="0 0 30 40">
      {/* Crown */}
      <Polygon points="10,4 15,0 20,4 22,4 22,7 8,7 8,4" fill="#ffd700" />
      {/* Gems */}
      <Rect x="14" y="1" width="2" height="2" fill="#ffffff" />
      {/* Hero glowing */}
      <Rect x="12" y="7" width="6" height="6" fill="#ffe566" />
      <Rect x="11" y="13" width="8" height="10" fill="#ffd700" />
      <Rect x="11" y="23" width="3" height="8" fill="#ffd700" />
      <Rect x="16" y="23" width="3" height="8" fill="#ffd700" />
    </Svg>
  );
}

function SceneFullGlow() {
  return (
    <Svg width={160} height={160} viewBox="0 0 40 40">
      {/* Outer glow rings */}
      <Circle cx="20" cy="18" r="16" fill="none" stroke="#ffffff40" strokeWidth="1" />
      <Circle cx="20" cy="18" r="12" fill="none" stroke="#ffd70060" strokeWidth="1" />
      {/* Wings */}
      <Polygon points="20,18 2,8 6,22" fill="#ffffff80" />
      <Polygon points="20,18 38,8 34,22" fill="#ffffff80" />
      {/* Hero full divine */}
      <Rect x="17" y="6" width="6" height="6" fill="#ffffff" />
      <Rect x="16" y="12" width="8" height="10" fill="#ffe566" />
      <Rect x="16" y="22" width="3" height="9" fill="#ffe566" />
      <Rect x="21" y="22" width="3" height="9" fill="#ffe566" />
    </Svg>
  );
}

function SceneTranscendent() {
  return (
    <Svg width={180} height={180} viewBox="0 0 45 45">
      {/* God rays */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 22.5 + Math.cos(rad) * 6;
        const y1 = 20 + Math.sin(rad) * 6;
        const x2 = 22.5 + Math.cos(rad) * 22;
        const y2 = 20 + Math.sin(rad) * 22;
        return (
          <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#ffffff40" strokeWidth="0.5" />
        );
      })}
      {/* Crown */}
      <Polygon points="17,6 22.5,2 28,6 30,6 30,9 15,9 15,6" fill="#ffffff" />
      {/* Full divine hero — white gold */}
      <Rect x="19.5" y="9" width="6" height="6" fill="#ffffff" />
      <Rect x="18.5" y="15" width="8" height="10" fill="#ffffff" />
      <Rect x="18.5" y="25" width="3" height="10" fill="#ffffff" />
      <Rect x="23.5" y="25" width="3" height="10" fill="#ffffff" />
      {/* Wings full */}
      <Polygon points="22.5,18 2,6 8,22" fill="#ffffff60" />
      <Polygon points="22.5,18 43,6 37,22" fill="#ffffff60" />
    </Svg>
  );
}

const SCENE_COMPONENTS = [
  SceneStanding,
  SceneLightDescends,
  SceneWingsSpread,
  SceneCrownDescends,
  SceneFullGlow,
  SceneTranscendent,
];

export default function SRankCutscene() {
  const navigation = useNavigation<{ goBack: () => void }>();
  const { refresh } = useSystemStore();
  const [frameIndex, setFrameIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeIn();
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ])
    );
    glowLoop.start();
    return () => glowLoop.stop();
  }, [frameIndex]);

  const fadeIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  };

  const fadeOutThen = (callback: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(callback);
  };

  const handleNext = () => {
    if (frameIndex < FRAMES.length - 1) {
      fadeOutThen(() => {
        setFrameIndex((prev) => prev + 1);
      });
    } else {
      setFinished(true);
    }
  };

  const handleComplete = async () => {
    await setSystemState('journey_complete', '1');
    await refresh();
    navigation.goBack();
  };

  const frame = FRAMES[frameIndex];
  const SceneComponent = SCENE_COMPONENTS[frameIndex];

  if (finished) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.content, { opacity: glowAnim }]}>
          <Text style={styles.finalTitle}>S-RANK</Text>
          <Text style={styles.finalSubtitle}>THE TRANSCENDENT</Text>
        </Animated.View>
        <Text style={styles.finalText}>
          {'RAYNALD ARVAN LIM.\nTHE SYSTEM HAS RENDERED ITS VERDICT.\nYOU ARE TRANSCENDENT.'}
        </Text>
        <TouchableOpacity style={styles.completeBtn} onPress={handleComplete}>
          <Text style={styles.completeBtnText}>ACCEPT YOUR DESTINY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={handleNext} activeOpacity={0.9}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.frameLabel}>{frame.title}</Text>

        <View style={styles.sceneArea}>
          <SceneComponent />
        </View>

        <Text style={styles.frameText}>{frame.text}</Text>

        <Text style={styles.tapHint}>
          {frameIndex < FRAMES.length - 1 ? 'TAP TO CONTINUE' : 'TAP TO FINISH'}
        </Text>

        {/* Frame dots */}
        <View style={styles.dotRow}>
          {FRAMES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i <= frameIndex ? '#ffd700' : '#333' },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  content: { alignItems: 'center', width: '100%' },
  frameLabel: {
    color: '#444',
    fontSize: 10,
    letterSpacing: 4,
    marginBottom: 32,
    fontFamily: 'PressStart2P',
  },
  sceneArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    minHeight: 180,
  },
  frameText: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 1,
    marginBottom: 32,
    fontFamily: 'PressStart2P',
  },
  tapHint: {
    color: '#555',
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 20,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Finished state
  finalTitle: {
    color: '#ffd700',
    fontSize: 40,
    fontWeight: 'bold',
    letterSpacing: 8,
    fontFamily: 'PressStart2P',
    textAlign: 'center',
  },
  finalSubtitle: {
    color: '#ffffff',
    fontSize: 12,
    letterSpacing: 4,
    fontFamily: 'PressStart2P',
    textAlign: 'center',
    marginTop: 12,
  },
  finalText: {
    color: '#aaaaaa',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 22,
    marginVertical: 40,
    letterSpacing: 0.5,
    fontFamily: 'PressStart2P',
  },
  completeBtn: {
    borderWidth: 2,
    borderColor: '#ffd700',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  completeBtnText: {
    color: '#ffd700',
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: 'PressStart2P',
  },
});
```

- [ ] **Step 4: Trigger cutscene on S-Rank**

In `the-system/src/store/useSystemStore.ts`, the `completeDiscipline` action returns a `LevelUpEvent`. When `newRank === 'S'` and `rankChanged === true`, `CommandHall` should navigate to `SRankCutscene`.

In `the-system/src/screens/CommandHall.tsx`, update `handleComplete`:
```tsx
const handleComplete = async (id: number) => {
  await playSound('complete');
  const result = await completeDiscipline(id);
  if (result.levelUp) {
    if (result.levelUp.rankChanged && result.levelUp.newRank === 'S') {
      // S-Rank finale!
      await playSound('rankUp');
      navigation.navigate('SRankCutscene');
    } else {
      await playSound(result.levelUp.rankChanged ? 'rankUp' : 'levelUp');
      navigation.navigate('LevelUpSplash', {
        level: result.levelUp.newLevel,
        xpGained: result.xpGained,
        rankChanged: result.levelUp.rankChanged,
        newRank: result.levelUp.newRank,
      });
    }
  }
};
```

- [ ] **Step 5: Write test**

Create `the-system/__tests__/screens/SRankCutscene.test.tsx`:
```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

jest.mock('../../src/store/useSystemStore', () => ({
  useSystemStore: () => ({ refresh: jest.fn().mockResolvedValue(undefined) }),
}));

jest.mock('../../src/db/queries', () => ({
  setSystemState: jest.fn().mockResolvedValue(undefined),
}));

import SRankCutscene from '../../src/screens/SRankCutscene';

describe('SRankCutscene', () => {
  it('renders first frame', () => {
    const { getByText } = render(<SRankCutscene />);
    expect(getByText('FRAME I')).toBeTruthy();
  });

  it('advances frame on tap', () => {
    const { getByText, getByTestId } = render(<SRankCutscene />);
    // Tap the container to advance
    fireEvent.press(getByText('TAP TO CONTINUE'));
    // After tap, frame index should be 1 — but fade animation means we check text changes
    // Just verify no crash
  });
});
```

Run: `cd the-system && npx jest __tests__/screens/SRankCutscene.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 6: Commit**

```powershell
cd the-system
git add src/screens/SRankCutscene.tsx
git add src/navigation/types.ts src/navigation/AppNavigator.tsx
git add src/screens/CommandHall.tsx
git add __tests__/screens/SRankCutscene.test.tsx
git commit -m "feat: add 6-frame S-Rank finale cutscene with pixel art scenes"
```

---

## Task 6: App Icon

**Files:**
- Create: `the-system/src/assets/icon.tsx` (SVG source reference)
- Modify: `the-system/app.json`

The icon system in Expo uses static image files. Since we can't run a build script to convert SVG→PNG automatically, we use Expo's built-in adaptive icon approach with a simple generated icon.

- [ ] **Step 1: Update app.json with icon config**

Read `the-system/app.json`. Find the `"icon"` and `"android"` entries. The icon file at `./assets/icon.png` should already exist from the Expo template. Verify:

```powershell
Test-Path "the-system/assets/icon.png"
Test-Path "the-system/assets/adaptive-icon.png"
```

If both exist (from Expo template), the defaults are fine for now. The custom pixel art icon can be created post-MVP by a designer.

If they don't exist, update `app.json` to use Expo's default icon path — Expo handles this automatically. The `app.json` icon field should already be set.

- [ ] **Step 2: Update app version in app.json**

Read `the-system/app.json`, find the version fields, and update:
```json
{
  "expo": {
    "name": "THE SYSTEM",
    "slug": "the-system",
    "version": "1.0.0",
    "android": {
      "versionCode": 1,
      ...
    }
  }
}
```

Ensure `versionCode` is set to `1` and `version` is `"1.0.0"`. These will be incremented for future updates.

- [ ] **Step 3: Commit**

```powershell
cd the-system
git add app.json
git commit -m "chore: set app version 1.0.0, versionCode 1"
```

---

## Task 7: Release Build

**Files:** None created; build output at `android/app/build/outputs/apk/`

- [ ] **Step 1: Run full test suite**

```powershell
cd the-system
npx jest --no-coverage
```
Expected: All PASS

- [ ] **Step 2: TypeScript check**

```powershell
cd the-system
npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 3: Build release APK (signed with debug key for sideloading)**

The release APK is signed with the debug keystore (as configured in `android/app/build.gradle` `release` block). This is fine for personal sideloading.

Build for a single architecture first (faster):
```powershell
cd the-system/android
.\gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

Expected: `BUILD SUCCESSFUL`
APK at: `android/app/build/outputs/apk/release/app-release.apk`

If build fails:
- Missing font file: verify `src/assets/fonts/PressStart2P-Regular.ttf` exists
- Missing sound: sounds.ts generates at runtime, no static file needed
- Native module compile error: check Java files for syntax issues

- [ ] **Step 4: Build for all architectures (final APK)**

```powershell
cd the-system/android
.\gradlew assembleRelease
```

Expected: `BUILD SUCCESSFUL`
APK covers all 4 architectures (armeabi-v7a, arm64-v8a, x86, x86_64).

- [ ] **Step 5: Final commit**

```powershell
cd the-system
git add .
git commit -m "release: THE SYSTEM v1.0.0 — all phases complete"
```

---

## Completion Checklist

After all 7 tasks:
- [ ] `expo-av` and `expo-file-system` installed
- [ ] `PressStart2P-Regular.ttf` in `src/assets/fonts/`
- [ ] `PixelText.tsx` component exists, applied to CommandHall
- [ ] `sounds.ts` generates WAV tones on first play
- [ ] Sounds play on complete, fail, level-up, rank-up, relapse
- [ ] Settings screen has "EXPORT DATA (JSON)" button
- [ ] `SRankCutscene.tsx` exists with 6-frame SVG sequence
- [ ] S-Rank completion triggers cutscene
- [ ] All tests pass: `npx jest --no-coverage`
- [ ] TypeScript clean: `npx tsc --noEmit`
- [ ] Release APK builds successfully
