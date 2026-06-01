-- ==========================================================
-- babies 表添加 birth_date 字段
-- 013_add_birth_date.sql
-- 用于准确计算宝宝出生年龄（不再依赖预产期）
-- ==========================================================

ALTER TABLE IF EXISTS public.babies
  ADD COLUMN IF NOT EXISTS birth_date DATE;

-- 迁移现有数据：将 due_date 设为 birth_date（有预产期的宝宝）
UPDATE public.babies
  SET birth_date = due_date
  WHERE birth_date IS NULL;
