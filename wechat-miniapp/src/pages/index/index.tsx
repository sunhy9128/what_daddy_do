import { View, Text } from '@tarojs/components';
import { useLoad } from '@tarojs/taro';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getBabies } from '../../lib/api';
import { Baby } from '../../lib/supabase';
import { calculateStageFromDueDate } from '../../lib/stages';
import { colors, spacing, fontSize, radius } from '../../styles/tokens';

export default function Index() {
  const { user } = useAuth();
  const [babies, setBabies] = useState<Baby[]>([]);
  const [loading, setLoading] = useState(true);

  useLoad(() => {
    console.log('首页 loaded');
  });

  useEffect(() => {
    if (!user) return;
    getBabies(user.id)
      .then(setBabies)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <View style={{ padding: `${spacing.lg}rpx` }}><Text>加载中…</Text></View>;
  }

  const primary = babies[0];
  const stage = primary ? calculateStageFromDueDate(primary.due_date) : null;

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
          {primary?.name ?? '宝宝'}
        </Text>
        {stage && (
          <Text style={{ fontSize: `${fontSize.body}rpx`, color: colors.fgSecondary, marginTop: `${spacing.xs}rpx`, display: 'block' }}>
            {stage.weeksPregnant > 0 ? `孕 ${stage.weeksPregnant} 周` : '尚未确认'}
            {stage.daysToDue > 0 && ` · 距预产期 ${stage.daysToDue} 天`}
          </Text>
        )}
      </View>

      <Text style={{ fontSize: `${fontSize.callout}rpx`, color: colors.fg, fontWeight: '500', marginTop: `${spacing.md}rpx`, display: 'block' }}>
        物品准备 / 心理支持 / 工具栏
      </Text>
      <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginTop: `${spacing.xs}rpx`, display: 'block' }}>
        （MVP 骨架，UI 后续迭代）
      </Text>
    </View>
  );
}