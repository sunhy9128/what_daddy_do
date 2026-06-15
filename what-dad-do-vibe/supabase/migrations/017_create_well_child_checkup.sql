-- ==========================================================
-- 儿保检查项目表
-- 数据来源：国家卫健委《0-6岁儿童健康管理服务规范》(第三版)
--            + 小红书TOP10「儿保」帖子交叉验证
-- 017_create_well_child_checkup.sql
-- ==========================================================

-- =====================
-- 1. well_child_visits — 儿保时间点（各月龄标准访视）
-- 所有用户可读取
-- =====================
CREATE TABLE IF NOT EXISTS public.well_child_visits (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,                     -- 稳定标识符，如 'newborn', '42d', '6m'，用于前端记录关联
  name TEXT NOT NULL,                           -- 访视名称，如"新生儿家庭访视"
  age_label TEXT NOT NULL,                      -- 年龄标识，如"出生后7天内"
  min_age_days INTEGER NOT NULL,                -- 最小天数
  max_age_days INTEGER,                         -- 最大天数（nullable 表示不做严格上限）
  recommended_age TEXT,                         -- 推荐年龄文字说明
  sort_order INTEGER NOT NULL DEFAULT 0,        -- 排序
  is_key_visit BOOLEAN NOT NULL DEFAULT false,  -- 是否为关键节点（含血检等）
  notes TEXT,                                    -- 备注说明
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.well_child_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "所有人可读取儿保时间点" ON public.well_child_visits;
CREATE POLICY "所有人可读取儿保时间点" ON public.well_child_visits
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "仅服务端可写入儿保时间点" ON public.well_child_visits;
CREATE POLICY "仅服务端可写入儿保时间点" ON public.well_child_visits
  FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "仅服务端可更新儿保时间点" ON public.well_child_visits;
CREATE POLICY "仅服务端可更新儿保时间点" ON public.well_child_visits
  FOR UPDATE USING (false);

-- =====================
-- 2. well_child_checkup_items — 儿保检查项目明细
-- 每个时间点对应的检查项目清单
-- 所有用户可读取
-- =====================
CREATE TABLE IF NOT EXISTS public.well_child_checkup_items (
  id SERIAL PRIMARY KEY,
  visit_id INTEGER NOT NULL REFERENCES public.well_child_visits(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'measurement',        -- 体格测量（体重、身长、头围等）
    'physical_exam',      -- 体格检查（心肺、腹部、四肢等）
    'development',        -- 发育评估（大运动、精细动作、语言、社交）
    'lab_test',           -- 实验室检查（血常规等）
    'screening',          -- 专项筛查（听力、视力、髋关节等）
    'vaccination_check',  -- 疫苗接种核对
    'guidance',           -- 喂养/护理/安全指导
    'oral_health'         -- 口腔保健
  )),
  name TEXT NOT NULL,                           -- 项目名称
  description TEXT,                             -- 详细说明
  is_required BOOLEAN NOT NULL DEFAULT true,    -- 是否为必检项
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.well_child_checkup_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "所有人可读取儿保项目" ON public.well_child_checkup_items;
CREATE POLICY "所有人可读取儿保项目" ON public.well_child_checkup_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "仅服务端可写入儿保项目" ON public.well_child_checkup_items;
CREATE POLICY "仅服务端可写入儿保项目" ON public.well_child_checkup_items
  FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "仅服务端可更新儿保项目" ON public.well_child_checkup_items;
CREATE POLICY "仅服务端可更新儿保项目" ON public.well_child_checkup_items
  FOR UPDATE USING (false);

-- =====================
-- 3. user_well_child_records — 用户儿保记录
-- 用户为自己的宝宝记录的儿保完成情况
-- =====================
CREATE TABLE IF NOT EXISTS public.user_well_child_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  visit_id INTEGER NOT NULL REFERENCES public.well_child_visits(id) ON DELETE CASCADE,
  checkup_date DATE,                           -- 实际体检日期
  hospital TEXT,                               -- 体检医院
  doctor TEXT,                                 -- 体检医生
  is_completed BOOLEAN NOT NULL DEFAULT false, -- 是否已完成
  has_abnormality BOOLEAN DEFAULT false,       -- 是否存在异常
  abnormality_notes TEXT,                      -- 异常说明
  height_cm NUMERIC(5,1),                      -- 身高/身长 (cm)
  weight_kg NUMERIC(5,2),                      -- 体重 (kg)
  head_circumference_cm NUMERIC(4,1),          -- 头围 (cm)
  hemoglobin_g_l NUMERIC(5,1),                 -- 血红蛋白 (g/L)
  vision_left NUMERIC(3,1),                    -- 左眼视力
  vision_right NUMERIC(3,1),                   -- 右眼视力
  notes TEXT,                                  -- 用户备注
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(baby_id, visit_id)
);

