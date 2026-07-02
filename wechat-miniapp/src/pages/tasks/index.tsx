import { View, Text } from '@tarojs/components';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTasks, toggleTask } from '../../lib/api';
import { Task } from '../../lib/supabase';
import { StageTabs } from '../../components/StageTabs';
import { goTo } from '../../lib/router';
import { colors, spacing, fontSize, radius } from '../../styles/tokens';

const STAGE_TABS = ['产检', '日常', '打卡'];

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState('产检');

  useEffect(() => {
    if (!user) return;
    getTasks(user.id).then(setTasks);
  }, [user]);

  const filtered = tasks.filter(t => t.category === activeTab);

  const onToggle = async (task: Task) => {
    const next = !task.completed;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: next } : t));
    await toggleTask(task.id, next);
  };

  return (
    <View style={{ padding: `${spacing.lg}rpx`, backgroundColor: colors.bg, minHeight: '100vh' }}>
      <StageTabs tabs={STAGE_TABS} active={activeTab} onChange={setActiveTab} />

      {filtered.length === 0 ? (
        <View style={{ padding: `${spacing.xl}rpx`, textAlign: 'center' }}>
          <Text style={{ color: colors.fgSecondary, fontSize: `${fontSize.body}rpx` }}>
            暂无任务
          </Text>
        </View>
      ) : (
        filtered.map(task => (
          <View
            key={task.id}
            onClick={() => goTo(`/pages/tasks/detail?id=${task.id}`)}
            style={{
              backgroundColor: colors.surface,
              borderRadius: `${radius.md}rpx`,
              padding: `${spacing.md}rpx`,
              borderWidth: '2rpx',
              borderColor: colors.border,
              marginBottom: `${spacing.sm}rpx`,
              opacity: task.completed ? 0.55 : 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: `${spacing.sm}rpx` }}>
                <Text style={{ fontSize: `${fontSize.callout}rpx`, fontWeight: '500', color: colors.fg }}>
                  {task.title}
                </Text>
                {task.hospital_name && (
                  <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginTop: `${spacing.xs}rpx`, display: 'block' }}>
                    🏥 {task.hospital_name}
                  </Text>
                )}
                {task.due_date && (
                  <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.muted, marginTop: `${spacing.xs}rpx`, display: 'block' }}>
                    {task.due_date.slice(0, 10)}
                  </Text>
                )}
              </View>
              <View
                onClick={(e: any) => { e?.stopPropagation?.(); onToggle(task); }}
                style={{
                  width: '44rpx',
                  height: '44rpx',
                  borderRadius: '22rpx',
                  borderWidth: '2rpx',
                  borderColor: task.completed ? colors.accent : colors.border,
                  backgroundColor: task.completed ? colors.accent : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {task.completed && <Text style={{ color: '#FFFFFF', fontSize: '24rpx', lineHeight: '24rpx' }}>✓</Text>}
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}