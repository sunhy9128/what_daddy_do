import { supabase, Baby, Task, CommunityPost, KnowledgeArticle, PresetItem, UserPreparation, PsychologicalSupport, FoodSafety } from './supabase';

// ===== Babies =====
export async function getBabies(userId: string): Promise<Baby[]> {
  const { data, error } = await supabase
    .from('babies').select('*').eq('user_id', userId).order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Baby[];
}

// ===== Tasks =====
export async function getTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function toggleTask(taskId: number, completed: boolean): Promise<void> {
  const { error } = await supabase
    .from('tasks').update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq('id', taskId);
  if (error) throw error;
}

// ===== Community =====
export async function getCommunityPosts(category?: string): Promise<CommunityPost[]> {
  let q = supabase.from('community_posts').select('*').order('created_at', { ascending: false }).limit(50);
  if (category) q = q.eq('category', category);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as CommunityPost[];
}

export async function togglePostLike(postId: number, userId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('post_likes').select('id').eq('post_id', postId).eq('user_id', userId).maybeSingle();
  if (existing) {
    await supabase.from('post_likes').delete().eq('id', existing.id);
    await supabase.rpc('decrement_post_likes', { p_post_id: postId });
  } else {
    await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
    await supabase.rpc('increment_post_likes', { p_post_id: postId });
  }
}

// ===== Knowledge =====
export async function getKnowledgeArticles(): Promise<KnowledgeArticle[]> {
  const { data, error } = await supabase
    .from('knowledge_articles').select('*').order('id', { ascending: true });
  if (error) throw error;
  return (data ?? []) as KnowledgeArticle[];
}

// ===== Preset Items + User Preparations =====
export async function getPresetItems(stage?: string): Promise<PresetItem[]> {
  let q = supabase.from('preset_items').select('*').order('id', { ascending: true });
  if (stage) q = q.or(`stage.eq.${stage},stage.is.null`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PresetItem[];
}

export async function getUserPreparations(userId: string): Promise<UserPreparation[]> {
  const { data, error } = await supabase
    .from('user_preparations').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as UserPreparation[];
}

export async function togglePreparation(userId: string, presetItemId: number, completed: boolean): Promise<void> {
  const { data: existing } = await supabase
    .from('user_preparations').select('id')
    .eq('user_id', userId).eq('preset_item_id', presetItemId).maybeSingle();
  if (existing) {
    await supabase.from('user_preparations')
      .update({ completed }).eq('id', existing.id);
  } else {
    await supabase.from('user_preparations').insert({
      user_id: userId, preset_item_id: presetItemId, completed,
    });
  }
}

// ===== Psychological Support =====
export async function getPsychologicalSupport(stage?: string): Promise<PsychologicalSupport[]> {
  let q = supabase.from('psychological_support').select('*').order('id', { ascending: true });
  if (stage) q = q.or(`stage.eq.${stage},stage.is.null`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PsychologicalSupport[];
}

// ===== Food Safety =====
export async function getFoodSafety(query?: string): Promise<FoodSafety[]> {
  let q = supabase.from('food_safety').select('*').order('name', { ascending: true });
  if (query) q = q.ilike('name', `%${query}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as FoodSafety[];
}