/**
 * ensurePresetTasksForBaby + addPresetTasks
 *
 * 给一组预设任务创建 DB 记录，每条独立 try/catch，一条失败不影响其他。
 * 按 (user_id, baby_id, title, stage) 去重——每个宝宝独立种入全套预设，
 * 新儿童不因哥哥姐姐已有同名任务而缺失孕期产检任务。
 *
 * 这是 P1 #5 修复：之前只在 loadUserData 里调用，切宝宝走 setActiveBaby 时不会注入预设。
 */
import { getTasks } from '../lib/api';
import { supabase } from '../lib/supabase';
import { presetTasks, PresetTask } from '../lib/preset-tasks';

export async function addPresetTasks(userId: string, babyId: string, tasks: PresetTask[]): Promise<void> {
  const { data: existing } = await supabase
    .from('tasks')
    .select('title, stage')
    .eq('user_id', userId)
    .eq('baby_id', babyId);
  const existingKeys = new Set((existing || []).map(t => `${t.title}|${t.stage}`));

  const toInsert = tasks
    .filter(t => !existingKeys.has(`${t.title}|${t.stage}`))
    .map(task => ({
      user_id: userId,
      baby_id: babyId,
      title: task.title,
      description: task.description,
      stage: task.stage,
      type: task.type,
      task_subtype: task.type === 'daily' ? 'recurring' : 'one_time',
      due_date: task.due_date || null,
      is_completed: false,
    }));
  if (toInsert.length === 0) return;

  // 一次批量插入（上百条逐条插入会阻塞「保存中」几十秒）
  const { error } = await supabase.from('tasks').insert(toInsert);
  if (error) {
    // 批量失败时逐条兜底，单条失败不影响其他
    for (const task of toInsert) {
      try {
        await supabase.from('tasks').insert(task);
      } catch (e) {
        console.error('Failed to create preset task:', task.title);
      }
    }
  }
}

export async function ensurePresetTasksForBaby(userId: string, babyId: string): Promise<void> {
  const tasksData = await getTasks(userId, babyId);
  if (tasksData.length > 0) return;
  await addPresetTasks(userId, babyId, presetTasks);
}