ALTER TABLE public.user_well_child_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "用户可查看自己的儿保记录" ON public.user_well_child_records;
CREATE POLICY "用户可查看自己的儿保记录" ON public.user_well_child_records
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可创建自己的儿保记录" ON public.user_well_child_records;
CREATE POLICY "用户可创建自己的儿保记录" ON public.user_well_child_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可更新自己的儿保记录" ON public.user_well_child_records;
CREATE POLICY "用户可更新自己的儿保记录" ON public.user_well_child_records
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可删除自己的儿保记录" ON public.user_well_child_records;
CREATE POLICY "用户可删除自己的儿保记录" ON public.user_well_child_records
  FOR DELETE USING (auth.uid() = user_id);

-- 索引
CREATE INDEX IF NOT EXISTS user_well_child_records_user_idx ON public.user_well_child_records(user_id);
CREATE INDEX IF NOT EXISTS user_well_child_records_baby_idx ON public.user_well_child_records(baby_id);
CREATE INDEX IF NOT EXISTS user_well_child_records_visit_idx ON public.user_well_child_records(visit_id);
CREATE INDEX IF NOT EXISTS well_child_checkup_items_visit_idx ON public.well_child_checkup_items(visit_id);

-- ================================================================
-- 数据种子：13个标准儿保时间点及检查项目
-- ================================================================

-- =====================
-- 时间点数据
-- 基于国家卫健委0-6岁儿童健康管理规范 + 小红书高频儿保帖共识
-- =====================

INSERT INTO public.well_child_visits (slug, name, age_label, min_age_days, max_age_days, recommended_age, sort_order, is_key_visit, notes) VALUES
('newborn', '新生儿家庭访视',       '出生后7天内',          0,   7,    '出院后7天内',                   1,  true,  '社区医生上门访视，了解出生情况、喂养、黄疸、脐部护理等'),
('42d',    '满月/42天体检',       '28~42天',              28,  60,   '满月后至42天',                   2,  true,  '首次返院体检，全面评估新生儿期发育'),
('3m',     '3月龄儿保',            '3月龄',                 61,  120,  '出生后第3个月',                  3,  false, '评估早期运动发育和视听反应'),
('6m',     '6月龄儿保',            '6月龄',                 150, 210,  '出生后第6个月（关键节点）',       4,  true,  '首次血常规筛查贫血，辅食添加指导'),
('8m',     '8月龄儿保',            '8月龄',                 210, 270,  '出生后第8个月',                  5,  false, '复查血常规，评估爬行和精细运动'),
('12m',    '12月龄/1岁儿保',      '12月龄',                330, 400,  '出生后第12个月（关键节点）',      6,  true,  '全面发育评估，视力筛查，口腔检查'),
('18m',    '18月龄/1.5岁儿保',    '18月龄',                500, 570,  '出生后第18个月',                 7,  true,  '心理行为发育评估，视力筛查'),
('24m',    '24月龄/2岁儿保',      '24月龄',                680, 780,  '出生后第24个月',                 8,  true,  '血常规，视力筛查，口腔检查'),
('30m',    '30月龄/2.5岁儿保',    '30月龄',                850, 950,  '出生后第30个月',                 9,  false, '视力筛查，语言能力评估'),
('36m',    '36月龄/3岁儿保',      '36月龄（入园体检）',    1000, 1100, '出生后第36个月（入园前）',        10, true,  '入园前全面体检，含血常规、视力、口腔'),
('4y',     '4岁儿保',              '4岁',                   1400, 1550, '4周岁',                           11, false, '学龄前常规体检'),
('5y',     '5岁儿保',              '5岁',                   1750, 1900, '5周岁',                           12, false, '学龄前常规体检'),
('6y',     '6岁儿保（入学体检）',  '6岁',                   2100, 2300, '6周岁（入学前）',                 13, true,  '入学前全面体检，含血常规、视力、口腔');

