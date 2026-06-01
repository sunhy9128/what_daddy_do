-- ==========================================================
-- 食物禁忌表 — 宝妈孕期+婴儿期食物安全查询
-- 014_create_food_safety.sql
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.food_safety (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    '蔬菜', '水果', '肉类', '海鲜', '蛋奶', '豆制品',
    '谷物', '饮品', '调味品', '零食', '药材', '其他'
  )),
  -- 安全等级: safe=可以吃  caution=适量吃  forbidden=绝对不能吃
  preconception TEXT NOT NULL DEFAULT 'safe' CHECK (preconception IN ('safe', 'caution', 'forbidden')),
  first TEXT NOT NULL DEFAULT 'safe' CHECK (first IN ('safe', 'caution', 'forbidden')),
  second TEXT NOT NULL DEFAULT 'safe' CHECK (second IN ('safe', 'caution', 'forbidden')),
  third TEXT NOT NULL DEFAULT 'safe' CHECK (third IN ('safe', 'caution', 'forbidden')),
  postpartum TEXT NOT NULL DEFAULT 'safe' CHECK (postpartum IN ('safe', 'caution', 'forbidden')),
  baby_0_3m TEXT NOT NULL DEFAULT 'forbidden' CHECK (baby_0_3m IN ('safe', 'caution', 'forbidden')),
  baby_3_12m TEXT NOT NULL DEFAULT 'forbidden' CHECK (baby_3_12m IN ('safe', 'caution', 'forbidden')),
  baby_1_3y TEXT NOT NULL DEFAULT 'caution' CHECK (baby_1_3y IN ('safe', 'caution', 'forbidden')),
  note TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.food_safety ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所有人可读取食物安全数据" ON public.food_safety
  FOR SELECT USING (true);

CREATE POLICY "仅服务端可写入食物安全数据" ON public.food_safety
  FOR INSERT WITH CHECK (false);

CREATE POLICY "仅服务端可更新食物安全数据" ON public.food_safety
  FOR UPDATE USING (false);

-- 全文搜索索引（需启用 pg_trgm 扩展）
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS food_safety_name_idx ON public.food_safety USING gin(name gin_trgm_ops);

-- =====================
-- 插入预设食物数据
-- =====================
INSERT INTO public.food_safety (name, category, preconception, first, second, third, postpartum, baby_0_3m, baby_3_12m, baby_1_3y, note, sort_order) VALUES

