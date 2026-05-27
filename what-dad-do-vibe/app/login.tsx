import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';

const colors = {
  bg: '#F5F0E8',
  surface: '#FCFAF5',
  surfaceSecondary: '#F0ECE4',
  fg: '#1A1A2E',
  fgSecondary: '#5A5A6E',
  muted: '#8A8A9A',
  border: '#E8E4D9',
  accent: '#2C3E6B',
};

const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 40 };
const radius = { sm: 8, md: 12, lg: 16, xl: 20 };
const shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, signUp, session, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && session) {
      router.replace('/(tabs)');
    }
  }, [session, authLoading]);

  if (authLoading) {
    return null;
  }

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('错误', '请填写邮箱和密码');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        Alert.alert('成功', '请检查邮箱验证链接');
      } else {
        await signIn(email, password);
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setLoading(true);
    try {
      await signIn('admin', 'admin123');
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('错误', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>👶</Text>
          <Text style={styles.title}>爸爸去哪了</Text>
          <Text style={styles.subtitle}>新手爸爸的育儿随军参谋</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="邮箱"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="密码"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '请稍候...' : isSignUp ? '注册' : '登录'}
            </Text>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchHint}>{isSignUp ? '已有账号？' : '没有账号？'}</Text>
            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={styles.switchAction}>{isSignUp ? '登录' : '注册'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>或</Text>
            <View style={styles.dividerLine} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminButton} onPress={handleAdminLogin}>
            <Text style={styles.adminText}>超级管理员登录</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.fg,
  },
  subtitle: {
    fontSize: 15,
    color: colors.fgSecondary,
    marginTop: spacing.xs,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.fg,
    marginBottom: spacing.md,
    borderWidth: 0.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  switchHint: {
    fontSize: 15,
    color: colors.fgSecondary,
  },
  switchAction: {
    fontSize: 15,
    color: colors.accent,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: colors.muted,
    marginHorizontal: spacing.md,
  },
  adminButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  adminText: {
    fontSize: 15,
    color: colors.fgSecondary,
    fontWeight: '500',
  },
});