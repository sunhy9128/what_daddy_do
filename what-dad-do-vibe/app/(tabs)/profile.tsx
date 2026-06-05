import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useApp } from '../../src/context/AppContext';
import { useColors, useTheme } from '../../src/context/ThemeContext';
import { Card } from '../../src/components/atoms';
import { STAGES } from '../../src/lib/stages';
import { spacing, radius, typography } from '../../src/styles/tokens';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { state } = useApp();
  const colors = useColors();
  const { isDark, toggleTheme } = useTheme();

  const [signingOut, setSigningOut] = useState(false);
  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      if (Platform.OS === 'web') { window.alert('退出失败，请重试'); } else { Alert.alert('退出失败', '请重试'); }
    } finally {
      setSigningOut(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg },

    // 头像
    profile: { alignItems: 'center', paddingVertical: spacing.xxl },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: radius.lg,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    avatarText: { fontSize: 28, color: '#fff', fontWeight: '600' },
    email: { ...typography.callout, color: colors.fg },

    // 分区
    section: { marginBottom: spacing.lg },
    sectionTitle: {
      ...typography.caption1,
      fontWeight: '600',
      color: colors.muted,
      marginBottom: spacing.sm,
      marginLeft: spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    // 菜单卡片
    menuCard: {
      marginBottom: spacing.sm,
      marginHorizontal: 0,
      padding: 0,
      borderRadius: radius.sm,
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.md,
    },
    menuLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    menuIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },

    menuText: { ...typography.callout, color: colors.fg },
    menuBadge: { ...typography.footnote, color: colors.accent, fontWeight: '500' },

    // 孕期信息卡片
    pregCard: {
      backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg,
      marginBottom: spacing.lg, borderWidth: 0.5, borderColor: colors.border,
      alignItems: 'center', position: 'relative',
    },
    pregHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    pregIcon: {
      width: 36, height: 36, borderRadius: radius.sm,
      backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center',
    },
    pregTitle: { ...typography.headline, fontWeight: '600', color: colors.fg },
    pregRow: {
      flexDirection: 'row', justifyContent: 'space-between', width: '100%',
      paddingVertical: spacing.sm,
    },
    pregLabel: { ...typography.callout, color: colors.fgSecondary },
    pregValue: { ...typography.callout, fontWeight: '600', color: colors.accent },
    pregDivider: {
      width: '100%', height: StyleSheet.hairlineWidth, backgroundColor: colors.border,
    },

    // 宝宝信息卡片
    babyCard: {
      backgroundColor: isDark ? '#1E1E30' : '#FFF8F5', borderRadius: radius.lg, padding: spacing.xl,
      marginBottom: spacing.lg, alignItems: 'center',
      borderWidth: 1, borderColor: isDark ? '#333348' : '#F5E0D0',
      position: 'relative',
    },
    babyHeader: { alignItems: 'center', marginBottom: spacing.md },
    babyEmoji: { fontSize: 48, marginBottom: spacing.sm },
    babyNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    babyName: { ...typography.title2, fontWeight: '700', color: isDark ? '#E8DCC8' : '#5A3E2B' },
    babyStage: {
      fontSize: 11, fontWeight: '600', color: '#fff',
      backgroundColor: '#D4A574', paddingHorizontal: spacing.sm, paddingVertical: 2,
      borderRadius: radius.sm, overflow: 'hidden',
    },
    babyInfoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
    babyInfoText: { ...typography.callout, color: isDark ? '#B8A88A' : '#8B6F4A' },
    cardSettings: {
      position: 'absolute', top: spacing.sm, right: spacing.sm,
      width: 32, height: 32, borderRadius: radius.md,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 10,
    },
    babyTagRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    babyTag: {
      backgroundColor: isDark ? '#2A2E4A' : '#E8F0FE', paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
      borderRadius: radius.sm,
    },
    babyTagText: { fontSize: 12, fontWeight: '500', color: colors.accent },

    // 退出
    logoutBtn: {
      marginTop: spacing.md,
      paddingVertical: spacing.md + 2,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: isDark ? '#5A3A3A' : '#FECACA',
      backgroundColor: isDark ? '#2A1A1A' : '#FEF2F2',
      alignItems: 'center',
    },
    logoutText: { ...typography.callout, fontWeight: '500', color: colors.error },
  }), [colors, isDark]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 头像区域 */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.email}>{user?.email || '未登录'}</Text>
        </View>

        {/* 孕期/宝宝信息卡片 */}
        {state.babies.length > 0 && state.stage === 'postpartum' ? (
          <View style={styles.babyCard}>
            <TouchableOpacity style={styles.cardSettings} onPress={() => router.push('/baby-info')}>
              <Ionicons name="settings-outline" size={16} color="#D4A574" />
            </TouchableOpacity>
            <View style={styles.babyHeader}>
              <Text style={styles.babyEmoji}>{state.babies[0]?.gender === 'girl' ? '👧' : '👦'}</Text>
              <View style={styles.babyNameRow}>
                <Text style={styles.babyName}>{state.babies[0]?.name || '宝宝'}</Text>
                <Text style={styles.babyStage}>已出生</Text>
              </View>
            </View>
            {state.babies[0]?.birthDate && (
              <View style={styles.babyInfoRow}>
                <Ionicons name="gift-outline" size={14} color="#D4A574" />
                <Text style={styles.babyInfoText}>出生日期：{state.babies[0].birthDate}</Text>
              </View>
            )}
            <View style={styles.babyInfoRow}>
              <Ionicons name="time-outline" size={14} color="#D4A574" />
              <Text style={styles.babyInfoText}>宝宝 {state.birthAgeLabel}</Text>
            </View>
            <View style={styles.babyTagRow}>
              <View style={styles.babyTag}><Text style={styles.babyTagText}>{state.babies[0]?.gender === 'girl' ? '女宝' : '男宝'}</Text></View>
              <View style={[styles.babyTag, { backgroundColor: '#FFF0E6' }]}><Text style={[styles.babyTagText, { color: '#D4A574' }]}>🎂 {state.babies[0]?.birthDate || state.babies[0]?.dueDate}</Text></View>
            </View>
          </View>
        ) : state.babies.length > 0 ? (
          <View style={styles.pregCard}>
            <TouchableOpacity style={styles.cardSettings} onPress={() => router.push('/baby-info')}>
              <Ionicons name="settings-outline" size={16} color={colors.muted} />
            </TouchableOpacity>
            <View style={styles.pregHeader}>
              <View style={styles.pregIcon}>
                <Ionicons name="calendar-outline" size={20} color={colors.accent} />
              </View>
              <Text style={styles.pregTitle}>孕期信息</Text>
            </View>
            <View style={styles.pregRow}>
              <Text style={styles.pregLabel}>当前阶段</Text>
              <Text style={styles.pregValue}>
                {STAGES.find(s => s.key === state.stage)?.label || '未知'}
              </Text>
            </View>
            <View style={styles.pregDivider} />
            <View style={styles.pregRow}>
              <Text style={styles.pregLabel}>当前孕周</Text>
              <Text style={styles.pregValue}>第 {state.weeksPregnant} 周</Text>
            </View>
            <View style={styles.pregDivider} />
            <View style={styles.pregRow}>
              <Text style={styles.pregLabel}>预产期</Text>
              <Text style={styles.pregValue}>{state.babies[0]?.dueDate || '-'}</Text>
            </View>
          </View>
        ) : null}

        {/* 账号菜单 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>账号</Text>
          <Card style={styles.menuCard}>
            <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/profile-edit')}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="person-outline" size={18} color={colors.accent} />
                </View>
                <Text style={styles.menuText}>个人资料</Text>
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        {/* 关于菜单 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          <Card style={styles.menuCard}>
            <TouchableOpacity style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="help-circle-outline" size={18} color={colors.accent} />
                </View>
                <Text style={styles.menuText}>使用帮助</Text>
              </View>
            </TouchableOpacity>
          </Card>
          <Card style={styles.menuCard}>
            <TouchableOpacity style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
                </View>
                <Text style={styles.menuText}>关于我们</Text>
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        {/* 显示设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>显示</Text>
          <Card style={styles.menuCard}>
            <View style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={18} color={colors.accent} />
                </View>
                <Text style={styles.menuText}>深色模式</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#D4D0C8', true: colors.accentLight }}
                thumbColor={isDark ? colors.accent : '#FCFAF5'}
              />
            </View>
          </Card>
        </View>

        {/* 退出登录 */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          {signingOut ? (
            <ActivityIndicator color={colors.error} size="small" />
          ) : (
            <Text style={styles.logoutText}>退出登录</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

