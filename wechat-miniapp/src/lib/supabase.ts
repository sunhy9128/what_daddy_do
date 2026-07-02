import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client - 与 RN 端共用同一份后端
 * 注意：小程序的 supabase-js 调用会被小程序 HTTP 域名白名单限制，
 * 需在小程序后台 request 合法域名里加上 supabase.co。
 */
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// ===== 行类型（与 RN 端 src/lib/supabase.ts 对齐）=====
export type PregnancyStage = 'preconception' | 'first' | 'second' | 'third' | 'postpartum';

export interface Baby {
  id: number;
  user_id: string;
  name: string;
  gender: 'male' | 'female' | 'unknown' | null;
  due_date: string;
  birth_date: string | null;
  created_at: string;
}

export interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  category: string;          // 产检 / 日常 / 打卡
  stage: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface CommunityPost {
  id: number;
  user_id: string;
  content: string;
  category: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export interface KnowledgeArticle {
  id: number;
  emoji: string;
  title: string;
  content: string;
  read_time: string;
  category: string;
  stage: string | null;
}