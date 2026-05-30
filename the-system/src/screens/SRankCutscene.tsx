import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions,
} from 'react-native';
import Svg, { Rect, Circle, Line, Polygon } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { setSystemState } from '../db/queries';
import { useSystemStore } from '../store/useSystemStore';

const { width, height } = Dimensions.get('window');

const FRAMES = [
  { title: 'FRAME I', text: 'THE SYSTEM HAS RENDERED\nITS VERDICT.', scene: 'standing' },
  { title: 'FRAME II', text: 'SIX MONTHS.\nNOT A SINGLE DAY WASTED.', scene: 'light_descends' },
  { title: 'FRAME III', text: 'THE IRON TEMPLE\nHAS MADE YOU UNBREAKABLE.', scene: 'wings_spread' },
  { title: 'FRAME IV', text: 'SILENCE HAS BEEN HELD.\nTHE MIND IS SOVEREIGN.', scene: 'crown_descends' },
  { title: 'FRAME V', text: 'YOU ARE NO LONGER\nWHO YOU WERE.', scene: 'full_glow' },
  { title: 'FRAME VI', text: 'RAYNALD ARVAN LIM.\nYOU ARE TRANSCENDENT.', scene: 'transcendent' },
];

function SceneStanding() {
  return (
    <Svg width={120} height={160} viewBox="0 0 30 40">
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
      <Polygon points="14,0 16,0 20,15 10,15" fill="#ffd70030" />
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
      <Polygon points="20,18 4,10 8,22" fill="#ffd70060" />
      <Polygon points="20,18 36,10 32,22" fill="#ffd70060" />
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
      <Polygon points="10,4 15,0 20,4 22,4 22,7 8,7 8,4" fill="#ffd700" />
      <Rect x="14" y="1" width="2" height="2" fill="#ffffff" />
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
      <Circle cx="20" cy="18" r="16" fill="none" stroke="#ffffff40" strokeWidth="1" />
      <Circle cx="20" cy="18" r="12" fill="none" stroke="#ffd70060" strokeWidth="1" />
      <Polygon points="20,18 2,8 6,22" fill="#ffffff80" />
      <Polygon points="20,18 38,8 34,22" fill="#ffffff80" />
      <Rect x="17" y="6" width="6" height="6" fill="#ffffff" />
      <Rect x="16" y="12" width="8" height="10" fill="#ffe566" />
      <Rect x="16" y="22" width="3" height="9" fill="#ffe566" />
      <Rect x="21" y="22" width="3" height="9" fill="#ffe566" />
    </Svg>
  );
}

function SceneTranscendent() {
  const rays = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  return (
    <Svg width={180} height={180} viewBox="0 0 45 45">
      {rays.map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 22.5 + Math.cos(rad) * 6;
        const y1 = 20 + Math.sin(rad) * 6;
        const x2 = 22.5 + Math.cos(rad) * 22;
        const y2 = 20 + Math.sin(rad) * 22;
        return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffffff40" strokeWidth="0.5" />;
      })}
      <Polygon points="17,6 22.5,2 28,6 30,6 30,9 15,9 15,6" fill="#ffffff" />
      <Rect x="19.5" y="9" width="6" height="6" fill="#ffffff" />
      <Rect x="18.5" y="15" width="8" height="10" fill="#ffffff" />
      <Rect x="18.5" y="25" width="3" height="10" fill="#ffffff" />
      <Rect x="23.5" y="25" width="3" height="10" fill="#ffffff" />
      <Polygon points="22.5,18 2,6 8,22" fill="#ffffff60" />
      <Polygon points="22.5,18 43,6 37,22" fill="#ffffff60" />
    </Svg>
  );
}

const SCENE_COMPONENTS = [
  SceneStanding, SceneLightDescends, SceneWingsSpread,
  SceneCrownDescends, SceneFullGlow, SceneTranscendent,
];

export default function SRankCutscene() {
  const navigation = useNavigation<{ goBack: () => void }>();
  const { refresh } = useSystemStore();
  const [frameIndex, setFrameIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ])
    );
    glowLoop.start();
    return () => glowLoop.stop();
  }, [frameIndex]);

  const handleNext = () => {
    if (frameIndex < FRAMES.length - 1) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
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
        <View style={styles.dotRow}>
          {FRAMES.map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i <= frameIndex ? '#ffd700' : '#333333' }]} />
          ))}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center', padding: 32 },
  content: { alignItems: 'center', width: '100%' },
  frameLabel: { color: '#444444', fontSize: 10, letterSpacing: 4, marginBottom: 32 },
  sceneArea: { alignItems: 'center', justifyContent: 'center', marginBottom: 48, minHeight: 180 },
  frameText: { color: '#ffffff', fontSize: 12, textAlign: 'center', lineHeight: 22, letterSpacing: 1, marginBottom: 32 },
  tapHint: { color: '#555555', fontSize: 9, letterSpacing: 2, marginBottom: 20 },
  dotRow: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  finalTitle: { color: '#ffd700', fontSize: 40, fontWeight: 'bold', letterSpacing: 8, textAlign: 'center' },
  finalSubtitle: { color: '#ffffff', fontSize: 12, letterSpacing: 4, textAlign: 'center', marginTop: 12 },
  finalText: { color: '#aaaaaa', fontSize: 11, textAlign: 'center', lineHeight: 22, marginVertical: 40, letterSpacing: 0.5 },
  completeBtn: { borderWidth: 2, borderColor: '#ffd700', paddingHorizontal: 24, paddingVertical: 16 },
  completeBtnText: { color: '#ffd700', fontSize: 11, letterSpacing: 2 },
});
