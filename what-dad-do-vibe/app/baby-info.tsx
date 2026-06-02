import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../src/context/AppContext';
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
    if (isNaN(y) || isNaN(m) || isNaN(d)) { Alert.alert('格式错误', '请输入有效的数字'); return; }
    if (m < 1 || m > 12) { Alert.alert('月份错误', '月份应在 1-12 之间'); return; }
    if (d < 1 || d > 31) { Alert.alert('日期错误', '日期应在 1-31 之间'); return; }
    const dueDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    setSaving(true);
    try {
      if (existingBaby) {
        await updateBabyGender(existingBaby.id, existingBaby.gender || '', dueDate);
      } else {
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
    const labels: Record<string, string> = {
      preconception: '备孕', first: '孕早期', second: '孕中期',
      third: '孕晚期', postpartum: '产后',
    };
    return { stage: labels[state.stage] || '未知', weeks: state.weeksPregnant };
  })() : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 顶部导航 */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBack}>
          <Text style={styles.navBackText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>怀孕信息</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 当前信息卡片 */}
        {existingBaby && (
          <View style={styles.summary}>
            <View style={styles.summaryIcon}>
              <Text style={styles.summaryEmoji}>📅</Text>
            </View>
            <Text style={styles.summaryTitle}>当前孕期</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>阶段</Text>
              <Text style={styles.summaryValue}>{stageInfo?.stage || '未知'}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {state.stage === 'postpartum' ? '宝宝出生后' : '当前孕周'}
              </Text>
              <Text style={styles.summaryValue}>
                {state.stage === 'postpartum' ? state.birthAgeLabel : `${stageInfo?.weeks || 0} 周`}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>预产期</Text>
              <Text style={styles.summaryValue}>{existingBaby.dueDate}</Text>
            </View>
          </View>
        )}

        {/* 录入/修改预产期 */}
        <Text style={styles.formTitle}>
          {existingBaby ? '修改预产期' : '录入预产期'}
        </Text>
        <Text style={styles.formHint}>
          请输入医院确认的预产期，系统将自动计算当前孕周和阶段
        </Text>

        <View style={styles.dateCard}>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <TextInput
                style={styles.dateInput}
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                placeholder="2026"
                placeholderTextColor={colors.muted}
                maxLength={4}
              />
              <Text style={styles.dateLabel}>年</Text>
            </View>
            <Text style={styles.dateSep}>/</Text>
            <View style={styles.dateField}>
              <TextInput
                style={styles.dateInput}
                value={month}
                onChangeText={setMonth}
                keyboardType="number-pad"
                placeholder="09"
                placeholderTextColor={colors.muted}
                maxLength={2}
              />
              <Text style={styles.dateLabel}>月</Text>
            </View>
            <Text style={styles.dateSep}>/</Text>
            <View style={styles.dateField}>
              <TextInput
                style={styles.dateInput}
                value={day}
                onChangeText={setDay}
                keyboardType="number-pad"
                placeholder="15"
                placeholderTextColor={colors.muted}
                maxLength={2}
              />
              <Text style={styles.dateLabel}>日</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
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

  // 顶部导航
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  navBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBackText: { fontSize: 18, color: colors.accent, fontWeight: '600' },
  navTitle: { ...typography.title3, fontWeight: '600', color: colors.fg },

  content: { padding: spacing.lg },

  // 当前信息
  summary: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  summaryIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.accentLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  summaryEmoji: { fontSize: 20 },
  summaryTitle: { ...typography.headline, fontWeight: '600', color: colors.fg, marginBottom: spacing.md },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: spacing.xs + 2,
  },
  summaryLabel: { ...typography.callout, color: colors.fgSecondary },
  summaryValue: { ...typography.callout, fontWeight: '600', color: colors.accent },
  summaryDivider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },

  // 表单
  formTitle: { ...typography.headline, fontWeight: '600', color: colors.fg, marginBottom: spacing.xs },
  formHint: { ...typography.footnote, color: colors.muted, marginBottom: spacing.lg, lineHeight: 18 },

  // 日期选择
  dateCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dateField: { alignItems: 'center' },
  dateLabel: { ...typography.caption1, color: colors.muted, marginTop: spacing.xs },
  dateInput: {
    ...typography.title1,
    fontWeight: '700',
    color: colors.accent,
    textAlign: 'center',
    width: 76,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  dateSep: { ...typography.title1, color: colors.muted, marginTop: -spacing.md },

  // 保存
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { ...typography.callout, fontWeight: '600', color: '#fff' },
});
