-- 为 tasks 表增加每日打卡任务所需的连续打卡计数字段
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_checkin_date TEXT;
