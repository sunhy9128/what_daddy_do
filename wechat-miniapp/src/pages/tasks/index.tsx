import { View, Text } from '@tarojs/components';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTasks } from '../../lib/api';
import { Task } from '../../lib/supabase';
import { StageTabs } from '../../components/StageTabs';
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
            style={{
              backgroundColor: colors.surface,
              borderRadius: `${radius.md}rpx`,
              padding: `${spacing.md}rpx`,
              borderWidth: '1rpx',
              borderColor: colors.border,
              marginBottom: `${spacing.sm}rpx`,
              opacity: task.completed ? 0.55 : 1,
            }}
          >
            <Text style={{ fontSize: `${fontSize.callout}rpx`, fontWeight: '500', color: colors.fg }}>
              {task.completed ? '✓ ' : ''}{task.title}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}