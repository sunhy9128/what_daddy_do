import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform, LayoutAnimation, UIManager } from 'react-native';
import { colors, spacing, typography } from '../../styles/tokens';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
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
        setRecords(all.sort((a, b) => b.month - a.month));
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

  const [editMode, setEditMode] = useState(false);
  const [editMonth, setEditMonth] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const enterEdit = (i: number) => {
    const r = records[i];
    if (!r) return;
    setEditingIdx(i);
    setEditMonth(String(r.month));
    setEditHeight(String(r.height));
    setEditWeight(String(r.weight));
  };

  const confirmDelete = (i: number) => {
    const msg = `确定删除第 ${records[i].month} 月龄的记录吗？`;
    const doDelete = () => {
      const newRecords = records.filter((_, idx) => idx !== i);
      setRecords(newRecords);
      persistRecords(newRecords);
      setEditingIdx(null);
    };
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) doDelete();
    } else {
      Alert.alert('删除记录', msg, [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    const m = parseInt(editMonth, 10);
    const h = parseFloat(editHeight);
    const w = parseFloat(editWeight);
    if (isNaN(m) || m < 0 || m > 36) return;
    const hasH = !isNaN(h) && h > 0;
    const hasW = !isNaN(w) && w > 0;
    if (!hasH && !hasW) return;
    const newRecords = records.map((r, i) =>
      i === editingIdx ? { month: m, height: hasH ? h : 0, weight: hasW ? w : 0 } : r
    );
    setRecords(newRecords.sort((a, b) => b.month - a.month));
    persistRecords(newRecords);
    setEditingIdx(null);
  };

  const cancelEdit = () => setEditingIdx(null);

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
    const newRecords = [newRecord, ...records].sort((a, b) => b.month - a.month);
    setRecords(newRecords);
    persistRecords(newRecords);
    setMonth('');
    setHeight('');
    setWeight('');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} nestedScrollEnabled>
      {/* 性别 */}
      <View style={styles.genderRow}>
        <Text style={styles.genderDisplay}>
          {babyGender === 'girl' ? '👧 女童' : '👦 男童'}
        </Text>
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

          {/* 新增记录 */}
          <View style={styles.addSection}>
            <Text style={styles.addSectionTitle}>新增记录</Text>
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
          </View>

          {/* 历史记录 */}
          {records.length > 0 && (
            <View style={styles.historySection}>
              <View style={styles.historyTitleRow}>
                <Text style={styles.historyTitle}>历史记录</Text>
                <TouchableOpacity
                  style={[styles.editToggleBtn, editMode && styles.editToggleBtnActive]}
                  onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setEditMode(!editMode); setEditingIdx(null); }}
                >
                  <Text style={[styles.editToggleText, editMode && styles.editToggleTextActive]}>
                    {editMode ? '完成' : '编辑'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.historyTable}>
                <View style={styles.historyHeader}>
                  <Text style={[styles.historyHeaderText, { flex: 2 }]}>月龄</Text>
                  <Text style={[styles.historyHeaderText, { flex: 3 }]}>身高(cm)</Text>
                  <Text style={[styles.historyHeaderText, { flex: 3 }]}>体重(kg)</Text>
                  {editMode && <Text style={[styles.historyHeaderText, { flex: 2 }]}>操作</Text>}
                </View>
                {records.slice(0, 10).map((r, i) => (
                  <View key={i} style={[styles.historyItem, editingIdx === i && styles.historyItemEditing]}>
                    {editingIdx === i ? (
                      <>
                        <View style={[styles.historyCell, { flex: 2 }]}>
                          <TextInput style={styles.editInput} value={editMonth} onChangeText={setEditMonth} keyboardType="number-pad" maxLength={2} />
                        </View>
                        <View style={[styles.historyCell, { flex: 3 }]}>
                          <TextInput style={styles.editInput} value={editHeight} onChangeText={setEditHeight} keyboardType="decimal-pad" />
                        </View>
                        <View style={[styles.historyCell, { flex: 3 }]}>
                          <TextInput style={styles.editInput} value={editWeight} onChangeText={setEditWeight} keyboardType="decimal-pad" />
                        </View>
                        <View style={[styles.historyCell, { flex: 2, flexDirection: 'row', gap: 4 }]}>
                          <TouchableOpacity style={styles.editRowBtn} onPress={saveEdit}>
                            <Text style={styles.editRowBtnText}>✓</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.editRowBtn, styles.editRowBtnDel]} onPress={() => { setEditingIdx(null); confirmDelete(i); }}>
                            <Text style={styles.editRowBtnTextDel}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={[styles.historyCell, { flex: 2 }]}>
                          <Text style={styles.historyText}>{r.month}</Text>
                        </View>
                        <View style={[styles.historyCell, { flex: 3 }]}>
                          <Text style={styles.historyText}>{r.height > 0 ? r.height : '-'}</Text>
                        </View>
                        <View style={[styles.historyCell, { flex: 3 }]}>
                          <Text style={styles.historyText}>{r.weight > 0 ? r.weight : '-'}</Text>
                        </View>
                        {editMode && (
                          <View style={[styles.historyCell, { flex: 2, flexDirection: 'row', gap: 4 }]}>
                            <TouchableOpacity style={styles.editRowBtn} onPress={() => enterEdit(i)}>
                              <Text style={styles.editRowBtnText}>✎</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.editRowBtn, styles.editRowBtnDel]} onPress={() => confirmDelete(i)}>
                              <Text style={styles.editRowBtnTextDel}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </>
                    )}
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
  addSection: { marginTop: spacing.md, marginBottom: spacing.lg },
  addSectionTitle: {
    ...typography.caption1,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  inputField: { flex: 1 },
  inputLabel: { ...typography.caption2, color: colors.muted, marginBottom: 4, fontWeight: '500' },
  input: {
    ...typography.callout,
    color: colors.fg,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    height: 42,
  },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  addBtnDisabled: { backgroundColor: colors.border, borderColor: colors.border },
  addBtnText: { ...typography.callout, fontWeight: '600', color: '#fff' },
  addBtnTextDisabled: { color: colors.muted },
  historySection: { marginTop: spacing.md },
  historyTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  historyTitle: { ...typography.caption1, fontWeight: '600', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  historyTable: {
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  historyHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: spacing.sm,
  },
  historyHeaderText: {
    ...typography.caption1,
    fontWeight: '600',
    color: colors.muted,
    textAlign: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    position: 'relative',
  },
  historyItemEditing: {
    backgroundColor: colors.accentLight,
  },
  historyCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    minHeight: 40,
  },
  historyText: { ...typography.callout, color: colors.fg, textAlign: 'center', fontWeight: '500' },
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

  // 编辑
  editInput: {
    ...typography.callout,
    color: colors.accent,
    backgroundColor: colors.bg,
    borderRadius: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.accent,
    textAlign: 'center',
    width: '100%',
    height: 32,
    maxWidth: 64,
    fontWeight: '500',
  },
  editToggleBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  editToggleBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  editToggleText: {
    ...typography.caption1,
    color: colors.accent,
    fontWeight: '500',
  },
  editToggleTextActive: {
    color: '#fff',
  },
  editRowBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  editRowBtnDel: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  editRowBtnText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  editRowBtnTextDel: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '600',
  },
});

export default GrowthTracker;
