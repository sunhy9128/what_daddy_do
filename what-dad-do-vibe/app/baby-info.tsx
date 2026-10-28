import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../src/context/AppContext';
import { useAuth } from '../src/context/AuthContext';
import { calculateStageFromDueDate, calculateBirthAge } from '../src/lib/stages';
import { useColors, useTheme } from '../src/context/ThemeContext';
import { spacing, radius, typography, shadows, MAX_FONT_SCALE } from '../src/styles/tokens';
import { DatePicker } from '../src/components/DatePicker';
import * as Linking from 'expo-linking';

export default function BabyInfoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, addBaby, updateBabyGender, archiveBaby } = useApp();
  const { user } = useAuth();
  const { babyId, mode, from } = useLocalSearchParams<{ babyId?: string; mode?: string; from?: string }>();

  const existingBaby = babyId
    ? state.babies.find(b => b.id === babyId)
    : mode === 'new' ? null : state.babies[0];
  // 阶段按 URL 指定的宝宝计算，不能用全局 state.stage（那是当前激活宝宝的）
  const babyStage = existingBaby?.dueDate ? calculateStageFromDueDate(existingBaby.dueDate) : null;
  const isPostpartum = babyStage?.stage === 'postpartum';
  const birthAgeLabel = existingBaby?.dueDate ? calculateBirthAge(existingBaby.dueDate, existingBaby.birthDate) : '';

  const [dueDate, setDueDate] = useState(existingBaby?.dueDate || new Date().toISOString().split('T')[0]);
  // 备孕中模式（仅新增时可用）
  const [isPreconception, setIsPreconception] = useState(false);
  const [hospitalName, setHospitalName] = useState(existingBaby?.hospitalName || '');
  const [hospitalAddress, setHospitalAddress] = useState(existingBaby?.hospitalLocation?.address || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newName, setNewName] = useState('');

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
    backgroundColor: isDark ? '#1E1C18' : '#F7F4EC', borderRadius: 20, padding: spacing.xl,
    alignItems: 'center', marginBottom: spacing.xl,
    borderWidth: 1, borderColor: isDark ? '#3A372F' : '#E3D9C6',
  },
  babyEmoji: { fontSize: 56, marginBottom: spacing.sm },
  babyName: { ...typography.title1, fontWeight: '700', color: isDark ? '#D9CCB2' : '#5C4A33', marginBottom: spacing.xs },
  babyTag: {
    backgroundColor: isDark ? '#4E4030' : '#B39B78', paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.sm, marginBottom: spacing.md,
  },
  babyTagText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  babyDivider: { width: '100%', height: StyleSheet.hairlineWidth, backgroundColor: isDark ? '#3A372F' : '#E3D9C6', marginBottom: spacing.md },

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
  infoValue: { ...typography.callout, fontWeight: '600', color: colors.accent, flexShrink: 1, textAlign: 'right' },
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
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerSurface,
  },
  deleteBtnText: { ...typography.callout, fontWeight: '600', color: colors.dangerFg },
  deleteHint: {
    ...typography.footnote,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
}), [colors, isDark]);

  const safeAlert = (title: string, msg?: string) => {
    if (Platform.OS === 'web') { window.alert(msg || title); }
    else { Alert.alert(title, msg || ''); }
  };

  const handleSave = async () => {
    if (!isPreconception && !dueDate) { safeAlert('请选择预产期'); return; }
    // 预产期医学合理性校验：妊娠最长 42 周，预产期不可能比今天晚 294 天以上；
    // 已出生超过 2 年超出本应用覆盖范围
    if (!isPreconception && dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(dueDate + 'T00:00:00');
      const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
      if (diffDays > 294) {
        safeAlert('预产期有误', '预产期最多在今天之后 42 周（约 9 个半月），请核对日期');
        return;
      }
      if (diffDays < -730) {
        safeAlert('预产期有误', '预产期早于今天 2 年以上，已超出本应用支持的宝宝年龄段，请核对日期');
        return;
      }
    }
    setSaving(true);
    try {
      // 备孕中模式：设一个远期假日期（2年后），数据库 due_date 有 not null 约束
      const effectiveDueDate = isPreconception
        ? new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : dueDate;
      if (existingBaby) {
        await updateBabyGender(existingBaby.id, existingBaby.gender || '', dueDate, undefined, undefined, hospitalName || undefined, hospitalAddress ? { address: hospitalAddress } : null);
      } else {
        await addBaby(effectiveDueDate, newName.trim() || `宝宝${state.babies.length + 1}`, undefined, hospitalName || undefined, hospitalAddress ? { address: hospitalAddress } : null);
      }
      safeAlert('保存成功', '孕期信息已更新');
      router.back();
    } catch (error) {
      safeAlert('保存失败', '请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!existingBaby || deleting) return;
    const name = existingBaby.name || '宝宝';
    const confirmDelete = () => {
      setDeleting(true);
      archiveBaby(existingBaby.id)
        .then(() => {
          safeAlert('已删除', `"${name}"已从列表移除`);
          router.replace('/(tabs)/profile');
        })
        .catch(() => safeAlert('删除失败', '请重试'))
        .finally(() => setDeleting(false));
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`确定删除"${name}"吗？删除后该宝宝将从列表移除，云端数据保留。`)) confirmDelete();
    } else {
      Alert.alert('删除宝宝', `确定删除"${name}"吗？删除后该宝宝将从列表移除，云端数据保留。`, [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: confirmDelete },
      ]);
    }
  };

  const stageInfo = existingBaby && babyStage ? (() => {
    const labels: Record<string, string> = {
      preconception: '备孕', first: '孕早期', second: '孕中期',
      third: '孕晚期', postpartum: '产后',
    };
    return { stage: labels[babyStage.stage] || '未知', weeks: babyStage.weeksPregnant };
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
          <Ionicons name="chevron-back" size={20} color={colors.accent} allowFontScaling={false} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>孕期信息</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        {/* 当前信息 */}
        {existingBaby && isPostpartum ? (
          <View style={styles.babyCard}>
            <Ionicons name={existingBaby.gender === 'girl' ? 'woman-outline' : 'man-outline'} size={32} color={colors.fgSecondary} />
            <Text style={styles.babyName}>{existingBaby.name || '宝宝'}</Text>
            <View style={styles.babyTag}><Text style={styles.babyTagText}>已出生</Text></View>
            <View style={styles.babyDivider} />
            <View style={styles.infoRow}>
              <Ionicons name="gift-outline" size={16} color={colors.warning} />
              <Text style={styles.infoLabel}>出生日期</Text>
              <Text style={styles.infoValue}>{existingBaby.birthDate || '未记录'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color={colors.warning} />
              <Text style={styles.infoLabel}>宝宝</Text>
              <Text style={styles.infoValue}>{birthAgeLabel || '未记录'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.warning} />
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

        {/* 宝宝名称（仅新增时显示） */}
        {!existingBaby && (
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>宝宝名称</Text>
            <TextInput
              style={styles.motherInput}
              value={newName}
              onChangeText={setNewName}
              placeholder={`如：小宝（留空则默认"宝宝${state.babies.length + 1}"）`}
              placeholderTextColor={colors.muted}
            />
          </View>
        )}

        {/* 阶段选择（仅新增时显示） */}
        {!existingBaby && (
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>宝宝状态</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: spacing.md,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: isPreconception ? colors.accent : colors.border,
                  backgroundColor: isPreconception ? colors.accent : 'transparent',
                  alignItems: 'center',
                }}
                onPress={() => setIsPreconception(true)}
              >
                <Text style={{ ...typography.callout, fontWeight: '600', color: isPreconception ? '#fff' : colors.fg }}>
                  备孕中
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: spacing.md,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: !isPreconception ? colors.accent : colors.border,
                  backgroundColor: !isPreconception ? colors.accent : 'transparent',
                  alignItems: 'center',
                }}
                onPress={() => setIsPreconception(false)}
              >
                <Text style={{ ...typography.callout, fontWeight: '600', color: !isPreconception ? '#fff' : colors.fg }}>
                  孕期中
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 修改预产期 */}
        {!isPreconception && (
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
        )}

        {/* 备孕中保存按钮 */}
        {isPreconception && (
          <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveText}>{saving ? '保存中…' : '开始备孕'}</Text>
          </TouchableOpacity>
        )}

        {/* 产检医院 */}
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>产检医院</Text>
          <Text style={styles.formHint}>
            设置产检医院后，可以在产检任务详情页一键导航到该医院
          </Text>
          <View style={styles.motherRow}>
            <View style={[styles.motherField, { flex: 2 }]}>
              <Text style={styles.motherLabel}>医院名称</Text>
              <TextInput style={styles.motherInput} value={hospitalName} onChangeText={setHospitalName} placeholder="如：市第一人民医院" placeholderTextColor={colors.muted} />
            </View>
            <View style={{ width: spacing.md }} />
            <View style={[styles.motherField, { flex: 1 }]}>
              <Text style={styles.motherLabel}>&nbsp;</Text>
              <TouchableOpacity
                style={[styles.motherInput, { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.xs }]}
                onPress={() => {
                  const url = Platform.OS === 'ios'
                    ? 'https://maps.apple.com/'
                    : 'https://maps.google.com/';
                  Linking.openURL(url);
                }}
              >
                <Ionicons name="location-outline" size={16} color={colors.accent} />
                <Text style={{ ...typography.caption1, color: colors.accent, fontWeight: '500' }}>选位置</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ marginTop: spacing.sm }}>
            <Text style={styles.motherLabel}>医院地址</Text>
            <TextInput style={styles.motherInput} value={hospitalAddress} onChangeText={setHospitalAddress} placeholder="输入地址或在地图中选择" placeholderTextColor={colors.muted} />
          </View>
          {hospitalAddress ? (
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm }}
              onPress={() => {
                const encoded = encodeURIComponent(hospitalAddress);
                const url = Platform.OS === 'ios'
                  ? `https://maps.apple.com/?q=${encoded}`
                  : `https://maps.google.com/?q=${encoded}`;
                Linking.openURL(url);
              }}
            >
              <Ionicons name="navigate-outline" size={14} color={colors.accent} />
              <Text style={{ ...typography.caption2, color: colors.accent, fontWeight: '500' }}>在地图中查看</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 删除宝宝（仅编辑已有宝宝时显示） */}
        {existingBaby && (
          <View style={styles.formSection}>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleting}>
              <Ionicons name="trash-outline" size={16} color={colors.dangerFg} />
              <Text style={styles.deleteBtnText}>{deleting ? '删除中…' : '删除'}</Text>
            </TouchableOpacity>
            <Text style={styles.deleteHint}>删除后该宝宝将从列表移除，云端数据保留</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

