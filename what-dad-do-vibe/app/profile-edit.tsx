import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';
import { colors, spacing, radius, typography } from '../src/styles/tokens';

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [nickname, setNickname] = useState(user?.user_metadata?.nickname || '');
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [saving, setSaving] = useState(false);

  const safeAlert = (title: string, msg?: string) => {
    if (Platform.OS === 'web') { window.alert(msg || title); }
    else { Alert.alert(title, msg || ''); }
  };

  const handleUpdatePassword = async () => {
    if (!curPwd) { safeAlert('请输入当前密码'); return; }
    if (!newPwd || newPwd.length < 6) { safeAlert('新密码至少 6 位'); return; }
    if (newPwd !== confirmPwd) { safeAlert('两次输入的新密码不一致'); return; }
    setSaving(true);
    try {
      const { error: reAuthErr } = await supabase.auth.updateUser({ password: newPwd });
      if (reAuthErr) throw reAuthErr;
      const doLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/login');
      };
      if (Platform.OS === 'web') {
        if (window.confirm('密码已更新，请重新登录')) doLogout();
      } else {
        Alert.alert('密码已更新', '请重新登录', [
          { text: '确定', onPress: () => doLogout() },
        ]);
      }
    } catch (e: any) {
      safeAlert('更新失败', e.message || '请确认当前密码正确');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 顶部导航 */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBack}>
          <Ionicons name="chevron-back" size={20} color={colors.accent} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>个人资料</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 账号信息 */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <View style={[styles.infoIcon, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="mail-outline" size={16} color={colors.accent} />
                </View>
                <Text style={styles.infoLabel}>邮箱</Text>
              </View>
              <Text style={styles.infoValue}>{user?.email || '-'}</Text>
            </View>
          </View>
        </View>

        {/* 修改密码 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>修改密码</Text>
          <View style={styles.formCard}>
            <Text style={styles.fieldLabel}>当前密码</Text>
            <TextInput
              style={styles.input}
              value={curPwd}
              onChangeText={setCurPwd}
              secureTextEntry
              placeholder="输入当前密码"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.fieldLabel}>新密码</Text>
            <TextInput
              style={styles.input}
              value={newPwd}
              onChangeText={setNewPwd}
              secureTextEntry
              placeholder="至少 6 位"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.fieldLabel}>确认新密码</Text>
            <TextInput
              style={styles.input}
              value={confirmPwd}
              onChangeText={setConfirmPwd}
              secureTextEntry
              placeholder="再次输入新密码"
              placeholderTextColor={colors.muted}
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleUpdatePassword}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>更新密码</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  navTitle: { ...typography.title3, fontWeight: '600', color: colors.fg },
  content: { padding: spacing.lg },

  // 分区
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    ...typography.caption1, fontWeight: '600', color: colors.muted,
    marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // 信息卡片
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 14, padding: spacing.md,
    borderWidth: 0.5, borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoIcon: {
    width: 28, height: 28, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { ...typography.callout, color: colors.fgSecondary },
  infoValue: { ...typography.callout, fontWeight: '500', color: colors.fg },

  // 表单
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 14, padding: spacing.lg,
    borderWidth: 0.5, borderColor: colors.border,
  },
  fieldLabel: {
    ...typography.caption1, fontWeight: '500', color: colors.fgSecondary,
    marginBottom: spacing.xs, marginTop: spacing.sm,
  },
  input: {
    ...typography.callout, color: colors.fg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
    height: 44,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    height: 44,
    alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.lg,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.callout, fontWeight: '600', color: '#fff' },
});
