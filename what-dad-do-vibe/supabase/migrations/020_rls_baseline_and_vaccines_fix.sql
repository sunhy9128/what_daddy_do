-- 020: RLS 补漏 + tasks/records schema 基线收回版本控制
-- 背景（2026-09 数据库审查）：
--   1. vaccines / vaccine_doses 从未 ENABLE RLS，anon key 可任意写（CRITICAL）
--   2. tasks / records 当初在 Dashboard 手建，schema 不在版本控制（本文件补齐基线，
--      CREATE TABLE IF NOT EXISTS 对已存在的表是 no-op，仅作文档与新环境重建用）
--   3. user_vaccinations 缺 delete 策略、user_id 缺外键
-- 全部为幂等写法，可安全重复执行。

-- ============================================================
-- 1. tasks / records 基线（已存在则跳过）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  stage TEXT CHECK (stage IN ('preconception', 'first', 'second', 'third', 'postpartum')),
  type TEXT NOT NULL CHECK (type IN ('prenatal', 'daily', 'checkin')),
  task_subtype TEXT DEFAULT 'one_time' CHECK (task_subtype IN ('one_time', 'recurring')),
  due_date TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  daily_count INT DEFAULT 0,
  daily_date TEXT,
  streak_count INT DEFAULT 0,
  last_checkin_date TEXT,
  location JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS：幂等开启（已开启则无效果）
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;

-- 策略：仅当不存在时创建（名字与 Dashboard 现有策略保持一致）
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can read/write their own tasks') THEN
    CREATE POLICY "Users can read/write their own tasks" ON public.tasks
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'records' AND policyname = 'Users can read/write their own records') THEN
    CREATE POLICY "Users can read/write their own records" ON public.records
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- 2. vaccines / vaccine_doses：开启 RLS，公开读、写锁死（CRITICAL 修复）
-- ============================================================
ALTER TABLE public.vaccines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccine_doses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vaccines' AND policyname = 'vaccines_public_read') THEN
    CREATE POLICY "vaccines_public_read" ON public.vaccines FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vaccine_doses' AND policyname = 'vaccine_doses_public_read') THEN
    CREATE POLICY "vaccine_doses_public_read" ON public.vaccine_doses FOR SELECT USING (true);
  END IF;
END $$;
-- 注：不创建任何 INSERT/UPDATE/DELETE 策略 = RLS 下默认拒绝写，仅服务端（service_role）可写。

-- ============================================================
-- 3. user_vaccinations：补 delete 策略 + user_id 外键
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_vaccinations' AND policyname = 'user_vaccinations_delete') THEN
    CREATE POLICY "user_vaccinations_delete" ON public.user_vaccinations
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_vaccinations_user_id_fkey') THEN
    ALTER TABLE public.user_vaccinations
      ADD CONSTRAINT user_vaccinations_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
