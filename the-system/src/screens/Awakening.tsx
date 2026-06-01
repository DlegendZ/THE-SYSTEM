import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useSystemStore } from '../store/useSystemStore';
import { requestNotificationPermissions } from '../notifications/scheduler';
import { format } from 'date-fns';
import SystemBackground from '../components/fx/SystemBackground';
import type { HeroClass } from '../types';

const { width } = Dimensions.get('window');

type Step = 'intro' | 'name' | 'class' | 'permissions' | 'accept';

const CLASSES: { name: HeroClass; desc: string }[] = [
  { name: 'Warrior', desc: 'Heavy armor, sword & shield, strong stance' },
  { name: 'Mage', desc: 'Robes, staff, arcane symbols' },
  { name: 'Rogue', desc: 'Light armor, dual blades, crouched stance' },
];

export default function Awakening() {
  const { createNewHero, completeOnboarding } = useSystemStore();

  const [step, setStep] = useState<Step>('intro');
  const [name, setName] = useState('');
  const [heroClass, setHeroClass] = useState<HeroClass | null>(null);
  const [introText, setIntroText] = useState('');
  const opacity = useRef(new Animated.Value(0)).current;

  const fullIntro = 'THE SYSTEM HAS DETECTED A CANDIDATE.';

  useEffect(() => {
    if (step === 'intro') {
      let i = 0;
      const interval = setInterval(() => {
        setIntroText(fullIntro.slice(0, i + 1));
        i++;
        if (i >= fullIntro.length) clearInterval(interval);
      }, 60);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleAccept = async () => {
    if (!heroClass) return;
    await createNewHero(name, heroClass);
    await completeOnboarding();
  };

  return (
    <View style={styles.container}>
      <SystemBackground color="#D97757" background="#262624" />
      {step === 'intro' && (
        <TouchableOpacity style={styles.fullScreen} onPress={() => setStep('name')}>
          <Animated.View style={{ opacity }}>
            <Text style={styles.introText}>{introText}</Text>
            {introText.length >= fullIntro.length && (
              <Text style={styles.tapHint}>TAP TO CONTINUE</Text>
            )}
          </Animated.View>
        </TouchableOpacity>
      )}

      {step === 'name' && (
        <View style={styles.section}>
          <Text style={styles.prompt}>IDENTIFY YOURSELF.</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholderTextColor="#666"
            selectionColor="#D97757"
          />
          <TouchableOpacity
            style={styles.goldBtn}
            onPress={() => name.trim() && setStep('class')}
          >
            <Text style={styles.goldBtnText}>CONFIRM</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'class' && (
        <View style={styles.section}>
          <Text style={styles.prompt}>SELECT YOUR CLASS.</Text>
          {CLASSES.map((c) => (
            <TouchableOpacity
              key={c.name}
              style={[
                styles.classCard,
                heroClass === c.name && styles.classCardSelected,
              ]}
              onPress={() => setHeroClass(c.name)}
            >
              <Text style={styles.className}>{c.name.toUpperCase()}</Text>
              <Text style={styles.classDesc}>{c.desc}</Text>
            </TouchableOpacity>
          ))}
          {heroClass && (
            <TouchableOpacity
              style={styles.goldBtn}
              onPress={() => setStep('permissions')}
            >
              <Text style={styles.goldBtnText}>CONFIRM</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {step === 'permissions' && (
        <View style={styles.section}>
          <Text style={styles.prompt}>
            THE SYSTEM REQUIRES CERTAIN PERMISSIONS TO ENFORCE YOUR COVENANT.
          </Text>
          <TouchableOpacity
            style={styles.permBtn}
            onPress={async () => {
              await requestNotificationPermissions();
            }}
          >
            <Text style={styles.permBtnText}>GRANT NOTIFICATIONS</Text>
            <Text style={styles.permDesc}>Required to deliver system mandates.</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.goldBtn, { marginTop: 24 }]}
            onPress={() => setStep('accept')}
          >
            <Text style={styles.goldBtnText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'accept' && (
        <View style={styles.section}>
          <Text style={styles.prompt}>YOUR COVENANT BEGINS.</Text>
          <Text style={styles.dateText}>
            {format(new Date(), 'yyyy-MM-dd')}
          </Text>
          <TouchableOpacity style={styles.goldBtn} onPress={handleAccept}>
            <Text style={styles.goldBtnText}>I ACCEPT</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#262624' },
  fullScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  section: { flex: 1, justifyContent: 'center', padding: 32 },
  introText: { color: '#D97757', fontSize: 20, textAlign: 'center', fontWeight: 'bold' },
  tapHint: { color: '#666', fontSize: 10, textAlign: 'center', marginTop: 32 },
  prompt: { color: '#D97757', fontSize: 16, textAlign: 'center', marginBottom: 24, fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#D97757',
    color: '#fff',
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  goldBtn: {
    backgroundColor: '#D97757',
    padding: 14,
    alignItems: 'center',
    borderRadius: 4,
  },
  goldBtnText: { color: '#000', fontSize: 14, fontWeight: 'bold' },
  classCard: {
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    marginVertical: 6,
    borderRadius: 4,
  },
  classCardSelected: { borderColor: '#D97757', backgroundColor: '#322E29' },
  className: { color: '#D97757', fontSize: 14, fontWeight: 'bold' },
  classDesc: { color: '#999', fontSize: 11, marginTop: 4 },
  permBtn: {
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    marginVertical: 6,
    borderRadius: 4,
  },
  permBtnText: { color: '#D97757', fontSize: 12, fontWeight: 'bold' },
  permDesc: { color: '#666', fontSize: 10, marginTop: 4 },
  dateText: { color: '#D97757', fontSize: 24, textAlign: 'center', marginBottom: 24, fontWeight: 'bold' },
});
