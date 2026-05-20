-- 更新tasks表结构，增加任务子类型和计数字段
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS task_subtype TEXT DEFAULT 'one_time' CHECK (task_subtype IN ('one_time', 'recurring')),
ADD COLUMN IF NOT EXISTS daily_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_date TEXT;

-- 更新现有任务的subtype
UPDATE public.tasks SET task_subtype = 'one_time' WHERE type = 'prenatal';
UPDATE public.tasks SET task_subtype = 'recurring' WHERE type = 'daily';
UPDATE public.tasks SET task_subtype = COALESCE(task_subtype, 'one_time') WHERE task_subtype IS NULL;

-- 将daily_count和daily_date设为NOT NULL默认值
ALTER TABLE public.tasks ALTER COLUMN daily_count SET DEFAULT 0;