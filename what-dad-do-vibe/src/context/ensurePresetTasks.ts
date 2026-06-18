/**
 * ensurePresetTasksForBaby + addPresetTasks
 *
 * 给一组预设任务创建 DB 记录，每条独立 try/catch，一条失败不影响其他。
 * 跨宝宝只插入一次（按 (user_id, title) 去重）。
 *
 * 这是 P1 #5 修复：之前只在 loadUserData 里调用，切宝宝走 setActiveBaby 时不会注入预设。
 */
import { createTask, getTasks } from '../lib/api';
import { supabase } from '../lib/supabase';
import { presetTasks, PresetTask } from '../lib/preset-tasks';

export async function addPresetTasks(userId: string, babyId: string, tasks: PresetTask[]): Promise<void> {
  const { data: existing } = await supabase
    .from('tasks')
    .select('title')
    .eq('user_id', userId);
  const existingTitles = new Set((existing || []).map(t => t.title));

  for (const task of tasks) {
    if (existingTitles.has(task.title)) continue;
    try {
      await createTask({
        user_id: userId,
        baby_id: babyId,
        title: task.title,
        description: task.description,
        stage: task.stage,
        type: task.type,
        task_subtype: task.type === 'daily' ? 'recurring' : 'one_time',
        due_date: task.due_date || null,
        is_completed: false,
      });
    } catch (e) {
      console.error('Failed to create preset task:', task.title);
    }
  }
}

export async function ensurePresetTasksForBaby(userId: string, babyId: string): Promise<void> {
  const tasksData = await getTasks(userId, babyId);
  if (tasksData.length > 0) return;
  await addPresetTasks(userId, babyId, presetTasks);
}