import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../styles/tokens';
import { GrowthChart } from './GrowthChart';
import { loadGrowthRecords, saveGrowthRecords, GrowthRecordData } from '../../lib/storage';
import { LoadingDot } from './ToolBase';

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
  const [loading, setLoading] = useState(true);

  // 加载历史记录
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const all = await loadGrowthRecords(userId);
        setRecords(all);
      } catch (e) {
        console.error('Failed to load growth records:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const persistRecords = (newRecords: GrowthRecord[]) => {
    if (!userId) return;
    saveGrowthRecords(userId, newRecords);
  };

  const canSave = (() => {
    const m = parseInt(month, 10);
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const monthOk = !isNaN(m) && m >= 0 && m <= 36 && month.length > 0;
    const hasHeight = !isNaN(h) && h > 0;
    const hasWeight = !isNaN(w) && w > 0;
    return monthOk && (hasHeight || hasWeight);
  })();

  const handleAdd = () => {
    const m = parseInt(month, 10);
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const hasHeight = !isNaN(h) && h > 0;
    const hasWeight = !isNaN(w) && w > 0;

    const newRecord: GrowthRecord = { month: m, height: hasHeight ? h : 0, weight: hasWeight ? w : 0 };
    const newRecords = [newRecord, ...records];
    setRecords(newRecords);
    persistRecords(newRecords);
    setMonth('');
    setHeight('');
    setWeight('');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} nestedScrollEnabled>
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
        <TouchableOpacity style={[styles.addBtn, !canSave && styles.addBtnDisabled]} onPress={handleAdd} disabled={!canSave}>
          <Text style={[styles.addBtnText, !canSave && styles.addBtnTextDisabled]}>记录</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingDots}>
            <LoadingDot delay={0} />
            <LoadingDot delay={150} />
            <LoadingDot delay={300} />
          </View>
          <Text style={styles.loadingText}>正在加载生长记录…</Text>
        </View>
      ) : (
        <>
          {/* 合并生长曲线（身长 + 体重双 Y 轴） */}
          <GrowthChart gender={gender} records={records} />

          {/* 历史记录 */}
          {records.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>历史记录</Text>
              <View style={styles.historyTable}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyHeaderText}>月龄</Text>
                  <Text style={styles.historyHeaderText}>身高 (cm)</Text>
                  <Text style={styles.historyHeaderText}>体重 (kg)</Text>
                </View>
                {records.slice(0, 10).map((r, i) => (
                  <View key={i} style={styles.historyItem}>
                    <View style={styles.historyCell}>
                      <Text style={styles.historyText}>{r.month}</Text>
                    </View>
                    <View style={styles.historyCell}>
                      <Text style={styles.historyText}>{r.height}</Text>
                    </View>
                    <View style={styles.historyCell}>
                      <Text style={styles.historyText}>{r.weight}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { maxHeight: 540 },
  genderRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  genderBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: 8, alignItems: 'center', backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  genderBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  genderText: { ...typography.footnote, fontWeight: '500', color: colors.muted },
  genderTextActive: { color: '#fff' },
  genderDisplay: { ...typography.callout, fontWeight: '600', color: colors.accent },
  inputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end', marginBottom: spacing.md },
  inputField: { flex: 1 },
  inputLabel: { ...typography.caption2, color: colors.muted, marginBottom: 4, fontWeight: '500' },
  input: { ...typography.callout, color: colors.fg, backgroundColor: colors.surfaceSecondary, borderRadius: 10, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border, textAlign: 'center', height: 42 },
  addBtn: { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: spacing.lg, height: 42, alignItems: 'center', justifyContent: 'center' },
  addBtnDisabled: { backgroundColor: colors.border },
  addBtnText: { ...typography.callout, fontWeight: '600', color: '#fff' },
  addBtnTextDisabled: { color: colors.muted },
  historySection: { marginTop: spacing.md },
  historyTitle: { ...typography.caption1, fontWeight: '600', color: colors.muted, marginBottom: spacing.xs },
  historyTable: {
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  historyHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: spacing.xs + 2,
  },
  historyHeaderText: {
    flex: 1,
    ...typography.caption1,
    fontWeight: '600',
    color: colors.muted,
    textAlign: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  historyCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs + 2,
  },
  historyText: { ...typography.footnote, color: colors.fg, textAlign: 'center' },
  // 加载动画
  loadingContainer: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary + '40',
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  loadingDots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  loadingText: { ...typography.footnote, color: colors.muted },
});

export default GrowthTracker;
