import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://bckqyruxcusaaarrpyif.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJja3F5cnV4Y3VzYWFhcnJweWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMzU4MTUsImV4cCI6MjA5MzYxMTgxNX0.2FOrt5mdReu_Agmf_oOHewDhITS7dwio-ZbB4aVHaKA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Types
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Baby {
  id: string;
  user_id: string;
  due_date: string;
  birth_date: string | null;
  name: string;
  gender: string | null;
  created_at: string;
  updated_at: string;
}

export interface FoodSafety {
  id: string;
  name: string;
  category: '蔬菜' | '水果' | '肉类' | '海鲜' | '蛋奶' | '豆制品' | '谷物' | '饮品' | '调味品' | '零食' | '药材' | '其他';
  preconception: 'safe' | 'caution' | 'forbidden';
  first: 'safe' | 'caution' | 'forbidden';
  second: 'safe' | 'caution' | 'forbidden';
  third: 'safe' | 'caution' | 'forbidden';
  postpartum: 'safe' | 'caution' | 'forbidden';
  baby_0_3m: 'safe' | 'caution' | 'forbidden';
  baby_3_12m: 'safe' | 'caution' | 'forbidden';
  baby_1_3y: 'safe' | 'caution' | 'forbidden';
  note: string | null;
  sort_order: number;
}

export interface PregnancyStage {
  id: string;
  name: string;
  weeks_start: number;
  weeks_end: number;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  stage: 'preconception' | 'first' | 'second' | 'third' | 'postpartum';
  type: 'prenatal' | 'daily' | 'checkin';
  task_subtype: 'one_time' | 'recurring';
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  daily_count: number;
  daily_date: string | null;
  streak_count: number;
  last_checkin_date: string | null;
  created_at: string;
}

export interface Record {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_private: boolean;
  created_at: string;
}

export interface UrgentNote {
  id: string;
  user_id: string;
  content: string;
  is_active: boolean;
  created_at: string;
  dismissed_at: string | null;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Vaccine {
  id: number;
  name: string;
  disease: string;
  category: '免费' | '自费';
  total_doses: number;
  notes: string | null;
}

export interface VaccineDose {
  id: number;
  vaccine_id: number;
  dose_number: number;
  min_age_months: number;
  max_age_months: number | null;
  min_interval_days: number;
  notes: string | null;
}

export interface UserVaccination {
  id: string;
  user_id: string;
  dose_id: number;
  vaccinated_at: string | null;
  is_vaccinated: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeArticle {
  id: number;
  emoji: string;
  title: string;
  content: string;
  read_time: string;
  category: string;
  stage: string | null;
  source: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeRead {
  id: string;
  user_id: string;
  article_id: number;
  read_at: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  author_name: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  comments: number;
  created_at: string;
}

// 物品准备
export interface PresetItem {
  id: string;
  name: string;
  description: string | null;
  category: '喂养' | '洗护' | '衣物' | '睡眠' | '出行' | '妈妈用品' | '产后恢复' | '医疗' | '其他';
  period: 'preconception' | 'first' | 'second' | 'third' | 'postpartum_0_3m' | 'postpartum_3_12m' | 'postpartum_1_3y';
  quantity_suggestion: string | null;
  preparation_timing: string | null;
  essential_level: 'essential' | 'recommended' | 'optional';
  sort_order: number;
  recommendation_type: 'suggested' | 'caution' | null;
  source: 'manual' | 'xiaohongshu_consensus' | null;
  created_at: string;
}

export interface UserPreparation {
  id: string;
  user_id: string;
  item_id: string;
  status: 'not_prepared' | 'prepared' | 'not_needed';
  prepared_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// 心理支持
export interface PsychologicalSupport {
  id: string;
  title: string;
  content: string;
  period: 'preconception' | 'first' | 'second' | 'third' | 'postpartum_0_3m' | 'postpartum_3_12m' | 'postpartum_1_3y';
  support_type: 'emotion' | 'communication' | 'action' | 'knowledge';
  tips: string[];
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// =====================
// 儿保检查 (Well-Child Checkup)
// =====================

export interface WellChildVisit {
  id: number;
  slug: string;
  name: string;
  age_label: string;
  min_age_days: number;
  max_age_days: number | null;
  recommended_age: string | null;
  sort_order: number;
  is_key_visit: boolean;
  notes: string | null;
  created_at: string;
}

export interface WellChildCheckupItem {
  id: number;
  visit_id: number;
  category: 'measurement' | 'physical_exam' | 'development' | 'lab_test' | 'screening' | 'vaccination_check' | 'guidance' | 'oral_health';
  name: string;
  description: string | null;
  is_required: boolean;
  sort_order: number;
  created_at: string;
}

export interface UserWellChildRecord {
  id: string;
  user_id: string;
  baby_id: string;
  visit_id: number;
  checkup_date: string | null;
  hospital: string | null;
  doctor: string | null;
  is_completed: boolean;
  has_abnormality: boolean | null;
  abnormality_notes: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  head_circumference_cm: number | null;
  hemoglobin_g_l: number | null;
  vision_left: number | null;
  vision_right: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}