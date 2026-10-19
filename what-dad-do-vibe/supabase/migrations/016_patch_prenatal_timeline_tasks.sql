-- 补充产检时间轴缺失的预设任务
-- 运行方式：Supabase Dashboard → SQL Editor → 粘贴执行
-- 按 (stage, title, type) 去重，不会重复插入

INSERT INTO public.preset_tasks (title, description, stage, type, due_date)
SELECT * FROM (VALUES
  ('确认妊娠', '验血/尿HCG确认怀孕，B超确认宫内孕，排除宫外孕', 'first', 'prenatal', NULL),
  ('常规产检', '血压、体重、宫高、腹围、胎心监测，评估母胎状况', 'third', 'prenatal', NULL),
  ('预产期检查', '40周检查，如未发动则确认催产或剖腹产方案', 'third', 'prenatal', NULL),
  ('过期待处理', '超过41周未发动需住院催产，监测胎盘功能', 'third', 'prenatal', NULL)
) AS t(title, description, stage, type, due_date)
WHERE NOT EXISTS (
  SELECT 1 FROM public.preset_tasks
  WHERE preset_tasks.title = t.title
    AND preset_tasks.stage = t.stage
    AND preset_tasks.type = t.type
);
