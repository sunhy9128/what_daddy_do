import { View, Text } from '@tarojs/components';
import { navigateBack } from '@tarojs/taro';
import { Card } from '../../components/Card';
import { colors, spacing, fontSize, radius } from '../../styles/tokens';

interface Props {
  emoji: string;
  title: string;
  desc: string;
  detail?: string;
}

export default function ComingSoon({ emoji, title, desc, detail }: Props) {
  return (
    <View style={{ padding: `${spacing.lg}rpx`, backgroundColor: colors.bg, minHeight: '100vh' }}>
      <Text style={{ fontSize: `${fontSize.title}rpx`, fontWeight: '600', color: colors.fg, marginBottom: `${spacing.md}rpx`, display: 'block' }}>
        {emoji} {title}
      </Text>
      <Card>
        <Text style={{ fontSize: '72rpx', textAlign: 'center' }}>{emoji}</Text>
        <Text style={{ fontSize: `${fontSize.callout}rpx`, color: colors.fg, fontWeight: '500', textAlign: 'center', marginTop: `${spacing.md}rpx`, display: 'block' }}>
          {desc}
        </Text>
        {detail && (
          <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, textAlign: 'center', marginTop: `${spacing.sm}rpx`, display: 'block' }}>
            {detail}
          </Text>
        )}
        <View
          onClick={() => navigateBack()}
          style={{
            marginTop: `${spacing.lg}rpx`,
            padding: `${spacing.md}rpx`,
            backgroundColor: colors.accent,
            borderRadius: `${radius.md}rpx`,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: `${fontSize.callout}rpx` }}>返回</Text>
        </View>
      </Card>
    </View>
  );
}