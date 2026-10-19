-- =============================================================
-- 018_multi_baby.sql
-- 目的: 支持多宝宝架构
--   1) babies 表补 is_active / is_archived / sort_order
--   2) tasks / records / user_vaccinations / user_preparations 加 baby_id NOT NULL
--   3) 回填旧数据到 user 第一只 active 宝宝
--   4) 改 unique 约束从 (user_id, xxx) 到 (baby_id, xxx)
--
-- ⚠️ 本文件需在 Supabase Dashboard SQL Editor 手动执行
--    (anon key 受 RLS 阻挡, 脚本无法跑; 详见 CLAUDE.md Watch-outs)
-- =============================================================

BEGIN;

-- ============================================================
-- 1) babies 表: 归档 + 排序字段
-- ============================================================

ALTER TABLE babies
  ADD COLUMN IF NOT EXISTS is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sort_order  INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 复合索引: 按用户筛 active + 按 sort_order 排序
CREATE INDEX IF NOT EXISTS idx_babies_user_active
  ON babies (user_id, is_active, sort_order);

-- ============================================================
-- 2) tasks 表: baby_id NOT NULL
-- ============================================================

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS baby_id UUID;

-- 回填: 每条任务归属 user 的第一只 active 宝宝
UPDATE tasks t
  SET baby_id = (
    SELECT b.id
    FROM babies b
    WHERE b.user_id = t.user_id
      AND b.is_active = TRUE
      AND b.is_archived = FALSE
    ORDER BY b.sort_order ASC, b.created_at ASC
    LIMIT 1
  )
  WHERE baby_id IS NULL;

-- 强约束: 不允许 NULL (必须归属一只宝宝)
ALTER TABLE tasks
  ALTER COLUMN baby_id SET NOT NULL;

-- 索引
CREATE INDEX IF NOT EXISTS idx_tasks_baby
  ON tasks (baby_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_baby
  ON tasks (user_id, baby_id);

-- 外键 (CASCADE: 宝宝删除时任务自动删除)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_baby_id_fkey'
  ) THEN
    ALTER TABLE tasks
      ADD CONSTRAINT tasks_baby_id_fkey
      FOREIGN KEY (baby_id) REFERENCES babies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 3) records 表: baby_id NOT NULL
-- ============================================================

ALTER TABLE records
  ADD COLUMN IF NOT EXISTS baby_id UUID;

UPDATE records r
  SET baby_id = (
    SELECT b.id
    FROM babies b
    WHERE b.user_id = r.user_id
      AND b.is_active = TRUE
      AND b.is_archived = FALSE
    ORDER BY b.sort_order ASC, b.created_at ASC
    LIMIT 1
  )
  WHERE baby_id IS NULL;

ALTER TABLE records
  ALTER COLUMN baby_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_records_baby
  ON records (baby_id);
CREATE INDEX IF NOT EXISTS idx_records_user_baby
  ON records (user_id, baby_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'records_baby_id_fkey'
  ) THEN
    ALTER TABLE records
      ADD CONSTRAINT records_baby_id_fkey
      FOREIGN KEY (baby_id) REFERENCES babies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 4) user_vaccinations: baby_id + 改 unique
-- ============================================================

ALTER TABLE user_vaccinations
  ADD COLUMN IF NOT EXISTS baby_id UUID;

UPDATE user_vaccinations uv
  SET baby_id = (
    SELECT b.id
    FROM babies b
    WHERE b.user_id = uv.user_id
      AND b.is_active = TRUE
      AND b.is_archived = FALSE
    ORDER BY b.sort_order ASC, b.created_at ASC
    LIMIT 1
  )
  WHERE baby_id IS NULL;

ALTER TABLE user_vaccinations
  ALTER COLUMN baby_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_vacc_baby
  ON user_vaccinations (baby_id);

-- 替换 unique 约束: 从 (user_id, dose_id) 到 (baby_id, dose_id)
ALTER TABLE user_vaccinations
  DROP CONSTRAINT IF EXISTS user_vaccinations_user_id_dose_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_vaccinations_baby_id_dose_id_key'
  ) THEN
    ALTER TABLE user_vaccinations
      ADD CONSTRAINT user_vaccinations_baby_id_dose_id_key
      UNIQUE (baby_id, dose_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_vaccinations_baby_id_fkey'
  ) THEN
    ALTER TABLE user_vaccinations
      ADD CONSTRAINT user_vaccinations_baby_id_fkey
      FOREIGN KEY (baby_id) REFERENCES babies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 5) user_preparations: baby_id + 改 unique
-- ============================================================

ALTER TABLE user_preparations
  ADD COLUMN IF NOT EXISTS baby_id UUID;

UPDATE user_preparations up
  SET baby_id = (
    SELECT b.id
    FROM babies b
    WHERE b.user_id = up.user_id
      AND b.is_active = TRUE
      AND b.is_archived = FALSE
    ORDER BY b.sort_order ASC, b.created_at ASC
    LIMIT 1
  )
  WHERE baby_id IS NULL;

ALTER TABLE user_preparations
  ALTER COLUMN baby_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_prep_baby
  ON user_preparations (baby_id);

-- 替换 unique 约束: 从 (user_id, item_id) 到 (baby_id, item_id)
ALTER TABLE user_preparations
  DROP CONSTRAINT IF EXISTS user_preparations_user_id_item_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_preparations_baby_id_item_id_key'
  ) THEN
    ALTER TABLE user_preparations
      ADD CONSTRAINT user_preparations_baby_id_item_id_key
      UNIQUE (baby_id, item_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_preparations_baby_id_fkey'
  ) THEN
    ALTER TABLE user_preparations
      ADD CONSTRAINT user_preparations_baby_id_fkey
      FOREIGN KEY (baby_id) REFERENCES babies(id) ON DELETE CASCADE;
  END IF;
END $$;

COMMIT;

-- =============================================================
-- 执行后请在 Supabase Dashboard 跑以下 SQL 验证:
--
--   SELECT count(*) AS total, count(baby_id) AS with_baby
--   FROM tasks;
--   -- 期望 total == with_baby
--
--   SELECT count(*) AS total, count(baby_id) AS with_baby
--   FROM records;
--
--   SELECT count(*) AS total, count(baby_id) AS with_baby
--   FROM user_vaccinations;
--
--   SELECT count(*) AS total, count(baby_id) AS with_baby
--   FROM user_preparations;
--
--   SELECT is_active, is_archived, count(*)
--   FROM babies GROUP BY is_active, is_archived;
-- =============================================================
