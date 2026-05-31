import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSystemStore } from '../store/useSystemStore';
import {
  setDisciplineActive, createCustomDiscipline, deleteDiscipline,
} from '../db/queries';
import type { Discipline } from '../types';

const DIFFICULTY_OPTIONS = ['EASY', 'NORMAL', 'HARD', 'LEGENDARY'] as const;
type Difficulty = typeof DIFFICULTY_OPTIONS[number];

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  EASY: '#4caf50', NORMAL: '#2196f3', HARD: '#ff9800', LEGENDARY: '#f44336',
};

const XP_DEFAULTS: Record<Difficulty, [number, number]> = {
  EASY: [10, 5], NORMAL: [25, 15], HARD: [50, 30], LEGENDARY: [100, 0],
};

interface AddForm {
  name: string;
  description: string;
  difficulty: Difficulty;
  deadlineTime: string;
}

const BLANK_FORM: AddForm = { name: '', description: '', difficulty: 'NORMAL', deadlineTime: '23:59' };

export default function Codex() {
  const insets = useSafeAreaInsets();
  const { disciplines, refresh, currentTheme: theme } = useSystemStore();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddForm>(BLANK_FORM);

  const handleToggleActive = async (d: Discipline) => {
    if (d.code === 'SILENCE' && d.is_active) {
      Alert.alert(
        'DISABLE SILENCE?',
        'Disabling SILENCE Protocol removes streak tracking.',
        [
          { text: 'CANCEL', style: 'cancel' },
          { text: 'DISABLE', style: 'destructive', onPress: async () => { await setDisciplineActive(d.id, !d.is_active); await refresh(); } },
        ]
      );
    } else {
      await setDisciplineActive(d.id, !d.is_active);
      await refresh();
    }
  };

  const handleDelete = (d: Discipline) => {
    if (!d.is_custom) {
      Alert.alert('CANNOT DELETE', 'Core disciplines cannot be deleted. You can disable them.');
      return;
    }
    Alert.alert(
      'DELETE DISCIPLINE',
      `Delete "${d.name}"? All logs will also be deleted.`,
      [
        { text: 'CANCEL', style: 'cancel' },
        { text: 'DELETE', style: 'destructive', onPress: async () => { await deleteDiscipline(d.id); await refresh(); } },
      ]
    );
  };

  const handleAddSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert('NAME REQUIRED', 'Enter a name for this discipline.');
      return;
    }
    const [xpGain, xpLoss] = XP_DEFAULTS[form.difficulty];
    await createCustomDiscipline({
      name: form.name.trim(),
      description: form.description.trim(),
      difficulty: form.difficulty,
      xpGain,
      xpLoss,
      deadlineTime: form.deadlineTime || '23:59',
    });
    await refresh();
    setForm(BLANK_FORM);
    setShowAdd(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={[styles.title, { color: theme.text }]}>THE CODEX</Text>
        <TouchableOpacity style={[styles.addBtn, { borderColor: theme.accent }]} onPress={() => setShowAdd(true)}>
          <Text style={[styles.addBtnText, { color: theme.accent }]}>+ ADD</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {disciplines.map((d) => {
          const diffColor = DIFFICULTY_COLORS[d.difficulty as Difficulty] ?? theme.accent;
          return (
            <View key={d.id} style={[styles.row, { borderBottomColor: '#222222' }]}>
              <View style={[styles.iconBox, { borderColor: diffColor }]}>
                <Text style={[styles.iconCode, { color: diffColor }]}>{d.code.slice(0, 3)}</Text>
              </View>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowName, { color: theme.text }]}>{d.name}</Text>
                <View style={styles.rowMeta}>
                  <View style={[styles.diffBadge, { backgroundColor: diffColor + '30', borderColor: diffColor }]}>
                    <Text style={[styles.diffText, { color: diffColor }]}>{d.difficulty}</Text>
                  </View>
                  <Text style={[styles.xpText, { color: '#4caf50' }]}>+{d.xp_gain}</Text>
                  <Text style={[styles.xpText, { color: '#f44336' }]}>-{d.xp_loss}</Text>
                </View>
                {d.deadline_time && (
                  <Text style={[styles.deadlineText, { color: theme.textSecondary }]}>Deadline: {d.deadline_time}</Text>
                )}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.toggleBtn, { backgroundColor: d.is_active ? theme.accent + '20' : '#333333', borderColor: d.is_active ? theme.accent : '#444444' }]}
                  onPress={() => handleToggleActive(d)}
                >
                  <Text style={[styles.toggleText, { color: d.is_active ? theme.accent : '#666666' }]}>
                    {d.is_active ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
                {d.is_custom && (
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(d)}>
                    <Text style={styles.deleteText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.background, borderColor: theme.accent }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>ADD DISCIPLINE</Text>

            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>NAME</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.accent }]}
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              placeholder="Discipline name"
              placeholderTextColor={theme.textSecondary}
              maxLength={40}
            />

            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.accent }]}
              value={form.description}
              onChangeText={(v) => setForm({ ...form, description: v })}
              placeholder="Brief description"
              placeholderTextColor={theme.textSecondary}
              maxLength={100}
            />

            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>DIFFICULTY</Text>
            <View style={styles.diffRow}>
              {DIFFICULTY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.diffOption, { borderColor: form.difficulty === opt ? DIFFICULTY_COLORS[opt] : '#444444', backgroundColor: form.difficulty === opt ? DIFFICULTY_COLORS[opt] + '30' : 'transparent' }]}
                  onPress={() => setForm({ ...form, difficulty: opt })}
                >
                  <Text style={[styles.diffOptionText, { color: form.difficulty === opt ? DIFFICULTY_COLORS[opt] : '#666666' }]}>
                    {opt.slice(0, 4)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>DEADLINE (HH:MM)</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.accent }]}
              value={form.deadlineTime}
              onChangeText={(v) => setForm({ ...form, deadlineTime: v })}
              placeholder="23:59"
              placeholderTextColor={theme.textSecondary}
              maxLength={5}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: '#666666' }]} onPress={() => { setShowAdd(false); setForm(BLANK_FORM); }}>
                <Text style={[styles.cancelText, { color: '#666666' }]}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.accent }]} onPress={handleAddSubmit}>
                <Text style={styles.submitText}>CREATE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#333333' },
  title: { fontSize: 17, fontWeight: 'bold', letterSpacing: 3 },
  addBtn: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  addBtnText: { fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  scroll: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1 },
  iconBox: { width: 48, height: 48, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iconCode: { fontSize: 12, fontWeight: 'bold' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  diffBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2 },
  diffText: { fontSize: 11, fontWeight: 'bold' },
  xpText: { fontSize: 12 },
  deadlineText: { fontSize: 12, marginTop: 2 },
  actions: { alignItems: 'center', gap: 4 },
  toggleBtn: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 2 },
  toggleText: { fontSize: 12, fontWeight: 'bold' },
  deleteBtn: { padding: 4 },
  deleteText: { color: '#f44336', fontSize: 16 },
  bottomPadding: { height: 64 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalBox: { padding: 24, borderTopWidth: 2 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', letterSpacing: 2, marginBottom: 16 },
  formLabel: { fontSize: 11, letterSpacing: 2, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 2, padding: 10, fontSize: 14, marginBottom: 4 },
  diffRow: { flexDirection: 'row', gap: 8 },
  diffOption: { flex: 1, borderWidth: 1, padding: 8, alignItems: 'center', borderRadius: 2 },
  diffOptionText: { fontSize: 11, fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1, padding: 13, alignItems: 'center' },
  cancelText: { fontSize: 13, fontWeight: 'bold' },
  submitBtn: { flex: 1, padding: 13, alignItems: 'center', borderRadius: 2 },
  submitText: { color: '#000000', fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
});
