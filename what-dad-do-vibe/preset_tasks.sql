-- 创建预设任务表SQL，请在Supabase控制台中执行

-- 1. 创建preset_tasks表
CREATE TABLE IF NOT EXISTS public.preset_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  stage TEXT NOT NULL CHECK (stage IN ('preconception', 'first', 'second', 'third')),
  type TEXT NOT NULL CHECK (type IN ('prenatal', 'daily', 'custom')),
  due_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 插入预设任务数据
INSERT INTO public.preset_tasks (title, description, stage, type, due_date) VALUES
-- 备孕阶段
('孕前体检', '全面体检，包括血常规、尿常规、肝肾功能', 'preconception', 'prenatal', NULL),
('补充叶酸', '每天400微克，预防胎儿神经管畸形', 'preconception', 'daily', NULL),
('戒酒戒烟', '提前3个月戒酒戒烟', 'preconception', 'custom', NULL),
('作息调整', '保持规律作息，充足睡眠', 'preconception', 'daily', NULL),
-- 孕早期
('首次产检', '确认怀孕，建立孕期档案', 'first', 'prenatal', '2026-06-15'),
('NT检查', '胎儿颈项透明层厚度检查，用于早期筛查唐氏综合征', 'first', 'prenatal', '2026-07-01'),
('建档', '建立母子健康档案', 'first', 'prenatal', NULL),
('唐氏筛查', '早期唐氏综合征筛查', 'first', 'prenatal', NULL),
-- 孕中期
('大排畸B超', '系统超声检查，全面排查胎儿结构畸形', 'second', 'prenatal', '2026-08-15'),
('糖耐量测试', '筛查妊娠期糖尿病，需要空腹', 'second', 'prenatal', '2026-09-01'),
('胎儿心脏彩超', '检查胎儿心脏发育', 'second', 'prenatal', NULL),
('营养补充', '补充钙、铁、DHA', 'second', 'daily', NULL),
-- 孕晚期
('小排畸B超', '孕晚期超声检查，确认胎儿发育情况', 'third', 'prenatal', '2026-10-15'),
('胎心监护', '32周后每周一次，36周后每周两次', 'third', 'prenatal', NULL),
('B族链球菌检测', '36周筛查，预防新生儿感染', 'third', 'prenatal', NULL),
('数胎动', '每日3次记录胎动', 'third', 'daily', NULL),
('血糖监控', '每日三餐后测量血糖', 'third', 'daily', NULL),
('体重监测', '每周固定时间测量', 'third', 'daily', NULL),
('待产包准备', '打包入院物品清单', 'third', 'custom', NULL),
('产后准备', '了解产后护理知识', 'third', 'custom', NULL),
-- 产后
('新生儿体检', '出生后首次体检', 'third', 'prenatal', NULL),
('听力筛查', '新生儿听力筛查', 'third', 'prenatal', NULL),
('疫苗接种', '按计划接种疫苗', 'third', 'prenatal', NULL),
('满月体检', '满月后首次体检', 'third', 'prenatal', NULL);

-- 3. 启用RLS（可选，如果需要的话）
-- ALTER TABLE public.preset_tasks ENABLE ROW LEVEL SECURITY;
-- 允许所有人读取预设任务
-- CREATE POLICY "Allow read preset_tasks" ON preset_tasks FOR SELECT USING (true);