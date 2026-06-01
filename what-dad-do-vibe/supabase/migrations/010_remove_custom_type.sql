-- ==========================================================
-- 移除 custom 类型 + 现有 custom 任务自动分类
-- 010_remove_custom_type.sql
-- 用户添加任务时不再出现"自建"分类，根据标题内容自动归类
-- ==========================================================

-- =====================
-- 1. 迁移现有 custom 任务到自动分类
-- =====================
-- 任务标题关键词 → type 映射规则（保持与前端一致）
UPDATE public.tasks
SET type = 'prenatal'
WHERE type = 'custom'
  AND (
    title LIKE '%产检%' OR title LIKE '%检查%' OR title LIKE '%筛查%'
    OR title LIKE '%B超%' OR title LIKE '%胎心%' OR title LIKE '%唐筛%'
    OR title LIKE '%糖耐%' OR title LIKE '%四维%' OR title LIKE '%NT%'
    OR title LIKE '%彩超%' OR title LIKE '%大排畸%' OR title LIKE '%小排畸%'
    OR title LIKE '%血常规%' OR title LIKE '%尿常规%'
  );

UPDATE public.tasks
SET type = 'checkin'
WHERE type = 'custom'
  AND (title LIKE '%打卡%');

UPDATE public.tasks
SET type = 'daily'
WHERE type = 'custom'
  AND (
    title LIKE '%每天%' OR title LIKE '%每日%'
    OR title LIKE '%运动%' OR title LIKE '%散步%' OR title LIKE '%喝水%'
    OR title LIKE '%体重%' OR title LIKE '%血压%' OR title LIKE '%血糖%'
    OR title LIKE '%测%' OR title LIKE '%量%' OR title LIKE '%记录%'
    OR title LIKE '%吃%' OR title LIKE '%喝%'
  );

-- 剩余的 custom 任务归类为 daily（默认日常）
UPDATE public.tasks
SET type = 'daily'
WHERE type = 'custom';

-- 同样迁移 preset_tasks 表
UPDATE public.preset_tasks
SET type = 'prenatal'
WHERE type = 'custom'
  AND (
    title LIKE '%产检%' OR title LIKE '%检查%' OR title LIKE '%筛查%'
    OR title LIKE '%B超%' OR title LIKE '%胎心%' OR title LIKE '%唐筛%'
    OR title LIKE '%糖耐%' OR title LIKE '%四维%' OR title LIKE '%NT%'
  );

UPDATE public.preset_tasks
SET type = 'checkin'
WHERE type = 'custom'
  AND (title LIKE '%打卡%');

UPDATE public.preset_tasks
SET type = 'daily'
WHERE type = 'custom'
  AND (
    title LIKE '%每天%' OR title LIKE '%每日%'
    OR title LIKE '%运动%' OR title LIKE '%散步%' OR title LIKE '%喝水%'
    OR title LIKE '%体重%' OR title LIKE '%血压%' OR title LIKE '%血糖%'
  );

UPDATE public.preset_tasks
SET type = 'daily'
WHERE type = 'custom';

-- =====================
-- 2. 修改 CHECK 约束
-- =====================
-- 先删除旧约束
ALTER TABLE IF EXISTS public.tasks
  DROP CONSTRAINT IF EXISTS tasks_type_check;

ALTER TABLE IF EXISTS public.preset_tasks
  DROP CONSTRAINT IF EXISTS preset_tasks_type_check;

-- 添加新约束（不含 custom）
ALTER TABLE IF EXISTS public.tasks
  ADD CONSTRAINT tasks_type_check
  CHECK (type IN ('prenatal', 'daily', 'checkin'));

ALTER TABLE IF EXISTS public.preset_tasks
  ADD CONSTRAINT preset_tasks_type_check
  CHECK (type IN ('prenatal', 'daily', 'checkin'));

-- preset_items 表的 essential_level 也需要移除 optional 中的 custom 概念
-- （但 preset_items 的 essential_level CHECK 是 'essential'|'recommended'|'optional'，不含 custom，无需修改）
