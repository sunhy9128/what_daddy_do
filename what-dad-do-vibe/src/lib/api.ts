import { supabase, Task, Record, CommunityPost, UrgentNote, Baby, PostComment, KnowledgeArticle, Vaccine, VaccineDose, UserVaccination, PresetItem, UserPreparation, PsychologicalSupport, FoodSafety, WellChildVisit, WellChildCheckupItem, UserWellChildRecord } from '../lib/supabase';

// 预设任务类型
export interface PresetTask {
  id: string;
  title: string;
  description: string;
  stage: 'preconception' | 'first' | 'second' | 'third' | 'postpartum';
  type: 'prenatal' | 'daily' | 'checkin';
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
      return [];
    }
    return data || [];
  } catch (e) {
    console.log('getPresetTasks exception:', e);
    return [];
  }
}

// 孕期阶段
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

  // 从 post_likes / post_comments 取真实计数
  const posts = data || [];
  const enriched = await Promise.all(posts.map(async (post) => {
    const { count: likesCount } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);
    const { count: commentsCount } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);
    return { ...post, likes: likesCount || 0, comments: commentsCount || 0 };
  }));

  return enriched;
}

// 创建社区帖子
export async function createCommunityPost(post: {
  user_id: string;
  author_name: string;
  title: string;
  content: string;
  category: string;
}): Promise<CommunityPost> {
  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      user_id: post.user_id,
      author_name: post.author_name,
      title: post.title,
      content: post.content,
      category: post.category,
    })
    .select()
    .single();
  if (error) throw error;
  return { ...data, likes: 0, comments: 0 };
}

