import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { useSystemStore } from '../store/useSystemStore';
import { CornerBrackets } from '../components/ui/CornerBox';
import { requestNotificationPermissions } from '../notifications/scheduler';
import { format } from 'date-fns';
import SystemBackground from '../components/fx/SystemBackground';
import OnboardingOrbit from '../components/fx/OnboardingOrbit';
import type { HeroClass } from '../types';
import { FONTS } from '../theme/typography';

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
  const opacity = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(12)).current;

  const fullIntro = 'THE SYSTEM HAS DETECTED A CANDIDATE.';

  useEffect(() => {
    if (step !== 'intro') return;
    opacity.setValue(0);
    rise.setValue(12);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [step, opacity, rise]);

  const handleAccept = async () => {
    if (!heroClass) return;
    await createNewHero(name, heroClass);
    await completeOnboarding();
  };

  return (
    <View style={styles.container}>
      <SystemBackground color="#D97757" background="#262624" />
      <OnboardingOrbit color="#D97757" />
      {step === 'intro' && (
        <TouchableOpacity style={styles.fullScreen} onPress={() => setStep('name')}>
          <Animated.View style={{ opacity, transform: [{ translateY: rise }] }}>
            <Text style={styles.introText}>{fullIntro}</Text>
            <Text style={styles.tapHint}>Tap to continue</Text>
          </Animated.View>
        </TouchableOpacity>
      )}

      {step === 'name' && (
        <View style={styles.section}>
          <Text style={styles.prompt}>IDENTIFY YOURSELF.</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor="#666"
              selectionColor="#D97757"
            />
            <CornerBrackets color="#D97757" />
          </View>
          <TouchableOpacity
            style={styles.goldBtn}
            onPress={() => name.trim() && setStep('class')}
          >
            <Text style={styles.goldBtnText}>Confirm</Text>
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
              <CornerBrackets color={heroClass === c.name ? '#D97757' : '#333'} />
              <Text style={styles.className}>{c.name}</Text>
              <Text style={styles.classDesc}>{c.desc}</Text>
            </TouchableOpacity>
          ))}
          {heroClass && (
            <TouchableOpacity
              style={styles.goldBtn}
              onPress={() => setStep('permissions')}
            >
              <Text style={styles.goldBtnText}>Confirm</Text>
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
            <CornerBrackets color="#333" />
            <Text style={styles.permBtnText}>Grant notifications</Text>
            <Text style={styles.permDesc}>Required to deliver system mandates.</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.goldBtn, { marginTop: 24 }]}
            onPress={() => setStep('accept')}
          >
            <Text style={styles.goldBtnText}>Continue</Text>
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
            <Text style={styles.goldBtnText}>I accept</Text>
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
  introText: { color: '#D97757', fontSize: 20, textAlign: 'center', fontFamily: FONTS.display },
  tapHint: { color: '#666', fontSize: 10, textAlign: 'center', marginTop: 32, fontFamily: FONTS.body },
  prompt: { color: '#D97757', fontSize: 16, textAlign: 'center', marginBottom: 24, fontFamily: FONTS.bold },
  inputWrap: { position: 'relative', marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: '#D97757',
    color: '#fff',
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: FONTS.body,
  },
  goldBtn: {
    backgroundColor: '#D97757',
    padding: 14,
    alignItems: 'center',
    borderRadius: 4,
  },
  goldBtnText: { color: '#000', fontSize: 14, fontFamily: FONTS.display },
  classCard: {
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    marginVertical: 6,
    borderRadius: 4,
    position: 'relative',
  },
  classCardSelected: { borderColor: '#D97757', backgroundColor: '#322E29' },
  className: { color: '#D97757', fontSize: 14, fontFamily: FONTS.bold },
  classDesc: { color: '#999', fontSize: 11, marginTop: 4, fontFamily: FONTS.body },
  permBtn: {
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    marginVertical: 6,
    borderRadius: 4,
    position: 'relative',
  },
  permBtnText: { color: '#D97757', fontSize: 12, fontFamily: FONTS.bold },
  permDesc: { color: '#666', fontSize: 10, marginTop: 4, fontFamily: FONTS.body },
  dateText: { color: '#D97757', fontSize: 24, textAlign: 'center', marginBottom: 24, fontFamily: FONTS.display },
});