-- =====================
-- 检查项目数据
-- 小红书高频帖共识交叉验证：身高体重测量、发育评估、血常规被提及频率最高
-- =====================

-- === 1. 新生儿家庭访视 ===
INSERT INTO public.well_child_checkup_items (visit_id, category, name, description, is_required, sort_order) VALUES
(1, 'measurement',       '测量体重、身长、头围',           '记录出生体重、身长、头围，评估宫内发育情况', true, 1),
(1, 'physical_exam',     '全身体格检查',                   '检查皮肤颜色、皮疹、黄疸；脐部有无渗血/感染；口腔腭裂；脊柱、四肢、肛门等', true, 2),
(1, 'screening',         '黄疸监测',                       '经皮胆红素测定或肉眼评估黄疸程度', true, 3),
(1, 'screening',         '新生儿听力筛查',                 '耳声发射(OAE)或自动听性脑干反应(AABR)', true, 4),
(1, 'screening',         '先天性心脏病筛查',               '心脏听诊+经皮血氧饱和度测定', true, 5),
(1, 'screening',         '新生儿遗传代谢病筛查',           '足底血采集（先天性甲低、苯丙酮尿症等）', true, 6),
(1, 'guidance',          '喂养指导',                       '母乳喂养技巧、按需哺乳、正确衔乳姿势、拍嗝方法', true, 7),
(1, 'guidance',          '护理指导',                       '脐部护理、臀部护理、洗澡方法、室温控制', true, 8),
(1, 'guidance',          '维生素D补充指导',                '出生后即开始补充维生素D 400IU/天', true, 9),
(1, 'guidance',          '安全与睡眠指导',                 '仰卧睡眠、避免床上杂物、防止婴儿猝死综合征(SIDS)', false, 10);

-- === 2. 满月/42天体检 ===
INSERT INTO public.well_child_checkup_items (visit_id, category, name, description, is_required, sort_order) VALUES
(2, 'measurement',       '测量体重、身长、头围',           '评估满月生长速度，正常体重增长600g以上', true, 1),
(2, 'physical_exam',     '全身体格检查',                   '心肺听诊、腹部触诊、髋关节外展检查（筛查发育性髋关节发育不良）', true, 2),
(2, 'development',       '视听反应评估',                   '对声音有反应、能注视人脸或红球、会追视', true, 3),
(2, 'development',       '俯卧抬头评估',                   '俯卧时能短暂抬头，头部可左右转动', true, 4),
(2, 'screening',         '髋关节超声筛查',                 'B超检查髋关节发育情况（如有指征）', false, 5),
(2, 'guidance',          '喂养与营养指导',                  '母乳或配方奶喂养评估，维生素D继续补充', true, 6),
(2, 'guidance',          '疫苗接种核对',                   '检查乙肝第二针是否按时接种', true, 7);

-- === 3. 3月龄儿保 ===
INSERT INTO public.well_child_checkup_items (visit_id, category, name, description, is_required, sort_order) VALUES
(3, 'measurement',       '测量体重、身长、头围',           '评估生长曲线是否正常', true, 1),
(3, 'physical_exam',     '全身体格检查',                   '心肺听诊、腹部触诊、肌张力评估', true, 2),
(3, 'development',       '追视与追听评估',                 '双眼追视移动物体、头转向声源', true, 3),
(3, 'development',       '逗笑反应评估',                   '被逗引时会微笑或发出笑声', true, 4),
(3, 'development',       '俯卧抬头评估',                   '俯卧时能抬头45~90度，能用肘支撑', true, 5),
(3, 'development',       '手部动作评估',                   '能抓住玩具并放入口中', false, 6),
(3, 'guidance',          '喂养与发育指导',                  '纯母乳/配方奶喂养持续推进', true, 7),
(3, 'guidance',          '疫苗接种核对',                   '检查脊灰、百白破等疫苗是否按时接种', true, 8);

