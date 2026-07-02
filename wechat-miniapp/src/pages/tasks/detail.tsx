import { View, Text, Button } from '@tarojs/components';
import { useLoad, useRouter, navigateBack } from '@tarojs/taro';
import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import { supabase, Task } from '../../lib/supabase';
import { toggleTask } from '../../lib/api';
import { Card } from '../../components/Card';
import { colors, spacing, fontSize, radius } from '../../styles/tokens';

/** 解析 description 中的「注意事项: ...」块（与 RN 端约定一致） */
function parseNotes(desc?: string | null): string[] {
  if (!desc) return [];
  const match = desc.match(/注意事项[:：]\s*([\s\S]+?)(?=\n\n|$)/);
  if (!match) return [];
  return match[1].split(/[\n;,，；]/).map(s => s.trim()).filter(Boolean);
}

export default function TaskDetail() {
  const router = useRouter();
  const taskId = Number(router.params.id);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useLoad(() => { console.log('task detail loaded:', taskId); });

  useEffect(() => {
    if (!taskId) return;
    supabase.from('tasks').select('*').eq('id', taskId).maybeSingle()
      .then(({ data }) => setTask(data as Task | null))
      .finally(() => setLoading(false));
  }, [taskId]);

  const onToggle = async () => {
    if (!task) return;
    const next = !task.completed;
    setTask({ ...task, completed: next });
    await toggleTask(task.id, next);
  };

  const openMap = () => {
    if (!task?.hospital_lat || !task?.hospital_lng) {
      Taro.showToast({ title: '未设置医院坐标', icon: 'none' });
      return;
    }
    const { hospital_lat: lat, hospital_lng: lng, hospital_name: name } = task;
    Taro.openLocation({
      latitude: lat,
      longitude: lng,
      name: name ?? '产检医院',
      scale: 16,
    });
  };

  if (loading) {
    return <View style={{ padding: `${spacing.lg}rpx` }}><Text>加载中…</Text></View>;
  }
  if (!task) {
    return <View style={{ padding: `${spacing.lg}rpx` }}><Text>任务不存在</Text></View>;
  }

  const notes = parseNotes(task.description);

  return (
    <View style={{ padding: `${spacing.lg}rpx`, backgroundColor: colors.bg, minHeight: '100vh' }}>
      <Card style={{ marginBottom: `${spacing.md}rpx` }}>
        <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.accent, fontWeight: '500' }}>
          {task.category}
        </Text>
        <Text style={{ fontSize: `${fontSize.headline}rpx`, fontWeight: '600', color: colors.fg, marginTop: `${spacing.xs}rpx`, display: 'block' }}>
          {task.title}
        </Text>
        {task.due_date && (
          <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginTop: `${spacing.sm}rpx`, display: 'block' }}>
            截止：{task.due_date.slice(0, 10)}
          </Text>
        )}
        {task.description && (
          <Text style={{ fontSize: `${fontSize.body}rpx`, color: colors.fg, marginTop: `${spacing.md}rpx`, display: 'block', lineHeight: '1.6' }}>
            {task.description.replace(/注意事项[:：][\s\S]+/, '').trim()}
          </Text>
        )}
      </Card>

      {notes.length > 0 && (
        <Card style={{ marginBottom: `${spacing.md}rpx`, backgroundColor: colors.surfaceSecondary, bordered: false }}>
          <Text style={{ fontSize: `${fontSize.callout}rpx`, fontWeight: '600', color: colors.fg, marginBottom: `${spacing.sm}rpx`, display: 'block' }}>
            ⚠️ 注意事项
          </Text>
          {notes.map((n, i) => (
            <View key={i} style={{ flexDirection: 'row', marginTop: `${spacing.xs}rpx` }}>
              <Text style={{ color: colors.fg, fontSize: `${fontSize.body}rpx`, marginRight: `${spacing.xs}rpx` }}>·</Text>
              <Text style={{ color: colors.fg, fontSize: `${fontSize.body}rpx`, flex: 1 }}>{n}</Text>
            </View>
          ))}
        </Card>
      )}

      {task.hospital_name && (
        <Card style={{ marginBottom: `${spacing.md}rpx` }}>
          <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary }}>产检医院</Text>
          <Text style={{ fontSize: `${fontSize.callout}rpx`, fontWeight: '600', color: colors.fg, marginTop: `${spacing.xs}rpx`, display: 'block' }}>
            {task.hospital_name}
          </Text>
          {task.hospital_address && (
            <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginTop: `${spacing.xs}rpx`, display: 'block' }}>
              📍 {task.hospital_address}
            </Text>
          )}
          {task.hospital_lat && task.hospital_lng && (
            <View
              onClick={openMap}
              style={{
                marginTop: `${spacing.md}rpx`,
                padding: `${spacing.sm}rpx`,
                backgroundColor: colors.accentLight,
                borderRadius: `${radius.sm}rpx`,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.accent, fontSize: `${fontSize.footnote}rpx`, fontWeight: '500' }}>
                🗺️ 一键导航
              </Text>
            </View>
          )}
        </Card>
      )}

      <Button
        onClick={onToggle}
        style={{
          backgroundColor: task.completed ? colors.surface : colors.accent,
          color: task.completed ? colors.fgSecondary : '#FFFFFF',
          borderRadius: `${radius.md}rpx`,
          fontSize: `${fontSize.callout}rpx`,
          marginTop: `${spacing.md}rpx`,
          borderWidth: task.completed ? '1rpx' : '0',
          borderColor: colors.border,
        }}
      >
        {task.completed ? '✓ 已完成（点击撤销）' : '标记完成'}
      </Button>

      <View onClick={() => navigateBack()} style={{ alignItems: 'center', marginTop: `${spacing.md}rpx` }}>
        <Text style={{ color: colors.fgSecondary, fontSize: `${fontSize.footnote}rpx` }}>返回</Text>
      </View>
    </View>
  );
}