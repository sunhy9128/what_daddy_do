import { View, Text, Input } from '@tarojs/components';
import { useEffect, useState } from 'react';
import { getFoodSafety } from '../../lib/api';
import { FoodSafety } from '../../lib/supabase';
import { colors, spacing, fontSize, radius } from '../../styles/tokens';

const CATEGORY_META: Record<FoodSafety['category'], { label: string; bg: string; fg: string; emoji: string }> = {
  safe:    { label: '可以吃', bg: '#E8F5E9', fg: '#2E7D32', emoji: '✅' },
  caution: { label: '谨慎吃', bg: '#FFF8E1', fg: '#E65100', emoji: '⚠️' },
  avoid:   { label: '避免吃', bg: '#FFEBEE', fg: '#C62828', emoji: '❌' },
};

export default function Food() {
  const [all, setAll] = useState<FoodSafety[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FoodSafety['category'] | 'all'>('all');

  useEffect(() => { getFoodSafety().then(setAll).catch(() => {}); }, []);

  const visible = all
    .filter(item => filter === 'all' || item.category === filter)
    .filter(item => !query || item.name.includes(query));

  return (
    <View style={{ padding: `${spacing.lg}rpx`, backgroundColor: colors.bg, minHeight: '100vh' }}>
      <Text style={{ fontSize: `${fontSize.title}rpx`, fontWeight: '600', color: colors.fg, marginBottom: `${spacing.md}rpx`, display: 'block' }}>
        🍽️ 食物禁忌
      </Text>

      <Input
        value={query}
        onInput={(e: any) => setQuery(e.detail.value)}
        placeholder="搜索食物…"
        style={{
          backgroundColor: colors.surface,
          borderRadius: `${radius.sm}rpx`,
          borderWidth: '2rpx',
          borderColor: colors.border,
          padding: `${spacing.sm}rpx`,
          fontSize: `${fontSize.body}rpx`,
          marginBottom: `${spacing.md}rpx`,
        }}
      />

      <View style={{ flexDirection: 'row', marginBottom: `${spacing.md}rpx` }}>
        {(['all', 'safe', 'caution', 'avoid'] as const).map(k => {
          const active = k === filter;
          const label = k === 'all' ? '全部' : CATEGORY_META[k].label;
          return (
            <View
              key={k}
              onClick={() => setFilter(k)}
              style={{
                padding: `${spacing.xs}rpx ${spacing.md}rpx`,
                borderRadius: `${radius.full}rpx`,
                backgroundColor: active ? colors.accent : colors.surface,
                borderWidth: '2rpx',
                borderColor: active ? colors.accent : colors.border,
                marginRight: `${spacing.xs}rpx`,
              }}
            >
              <Text style={{ color: active ? '#FFFFFF' : colors.fg, fontSize: `${fontSize.footnote}rpx` }}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      {visible.length === 0 ? (
        <Text style={{ color: colors.fgSecondary, textAlign: 'center', padding: `${spacing.lg}rpx` }}>
          暂无数据
        </Text>
      ) : (
        visible.map(item => {
          const meta = CATEGORY_META[item.category];
          return (
            <View
              key={item.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: `${radius.md}rpx`,
                padding: `${spacing.md}rpx`,
                borderWidth: '2rpx',
                borderColor: colors.border,
                marginBottom: `${spacing.sm}rpx`,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  padding: `${spacing.xs}rpx ${spacing.sm}rpx`,
                  borderRadius: `${radius.sm}rpx`,
                  backgroundColor: meta.bg,
                  marginRight: `${spacing.md}rpx`,
                }}
              >
                <Text style={{ color: meta.fg, fontSize: `${fontSize.footnote}rpx`, fontWeight: '500' }}>
                  {meta.emoji} {meta.label}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: `${fontSize.callout}rpx`, color: colors.fg, fontWeight: '500' }}>
                  {item.name}
                </Text>
                {item.note && (
                  <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginTop: `${spacing.xs}rpx`, display: 'block' }}>
                    {item.note}
                  </Text>
                )}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}