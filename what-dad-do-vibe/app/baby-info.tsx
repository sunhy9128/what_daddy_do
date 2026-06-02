import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../src/context/AppContext';
import { STAGES } from '../src/lib/stages';
import { colors, spacing, typography, shadows } from '../src/styles/tokens';

export default function BabyInfoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, addBaby, updateBabyGender } = useApp();

  const existingBaby = state.babies[0];
  const isPostpartum = state.stage === 'postpartum';

  const [year, setYear] = useState(existingBaby?.dueDate ? existingBaby.dueDate.split('-')[0] : '');
  const [month, setMonth] = useState(existingBaby?.dueDate ? existingBaby.dueDate.split('-')[1] : '');
  const [day, setDay] = useState(existingBaby?.dueDate ? existingBaby.dueDate.split('-')[2] : '');
  const [saving, setSaving] = useState(false);

  const safeAlert = (title: string, msg?: string) => {
    if (Platform.OS === 'web') { window.alert(msg || title); }
    else { Alert.alert(title, msg || ''); }
  };

  const handleSave = async () => {
    if (!year || !month || !day) { safeAlert('请填写完整'); return; }
    const y = parseInt(year, 10); const m = parseInt(month, 10); const d = parseInt(day, 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) { safeAlert('格式错误', '请输入有效数字'); return; }
    if (m < 1 || m > 12) { safeAlert('月份错误', '月份应在 1-12 之间'); return; }
    if (d < 1 || d > 31) { safeAlert('日期错误', '日期应在 1-31 之间'); return; }
    const dueDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    setSaving(true);
    try {
      if (existingBaby) {
        await updateBabyGender(existingBaby.id, existingBaby.gender || '', dueDate);
      } else {
        await addBaby(dueDate);
      }
      safeAlert('保存成功', '孕期信息已更新');
      router.back();
    } catch (error) {
      safeAlert('保存失败', '请重试');
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
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBack}>
          <Ionicons name="chevron-back" size={20} color={colors.accent} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{isPostpartum ? '宝宝信息' : '怀孕信息'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 当前信息 */}
        {existingBaby && isPostpartum ? (
          <View style={styles.babyCard}>
            <Text style={styles.babyEmoji}>{existingBaby.gender === 'girl' ? '👧' : '👦'}</Text>
            <Text style={styles.babyName}>{existingBaby.name || '宝宝'}</Text>
            <View style={styles.babyTag}><Text style={styles.babyTagText}>已出生</Text></View>
            <View style={styles.babyDivider} />
            <View style={styles.infoRow}>
              <Ionicons name="gift-outline" size={16} color="#D4A574" />
              <Text style={styles.infoLabel}>出生日期</Text>
              <Text style={styles.infoValue}>{existingBaby.birthDate || '未记录'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color="#D4A574" />
              <Text style={styles.infoLabel}>宝宝</Text>
              <Text style={styles.infoValue}>{state.birthAgeLabel}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#D4A574" />
              <Text style={styles.infoLabel}>原预产期</Text>
              <Text style={styles.infoValue}>{existingBaby.dueDate}</Text>
            </View>
          </View>
        ) : existingBaby ? (
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="calendar-outline" size={20} color={colors.accent} />
              <Text style={styles.infoCardTitle}>当前孕期</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>阶段</Text>
              <Text style={styles.infoValue}>{stageInfo?.stage || '未知'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>当前孕周</Text>
              <Text style={styles.infoValue}>{stageInfo?.weeks || 0} 周</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>预产期</Text>
              <Text style={styles.infoValue}>{existingBaby.dueDate}</Text>
            </View>
          </View>
        ) : null}

        {/* 修改预产期 */}
        <View style={styles.formSection}>
        <Text style={styles.formTitle}>
          {existingBaby ? '修改预产期' : '录入预产期'}
        </Text>
        <Text style={styles.formHint}>
          请输入医院确认的预产期，系统自动计算孕周和阶段
        </Text>

        <View style={styles.dateCard}>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <TextInput style={styles.dateInput} value={year} onChangeText={setYear} keyboardType="number-pad" placeholder="2026" placeholderTextColor={colors.muted} maxLength={4} />
              <Text style={styles.dateLabel}>年</Text>
            </View>
            <Text style={styles.dateSep}>/</Text>
            <View style={styles.dateField}>
              <TextInput style={styles.dateInput} value={month} onChangeText={setMonth} keyboardType="number-pad" placeholder="09" placeholderTextColor={colors.muted} maxLength={2} />
              <Text style={styles.dateLabel}>月</Text>
            </View>
            <Text style={styles.dateSep}>/</Text>
            <View style={styles.dateField}>
              <TextInput style={styles.dateInput} value={day} onChangeText={setDay} keyboardType="number-pad" placeholder="15" placeholderTextColor={colors.muted} maxLength={2} />
              <Text style={styles.dateLabel}>日</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveText}>{saving ? '保存中…' : existingBaby ? '更新预产期' : '保存'}</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  navBack: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center',
  },
  navTitle: { ...typography.title3, fontWeight: '600', color: colors.fg },
  content: { padding: spacing.lg },

  // 宝宝卡片
  babyCard: {
    backgroundColor: '#FFF8F5', borderRadius: 20, padding: spacing.xl,
    alignItems: 'center', marginBottom: spacing.xl,
    borderWidth: 1, borderColor: '#F5E0D0',
  },
  babyEmoji: { fontSize: 56, marginBottom: spacing.sm },
  babyName: { ...typography.title1, fontWeight: '700', color: '#5A3E2B', marginBottom: spacing.xs },
  babyTag: {
    backgroundColor: '#D4A574', paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: 12, marginBottom: spacing.md,
  },
  babyTagText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  babyDivider: { width: '100%', height: StyleSheet.hairlineWidth, backgroundColor: '#F5E0D0', marginBottom: spacing.md },

  // 孕期卡片
  infoCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: spacing.lg,
    marginBottom: spacing.xl, borderWidth: 0.5, borderColor: colors.border,
  },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  infoCardTitle: { ...typography.headline, fontWeight: '600', color: colors.fg },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  infoLabel: { ...typography.callout, color: colors.fgSecondary, flex: 1 },
  infoValue: { ...typography.callout, fontWeight: '600', color: colors.accent },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },

  // 表单
  formSection: {
    backgroundColor: colors.surface, borderRadius: 14, padding: spacing.lg,
    marginBottom: spacing.lg, borderWidth: 0.5, borderColor: colors.border,
  },
  formTitle: {
    ...typography.headline, fontWeight: '600', color: colors.fg, marginBottom: spacing.xs,
  },
  formHint: {
    ...typography.footnote, color: colors.muted, marginBottom: spacing.lg, lineHeight: 20,
  },
  dateCard: {
    backgroundColor: colors.surfaceSecondary, borderRadius: 12, padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  dateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  dateField: { alignItems: 'center', flex: 1 },
  dateLabel: {
    ...typography.caption2, color: colors.muted, marginTop: spacing.sm, fontWeight: '500',
  },
  dateInput: {
    ...typography.title2, fontWeight: '700', color: colors.accent,
    textAlign: 'center', width: '100%', paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  dateSep: {
    ...typography.title2, color: colors.muted, marginTop: -spacing.xl,
  },
  saveBtn: {
    backgroundColor: colors.accent, borderRadius: 12,
    paddingVertical: spacing.md + 2, alignItems: 'center',
    ...shadows.sm,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { ...typography.callout, fontWeight: '600', color: '#fff' },
});