// 紧急关注 CRUD
export async function getUrgentNotes(userId: string): Promise<UrgentNote[]> {
  const { data, error } = await supabase
    .from('urgent_notes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createUrgentNote(note: Partial<UrgentNote>): Promise<UrgentNote> {
  const { data, error } = await supabase
    .from('urgent_notes')
    .insert(note)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function dismissUrgentNote(id: string): Promise<void> {
  const { error } = await supabase
    .from('urgent_notes')
    .update({ is_active: false, dismissed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// 宝宝 CRUD
export async function getBabies(userId: string): Promise<Baby[]> {
  const { data, error } = await supabase
    .from('babies')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createBaby(baby: Partial<Baby>): Promise<Baby> {
  const { data, error } = await supabase
    .from('babies')
    .insert(baby)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBaby(id: string, updates: Partial<Baby>): Promise<Baby> {
  const { data, error } = await supabase
    .from('babies')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 孕期阶段计算
// 帖子互动
export async function toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
  // 检查是否已点赞
  const { data: existing } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    // 取消点赞
    await supabase.from('post_likes').delete().eq('id', existing.id);
    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);
    // 同步更新 community_posts 计数
    await supabase.from('community_posts').update({ likes: count || 0 }).eq('id', postId);
    return { liked: false, likesCount: count || 0 };
  } else {
    // 点赞
    await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);
    // 同步更新 community_posts 计数
    await supabase.from('community_posts').update({ likes: count || 0 }).eq('id', postId);
    return { liked: true, likesCount: count || 0 };
  }
}

export async function getLikeStatus(postId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

export async function getComments(postId: string): Promise<PostComment[]> {
  const { data, error } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addComment(postId: string, userId: string, content: string): Promise<PostComment> {
  const { data, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select()
    .single();
  if (error) throw error;
  // 同步更新 community_posts 评论计数
  const { count } = await supabase
    .from('post_comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);
  await supabase.from('community_posts').update({ comments: count || 0 }).eq('id', postId);
  return data;
}

// 知识文章
export async function getKnowledgeArticles(): Promise<KnowledgeArticle[]> {
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getReadKnowledgeIds(userId: string): Promise<Set<number>> {
  const { data, error } = await supabase
    .from('user_knowledge_reads')
    .select('article_id')
    .eq('user_id', userId);
  if (error) console.error('getReadKnowledgeIds error:', error.message);
  return new Set((data || []).map(r => r.article_id));
}

export async function markKnowledgeRead(userId: string, articleId: number): Promise<void> {
  // 先查是否存在，避免重复
  const { data: existing } = await supabase
    .from('user_knowledge_reads')
    .select('id')
    .eq('user_id', userId)
    .eq('article_id', articleId)
    .maybeSingle();
  if (existing) return; // 已读，跳过

  const { error } = await supabase
    .from('user_knowledge_reads')
    .insert({ user_id: userId, article_id: articleId, read_at: new Date().toISOString() });
  if (error) console.error('markKnowledgeRead error:', error.message);
}

// 疫苗
export async function getVaccines(): Promise<(Vaccine & { doses: VaccineDose[] })[]> {
  const { data: vaccines, error: vErr } = await supabase.from('vaccines').select('*').order('id');
  if (vErr) throw vErr;
  const { data: doses, error: dErr } = await supabase.from('vaccine_doses').select('*').order('dose_number');
  if (dErr) throw dErr;

  return (vaccines || []).map(v => ({
    ...v,
    doses: (doses || []).filter(d => d.vaccine_id === v.id),
  }));
}

export async function getUserVaccinations(userId: string): Promise<UserVaccination[]> {
  const { data, error } = await supabase
    .from('user_vaccinations')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

export async function setVaccinationStatus(
  userId: string, doseId: number, isVaccinated: boolean, vaccinatedAt?: string
): Promise<UserVaccination> {
  const { data, error } = await supabase
    .from('user_vaccinations')
    .upsert({
      user_id: userId,
      dose_id: doseId,
      is_vaccinated: isVaccinated,
      vaccinated_at: vaccinatedAt || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,dose_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ==========================================================
// 物品准备 API
// ==========================================================

// 获取物品准备列表（按 period 筛选）
export async function getPresetItems(period?: string): Promise<PresetItem[]> {
  let query = supabase
    .from('preset_items')
    .select('*')
    .order('sort_order', { ascending: true });

  if (period) {
    query = query.eq('period', period);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// 获取多个 period 的物品（用于跨阶段显示）
export async function getPresetItemsByPeriods(periods: string[]): Promise<PresetItem[]> {
  const { data, error } = await supabase
    .from('preset_items')
    .select('*')
    .in('period', periods)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

// 获取用户的物品准备状态
export async function getUserPreparations(userId: string): Promise<UserPreparation[]> {
  const { data, error } = await supabase
    .from('user_preparations')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

// 设置用户物品准备状态（upsert）
export async function setUserPreparation(
  userId: string,
  itemId: string,
  status: 'not_prepared' | 'prepared' | 'not_needed'
): Promise<UserPreparation> {
  const now = new Date().toISOString();
  const payload: Partial<UserPreparation> = {
    user_id: userId,
    item_id: itemId,
    status,
    updated_at: now,
  };

  if (status === 'prepared') {
    payload.prepared_at = now;
  } else {
    payload.prepared_at = null;
  }

  const { data, error } = await supabase
    .from('user_preparations')
    .upsert(payload, { onConflict: 'user_id,item_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ==========================================================
// 心理支持 API
// ==========================================================

// 获取心理支持内容列表（按 period 筛选）
export async function getPsychologicalSupport(period?: string): Promise<PsychologicalSupport[]> {
  let query = supabase
    .from('psychological_support')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (period) {
    query = query.eq('period', period);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// 获取多个 period 的心理支持内容
export async function getPsychologicalSupportByPeriods(periods: string[]): Promise<PsychologicalSupport[]> {
  const { data, error } = await supabase
    .from('psychological_support')
    .select('*')
    .eq('is_published', true)
    .in('period', periods)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

// 食物安全查询
export async function getFoodSafety(): Promise<FoodSafety[]> {
  const { data, error } = await supabase
    .from('food_safety')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

// =====================
// 儿保检查 (Well-Child Checkup)
// =====================

/** 获取所有儿保时间点 */
export async function getWellChildVisits(): Promise<WellChildVisit[]> {
  const { data, error } = await supabase
    .from('well_child_visits')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

/** 获取某个时间点的检查项目 */
export async function getCheckupItemsByVisit(visitId: number): Promise<WellChildCheckupItem[]> {
  const { data, error } = await supabase
    .from('well_child_checkup_items')
    .select('*')
    .eq('visit_id', visitId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

/** 批量获取所有检查项目（按 visit_id 分组） */
export async function getAllCheckupItems(): Promise<WellChildCheckupItem[]> {
  const { data, error } = await supabase
    .from('well_child_checkup_items')
    .select('*')
    .order('visit_id', { ascending: true })
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

/** 获取宝宝的所有儿保记录 */
export async function getUserWellChildRecords(babyId: string): Promise<UserWellChildRecord[]> {
  const { data, error } = await supabase
    .from('user_well_child_records')
    .select('*')
    .eq('baby_id', babyId)
    .order('visit_id', { ascending: true });
  if (error) throw error;
  return data || [];
}

/** 创建或更新儿保记录（按 baby_id + visit_id 去重） */
export async function upsertWellChildRecord(
  record: Partial<UserWellChildRecord> & { baby_id: string; visit_id: number }
): Promise<UserWellChildRecord> {
  const { data, error } = await supabase
    .from('user_well_child_records')
    .upsert(record, { onConflict: 'baby_id, visit_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** 删除儿保记录 */
export async function deleteWellChildRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from('user_well_child_records')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