-- === 4. 6月龄儿保（关键节点） ===
INSERT INTO public.well_child_checkup_items (visit_id, category, name, description, is_required, sort_order) VALUES
(4, 'measurement',       '测量体重、身长、头围',           '评估生长曲线，出生体重应翻倍', true, 1),
(4, 'physical_exam',     '全身体格检查',                   '心肺听诊、腹部触诊、检查出牙情况', true, 2),
(4, 'development',       '翻身与独坐评估',                 '能从仰卧翻到俯卧、能独坐片刻（靠坐或独坐）', true, 3),
(4, 'development',       '伸手抓物评估',                   '能主动伸手抓握玩具、会传递物品', true, 4),
(4, 'development',       '发音评估',                       '能发出ba/ma/da等辅音组合', true, 5),
(4, 'lab_test',          '血常规检查（贫血筛查）',          '末梢血检测血红蛋白，筛查缺铁性贫血。小红书共识：此项必做！', true, 6),
(4, 'guidance',          '辅食添加指导',                   '从富含铁的泥糊状食物开始（强化铁米粉→菜泥→肉泥）。小红书共识：第一口米粉要高铁！', true, 7),
(4, 'guidance',          '喂养与睡眠指导',                  '奶量约800-1000ml/天+辅食，睡眠规律培养', true, 8),
(4, 'guidance',          '口腔保健指导',                   '出牙后开始用指套牙刷或纱布清洁牙齿', true, 9),
(4, 'guidance',          '安全指导',                       '防坠落、防异物吸入、防晒', false, 10),
(4, 'vaccination_check', '疫苗接种核对',                   '检查乙肝第三针、脊灰、百白破等', true, 11);

-- === 5. 8月龄儿保 ===
INSERT INTO public.well_child_checkup_items (visit_id, category, name, description, is_required, sort_order) VALUES
(5, 'measurement',       '测量体重、身长、头围',           '评估生长曲线', true, 1),
(5, 'physical_exam',     '全身体格检查',                   '心肺听诊、腹部触诊、牙齿检查（一般已出2~4颗）', true, 2),
(5, 'development',       '爬行评估',                       '能匍匐爬行或手脚并用爬行', true, 3),
(5, 'development',       '扶站评估',                       '能扶着物体站立片刻', true, 4),
(5, 'development',       '精细动作评估',                   '会用拇指和食指捏取小物品（钳式抓握）', true, 5),
(5, 'development',       '语言理解评估',                   '能理解"不"、会模仿声音、能发出ba-ma-da等音节', true, 6),
(5, 'lab_test',          '血常规复查',                     '复查血红蛋白，6月龄贫血的宝宝需追踪', false, 7),
(5, 'guidance',          '辅食进阶指导',                   '从泥糊状过渡到碎末状、小颗粒状，引入手指食物。小红书共识：BLW自主进食法讨论度高', true, 8),
(5, 'guidance',          '安全与社交指导',                  '防跌倒、陌生人焦虑应对', false, 9);

-- === 6. 12月龄/1岁儿保（关键节点） ===
INSERT INTO public.well_child_checkup_items (visit_id, category, name, description, is_required, sort_order) VALUES
(6, 'measurement',       '测量体重、身长、头围',           '评估生长曲线，出生身长应增长约50%', true, 1),
(6, 'physical_exam',     '全身体格检查',                   '心肺听诊、腹部触诊、外生殖器检查', true, 2),
(6, 'development',       '独站与行走评估',                 '能独立站立、能扶走或独走几步', true, 3),
(6, 'development',       '语言评估',                       '能有意识叫"爸爸""妈妈"，能说1~3个单字', true, 4),
(6, 'development',       '社交评估',                       '会挥手再见、会拍手欢迎、会用手指表达需求', true, 5),
(6, 'development',       '认知评估',                       '会模仿动作、能找到藏起来的物品（客体永存）', true, 6),
(6, 'lab_test',          '血常规检查',                     '筛查贫血', true, 7),
(6, 'screening',         '视力筛查',                       '屈光筛查仪检查，早期发现近视/远视/散光', true, 8),
(6, 'oral_health',       '口腔检查',                       '检查牙齿数目和排列（一般出4~8颗），龋齿风险评估', true, 9),
(6, 'guidance',          '断奶与饮食过渡指导',              '从奶为主过渡到三餐为主、奶为辅。家庭餐逐步引入', true, 10),
(6, 'guidance',          '行为与情绪管理指导',              '应对分离焦虑、建立规则意识', false, 11),
(6, 'vaccination_check', '疫苗接种核对',                   '检查麻腮风、乙脑、13价肺炎等疫苗', true, 12);

