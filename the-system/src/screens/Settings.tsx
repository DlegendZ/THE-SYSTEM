import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSystemStore } from '../store/useSystemStore';
import { getSystemState, setSystemState } from '../db/queries';
import { differenceInCalendarDays, parseISO } from 'date-fns';
// expo-file-system v18+ moved legacy APIs to expo-file-system/legacy
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getDb } from '../db/database';
import SystemBackground from '../components/fx/SystemBackground';
import RichNotification from '../native/RichNotification';

type Nav = { goBack: () => void };

const INTERVALS = [1, 2, 3, 4, 6];

export default function Settings() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { hero, currentTheme: theme, resetJourney, syncNotifications } = useSystemStore();

  const [notifInterval, setNotifInterval] = useState(3);
  const [quietStart, setQuietStart] = useState('00:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [resetConfirm, setResetConfirm] = useState('');

  useEffect(() => {
    (async () => {
      const interval = await getSystemState('notification_interval');
      const qs = await getSystemState('quiet_start');
      const qe = await getSystemState('quiet_end');
      if (interval) setNotifInterval(parseInt(interval, 10));
      if (qs) setQuietStart(qs);
      if (qe) setQuietEnd(qe);
    })();
  }, []);

  const saveInterval = async (v: number) => {
    setNotifInterval(v);
    await setSystemState('notification_interval', String(v));
    await syncNotifications();
  };

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

  const handleResetJourney = async () => {
    if (resetConfirm.trim() !== 'I ACCEPT THE RESET') {
      Alert.alert('TYPE THE PHRASE', 'Type exactly: I ACCEPT THE RESET');
      return;
    }
    Alert.alert(
      'FINAL WARNING',
      'This will wipe ALL data. There is no undo.',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'RESET',
          style: 'destructive',
          onPress: async () => {
            try {
              setResetConfirm('');
              await resetJourney();
            } catch (err) {
              Alert.alert('RESET ERROR', String(err));
            }
          },
        },
      ]
    );
  };

  const journeyDays = hero
    ? differenceInCalendarDays(new Date(), parseISO(hero.journey_start_date)) + 1
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SystemBackground color={theme.accent} background={theme.background} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: theme.text }]}>SETTINGS</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.closeBtn, { color: theme.textSecondary }]}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionHeader, { color: theme.accent }]}>NOTIFICATIONS</Text>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Interval (hours)</Text>
        <View style={styles.intervalRow}>
          {INTERVALS.map((v) => (
            <TouchableOpacity
              key={v}
              style={[
                styles.intervalBtn,
                {
                  borderColor: notifInterval === v ? theme.accent : theme.textSecondary,
                  backgroundColor: notifInterval === v ? theme.accent + '30' : 'transparent',
                },
              ]}
              onPress={() => saveInterval(v)}
            >
              <Text style={[styles.intervalText, { color: notifInterval === v ? theme.accent : theme.textSecondary }]}>
                {v}h
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: theme.textSecondary }]}>
          Quiet hours: {quietStart} – {quietEnd}
        </Text>

        <Text style={[styles.sectionHeader, { color: theme.accent }]}>ABOUT</Text>
        <Text style={[styles.infoText, { color: theme.text }]}>Player: {hero?.name ?? 'Unknown'}</Text>
        <Text style={[styles.infoText, { color: theme.text }]}>Journey start: {hero?.journey_start_date ?? '—'}</Text>
        <Text style={[styles.infoText, { color: theme.text }]}>Day {journeyDays} of 180</Text>

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

        <TouchableOpacity
          style={[styles.exportButton, { borderColor: theme.accent, marginTop: 8 }]}
          onPress={async () => {
            const banner = hero ? `notif_${hero.hero_class.toLowerCase()}_${hero.rank.toLowerCase()}` : undefined;
            const ok = await RichNotification.presentNow(
              'THE SYSTEM',
              'THE SYSTEM TESTS YOUR RESOLVE. ANSWER THE CALL.',
              banner
            );
            if (!ok) Alert.alert('NOTIFICATION', 'Rich notifications need the latest native build. Rebuild the app.');
          }}
        >
          <Text style={[styles.exportText, { color: theme.accent }]}>TEST NOTIFICATION</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionHeader, { color: '#ff4444' }]}>DANGER ZONE</Text>
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          Type "I ACCEPT THE RESET" to enable reset:
        </Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: '#ff4444' }]}
          value={resetConfirm}
          onChangeText={setResetConfirm}
          placeholder="Type here..."
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="characters"
        />
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: resetConfirm === 'I ACCEPT THE RESET' ? '#ff4444' : '#333' }]}
          onPress={handleResetJourney}
        >
          <Text style={styles.resetText}>RESET JOURNEY</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#333',
  },
  title: { fontSize: 17, fontWeight: 'bold', letterSpacing: 3 },
  closeBtn: { fontSize: 20, padding: 4 },
  scroll: { flex: 1, padding: 16 },
  sectionHeader: { fontSize: 12, fontWeight: 'bold', letterSpacing: 3, marginTop: 24, marginBottom: 12 },
  label: { fontSize: 13, marginBottom: 8 },
  intervalRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  intervalBtn: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 2 },
  intervalText: { fontSize: 13, fontWeight: 'bold' },
  infoText: { fontSize: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 2, padding: 10, marginBottom: 12, fontSize: 14 },
  resetButton: { padding: 14, alignItems: 'center', borderRadius: 2, marginBottom: 16 },
  resetText: { color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  bottomPadding: { height: 64 },
  exportButton: { borderWidth: 1, padding: 14, alignItems: 'center', marginBottom: 8 },
  exportText: { fontSize: 13, fontWeight: 'bold', letterSpacing: 2 },
});
