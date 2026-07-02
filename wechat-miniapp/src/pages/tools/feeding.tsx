import { View, Text, Button } from '@tarojs/components';
import { useEffect, useState, useRef } from 'react';
import Taro from '@tarojs/taro';
import { useAuth } from '../../context/AuthContext';
import { useFeedingRecords, FeedingRecord } from '../../hooks/useFeedingRecords';
import { Card } from '../../components/Card';
import { colors, spacing, fontSize, radius } from '../../styles/tokens';

type Type = FeedingRecord['type'];
const TYPES: { value: Type; label: string; emoji: string }[] = [
  { value: 'breast-left',  label: '左胸', emoji: '🤱' },
  { value: 'breast-right', label: '右胸', emoji: '🤱' },
  { value: 'bottle',       label: '奶瓶', emoji: '🍼' },
];

function fmt(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Feeding() {
  const { user } = useAuth();
  const { records, add, remove } = useFeedingRecords(user?.id);
  const [type, setType] = useState<Type>('breast-left');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<string | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (tick.current) clearInterval(tick.current); }, []);

  const start = () => {
    startedAt.current = new Date().toISOString();
    setElapsed(0);
    setRunning(true);
    tick.current = setInterval(() => {
      setElapsed(e => e + 1);
    }, 1000);
  };

  const stop = async () => {
    if (!startedAt.current) return;
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
    setRunning(false);
    if (elapsed < 1) {
      Taro.showToast({ title: '太短了，未记录', icon: 'none' });
      startedAt.current = null;
      return;
    }
    add({ type, startAt: startedAt.current, durationSec: elapsed });
    startedAt.current = null;
    Taro.showToast({ title: '已记录', icon: 'success' });
  };

  return (
    <View style={{ padding: `${spacing.lg}rpx`, backgroundColor: colors.bg, minHeight: '100vh' }}>
      <Text style={{ fontSize: `${fontSize.title}rpx`, fontWeight: '600', color: colors.fg, marginBottom: `${spacing.md}rpx`, display: 'block' }}>
        🍼 喂奶计时
      </Text>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: `${spacing.md}rpx` }}>
          {TYPES.map(t => {
            const active = t.value === type;
            return (
              <View
                key={t.value}
                onClick={() => !running && setType(t.value)}
                style={{
                  padding: `${spacing.sm}rpx ${spacing.md}rpx`,
                  borderRadius: `${radius.full}rpx`,
                  backgroundColor: active ? colors.accent : colors.surfaceSecondary,
                  opacity: running && !active ? 0.4 : 1,
                }}
              >
                <Text style={{ color: active ? '#FFFFFF' : colors.fg, fontSize: `${fontSize.footnote}rpx` }}>
                  {t.emoji} {t.label}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={{ textAlign: 'center', fontSize: '80rpx', fontWeight: '300', color: colors.fg, fontVariantNumeric: 'tabular-nums' }}>
          {fmt(elapsed)}
        </Text>

        <Button
          onClick={running ? stop : start}
          style={{
            backgroundColor: running ? colors.danger : colors.accent,
            color: '#FFFFFF',
            borderRadius: `${radius.md}rpx`,
            fontSize: `${fontSize.callout}rpx`,
            marginTop: `${spacing.md}rpx`,
          }}
        >
          {running ? '停止并保存' : '开始计时'}
        </Button>
      </Card>

      <Text style={{ fontSize: `${fontSize.callout}rpx`, fontWeight: '600', color: colors.fg, marginTop: `${spacing.lg}rpx`, marginBottom: `${spacing.sm}rpx`, display: 'block' }}>
        历史记录 ({records.length})
      </Text>
      {records.length === 0 ? (
        <Text style={{ color: colors.fgSecondary, fontSize: `${fontSize.footnote}rpx`, textAlign: 'center', padding: `${spacing.md}rpx` }}>
          暂无记录
        </Text>
      ) : (
        records.slice(0, 10).map(r => {
          const meta = TYPES.find(t => t.value === r.type)!;
          return (
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
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text style={{ fontSize: `${fontSize.callout}rpx`, color: colors.fg }}>
                  {meta.emoji} {meta.label} · {fmt(r.durationSec)}
                </Text>
                <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginTop: `${spacing.xs}rpx`, display: 'block' }}>
                  {new Date(r.startAt).toLocaleString('zh-CN')}
                </Text>
              </View>
              <View onClick={() => remove(r.id)}>
                <Text style={{ color: colors.danger, fontSize: `${fontSize.footnote}rpx` }}>删除</Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}