-- === 7. 18月龄/1.5岁儿保 ===
INSERT INTO public.well_child_checkup_items (visit_id, category, name, description, is_required, sort_order) VALUES
(7, 'measurement',       '测量体重、身长/身高、头围',      '评估生长曲线', true, 1),
(7, 'physical_exam',     '全身体格检查',                   '心肺听诊、腹部触诊、步态观察', true, 2),
(7, 'development',       '行走与跑动评估',                 '能独立行走、会跑、能扶栏杆上下台阶', true, 3),
(7, 'development',       '语言评估',                       '会说10个以上单字/词、能说出身体部位名称、会说2~3字短句', true, 4),
(7, 'development',       '精细动作评估',                   '会搭积木（4块以上）、会翻书页、会涂鸦', true, 5),
(7, 'development',       '社交与自理评估',                 '会自己用勺子吃饭（弄撒正常）、会脱袜子/鞋子', true, 6),
(7, 'lab_test',          '血常规检查',                     '筛查贫血', true, 7),
(7, 'screening',         '视力筛查',                       '屈光筛查', true, 8),
(7, 'guidance',          '语言促进指导',                   '多与孩子对话、读绘本、描述日常事物', true, 9),
(7, 'guidance',          '生活习惯培养',                   '规律作息、如厕训练准备（不强迫）', false, 10),
(7, 'vaccination_check', '疫苗接种核对',                   '百白破第四针、麻腮风第二针、甲肝等', true, 11);

-- === 8. 24月龄/2岁儿保 ===
INSERT INTO public.well_child_checkup_items (visit_id, category, name, description, is_required, sort_order) VALUES
(8, 'measurement',       '测量体重、身高、头围',           '评估生长曲线，计算BMI', true, 1),
(8, 'physical_exam',     '全身体格检查',                   '心肺听诊、腹部触诊、步态、足弓发育', true, 2),
(8, 'development',       '跑跳评估',                       '能双脚跳离地面、会踢球、能跑且较少摔倒', true, 3),
(8, 'development',       '语言评估',                       '会说3~5字句子、能说出50个以上词汇、能说出自己的名字', true, 4),
(8, 'development',       '精细动作与认知评估',              '会模仿画直线/圆圈、能搭6~7块积木、能辨认常见物品', true, 5),
(8, 'development',       '社交与自理评估',                 '会自己脱衣服/裤子、会洗手擦手、能表达大小便需求', true, 6),
(8, 'lab_test',          '血常规检查',                     '筛查贫血', true, 7),
(8, 'screening',         '视力筛查',                       '屈光筛查', true, 8),
(8, 'oral_health',       '口腔检查',                       '龋齿检查、牙齿排列、涂氟建议', true, 9),
(8, 'guidance',          '饮食与行为指导',                  '均衡饮食、控制零食与屏幕时间、建立规则', true, 10),
(8, 'vaccination_check', '疫苗接种核对',                   '乙脑第二针等', true, 11);

-- === 9. 30月龄/2.5岁儿保 ===
INSERT INTO public.well_child_checkup_items (visit_id, category, name, description, is_required, sort_order) VALUES
(9, 'measurement',       '测量体重、身高',                 '评估生长曲线', true, 1),
(9, 'physical_exam',     '体格检查',                       '心肺听诊、腹部触诊', true, 2),
(9, 'development',       '运动评估',                       '能单脚站立片刻、会骑三轮车/平衡车、能踮脚走', true, 3),
(9, 'development',       '语言与认知评估',                  '能说出颜色、能数1~10、能说完整的短句、会回答简单问题', true, 4),
(9, 'development',       '社交与自理评估',                  '能自己穿简单衣物、会和小朋友一起玩、能表达情绪', true, 5),
(9, 'screening',         '视力筛查',                       '屈光筛查', true, 6),
(9, 'guidance',          '入园准备指导',                   '如计划3岁入园，提前培养独立如厕、自主进食、表达需求的能力', true, 7);

