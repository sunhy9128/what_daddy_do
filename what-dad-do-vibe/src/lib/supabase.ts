import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bckqyruxcusaaarrpyif.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJja3F5cnV4Y3VzYWFhcnJweWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMzU4MTUsImV4cCI6MjA5MzYxMTgxNX0.2FOrt5mdReu_Agmf_oOHewDhITS7dwio-ZbB4aVHaKA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  name: string;
  created_at: string;
  updated_at: string;
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
  type: 'prenatal' | 'daily' | 'custom' | 'checkin';
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

export interface CommunityPost {
  id: string;
  author_name: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  comments: number;
  created_at: string;
}