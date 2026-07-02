import { View, Text } from '@tarojs/components';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, fontSize, radius } from '../../styles/tokens';

export default function Profile() {
  const { user, signOut } = useAuth();

  return (
    <View style={{ padding: `${spacing.lg}rpx`, backgroundColor: colors.bg, minHeight: '100vh' }}>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: `${radius.md}rpx`,
          padding: `${spacing.lg}rpx`,
          borderWidth: '2rpx',
          borderColor: colors.border,
          marginBottom: `${spacing.md}rpx`,
        }}
      >
        <Text style={{ fontSize: `${fontSize.title}rpx`, fontWeight: '600', color: colors.fg }}>
          {user?.email ?? '未登录'}
        </Text>
      </View>

      <View
        onClick={() => signOut()}
        style={{
          backgroundColor: colors.surface,
          borderRadius: `${radius.md}rpx`,
          padding: `${spacing.md}rpx`,
          borderWidth: '1rpx',
          borderColor: colors.border,
          textAlign: 'center',
          marginTop: `${spacing.lg}rpx`,
        }}
      >
        <Text style={{ fontSize: `${fontSize.callout}rpx`, color: colors.danger, fontWeight: '500' }}>
          退出登录
        </Text>
      </View>
    </View>
  );
}