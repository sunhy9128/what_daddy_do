import { View, Text, Input, Button } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, fontSize, radius } from '../../styles/tokens';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      Taro.showToast({ title: '请输入邮箱和密码', icon: 'none' });
      return;
    }
    setSubmitting(true);
    const fn = isSignUp ? signUp : signIn;
    const { error } = await fn(email, password);
    setSubmitting(false);
    if (error) {
      Taro.showToast({ title: error, icon: 'none' });
    } else {
      Taro.switchTab({ url: '/pages/index/index' });
    }
  };

  return (
    <View style={{ padding: `${spacing.xl}rpx`, backgroundColor: colors.bg, minHeight: '100vh' }}>
      <Text style={{ fontSize: `${fontSize.title}rpx`, fontWeight: '600', color: colors.fg, marginBottom: `${spacing.xl}rpx`, display: 'block' }}>
        {isSignUp ? '注册账号' : '登录'}
      </Text>

      <View style={{ marginBottom: `${spacing.md}rpx` }}>
        <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginBottom: `${spacing.xs}rpx`, display: 'block' }}>邮箱</Text>
        <Input
          value={email}
          onInput={(e: any) => setEmail(e.detail.value)}
          placeholder="you@example.com"
          style={{
            backgroundColor: colors.surface,
            borderRadius: `${radius.sm}rpx`,
            borderWidth: '1rpx',
            borderColor: colors.border,
            padding: `${spacing.sm}rpx`,
            fontSize: `${fontSize.body}rpx`,
          }}
        />
      </View>

      <View style={{ marginBottom: `${spacing.lg}rpx` }}>
        <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginBottom: `${spacing.xs}rpx`, display: 'block' }}>密码</Text>
        <Input
          value={password}
          onInput={(e: any) => setPassword(e.detail.value)}
          password
          placeholder="******"
          style={{
            backgroundColor: colors.surface,
            borderRadius: `${radius.sm}rpx`,
            borderWidth: '1rpx',
            borderColor: colors.border,
            padding: `${spacing.sm}rpx`,
            fontSize: `${fontSize.body}rpx`,
          }}
        />
      </View>

      <Button
        onClick={onSubmit}
        loading={submitting}
        style={{
          backgroundColor: colors.accent,
          color: '#FFFFFF',
          borderRadius: `${radius.sm}rpx`,
          fontSize: `${fontSize.callout}rpx`,
          marginBottom: `${spacing.md}rpx`,
        }}
      >
        {isSignUp ? '注册' : '登录'}
      </Button>

      <View onClick={() => setIsSignUp(!isSignUp)} style={{ textAlign: 'center' }}>
        <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.accent }}>
          {isSignUp ? '已有账号？去登录' : '没有账号？去注册'}
        </Text>
      </View>
    </View>
  );
}