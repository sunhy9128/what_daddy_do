import { View, Text, Input, Button } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { useAuth } from '../../context/AuthContext';
import { useGrowthRecords } from '../../hooks/useGrowthRecords';
import { Card } from '../../components/Card';
import { colors, spacing, fontSize, radius } from '../../styles/tokens';

function today() { return new Date().toISOString().slice(0, 10); }

export default function Growth() {
  const { user } = useAuth();
  const { records, add, remove } = useGrowthRecords(user?.id);
  const [date, setDate] = useState(today());
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  const onAdd = async () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) {
      Taro.showToast({ title: '请输入有效数值', icon: 'none' });
      return;
    }
    add({ date, heightCm: h, weightKg: w });
    setHeight('');
    setWeight('');
    Taro.showToast({ title: '已记录', icon: 'success' });
  };

  // 简单体重曲线（最近 8 条）
  const recent = records.slice(0, 8).reverse();
  const maxW = Math.max(...recent.map(r => r.weightKg), 10);

  return (
    <View style={{ padding: `${spacing.lg}rpx`, backgroundColor: colors.bg, minHeight: '100vh' }}>
      <Text style={{ fontSize: `${fontSize.title}rpx`, fontWeight: '600', color: colors.fg, marginBottom: `${spacing.md}rpx`, display: 'block' }}>
        📏 生长记录
      </Text>

      <Card>
        <View style={{ marginBottom: `${spacing.md}rpx` }}>
          <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginBottom: `${spacing.xs}rpx`, display: 'block' }}>日期</Text>
          <Input
            value={date}
            onInput={(e: any) => setDate(e.detail.value)}
            placeholder="YYYY-MM-DD"
            style={inputStyle}
          />
        </View>
        <View style={{ flexDirection: 'row', marginBottom: `${spacing.md}rpx` }}>
          <View style={{ flex: 1, marginRight: `${spacing.sm}rpx` }}>
            <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginBottom: `${spacing.xs}rpx`, display: 'block' }}>身高 (cm)</Text>
            <Input
              type="digit"
              value={height}
              onInput={(e: any) => setHeight(e.detail.value)}
              placeholder="70"
              style={inputStyle}
            />
          </View>
          <View style={{ flex: 1, marginLeft: `${spacing.sm}rpx` }}>
            <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginBottom: `${spacing.xs}rpx`, display: 'block' }}>体重 (kg)</Text>
            <Input
              type="digit"
              value={weight}
              onInput={(e: any) => setWeight(e.detail.value)}
              placeholder="7.5"
              style={inputStyle}
            />
          </View>
        </View>
        <Button
          onClick={onAdd}
          style={{ backgroundColor: colors.accent, color: '#FFFFFF', borderRadius: `${radius.md}rpx`, fontSize: `${fontSize.callout}rpx` }}
        >
          添加记录
        </Button>
      </Card>

      {/* 简易体重柱图 */}
      {recent.length > 1 && (
        <Card style={{ marginTop: `${spacing.md}rpx` }}>
          <Text style={{ fontSize: `${fontSize.callout}rpx`, fontWeight: '600', color: colors.fg, marginBottom: `${spacing.md}rpx`, display: 'block' }}>
            体重趋势
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: '200rpx' }}>
            {recent.map(r => (
              <View key={r.id} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', marginHorizontal: `${spacing.xs / 2}rpx` }}>
                <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginBottom: `${spacing.xs / 2}rpx` }}>
                  {r.weightKg}
                </Text>
                <View style={{
                  width: '100%',
                  height: `${(r.weightKg / maxW) * 140}rpx`,
                  backgroundColor: colors.accent,
                  borderRadius: `${radius.sm}rpx`,
                }} />
                <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.muted, marginTop: `${spacing.xs / 2}rpx` }}>
                  {r.date.slice(5)}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      <Text style={{ fontSize: `${fontSize.callout}rpx`, fontWeight: '600', color: colors.fg, marginTop: `${spacing.lg}rpx`, marginBottom: `${spacing.sm}rpx`, display: 'block' }}>
        全部记录 ({records.length})
      </Text>
      {records.map(r => (
        <View
          key={r.id}
          style={{
            backgroundColor: colors.surface,
            borderRadius: `${radius.md}rpx`,
            padding: `${spacing.md}rpx`,
            borderWidth: '2rpx',
            borderColor: colors.border,
            marginBottom: `${spacing.sm}rpx`,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View>
            <Text style={{ fontSize: `${fontSize.callout}rpx`, color: colors.fg, fontWeight: '500' }}>{r.date}</Text>
            <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginTop: `${spacing.xs}rpx`, display: 'block' }}>
              {r.heightCm} cm · {r.weightKg} kg
            </Text>
          </View>
          <View onClick={() => remove(r.id)}>
            <Text style={{ color: colors.danger, fontSize: `${fontSize.footnote}rpx` }}>删除</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const inputStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: `${radius.sm}rpx`,
  borderWidth: '1rpx',
  borderColor: colors.border,
  padding: `${spacing.sm}rpx`,
  fontSize: `${fontSize.body}rpx`,
} as const;