-- ==========================================================
-- 物品准备表 + 用户物品准备表 + 心理支持表
-- 008_create_preparation_and_support_tables.sql
-- ==========================================================

-- =====================
-- 1. preset_items — 物品准备表
-- 根据孕周/婴儿出生后阶段，列出需要准备的物品
-- 所有用户可读取
-- =====================
CREATE TABLE IF NOT EXISTS public.preset_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    '喂养', '洗护', '衣物', '睡眠', '出行',
    '妈妈用品', '产后恢复', '医疗', '其他'
  )),
  -- 适用阶段：与孕期阶段对齐 + 产后细分
  period TEXT NOT NULL CHECK (period IN (
    'preconception', 'first', 'second', 'third',
    'postpartum_0_3m', 'postpartum_3_12m', 'postpartum_1_3y'
  )),
  quantity_suggestion TEXT,
  preparation_timing TEXT,
  essential_level TEXT NOT NULL DEFAULT 'recommended' CHECK (essential_level IN ('essential', 'recommended', 'optional')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.preset_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所有人可读取物品准备" ON public.preset_items
  FOR SELECT USING (true);

CREATE POLICY "仅服务端可写入物品准备" ON public.preset_items
  FOR INSERT WITH CHECK (false);

CREATE POLICY "仅服务端可更新物品准备" ON public.preset_items
  FOR UPDATE USING (false);

-- =====================
-- 2. user_preparations — 用户物品准备表
-- 记录用户对每个物品的准备状态
-- 用户只能操作自己的记录
-- =====================
CREATE TABLE IF NOT EXISTS public.user_preparations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.preset_items(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_prepared' CHECK (status IN ('not_prepared', 'prepared', 'not_needed')),
  prepared_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

ALTER TABLE public.user_preparations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可查看自己的准备记录" ON public.user_preparations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可创建自己的准备记录" ON public.user_preparations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可更新自己的准备记录" ON public.user_preparations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可删除自己的准备记录" ON public.user_preparations
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX user_preparations_user_idx ON public.user_preparations(user_id);
CREATE INDEX user_preparations_item_idx ON public.user_preparations(item_id);

-- =====================
-- 3. psychological_support — 心理支持表
-- 提示准爸爸/爸爸在不同时期对孕妈/新手妈妈进行心理支持
-- 所有用户可读取
-- =====================
CREATE TABLE IF NOT EXISTS public.psychological_support (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  -- 适用阶段
  period TEXT NOT NULL CHECK (period IN (
    'preconception', 'first', 'second', 'third',
    'postpartum_0_3m', 'postpartum_3_12m', 'postpartum_1_3y'
  )),
  -- 分类：情绪、沟通、行动、知识
  support_type TEXT NOT NULL CHECK (support_type IN ('emotion', 'communication', 'action', 'knowledge')),
  tips TEXT[],                  -- 具体可操作的建议列表
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.psychological_support ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所有人可读取心理支持" ON public.psychological_support
  FOR SELECT USING (true);

CREATE POLICY "仅服务端可写入心理支持" ON public.psychological_support
  FOR INSERT WITH CHECK (false);

CREATE POLICY "仅服务端可更新心理支持" ON public.psychological_support
  FOR UPDATE USING (false);

CREATE INDEX psychological_support_period_idx ON public.psychological_support(period);

-- =====================
-- 4. 插入预设物品数据
-- =====================
INSERT INTO public.preset_items (name, description, category, period, quantity_suggestion, preparation_timing, essential_level, sort_order) VALUES

-- ========== 备孕期 ==========
('基础体温计', '测量基础体温，监测排卵周期', '其他', 'preconception', '1支', '备孕前', 'essential', 1),
('排卵试纸', '检测排卵期，提高受孕率', '其他', 'preconception', '1-2盒（50条/盒）', '备孕前', 'essential', 2),
('验孕棒/试纸', '确认是否怀孕', '其他', 'preconception', '5-10支', '备孕前', 'essential', 3),
('叶酸片', '每天400-800微克，预防胎儿神经管畸形', '医疗', 'preconception', '1瓶（够3个月）', '备孕前3个月', 'essential', 4),

-- ========== 孕早期 ==========
('孕期维生素', '含铁、钙、DHA等复合维生素', '医疗', 'first', '1瓶', '确认怀孕后', 'recommended', 5),
('孕妇护肤品', '无刺激、无孕妇慎用成分的护肤品', '妈妈用品', 'first', '1套', '孕早期', 'recommended', 6),
('妊娠纹护理油', '保持腹部皮肤弹性，预防妊娠纹', '妈妈用品', 'first', '2瓶', '孕早期开始', 'recommended', 7),

-- ========== 孕中期 ==========
('孕妇装', '宽松舒适的孕妇装、孕妇裤', '妈妈用品', 'second', '3-4套', '孕中期', 'essential', 8),
('托腹带', '支撑腹部，缓解腰背压力', '妈妈用品', 'second', '1条', '腹部明显隆起时', 'optional', 9),
('钙片', '补充钙质，预防抽筋', '医疗', 'second', '2-3瓶', '孕中期开始', 'essential', 10),
('铁剂', '补铁预防贫血', '医疗', 'second', '2瓶', '遵医嘱', 'recommended', 11),
('DHA补充剂', '促进胎儿大脑和视网膜发育', '医疗', 'second', '2瓶', '孕中期开始', 'recommended', 12),
('婴儿床', '带安全标准的实木婴儿床', '睡眠', 'second', '1张', '孕28周前', 'essential', 13),
('婴儿床垫', '硬质、透气、符合安全标准', '睡眠', 'second', '1张', '与婴儿床同时', 'essential', 14),
('婴儿推车', '可平躺、避震好、轻便折叠', '出行', 'second', '1辆', '孕28周前', 'essential', 15),
('婴儿安全座椅', '符合国家安全标准，新生儿可用', '出行', 'second', '1个', '孕36周前', 'essential', 16),

-- ========== 孕晚期 ==========
('待产包（妈妈篇）', '', '妈妈用品', 'third', '1套', '孕36周前', 'essential', 17),
('产褥垫', '产后铺在床上使用', '妈妈用品', 'third', '10-15片', '孕36周前', 'essential', 18),
('产妇卫生巾（大号）', '产后恶露期使用', '妈妈用品', 'third', '2-3包', '孕36周前', 'essential', 19),
('一次性内裤', '产后方便更换', '妈妈用品', 'third', '10-15条', '孕36周前', 'essential', 20),
('哺乳衣/哺乳文胸', '方便哺乳的衣物', '妈妈用品', 'third', '2-3件/2-3个', '孕36周前', 'essential', 21),
('吸奶器', '手动或电动吸奶器', '喂养', 'third', '1个', '孕36周前', 'recommended', 22),
('防溢乳垫', '防止漏奶弄湿衣物', '妈妈用品', 'third', '1-2盒', '孕36周前', 'recommended', 23),
('吸管杯/吸管', '产后卧床时方便喝水', '妈妈用品', 'third', '1个', '孕36周前', 'essential', 24),
('冰袋', '剖腹产后伤口冷敷、顺产会阴消肿', '妈妈用品', 'third', '2-3个', '孕36周前', 'recommended', 25),
('NB码纸尿裤', '新生儿专用（≤5kg）', '洗护', 'third', '2包（约60-80片/包）', '孕36周前', 'essential', 26),
('婴儿湿巾', '新生儿手口专用，无酒精无香料', '洗护', 'third', '4-6包', '孕36周前', 'essential', 27),
('52号婴儿服（连体衣）', '新生儿尺码（0-1个月）', '衣物', 'third', '3-4件', '孕36周前', 'essential', 28),
('59号婴儿服（连体衣）', '新生儿/1-3个月尺码', '衣物', 'third', '3-4件', '孕36周前', 'essential', 29),
('包被/襁褓巾', '新生儿包裹用，2-3条替换', '衣物', 'third', '2-3条', '孕36周前', 'essential', 30),
('口水巾/拍嗝巾', '喂奶时使用', '衣物', 'third', '5-10条', '孕36周前', 'essential', 31),
('婴儿浴盆', '新生儿专用浴盆+浴架', '洗护', 'third', '1套', '孕36周前', 'essential', 32),
('婴儿沐浴露/洗发水', '新生儿专用、无泪配方', '洗护', 'third', '1瓶', '孕36周前', 'essential', 33),
('婴儿润肤露/抚触油', '日常保湿和抚触按摩', '洗护', 'third', '1-2瓶', '孕36周前', 'essential', 34),
('尿布台', '保护腰部的换尿布操作台', '洗护', 'third', '1个', '孕36周前', 'optional', 35),
('奶瓶（120ml+240ml）', '玻璃或PPSU材质', '喂养', 'third', '2-3个（大小各一）', '孕36周前', 'essential', 36),
('奶瓶刷+奶瓶清洗剂', '清洁奶瓶专用', '喂养', 'third', '1套', '孕36周前', 'essential', 37),
('奶粉（小罐）', '备一小罐，防止母乳不足', '喂养', 'third', '1小罐（400g）', '孕36周前', 'recommended', 38),
('恒温调奶器', '保持冲奶水温恒定', '喂养', 'third', '1个', '孕36周前', 'recommended', 39),
('奶瓶消毒器', '蒸汽或紫外线消毒', '喂养', 'third', '1个', '孕36周前', 'recommended', 40),
('婴儿指甲剪', '新生儿专用安全指甲剪', '洗护', 'third', '1个', '孕36周前', 'essential', 41),
('婴儿棉签/棉球', '清洁肚脐、耳朵、鼻子', '洗护', 'third', '1-2盒', '孕36周前', 'essential', 42),
('电子体温计', '婴儿专用快速测温', '医疗', 'third', '1个', '孕36周前', 'essential', 43),
('护臀膏', '预防和治疗尿布疹', '洗护', 'third', '1支', '孕36周前', 'essential', 44),

-- ========== 产后0-3个月 ==========
('S码纸尿裤', '3-8kg宝宝适用', '洗护', 'postpartum_0_3m', '2-4包/月', '根据宝宝体重增长', 'essential', 45),
('成人隔尿垫', '换尿布时铺在下面防止弄湿床单', '洗护', 'postpartum_0_3m', '3-5张（可水洗）', '产后准备', 'essential', 46),
('维生素D滴剂', '出生后第15天开始补充，每天400IU', '医疗', 'postpartum_0_3m', '1瓶', '出生后15天', 'essential', 47),
('婴儿安抚奶嘴', '0-6个月适用', '睡眠', 'postpartum_0_3m', '2个替换', '按需', 'optional', 48),
('婴儿背带/腰凳', '解放双手，方便抱娃', '出行', 'postpartum_0_3m', '1个', '按需', 'recommended', 49),
('婴儿黑白卡', '0-3个月视觉刺激', '其他', 'postpartum_0_3m', '1套', '出生后', 'recommended', 50),

-- ========== 产后3-12个月 ==========
('66号/73号婴儿服', '3-12个月尺码', '衣物', 'postpartum_3_12m', '4-6件', '根据宝宝生长', 'essential', 51),
('M码纸尿裤', '6-11kg宝宝适用', '洗护', 'postpartum_3_12m', '2-3包/月', '根据体重', 'essential', 52),
('婴儿辅食工具', '辅食机/研磨碗/辅食勺/围兜', '喂养', 'postpartum_3_12m', '1套', '4-6个月添加辅食前', 'essential', 53),
('婴儿餐椅', '培养良好就餐习惯', '喂养', 'postpartum_3_12m', '1个', '添加辅食前', 'essential', 54),
('婴儿牙胶', '缓解出牙期牙龈不适', '其他', 'postpartum_3_12m', '2-3个', '出牙前', 'recommended', 55),
('婴儿围栏+爬行垫', '创造安全活动空间', '睡眠', 'postpartum_3_12m', '1套', '开始翻身/爬行前', 'essential', 56),
('L码纸尿裤', '9-14kg宝宝适用', '洗护', 'postpartum_3_12m', '2包/月', '根据体重', 'essential', 57),

-- ========== 产后1-3岁 ==========
('学步鞋', '12-18个月开始学步', '衣物', 'postpartum_1_3y', '2-3双', '开始走路', 'essential', 58),
('训练裤/拉拉裤', '如厕训练过渡期', '洗护', 'postpartum_1_3y', '按需', '如厕训练期', 'recommended', 59),
('儿童餐具套装', '宝宝自主进食餐具', '喂养', 'postpartum_1_3y', '1套', '1岁左右', 'essential', 60),
('儿童水杯（吸管杯/敞口杯）', '过渡到自主喝水', '喂养', 'postpartum_1_3y', '2个', '1岁左右', 'essential', 61),
('幼儿马桶/马桶圈', '如厕训练', '洗护', 'postpartum_1_3y', '1个', '18个月-2岁', 'recommended', 62),
('儿童绘本', '适合年龄段的认知/行为绘本', '其他', 'postpartum_1_3y', '5-10本', '按阶段', 'recommended', 63),
('儿童安全用品', '防撞角/安全门锁/插座保护盖', '其他', 'postpartum_1_3y', '1套', '会爬/会走后', 'essential', 64);

-- =====================
-- 5. 插入心理支持数据
-- =====================
INSERT INTO public.psychological_support (title, content, period, support_type, tips, sort_order) VALUES

-- ========== 备孕期 ==========
(
  '备孕期的情绪陪伴',
  '备孕是一个充满期待也可能伴随焦虑的过程。准爸爸的理解和支持能给准妈妈极大的安全感。不要把备孕当成"任务"，而是一段共同成长的旅程。',
  'preconception',
  'emotion',
  ARRAY[
    '主动和伴侣沟通彼此的期待和担忧',
    '不要说"怎么还没怀上"之类给对方压力的话',
    '一起学习备孕知识，让她感受到你也在积极参与',
    '尊重她的排卵期节奏，不要让亲密变成"例行公事"',
    '如果备孕时间较长，主动提出一起去医院检查，共同面对'
  ],
  1
),
(
  '共同参与备孕行动',
  '备孕不是准妈妈一个人的事，准爸爸的参与非常重要。从生活方式的调整到知识的储备，夫妻同心才能事半功倍。',
  'preconception',
  'action',
  ARRAY[
    '和她一起补充叶酸（男性补充叶酸也有助于精子质量）',
    '共同戒烟戒酒，规律作息，互相监督',
    '一起制定运动计划，每周一起运动2-3次',
    '主动了解女性排卵周期和受孕知识',
    '陪她一起去孕前检查，自己也做全面体检'
  ],
  2
),

-- ========== 孕早期 ==========
(
  '理解和应对早孕反应',
  '孕早期是准妈妈身体变化最大的阶段。恶心、呕吐、疲劳、情绪波动都是正常的生理反应。你的耐心和体贴是给她最好的"止吐药"。',
  'first',
  'emotion',
  ARRAY[
    '当她孕吐时，递上一杯温水或苏打饼干，不要表现出嫌弃',
    '主动承担家务，让她有更多时间休息',
    '理解她情绪的忽高忽低，多拥抱少讲道理',
    '不要说"你太敏感了"之类否定她感受的话',
    '如果她孕吐严重，主动帮她预约医生'
  ],
  1
),
(
  '陪她度过第一个重要关口',
  '孕早期的产检和建档是孕期的重要里程碑。NT检查和早期唐筛可能带来焦虑，你的陪伴能让她安心。',
  'first',
  'knowledge',
  ARRAY[
    '陪她参加第一次产检，一起听医生的指导',
    '主动了解NT检查、唐筛是什么，不要一问三不知',
    '陪她办理建档手续，这个流程比较繁琐',
    '学习孕早期（1-12周）胎儿的发育知识',
    '了解哪些食物/药物/化妆品是孕期禁忌'
  ],
  2
),

-- ========== 孕中期 ==========
(
  '一起感受新生命的喜悦',
  '孕中期是准妈妈身体相对舒适的阶段。胎动的出现让孕期变得更加真实和神奇。这是加深夫妻情感连接的好时机。',
  'second',
  'emotion',
  ARRAY[
    '每天花时间和肚子里的宝宝说话、唱歌',
    '陪她感受胎动，一起分享这份奇妙的体验',
    '主动安排"约会"——孕中期相对稳定，适合短途出行',
    '夸她怀孕的样子很美，给她信心',
    '和她一起胎教，读故事或听音乐'
  ],
  1
),
(
  '积极参与孕期准备',
  '孕中期是准备婴儿用品和参加孕妇课程的关键时期。你的积极参与会让她感受到你是一个可靠的"战友"。',
  'second',
  'action',
  ARRAY[
    '陪她一起参加孕妇课程，学习分娩和育儿知识',
    '主动研究婴儿用品（推车、安全座椅、婴儿床等），和她一起做决定',
    '陪她拍孕妇照，记录这段特别的时光',
    '开始规划产假安排，和她讨论产后分工',
    '主动学习如何抱新生儿、换尿布、拍嗝'
  ],
  2
),

-- ========== 孕晚期 ==========
(
  '分娩前的心理支持',
  '临近分娩，准妈妈的身体负担最重，对分娩的恐惧和焦虑也最强烈。你的镇定和鼓励是她最需要的力量。',
  'third',
  'emotion',
  ARRAY[
    '耐心倾听她对分娩的恐惧，不要说"别想那么多"',
    '学习拉玛泽呼吸法，陪产时能指导她正确呼吸',
    '帮她按摩腰背、腿部，缓解孕晚期的不适',
    '提前和她讨论分娩计划，尊重她的选择',
    '告诉她"无论顺产还是剖腹产，我都会陪着你"'
  ],
  1
),
(
  '做好最后的准备',
  '孕晚期是待产的冲刺阶段。物品准备、入院流程、产后安排都需要在这段时间确定。你的条理性会减轻她的焦虑。',
  'third',
  'action',
  ARRAY[
    '和她一起整理待产包，确保每样物品都到位',
    '熟悉去医院的2-3条路线和停车情况',
    '确认入院需要携带的证件和材料',
    '定好月嫂/月子中心/谁来照顾月子',
    '陪她做产前检查，尤其是胎心监护和分娩评估',
    '承诺她："生产时我会一直陪在你身边"'
  ],
  2
),

-- ========== 产后0-3个月 ==========
(
  '产后情绪低谷——识别和应对',
  '约50-80%的新手妈妈会经历"产后情绪低落"（Baby Blues），10-15%可能发展为产后抑郁症。这是激素骤降+睡眠不足+角色转变共同作用的结果。你的理解比任何安慰话术都重要。',
  'postpartum_0_3m',
  'emotion',
  ARRAY[
    '留意她是否持续情绪低落、易哭、对宝宝缺乏兴趣',
    '当她哭或发脾气时，不要争辩对错——先拥抱，再说"辛苦了"',
    '主动说"你做得已经很好了"，新手妈妈的自我怀疑很普遍',
    '鼓励她出门透透气，哪怕只是下楼走10分钟',
    '如果她情绪持续低潮超过2周，温和提议看医生',
    '绝对不要说"你当妈妈了应该坚强"之类的话'
  ],
  1
),
(
  '新手爸爸的行动指南',
  '产后第一个月是家庭最混乱的时期。爸爸最容易犯的错误是"只围观不帮忙"或者"帮倒忙"。主动分担具体事务才是真正的支持。',
  'postpartum_0_3m',
  'action',
  ARRAY[
    '主动承担换尿布、拍嗝、哄睡等具体工作',
    '让老婆优先睡整觉——你负责宝宝半夜的一次喂养（瓶喂母乳或奶粉）',
    '承担所有家务：做饭、洗衣、打扫，让她只负责喂奶和休息',
    '帮老婆准备月子餐、烧洗澡水、洗伤口',
    '谢绝/婉拒亲戚探访，给她安静的恢复环境',
    '给老婆放"妈妈假"：每天至少30分钟完全属于她的时间'
  ],
  2
),
(
  '母乳喂养的陪伴之道',
  '母乳喂养之路常常充满挑战：乳头皲裂、堵奶、奶水不足、喂养焦虑。你的支持和实际帮助可以极大地减轻她的压力。',
  'postpartum_0_3m',
  'communication',
  ARRAY[
    '喂奶时帮她递水、垫枕头、调整姿势',
    '如果母乳困难，不要说"是不是奶不够"——这最伤人心',
    '主动学习正确的衔乳姿势和母乳知识',
    '半夜喂奶时陪她一起醒，哪怕只是陪着说说话',
    '如果决定混合喂养或纯奶粉，无条件支持她的选择',
    '帮她记录喂养时间，让她可以安心休息'
  ],
  3
),

-- ========== 产后3-12个月 ==========
(
  '支持她回归自我',
  '宝宝6个月后，妈妈开始从"纯妈妈"角色中慢慢找回自己。她可能想恢复身材、重返职场、发展兴趣爱好。你的支持是她最大的底气。',
  'postpartum_3_12m',
  'emotion',
  ARRAY[
    '鼓励她有自己的时间：约朋友、健身、读书',
    '主动提出周末由你带娃一整天，让她完全自由',
    '夸她的变化——赞美她的恢复和努力',
    '支持她的职业选择：无论是全职妈妈还是重返职场',
    '不要用"宝宝离不开妈妈"绑架她',
    '如果她产后身材焦虑，告诉她"你永远都美"'
  ],
  1
),
(
  '共同面对育儿挑战',
  '添加辅食、出牙期烦躁、睡眠倒退、分离焦虑……每个阶段都有新的挑战。夫妻同心是应对育儿困难的最佳武器。',
  'postpartum_3_12m',
  'action',
  ARRAY[
    '和她一起研究辅食添加的知识，陪宝宝尝试新食物',
    '出牙期宝宝夜间哭闹时，主动轮流起来安抚',
    '学习婴儿急救知识（海姆立克法），关键时刻能救命',
    '制定家庭分工计划，明确各自负责的育儿任务',
    '每周安排一次"夫妻时间"——不谈宝宝，只聊彼此'
  ],
  2
),

-- ========== 产后1-3岁 ==========
(
  '育儿理念的分歧处理',
  '宝宝1岁后，教育问题开始显现。夫妻之间在管教方式、喂养习惯、早教选择上可能出现分歧。有分歧正常，关键是如何处理。',
  'postpartum_1_3y',
  'communication',
  ARRAY[
    '不要在宝宝面前否定对方的管教方式',
    '有分歧时私下沟通，达成一致后再执行',
    '多问"你觉得怎么更好"，而不是"你这样不对"',
    '一起阅读育儿书籍，建立共同的知识基础',
    '接受"没有完美的育儿方式"，求同存异',
    '定期开"家庭会议"，讨论育儿方向和调整'
  ],
  1
),
(
  '保持夫妻关系的温度',
  '孩子2-3岁是最累的"terrible two"阶段，夫妻关系容易被育儿消耗殆尽。别忘了——好的夫妻关系才是给孩子最好的礼物。',
  'postpartum_1_3y',
  'emotion',
  ARRAY[
    '每月安排一次约会（请老人或保姆带娃）',
    '每天睡前花15分钟聊天——只聊彼此，不谈孩子',
    '保持肢体亲密：拥抱、牵手、按摩',
    '主动分担"隐形家务"——孩子的疫苗预约、衣物换季整理',
    '理解她的疲惫，多做少说',
    '告诉她："谢谢你为这个家做的一切"'
  ],
  2
);
