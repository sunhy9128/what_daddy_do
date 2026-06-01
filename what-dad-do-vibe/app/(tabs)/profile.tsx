import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useApp } from '../../src/context/AppContext';
import { Card } from '../../src/components/atoms';
import { colors, spacing, typography } from '../../src/styles/tokens';

const theme = {
  background: colors.bg,
  surface: colors.surface,
  textPrimary: colors.fg,
  textSecondary: colors.fgSecondary,
  accent: colors.accent,
  accentLight: colors.accent + '20',
  error: colors.error,
  errorLight: colors.error + '20',
};

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
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.email}>{user?.email || '未登录'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>账号</Text>
          <Card style={styles.menuItem}>
            <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/baby-info')}>
              <Text style={styles.menuText}>怀孕信息</Text>
              {state.babies.length > 0 && (
                <Text style={styles.menuBadge}>{state.babies[0].dueDate}</Text>
              )}
            </TouchableOpacity>
          </Card>
          <Card style={styles.menuItem}>
            <TouchableOpacity style={styles.menuRow}>
              <Text style={styles.menuText}>个人资料</Text>
            </TouchableOpacity>
          </Card>
          <Card style={styles.menuItem}>
            <TouchableOpacity style={styles.menuRow}>
              <Text style={styles.menuText}>设置</Text>
            </TouchableOpacity>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          <Card style={styles.menuItem}>
            <TouchableOpacity style={styles.menuRow}>
              <Text style={styles.menuText}>使用帮助</Text>
            </TouchableOpacity>
          </Card>
          <Card style={styles.menuItem}>
            <TouchableOpacity style={styles.menuRow}>
              <Text style={styles.menuText}>关于我们</Text>
            </TouchableOpacity>
          </Card>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '600',
  },
  email: {
    marginTop: spacing.md,
    fontSize: 16,
    color: theme.textPrimary,
  },

  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  menuItem: {
    marginBottom: spacing.sm,
  },
  menuRow: {
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: theme.textPrimary,
  },
  menuBadge: {
    fontSize: 12,
    color: theme.accent,
    marginTop: spacing.xs,
  },
  logoutButton: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.xs,
    padding: spacing.md,
    backgroundColor: theme.errorLight,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: theme.error,
    fontWeight: '500',
  },
});