-- ========== 蔬菜类 ==========
('菠菜', '蔬菜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '富含铁和叶酸，但需焯水去除草酸', 1),
('西兰花', '蔬菜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '富含叶酸和维生素C，孕期推荐', 2),
('胡萝卜', '蔬菜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', 'β-胡萝卜素丰富，煮熟后更易吸收', 3),
('西红柿', '蔬菜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '富含番茄红素和维生素C', 4),
('海带', '蔬菜', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'caution', '碘含量高，适量食用，甲亢患者避免', 5),
('紫菜', '蔬菜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'caution', 'safe', '碘含量高，少量食用即可', 6),
('山药', '蔬菜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '健脾养胃，孕期便秘可适量食用', 7),
('苦瓜', '蔬菜', 'safe', 'caution', 'caution', 'caution', 'safe', 'forbidden', 'forbidden', 'caution', '性寒，孕早期慎食，含奎宁可能刺激宫缩', 8),
('木耳', '蔬菜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '活血化瘀，产前不宜多食，产后可适量', 9),
('马齿苋', '蔬菜', 'caution', 'forbidden', 'forbidden', 'forbidden', 'caution', 'forbidden', 'forbidden', 'caution', '可能刺激子宫收缩，孕期禁用', 10),
('芦荟', '蔬菜', 'forbidden', 'forbidden', 'forbidden', 'forbidden', 'caution', 'forbidden', 'forbidden', 'forbidden', '芦荟大黄素可能导致盆腔充血，孕期禁用', 11),
('韭菜', '蔬菜', 'safe', 'safe', 'safe', 'caution', 'caution', 'forbidden', 'forbidden', 'safe', '适量食用，过量可能引起胃部不适', 12),
('扁豆', '蔬菜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '必须彻底煮熟，生扁豆含毒素', 13),
('豆芽', '蔬菜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '必须彻底煮熟，生豆芽可能含细菌', 14),

-- ========== 水果类 ==========
('苹果', '水果', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '孕期推荐水果，富含膳食纤维', 15),
('香蕉', '水果', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '补钾，缓解孕期腿抽筋', 16),
('橙子', '水果', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '富含维生素C，增强免疫力', 17),
('葡萄', '水果', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'caution', '糖分高，妊娠糖尿病者限量', 18),
('芒果', '水果', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'caution', 'safe', '过敏体质慎食', 19),
('菠萝', '水果', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'caution', 'safe', '含菠萝蛋白酶，过敏体质慎食', 20),
('榴莲', '水果', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'caution', '糖分和热量极高，妊娠糖尿病和体重增长过快者避免', 21),
('山楂', '水果', 'caution', 'forbidden', 'forbidden', 'forbidden', 'caution', 'forbidden', 'forbidden', 'forbidden', '可能刺激子宫收缩，孕早期尤其危险', 22),
('桂圆', '水果', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'caution', '性温，孕妇多食易上火、便秘', 23),
('荔枝', '水果', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'caution', '高糖，孕期血糖高者限量', 24),
('西瓜', '水果', 'safe', 'safe', 'safe', 'caution', 'caution', 'forbidden', 'forbidden', 'safe', '孕晚期利尿消肿，但含糖高不宜多食', 25),
('木瓜', '水果', 'safe', 'forbidden', 'forbidden', 'forbidden', 'safe', 'forbidden', 'forbidden', 'caution', '青木瓜含木瓜苷可能导致宫缩，孕期禁用', 26),
('猕猴桃', '水果', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'caution', 'safe', '富含叶酸和维生素C，通便效果好', 27),

-- ========== 肉类 ==========
('猪肉', '肉类', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '选瘦肉，充分煮熟', 28),
('牛肉', '肉类', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '富含铁和蛋白质，孕期推荐', 29),
('鸡肉', '肉类', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '去皮更健康，必须全熟', 30),
('鸭肉', '肉类', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '性凉，适量食用', 31),
('羊肉', '肉类', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '性温，冬季进补佳品，不宜过量', 32),
('动物肝脏', '肉类', 'safe', 'caution', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'caution', '富含铁和维生素A，孕早期过量可能导致胎儿畸形', 33),
('兔肉', '肉类', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '高蛋白低脂肪，可适量食用', 34),

-- ========== 海鲜类 ==========
('虾', '海鲜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '高蛋白低脂肪，必须全熟', 35),
('三文鱼', '海鲜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '富含DHA，孕期推荐，但须全熟', 36),
('鳕鱼', '海鲜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '肉质细嫩，适合婴儿辅食初期添加', 37),
('带鱼', '海鲜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '富含不饱和脂肪酸，适量食用', 38),
('螃蟹', '海鲜', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '性寒，孕早期慎食，过敏体质避免', 39),
('甲鱼', '海鲜', 'safe', 'forbidden', 'forbidden', 'forbidden', 'caution', 'forbidden', 'forbidden', 'forbidden', '活血化瘀作用强，孕期禁用', 40),
('田螺', '海鲜', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '可能含寄生虫，必须彻底煮熟', 41),
('生蚝', '海鲜', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '富含锌，但必须全熟食用，孕期抵抗力下降慎食', 42),

-- ========== 蛋奶类 ==========
('鸡蛋', '蛋奶', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '孕期每日1-2个，必须全熟', 43),
('鸭蛋', '蛋奶', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '必须全熟，皮蛋含铅应避免', 44),
('牛奶', '蛋奶', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '补钙首选，乳糖不耐可选无乳糖或酸奶', 45),
('酸奶', '蛋奶', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '富含益生菌，有助于肠道健康', 46),
('奶酪', '蛋奶', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'caution', 'safe', '选巴氏杀菌奶酪，避免生奶酪', 47),

-- ========== 豆制品 ==========
('豆腐', '豆制品', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '优质植物蛋白，孕期推荐', 48),
('豆浆', '豆制品', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '必须彻底煮开，生豆浆含毒素', 49),
('腐竹', '豆制品', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '豆制品中的高蛋白代表', 50),

-- ========== 谷物类 ==========
('大米', '谷物', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '主食，建议搭配杂粮', 51),
('小米', '谷物', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '养胃，产后月子粥首选', 52),
('燕麦', '谷物', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '富含膳食纤维，有助于控制血糖', 53),
('糙米', '谷物', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'caution', 'safe', '富含B族维生素，口感较粗逐渐添加', 54),
('薏米', '谷物', 'safe', 'forbidden', 'forbidden', 'forbidden', 'caution', 'forbidden', 'forbidden', 'forbidden', '可能刺激子宫收缩，孕期禁用', 55),
('糯米', '谷物', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'caution', '不易消化，不宜多食', 56),

-- ========== 饮品类 ==========
('白开水', '饮品', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '孕期最佳饮品', 57),
('蜂蜜', '饮品', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'caution', '一岁以下婴儿禁止食用（肉毒杆菌风险）', 58),
('绿茶', '饮品', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '含咖啡因，每日不超过200ml', 59),
('咖啡', '饮品', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '每日不超过一杯（200mg咖啡因），过量增加流产风险', 60),
('可乐', '饮品', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '含咖啡因和高糖，不推荐孕期饮用', 61),
('酒精', '饮品', 'forbidden', 'forbidden', 'forbidden', 'forbidden', 'caution', 'forbidden', 'forbidden', 'forbidden', '孕期绝对禁止！可能导致胎儿酒精综合征', 62),
('红糖水', '饮品', 'safe', 'caution', 'caution', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '产后补血佳品，孕期血糖高者限量', 63),
('菊花茶', '饮品', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'forbidden', '性凉，适量饮用', 64),

-- ========== 调味品类 ==========
('盐', '调味品', 'safe', 'safe', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'safe', '孕晚期控制盐摄入，预防水肿和妊娠高血压', 65),
('酱油', '调味品', 'safe', 'safe', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'safe', '含盐量高，孕期适量', 66),
('醋', '调味品', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '可少量食用', 67),
('生姜', '调味品', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '缓解孕吐，做菜调味适量', 68),
('大蒜', '调味品', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '杀菌消炎，做菜调味适量', 69),
('辣椒', '调味品', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '可能导致胃部不适和痔疮，孕晚期慎食', 70),
('味精', '调味品', 'safe', 'safe', 'caution', 'caution', 'safe', 'forbidden', 'forbidden', 'forbidden', '孕期少食为佳', 71),
('肉桂/桂皮', '调味品', 'safe', 'caution', 'caution', 'caution', 'safe', 'forbidden', 'forbidden', 'forbidden', '大量食用可能刺激子宫', 72),

-- ========== 零食类 ==========
('坚果（核桃）', '零食', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'caution', '富含DHA，每日3-5颗即可', 73),
('坚果（杏仁）', '零食', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'caution', '选甜杏仁，苦杏仁含氰化物孕期禁用', 74),
('巧克力', '零食', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'forbidden', '选黑巧克力，少量食用，注意咖啡因摄入', 75),
('膨化食品', '零食', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '高盐高脂，孕期尽量不吃', 76),
('冰淇淋', '零食', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'caution', '注意卫生和糖分，适量食用', 77),

-- ========== 药材类 ==========
('人参', '药材', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '性温，阴虚火旺者慎用，产后大补需遵医嘱', 78),
('当归', '药材', 'safe', 'caution', 'caution', 'forbidden', 'safe', 'forbidden', 'forbidden', 'forbidden', '活血补血，孕晚期禁用（可能引起宫缩），产后可用', 79),
('黄芪', '药材', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'forbidden', '补气佳品，孕期可适量食用', 80),
('阿胶', '药材', 'safe', 'caution', 'caution', 'caution', 'safe', 'forbidden', 'forbidden', 'forbidden', '产后补血佳品，孕早期慎用', 81),
('枸杞', '药材', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '滋补肝肾，适量食用', 82),
('红花', '药材', 'forbidden', 'forbidden', 'forbidden', 'forbidden', 'caution', 'forbidden', 'forbidden', 'forbidden', '活血通经作用强，孕期绝对禁用', 83);