-- === 10. 36月龄/3岁儿保（入园体检） ===
INSERT INTO public.well_child_checkup_items (visit_id, category, name, description, is_required, sort_order) VALUES
(10, 'measurement',      '测量体重、身高',                 '评估生长曲线，计算BMI', true, 1),
(10, 'physical_exam',    '全面体格检查',                   '心肺听诊、腹部触诊、脊柱四肢检查、外生殖器检查', true, 2),
(10, 'development',      '大运动评估',                     '能双脚交替上下楼梯、能单脚跳、会骑三轮车', true, 3),
(10, 'development',      '语言评估',                       '能说完整句子（4~6词）、能说出姓名年龄性别、能讲述简单经历', true, 4),
(10, 'development',      '认知评估',                       '能认出3~4种颜色、能数到20、懂"一样多"概念', true, 5),
(10, 'development',      '社交与自理评估',                  '能自己穿衣脱衣、能独立用勺/筷子吃饭、能自己上厕所', true, 6),
(10, 'lab_test',         '血常规检查',                     '筛查贫血', true, 7),
(10, 'screening',        '视力筛查',                       '屈光筛查+视力表检查（如可配合）', true, 8),
(10, 'oral_health',      '口腔检查',                       '龋齿检查、涂氟、咬合关系评估', true, 9),
(10, 'guidance',         '入园适应指导',                   '分离焦虑应对、社交能力培养、安全教育', true, 10),
(10, 'vaccination_check','疫苗接种核对',                   'A+C群流脑第一针等', true, 11);

-- === 11. 4岁儿保 ===
INSERT INTO public.well_child_checkup_items (visit_id, category, name, description, is_required, sort_order) VALUES
(11, 'measurement',      '测量体重、身高',                 '评估生长曲线', true, 1),
(11, 'physical_exam',    '体格检查',                       '心肺听诊、腹部触诊、脊柱侧弯筛查', true, 2),
(11, 'development',      '运动与语言发育评估',              '能单脚跳、会画人（3~4个部位）、能复述故事、句子结构完整', true, 3),
(11, 'screening',        '视力筛查',                       '标准视力表检查', true, 4),
(11, 'oral_health',      '口腔检查',                       '龋齿检查、涂氟或窝沟封闭建议', true, 5),
(11, 'guidance',         '健康生活方式指导',                '均衡营养、户外活动、限制屏幕时间、充足睡眠', true, 6);

-- === 12. 5岁儿保 ===
INSERT INTO public.well_child_checkup_items (visit_id, category, name, description, is_required, sort_order) VALUES
(12, 'measurement',      '测量体重、身高',                 '评估生长曲线', true, 1),
(12, 'physical_exam',    '体格检查',                       '心肺听诊、腹部触诊、脊柱侧弯筛查', true, 2),
(12, 'development',      '入学准备评估',                   '能写自己的名字、能数到100、能说出完整地址、能与同伴合作游戏', true, 3),
(12, 'screening',        '视力筛查',                       '标准视力表检查，关注近视趋势', true, 4),
(12, 'oral_health',      '口腔检查',                       '龋齿检查、窝沟封闭', true, 5),
(12, 'guidance',         '入学准备指导',                   '幼小衔接、情绪管理、社交技能', true, 6);

-- === 13. 6岁儿保（入学体检） ===
INSERT INTO public.well_child_checkup_items (visit_id, category, name, description, is_required, sort_order) VALUES
(13, 'measurement',      '测量体重、身高',                 '评估生长曲线', true, 1),
(13, 'physical_exam',    '全面体格检查',                   '心肺听诊、腹部触诊、脊柱侧弯筛查、外生殖器检查', true, 2),
(13, 'development',      '入学前综合评估',                  '读写能力、数学概念、社交适应、注意力评估', true, 3),
(13, 'lab_test',         '血常规检查',                     '筛查贫血', true, 4),
(13, 'screening',        '视力筛查',                       '标准视力表+屈光筛查', true, 5),
(13, 'oral_health',      '口腔检查',                       '龋齿检查、六龄齿窝沟封闭（关键！）', true, 6),
(13, 'guidance',         '入学健康指导',                   '作息调整、早餐营养、运动习惯、安全教育', true, 7),
(13, 'vaccination_check','疫苗接种核对',                   '白破疫苗、A+C群流脑第二针', true, 8);
