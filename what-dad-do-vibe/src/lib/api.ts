import { supabase, Task, Record, CommunityPost, PregnancyStage } from '../lib/supabase';

// 预设任务类型
export interface PresetTask {
  id: string;
  title: string;
  description: string;
  stage: 'preconception' | 'first' | 'second' | 'third';
  type: 'prenatal' | 'daily' | 'custom' | 'checkin';
  due_date?: string;
  created_at?: string;
}

// 获取预设任务列表（从数据库）
export async function getPresetTasks(): Promise<PresetTask[]> {
  try {
    const { data, error } = await supabase
      .from('preset_tasks')
      .select('*')
      .order('stage', { ascending: true });

    if (error) {
      console.log('getPresetTasks error:', error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.log('getPresetTasks exception:', e);
    return [];
  }
}

// 孕期阶段
export async function getPregnancyStages(): Promise<PregnancyStage[]> {
  const { data, error } = await supabase
    .from('pregnancy_stages')
    .select('*')
    .order('weeks_start');
  if (error) throw error;
  return data || [];
}

// 任务 CRUD
export async function getTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createTask(task: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleTaskComplete(id: string, isCompleted: boolean): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null
    })
    .eq('id', id);
  if (error) throw error;
}

// 日常任务计数增加
export async function incrementDailyCount(id: string, currentCount: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase
    .from('tasks')
    .update({
      daily_count: currentCount + 1,
      daily_date: today
    })
    .eq('id', id);
  if (error) throw error;
}

// 记录 CRUD
export async function getRecords(userId: string): Promise<Record[]> {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createRecord(record: Partial<Record>): Promise<Record> {
  const { data, error } = await supabase
    .from('records')
    .insert(record)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRecord(id: string): Promise<void> {
  const { error } = await supabase.from('records').delete().eq('id', id);
  if (error) throw error;
}

// 社区帖子
export async function getCommunityPosts(category?: string): Promise<CommunityPost[]> {
  let query = supabase
    .from('community_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (category && category !== '全部') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}