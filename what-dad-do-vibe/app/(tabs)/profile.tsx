import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useApp } from '../../src/context/AppContext';
import { Card } from '../../src/components/atoms';
import { colors, spacing, typography } from '../../src/styles/tokens';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { state } = useApp();

  const [signingOut, setSigningOut] = useState(false);
  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      Alert.alert('退出失败', '请重试');
    } finally {
      setSigningOut(false);
    }
  };

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

        {/* 账号菜单 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>账号</Text>
          <Card style={styles.menuCard}>
            <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/baby-info')}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: colors.accentLight }]}>
                  <Text style={styles.menuIconText}>📅</Text>
                </View>
                <Text style={styles.menuText}>怀孕信息</Text>
              </View>
              {state.babies.length > 0 && (
                <Text style={styles.menuBadge}>{state.babies[0].dueDate}</Text>
              )}
            </TouchableOpacity>
          </Card>
          <Card style={styles.menuCard}>
            <TouchableOpacity style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: colors.accentLight }]}>
                  <Text style={styles.menuIconText}>👤</Text>
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
                  <Text style={styles.menuIconText}>📖</Text>
                </View>
                <Text style={styles.menuText}>使用帮助</Text>
              </View>
            </TouchableOpacity>
          </Card>
          <Card style={styles.menuCard}>
            <TouchableOpacity style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: colors.accentLight }]}>
                  <Text style={styles.menuIconText}>💬</Text>
                </View>
                <Text style={styles.menuText}>关于我们</Text>
              </View>
            </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },

  // 头像
  profile: { alignItems: 'center', paddingVertical: spacing.xxl },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    borderRadius: 12,
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
  menuIconText: { fontSize: 16 },
  menuText: { ...typography.callout, color: colors.fg },
  menuBadge: { ...typography.footnote, color: colors.accent, fontWeight: '500' },

  // 退出
  logoutBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md + 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
  },
  logoutText: { ...typography.callout, fontWeight: '500', color: colors.error },
});
