-- ==========================================================
-- 补充食物禁忌数据 — 小红书热门孕期+婴儿期饮食禁忌
-- 015_add_food_safety_items.sql
-- 基于小红书阅读量 TOP 话题交叉整理，补充现有 83 条之外的常见食物
-- ==========================================================

-- ===================== 蔬菜类补充 ======================
INSERT INTO public.food_safety (name, category, preconception, first, second, third, postpartum, baby_0_3m, baby_3_12m, baby_1_3y, note, sort_order) VALUES
('芹菜', '蔬菜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '富含膳食纤维和芹菜素，有助于降血压', 84),
('南瓜', '蔬菜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '富含β-胡萝卜素和果胶，推荐孕期食用', 85),
('冬瓜', '蔬菜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '利尿消肿，孕晚期水肿可适量食用', 86),
('丝瓜', '蔬菜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '通乳下奶，产后推荐食用', 87),
('莲藕', '蔬菜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '补血养胃，熟藕温补，生藕性寒', 88),
('茄子', '蔬菜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '性凉，脾胃虚寒者适量，必须彻底煮熟', 89),
('白萝卜', '蔬菜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '助消化、通气，孕期胀气可适量食用', 90),
('空心菜', '蔬菜', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'safe', '性寒滑利，孕早期慎食', 91),
('黄瓜', '蔬菜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '清爽补水，但性凉不宜多食', 92),
('油菜', '蔬菜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '富含钙和维生素，孕期推荐', 93),
('秋葵', '蔬菜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '富含膳食纤维和叶酸，孕期推荐', 94),
('竹笋', '蔬菜', 'safe', 'caution', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'caution', '性寒，含草酸高，需焯水后食用', 95),
('芋头', '蔬菜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '富含膳食纤维和氟元素，煮熟后易消化', 96),

-- ===================== 水果类补充 ======================
('草莓', '水果', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'caution', 'safe', '富含维生素C和叶酸，清洗要彻底去除农药残留', 97),
('樱桃/车厘子', '水果', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '含铁量高，补血佳品，但性温多食易上火', 98),
('蓝莓', '水果', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'caution', 'safe', '富含花青素和抗氧化物质，孕期推荐', 99),
('西柚/柚子', '水果', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '富含叶酸和维生素C，但注意与药物相互作用', 100),
('火龙果', '水果', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '通便效果好，孕期便秘推荐，红心含花青素更佳', 101),
('柠檬', '水果', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '缓解孕吐，泡水饮用，酸性体质适量', 102),
('椰子/椰子水', '水果', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '椰子水补充羊水（民间经验），天然电解质饮品', 103),
('石榴', '水果', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'caution', '富含多酚类抗氧化物，补血安胎但糖分不低', 104),
('枇杷', '水果', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'caution', '润肺止咳，但性凉且含微量氰化物不宜多食', 105),
('牛油果', '水果', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'caution', 'safe', '富含优质脂肪酸和叶酸，孕期超级食物', 106),
('桃子', '水果', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '养阴生津，但毛需洗净，过敏体质慎食', 107),
('柿子', '水果', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '含鞣酸，空腹食用易形成胃结石，孕期慎食', 108),
('甘蔗', '水果', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '高糖，妊娠糖尿病者避免，霉变甘蔗有毒禁用', 109),
('百香果', '水果', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '维生素C含量极高，增强免疫力', 110),
('无花果', '水果', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '含丰富膳食纤维和矿物质，促进通乳', 111),
('桑葚', '水果', 'safe', 'caution', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'caution', '性寒，富含花青素，脾胃虚寒者少食', 112),
('杏子', '水果', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '有小毒（含苦杏仁苷），孕期不宜多食', 113),

-- ===================== 肉类补充 ======================
('鸽子肉', '肉类', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '高蛋白低脂肪，产后滋补佳品', 114),
('猪蹄', '肉类', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'caution', '富含胶原蛋白，民间认为催乳效果佳', 115),

-- ===================== 海鲜补充 ======================
('鲫鱼', '海鲜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '通乳下奶，产后鲫鱼汤是经典月子菜', 116),
('鲈鱼', '海鲜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '肉质细嫩少刺，富含蛋白质，适合孕期和辅食', 117),
('金枪鱼', '海鲜', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '大型鱼类含汞量较高，每周不超过1次', 118),
('蛤蜊', '海鲜', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '性寒，必须彻底煮熟，孕期适量', 119),
('海参', '海鲜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'caution', '高蛋白低脂肪，滋补佳品，产后恢复推荐', 120),
('鲍鱼', '海鲜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'forbidden', '高蛋白营养丰富，但胆固醇较高，适量食用', 121),
('鳗鱼', '海鲜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'forbidden', '富含DHA和EPA，孕期推荐但需全熟', 122),
('龙利鱼', '海鲜', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'safe', 'safe', '肉质鲜嫩无刺，最适合婴儿辅食初期添加的鱼类', 123),

-- ===================== 蛋奶类补充 ======================
('鹌鹑蛋', '蛋奶', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'caution', '含卵磷脂和脑磷脂，有助于胎儿大脑发育', 124),
('鹅蛋', '蛋奶', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'caution', '民间认为去胎毒，但无科学依据，胆固醇较高', 125),
('蛋白', '蛋奶', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '一岁内婴儿肠道屏障未发育完全，蛋白易过敏需延迟添加', 126),

-- ===================== 豆制品补充 ======================
('毛豆', '豆制品', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '富含植物蛋白和膳食纤维，必须煮熟', 127),
('绿豆', '豆制品', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '清热解暑，但性凉，孕期适量', 128),
('红豆', '豆制品', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '补血利水，孕期水肿和产后均可食用', 129),
('黑豆', '豆制品', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '补肾养血，富含花青素', 130),

-- ===================== 谷物类补充 ======================
('玉米', '谷物', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '富含膳食纤维和叶黄素，推荐孕期食用', 131),
('红薯', '谷物', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '通便效果好，但糖分高，妊娠糖尿病者限量', 132),
('紫薯', '谷物', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '富含花青素和硒，抗氧化效果好', 133),
('黑米', '谷物', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '补血养肾，适合孕期食用', 134),
('荞麦', '谷物', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '低GI，适合妊娠糖尿病孕妇，有助于控制血糖', 135),
('芝麻', '谷物', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'caution', '补钙补铁，芝麻酱是婴儿辅食优质调味', 136),
('藜麦', '谷物', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '全营养谷物，含全部必需氨基酸，孕期超级食物', 137),

-- ===================== 饮品补充 ======================
('红枣水', '饮品', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'safe', '补气血，孕期和产后均可适量饮用', 138),
('奶茶', '饮品', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '高糖高咖啡因，奶茶是小红书最热门孕期争议饮品', 139),
('功能性饮料', '饮品', 'forbidden', 'forbidden', 'forbidden', 'forbidden', 'forbidden', 'forbidden', 'forbidden', 'forbidden', '高咖啡因和添加剂，孕期绝对禁止', 140),
('大麦茶', '饮品', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'forbidden', 'forbidden', '哺乳期饮用可能回奶，产后慎饮', 141),
('红茶', '饮品', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '含咖啡因，每日不超过200ml，比绿茶发酵度高', 142),
('玫瑰花茶', '饮品', 'safe', 'caution', 'caution', 'caution', 'safe', 'forbidden', 'forbidden', 'forbidden', '疏肝理气，但活血作用较强，孕早期慎饮', 143),

-- ===================== 调味品补充 ======================
('料酒', '调味品', 'safe', 'caution', 'caution', 'caution', 'safe', 'forbidden', 'forbidden', 'forbidden', '含酒精成分，烹饪中酒精挥发后可用，尽量少用', 144),
('花椒', '调味品', 'safe', 'safe', 'safe', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '热性刺激，哺乳期有回奶说法，产后慎食', 145),
('八角', '调味品', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'forbidden', '香料少量调味无碍，不宜过量', 146),

-- ===================== 零食补充 ======================
('甜点/蛋糕', '零食', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'caution', '高糖高脂，妊娠糖尿病和体重增长过快者避免', 147),
('果冻', '零食', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '含添加剂，婴儿（尤其3岁以下）有窒息风险，绝对禁止', 148),
('海苔', '零食', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'caution', '富含碘和膳食纤维，选低盐版本，适量食用', 149),
('烧烤', '零食', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '高温烧烤产生致癌物（苯并芘），卫生难以保证，尽量不吃', 150),
('辣条', '零食', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '高盐高油多添加剂，孕期尽量不吃', 151),
('腌制食品（咸菜/泡菜）', '零食', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '高盐含亚硝酸盐，孕期少量食用，自制更安全', 152),
('腊肉/腊肠', '零食', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '加工肉制品含亚硝酸盐，孕期尽量不吃', 153),
('糖果/白砂糖', '零食', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'caution', '高糖，妊娠糖尿病者禁止，婴儿辅食不应加糖', 154),
('方便面', '零食', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '高钠低营养，应急可偶尔食用，不推荐作为正餐', 155),

-- ===================== 药材补充 ======================
('燕窝', '药材', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'forbidden', '富含唾液酸（燕窝酸），小红书最热门孕期滋补品，但需选正规渠道', 156),
('益母草', '药材', 'forbidden', 'forbidden', 'forbidden', 'forbidden', 'safe', 'forbidden', 'forbidden', 'forbidden', '活血调经，孕期绝对禁用，产后排恶露可用', 157),
('蜂王浆', '药材', 'caution', 'forbidden', 'forbidden', 'forbidden', 'caution', 'forbidden', 'forbidden', 'forbidden', '含类激素成分，孕期不推荐食用', 158),

-- ===================== 其他补充 ======================
('生鱼片/刺身', '其他', 'caution', 'forbidden', 'forbidden', 'forbidden', 'forbidden', 'forbidden', 'forbidden', 'forbidden', '含寄生虫和细菌风险，孕期绝对禁止生食', 159),
('火锅', '其他', 'safe', 'caution', 'safe', 'safe', 'caution', 'forbidden', 'forbidden', 'forbidden', '需确保食材全熟，选清汤锅底，避免生熟交叉污染', 160),

-- ===================== 高频补充（以下为小红书经典"孕妇能不能吃"话题） ======================
('小龙虾', '其他', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '小红书夏季最热孕期话题，必须彻底煮熟去虾线，适量食用', 161),
('螺蛳粉', '其他', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '小红书人气话题，高钠高辣，孕期偶尔解馋可去辣包', 162),
('麻辣烫', '其他', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '注意食材卫生和汤底，选清汤，确保全熟', 163),
('皮蛋/松花蛋', '蛋奶', 'safe', 'caution', 'caution', 'caution', 'caution', 'forbidden', 'forbidden', 'forbidden', '含铅风险，选无铅皮蛋，孕期少量食用', 164),
('苏打水/气泡水', '饮品', 'safe', 'safe', 'safe', 'safe', 'safe', 'forbidden', 'forbidden', 'forbidden', '无糖苏打水可缓解孕吐，但选无糖无咖啡因版本', 165);
