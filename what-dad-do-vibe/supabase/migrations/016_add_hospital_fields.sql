-- 016 增加产检医院和任务位置字段
-- 执行方式：在 Supabase Dashboard SQL Editor 中运行

-- 1. babies 表：增加医院名称和位置
ALTER TABLE babies
ADD COLUMN IF NOT EXISTS hospital_name TEXT,
ADD COLUMN IF NOT EXISTS hospital_location JSONB;

-- 2. tasks 表：增加位置信息（导航用）
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS location JSONB;
