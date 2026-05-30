import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSystemStore } from '../store/useSystemStore';
import ShieldModule from '../native/ShieldModule';

const LOCK_DELAY_SECONDS = 5;

export default function ShieldOverlay() {
  const navigation = useNavigation<{ goBack: () => void }>();
  const { currentTheme: theme } = useSystemStore();
  const [countdown, setCountdown] = useState(LOCK_DELAY_SECONDS);
  const [locking, setLocking] = useState(false);
  const [adminReady, setAdminReady] = useState<boolean | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    ShieldModule.isAdminActive().then(setAdminReady);
  }, []);

  useEffect(() => {
    if (adminReady !== true || locking) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [adminReady, locking, pulseAnim]);

  const startLock = () => {
    setLocking(true);
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          ShieldModule.lockNow()
            .then(() => navigation.goBack())
            .catch((err) => {
              Alert.alert('SHIELD ERROR', String(err));
              navigation.goBack();
            });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancel = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    navigation.goBack();
  };

  const handleGrantAdmin = async () => {
    await ShieldModule.openAdminSettings();
  };

  if (adminReady === false) {
    return (
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.background, borderColor: '#ff4444' }]}>
          <Text style={[styles.title, { color: '#ff4444' }]}>SHIELD PROTOCOL</Text>
          <Text style={[styles.body, { color: theme.text }]}>
            Device Admin permission is required for screen lock.
          </Text>
          <TouchableOpacity style={[styles.btn, { borderColor: theme.accent }]} onPress={handleGrantAdmin}>
            <Text style={[styles.btnText, { color: theme.accent }]}>GRANT DEVICE ADMIN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={[styles.cancelText, { color: theme.textSecondary }]}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <View style={[styles.container, { backgroundColor: theme.background, borderColor: '#ff4444' }]}>
        <Text style={[styles.title, { color: '#ff4444' }]}>SHIELD PROTOCOL</Text>
        {!locking ? (
          <>
            <Text style={[styles.body, { color: theme.text }]}>Screen will lock immediately.</Text>
            <Text style={[styles.warning, { color: theme.textSecondary }]}>
              You can cancel within {LOCK_DELAY_SECONDS} seconds after activating.
            </Text>
            <TouchableOpacity style={[styles.lockBtn, { backgroundColor: '#ff4444' }]} onPress={startLock}>
              <Text style={styles.lockBtnText}>ACTIVATE SHIELD</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>CANCEL</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Animated.Text style={[styles.countdown, { color: '#ff4444', transform: [{ scale: pulseAnim }] }]}>
              {countdown}
            </Animated.Text>
            <Text style={[styles.body, { color: theme.text }]}>
              Locking in {countdown} second{countdown !== 1 ? 's' : ''}...
            </Text>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>CANCEL</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  container: { width: 300, padding: 32, borderWidth: 2, alignItems: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', letterSpacing: 3, marginBottom: 20 },
  body: { fontSize: 12, textAlign: 'center', marginBottom: 12, lineHeight: 20 },
  warning: { fontSize: 10, textAlign: 'center', marginBottom: 24 },
  btn: { borderWidth: 2, paddingHorizontal: 20, paddingVertical: 10, marginBottom: 12 },
  btnText: { fontSize: 11, fontWeight: 'bold', letterSpacing: 2 },
  lockBtn: { paddingHorizontal: 24, paddingVertical: 14, marginBottom: 12 },
  lockBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', letterSpacing: 2 },
  cancelBtn: { padding: 8 },
  cancelText: { fontSize: 10, letterSpacing: 1 },
  countdown: { fontSize: 72, fontWeight: 'bold', marginBottom: 12 },
});
