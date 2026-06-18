import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../src/context/AppContext';
import { useAuth } from '../src/context/AuthContext';
import { STAGES } from '../src/lib/stages';
import { useColors, useTheme } from '../src/context/ThemeContext';
import { spacing, radius, typography, shadows } from '../src/styles/tokens';
import { loadMomWeightConfig, saveMomWeightConfig } from '../src/lib/storage';
import { DatePicker } from '../src/components/DatePicker';

export default function BabyInfoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, addBaby, updateBabyGender } = useApp();
  const { user } = useAuth();
  const { babyId, mode, from } = useLocalSearchParams<{ babyId?: string; mode?: string; from?: string }>();

  const existingBaby = babyId
    ? state.babies.find(b => b.id === babyId)
    : mode === 'new' ? null : state.babies[0];
  const isPostpartum = state.stage === 'postpartum';

  const [dueDate, setDueDate] = useState(existingBaby?.dueDate || new Date().toISOString().split('T')[0]);
  const [preWeight, setPreWeight] = useState('');
  const [height, setHeight] = useState('');
  const [saving, setSaving] = useState(false);
  // 加载孕前体重/身高配置
  useEffect(() => {
    if (!user) return;
    loadMomWeightConfig(user.id).then(cfg => {
      if (cfg) {
        setPreWeight(String(cfg.prePregnancyWeight));
        setHeight(String(cfg.height));
      }
    }).catch(() => {});
  }, [user]);

  const colors = useColors();
  const { isDark } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  navBack: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center',
  },
  navTitle: { ...typography.title3, fontWeight: '600', color: colors.fg },
  content: { padding: spacing.lg },

  // 宝宝卡片
  babyCard: {
    backgroundColor: isDark ? '#2A1E1E' : '#FFF8F5', borderRadius: 20, padding: spacing.xl,
    alignItems: 'center', marginBottom: spacing.xl,
    borderWidth: 1, borderColor: isDark ? '#4A3030' : '#F5E0D0',
  },
  babyEmoji: { fontSize: 56, marginBottom: spacing.sm },
  babyName: { ...typography.title1, fontWeight: '700', color: isDark ? '#E8DCC8' : '#5A3E2B', marginBottom: spacing.xs },
  babyTag: {
    backgroundColor: isDark ? '#5A4040' : '#D4A574', paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.sm, marginBottom: spacing.md,
  },
  babyTagText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  babyDivider: { width: '100%', height: StyleSheet.hairlineWidth, backgroundColor: isDark ? '#4A3030' : '#F5E0D0', marginBottom: spacing.md },

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
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dateField: {
    alignItems: 'center',
  },
  dateFieldYear: {
    flex: 1.6,
  },
  dateFieldMD: {
    flex: 1,
  },
  dateInput: {
    ...typography.title1,
    fontWeight: '700',
    color: colors.accent,
    textAlign: 'center',
    width: '100%',
    paddingVertical: spacing.md + 2,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  dateSep: {
    ...typography.title2,
    fontWeight: '300',
    color: colors.muted,
    opacity: 0.6,
    alignSelf: 'center',
  },
  motherRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  motherField: {
    flex: 1,
  },
  motherLabel: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.fgSecondary,
    marginBottom: spacing.sm,
  },
  motherInput: {
    ...typography.callout,
    color: colors.fg,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: colors.accent, borderRadius: radius.md,
    paddingVertical: spacing.md + 2, alignItems: 'center',
    ...shadows.sm,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { ...typography.callout, fontWeight: '600', color: '#fff' },
}), [colors, isDark]);

  const safeAlert = (title: string, msg?: string) => {
    if (Platform.OS === 'web') { window.alert(msg || title); }
    else { Alert.alert(title, msg || ''); }
  };

  const handleSave = async () => {
    if (!dueDate) { safeAlert('请选择预产期'); return; }
    setSaving(true);
    try {
      if (existingBaby) {
        await updateBabyGender(existingBaby.id, existingBaby.gender || '', dueDate);
      } else {
        await addBaby(dueDate, `宝宝${state.babies.length + 1}`);
      }
      // 保存孕前体重/身高配置
      const pw = parseFloat(preWeight);
      const h = parseFloat(height);
      if (!isNaN(pw) && pw > 0 && !isNaN(h) && h > 0 && user) {
        await saveMomWeightConfig(user.id, { prePregnancyWeight: pw, height: h });
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
        <TouchableOpacity onPress={() => {
          if (from === 'congratulations') {
            router.replace('/(tabs)');
          } else {
            router.back();
          }
        }} style={styles.navBack}>
          <Ionicons name="chevron-back" size={20} color={colors.accent} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>孕期信息</Text>
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

        {/* 母亲信息 */}
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>母亲信息</Text>
          <Text style={styles.formHint}>
            设置孕前体重和身高，用于孕期体重管理参考
          </Text>
          <View style={styles.motherRow}>
            <View style={styles.motherField}>
              <Text style={styles.motherLabel}>孕前体重(kg)</Text>
              <TextInput style={styles.motherInput} value={preWeight} onChangeText={setPreWeight} keyboardType="decimal-pad" placeholder="55" placeholderTextColor={colors.muted} />
            </View>
            <View style={{ width: spacing.md }} />
            <View style={styles.motherField}>
              <Text style={styles.motherLabel}>身高(cm)</Text>
              <TextInput style={styles.motherInput} value={height} onChangeText={setHeight} keyboardType="decimal-pad" placeholder="165" placeholderTextColor={colors.muted} />
            </View>
          </View>
        </View>

        {/* 修改预产期 */}
        <View style={styles.formSection}>
        <Text style={styles.formTitle}>
          {existingBaby ? '修改预产期' : '录入预产期'}
        </Text>
        <Text style={styles.formHint}>
          请输入医院确认的预产期，系统自动计算孕周和阶段
        </Text>

        <View style={styles.dateCard}>
          <DatePicker value={dueDate} onChange={setDueDate} label="预产期" />
        </View>

        <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveText}>{saving ? '保存中…' : existingBaby ? '更新信息' : '保存'}</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

