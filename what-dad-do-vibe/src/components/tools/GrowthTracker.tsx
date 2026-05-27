import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../styles/tokens';
import { GrowthChart } from './GrowthChart';
import { loadGrowthRecords, saveGrowthRecords, GrowthRecordData } from '../../lib/storage';

interface GrowthRecord {
  month: number;
  height: number;
  weight: number;
}

export function GrowthTracker({ userId, babyGender }: { userId: string; babyGender?: string }) {
  const [gender, setGender] = useState<'boy' | 'girl'>(babyGender === 'girl' ? 'girl' : 'boy');
  const [month, setMonth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [records, setRecords] = useState<GrowthRecord[]>([]);

  // 加载历史记录
  useEffect(() => {
    if (!userId) return;
    loadGrowthRecords(userId).then(all => setRecords(all));
  }, [userId]);

  const persistRecords = (newRecords: GrowthRecord[]) => {
    if (!userId) return;
    saveGrowthRecords(userId, newRecords);
  };

  const handleAdd = () => {
    const m = parseInt(month, 10);
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (isNaN(m) || m < 0 || m > 36) return;
    if (isNaN(h) || h <= 0) return;
    if (isNaN(w) || w <= 0) return;

    const newRecord: GrowthRecord = { month: m, height: h, weight: w };
    const newRecords = [newRecord, ...records];
    setRecords(newRecords);
    persistRecords(newRecords);
    setMonth('');
    setHeight('');
    setWeight('');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 性别 — 有宝宝数据时自动显示 */}
      <View style={styles.genderRow}>
        <Text style={styles.genderDisplay}>
          {babyGender === 'girl' ? '👧 女童' : '👦 男童'}
        </Text>
      </View>

      {/* 输入区 */}
      <View style={styles.inputRow}>
        <View style={styles.inputField}>
          <Text style={styles.inputLabel}>月龄</Text>
          <TextInput style={styles.input} value={month} onChangeText={setMonth} keyboardType="number-pad" placeholder="0-36" placeholderTextColor={colors.muted} maxLength={2} />
        </View>
        <View style={styles.inputField}>
          <Text style={styles.inputLabel}>身高(cm)</Text>
          <TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="decimal-pad" placeholder="50" placeholderTextColor={colors.muted} />
        </View>
        <View style={styles.inputField}>
          <Text style={styles.inputLabel}>体重(kg)</Text>
          <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="3.3" placeholderTextColor={colors.muted} />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>记录</Text>
        </TouchableOpacity>
      </View>

      {/* 身高曲线 */}
      <GrowthChart gender={gender} metric="length" records={records.map(r => ({ month: r.month, value: r.height }))} />

      {/* 体重曲线 */}
      <GrowthChart gender={gender} metric="weight" records={records.map(r => ({ month: r.month, value: r.weight }))} />

      {/* 历史记录 */}
      {records.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>历史记录</Text>
          {records.slice(0, 10).map((r, i) => (
            <View key={i} style={styles.historyItem}>
              <Text style={styles.historyText}>{r.month}月龄</Text>
              <Text style={styles.historyText}>{r.height}cm</Text>
              <Text style={styles.historyText}>{r.weight}kg</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { maxHeight: 500 },
  genderRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  genderBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: 8, alignItems: 'center', backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  genderBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  genderText: { ...typography.footnote, fontWeight: '500', color: colors.muted },
  genderTextActive: { color: '#fff' },
  genderDisplay: { ...typography.callout, fontWeight: '600', color: colors.accent },
  inputRow: { flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-end', marginBottom: spacing.md },
  inputField: { flex: 1 },
  inputLabel: { ...typography.caption1, color: colors.muted, marginBottom: 2 },
  input: { ...typography.footnote, color: colors.fg, backgroundColor: colors.surfaceSecondary, borderRadius: 6, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs + 2, borderWidth: 1, borderColor: colors.border, textAlign: 'center' },
  addBtn: { backgroundColor: colors.accent, borderRadius: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
  addBtnText: { ...typography.footnote, fontWeight: '600', color: '#fff' },
  historySection: { marginTop: spacing.md },
  historyTitle: { ...typography.caption1, fontWeight: '600', color: colors.muted, marginBottom: spacing.xs },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  historyText: { ...typography.footnote, color: colors.fg },
});

export default GrowthTracker;
