import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../src/context/AppContext';

import { Card } from '../src/components/atoms';
import { colors, spacing, typography } from '../src/styles/tokens';

export default function BabyInfoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, addBaby, updateBabyGender } = useApp();

  const existingBaby = state.babies[0];
  const [year, setYear] = useState(existingBaby?.dueDate ? existingBaby.dueDate.split('-')[0] : '');
  const [month, setMonth] = useState(existingBaby?.dueDate ? existingBaby.dueDate.split('-')[1] : '');
  const [day, setDay] = useState(existingBaby?.dueDate ? existingBaby.dueDate.split('-')[2] : '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!year || !month || !day) {
      Alert.alert('请填写完整', '请输入年份、月份和日期');
      return;
    }

    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);

    if (isNaN(y) || isNaN(m) || isNaN(d)) {
      Alert.alert('格式错误', '请输入有效的数字');
      return;
    }

    if (m < 1 || m > 12) {
      Alert.alert('月份错误', '月份应在 1-12 之间');
      return;
    }

    if (d < 1 || d > 31) {
      Alert.alert('日期错误', '日期应在 1-31 之间');
      return;
    }

    const dueDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    setSaving(true);
    try {
      if (existingBaby) {
        // 更新已有宝宝的预产期（保留性别，同步 context）
        await updateBabyGender(existingBaby.id, existingBaby.gender || '', dueDate);
      } else {
        // 新建宝宝记录
        await addBaby(dueDate);
      }
      Alert.alert('保存成功', '孕期信息已保存，将自动计算当前孕周和阶段', [
        { text: '好的', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('保存失败', '请重试');
    } finally {
      setSaving(false);
    }
  };

  const stageInfo = existingBaby ? (() => {
    const s = state.stage;
    const labels: Record<string, string> = {
      preconception: '备孕',
      first: '孕早期',
      second: '孕中期',
      third: '孕晚期',
      postpartum: '产后',
    };
    return {
      stage: labels[s] || '未知',
      weeks: state.weeksPregnant,
    };
  })() : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>怀孕信息</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {existingBaby && (
          <Card style={styles.currentInfo}>
            <Text style={styles.currentTitle}>当前孕期信息</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>孕期阶段</Text>
              <Text style={styles.infoValue}>{stageInfo?.stage || '未知'}</Text>
            </View>
            {state.stage === 'postpartum' ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>宝宝出生后</Text>
                <Text style={styles.infoValue}>{state.birthAgeLabel}</Text>
              </View>
            ) : (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>当前孕周</Text>
                <Text style={styles.infoValue}>{stageInfo?.weeks || 0} 周</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>预产期</Text>
              <Text style={styles.infoValue}>{existingBaby.dueDate}</Text>
            </View>
          </Card>
        )}

        <Text style={styles.sectionTitle}>
          {existingBaby ? '修改预产期' : '录入预产期'}
        </Text>
        <Text style={styles.hint}>
          请输入医院确认的预产期（预计分娩日期），系统将自动计算当前孕周和孕期阶段。
        </Text>

        <Card style={styles.dateCard}>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>年</Text>
              <TextInput
                style={styles.dateInput}
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                placeholder="2026"
                placeholderTextColor={colors.muted}
                maxLength={4}
              />
            </View>
            <Text style={styles.dateSep}>/</Text>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>月</Text>
              <TextInput
                style={styles.dateInput}
                value={month}
                onChangeText={setMonth}
                keyboardType="number-pad"
                placeholder="09"
                placeholderTextColor={colors.muted}
                maxLength={2}
              />
            </View>
            <Text style={styles.dateSep}>/</Text>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>日</Text>
              <TextInput
                style={styles.dateInput}
                value={day}
                onChangeText={setDay}
                keyboardType="number-pad"
                placeholder="15"
                placeholderTextColor={colors.muted}
                maxLength={2}
              />
            </View>
          </View>
        </Card>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveText}>
            {saving ? '保存中…' : existingBaby ? '更新预产期' : '保存'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backText: { ...typography.callout, color: colors.accent, fontWeight: '500' },
  headerTitle: { ...typography.title3, fontWeight: '600', color: colors.fg },
  content: { padding: spacing.lg },
  currentInfo: { marginBottom: spacing.lg },
  currentTitle: { ...typography.callout, fontWeight: '600', color: colors.fg, marginBottom: spacing.md },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  infoLabel: { ...typography.body, color: colors.fgSecondary },
  infoValue: { ...typography.body, fontWeight: '600', color: colors.accent },
  sectionTitle: { ...typography.headline, fontWeight: '600', marginBottom: spacing.xs },
  hint: { ...typography.footnote, color: colors.muted, marginBottom: spacing.md, lineHeight: 18 },
  dateCard: { marginBottom: spacing.lg },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  dateField: { alignItems: 'center' },
  dateLabel: { ...typography.caption1, color: colors.muted, marginBottom: spacing.xs },
  dateInput: {
    ...typography.title1,
    fontWeight: '700',
    color: colors.accent,
    textAlign: 'center',
    width: 80,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  dateSep: { ...typography.title1, color: colors.muted, marginTop: spacing.lg },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveText: { ...typography.callout, fontWeight: '600', color: '#fff' },
});
