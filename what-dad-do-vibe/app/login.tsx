import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';

const C = {
  bg: '#F5F0E8', surface: '#FCFAF5', surfaceSecondary: '#F0ECE4',
  fg: '#1A1A2E', fgSecondary: '#5A5A6E', muted: '#8A8A9A',
  border: '#E8E4D9', accent: '#2C3E6B',
};
const S = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 40 };
const R = { sm: 8, md: 12, lg: 16, xl: 20 };
const SH = { sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 } };

const DEFAULT_CODE = '0000';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, signUp, session, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCountdown = () => {
    setCodeSent(true);
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setCodeSent(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = () => {
    if (!phone || phone.length < 8) { safeAlert('请输入正确的手机号'); return; }
    // 开发阶段：验证码固定为 0000，不发真实短信
    startCountdown();
    if (Platform.OS === 'web') { window.alert('验证码：0000（开发阶段）'); }
    else { Alert.alert('验证码', '0000（开发阶段）'); }
  };

  useEffect(() => {
    if (!authLoading && session) {
      router.replace('/(tabs)');
    }
  }, [session, authLoading]);

  if (authLoading) return null;

  const safeAlert = (title: string, msg?: string) => {
    if (Platform.OS === 'web') { window.alert(msg || title); }
    else { Alert.alert(title, msg || ''); }
  };

  const handleEmailSubmit = async () => {
    if (!email || !password) { safeAlert('请填写邮箱和密码'); return; }
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        safeAlert('注册成功', '请检查邮箱验证链接');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      safeAlert('错误', e.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async () => {
    if (!phone || phone.length < 8) { safeAlert('请输入正确的手机号'); return; }
    if (!code || code.length < 4) { safeAlert('请输入验证码'); return; }
    if (code !== DEFAULT_CODE) { safeAlert('验证码错误'); return; }
    setLoading(true);
    try {
      // 开发阶段：用手机号映射邮箱 + 固定密码进行登录/注册
      const emailAlias = `u${phone}@whatdaddy.com`;
      const pwd = `p${phone}`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailAlias,
        password: pwd,
      });
      if (error?.message?.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: emailAlias,
          password: pwd,
          options: { data: { phone } },
        });
        if (signUpError) throw signUpError;
        // 注册后立即登录（开发阶段跳过邮箱验证）
        // 注册后尝试直接登录
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: emailAlias, password: pwd,
        });
        if (loginError) {
          safeAlert('还需要一步', '请在 Supabase 控制台 → Authentication → Settings 中关闭 "Confirm email" 开关，即可直接登录');
        } else {
          router.replace('/(tabs)');
        }
      } else if (error) {
        throw error;
      } else {
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      safeAlert('错误', e.message || '操作失败');
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
          <Image source={require('../assets/icon.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>爸爸去哪了</Text>
          <Text style={styles.subtitle}>新手爸爸的育儿随军参谋</Text>
        </View>

        {/* 登录方式切换 */}
        <View style={styles.modeSwitch}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'email' && styles.modeBtnActive]}
            onPress={() => setMode('email')}
          >
            <Ionicons name="mail-outline" size={14} color={mode === 'email' ? '#fff' : C.accent} />
            <Text style={[styles.modeText, mode === 'email' && styles.modeTextActive]}>邮箱</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'phone' && styles.modeBtnActive]}
            onPress={() => setMode('phone')}
          >
            <Ionicons name="phone-portrait-outline" size={14} color={mode === 'phone' ? '#fff' : C.accent} />
            <Text style={[styles.modeText, mode === 'phone' && styles.modeTextActive]}>手机</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {mode === 'email' ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="邮箱"
                placeholderTextColor={C.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={styles.input}
                placeholder="密码"
                placeholderTextColor={C.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleEmailSubmit}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? '请稍候...' : isSignUp ? '注册' : '登录'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="手机号"
                placeholderTextColor={C.muted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={11}
              />
              <View style={styles.codeRow}>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="验证码"
                  placeholderTextColor={C.muted}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={[styles.codeBtn, codeSent && styles.codeBtnDisabled]}
                  onPress={handleSendCode}
                  disabled={codeSent}
                >
                  <Text style={[styles.codeBtnText, codeSent && styles.codeBtnTextDisabled]}>
                    {codeSent ? `${countdown}s` : '获取验证码'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handlePhoneSubmit}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? '请稍候...' : '登录 / 注册'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {mode === 'email' && (
            <View style={styles.switchRow}>
              <Text style={styles.switchHint}>{isSignUp ? '已有账号？' : '没有账号？'}</Text>
              <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                <Text style={styles.switchAction}>{isSignUp ? '登录' : '注册'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: S.lg },
  logoContainer: { alignItems: 'center', marginBottom: S.xxl },
  logo: { width: 80, height: 80, borderRadius: 20, marginBottom: S.md },
  title: { fontSize: 28, fontWeight: '700', color: C.fg },
  subtitle: { fontSize: 15, color: C.fgSecondary, marginTop: S.xs },

  // 登录方式切换
  modeSwitch: {
    flexDirection: 'row', backgroundColor: C.surfaceSecondary,
    borderRadius: R.sm, padding: 3, marginBottom: S.lg,
  },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: S.sm + 2, borderRadius: 7,
  },
  modeBtnActive: { backgroundColor: C.accent },
  modeText: { fontSize: 14, fontWeight: '500', color: C.accent },
  modeTextActive: { color: '#fff' },

  form: { width: '100%' },
  input: {
    backgroundColor: C.surface, borderRadius: R.md,
    padding: S.md, fontSize: 16, color: C.fg,
    marginBottom: S.md, borderWidth: 0.5, borderColor: C.border,
    ...SH.sm,
  },
  button: {
    backgroundColor: C.accent, borderRadius: R.md,
    padding: S.md, alignItems: 'center', marginTop: S.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 17, fontWeight: '600', color: '#ffffff' },
  codeRow: { flexDirection: 'row', gap: S.sm, alignItems: 'flex-end', marginBottom: S.md },
  codeInput: { flex: 1, marginBottom: 0 },
  codeBtn: {
    backgroundColor: C.accent, borderRadius: R.md,
    paddingHorizontal: S.md, height: 50,
    alignItems: 'center', justifyContent: 'center',
    minWidth: 96,
  },
  codeBtnDisabled: { backgroundColor: C.muted },
  codeBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  codeBtnTextDisabled: { color: '#fff' },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: S.md,
  },
  switchHint: { fontSize: 15, color: C.fgSecondary },
  switchAction: { fontSize: 15, color: C.accent, fontWeight: '600', marginLeft: S.xs },
});
