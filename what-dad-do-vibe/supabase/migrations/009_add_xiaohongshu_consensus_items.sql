-- ==========================================================
-- 小红书孕晚期必买共识数据
-- 009_add_xiaohongshu_consensus_items.sql
-- 数据来源：小红书TOP10「孕晚期必买」帖子交叉提炼
-- ==========================================================

-- =====================
-- 1. 给 preset_items 添加 recommendation_type 字段
-- 标记建议类型：suggested=建议购买 caution=谨慎购买/避坑
-- =====================
ALTER TABLE IF EXISTS public.preset_items
  ADD COLUMN IF NOT EXISTS recommendation_type TEXT
  CHECK (recommendation_type IN ('suggested', 'caution'));

ALTER TABLE IF EXISTS public.preset_items
  ADD COLUMN IF NOT EXISTS source TEXT
  CHECK (source IN ('manual', 'xiaohongshu_consensus'));

-- =====================
-- 2. 插入全站共识建议购买项
-- =====================
INSERT INTO public.preset_items (name, description, category, period, quantity_suggestion, preparation_timing, essential_level, sort_order, recommendation_type, source) VALUES

-- ========== 妈妈用品 ==========
('会阴冲洗器',
 '孕期分泌物多用冲洗器装温水坐马桶上清洗很方便；产后侧切/撕裂伤口清洗必备。从孕期用到月子，日常姨妈期也可用。喷头可伸缩，收纳方便。',
 '妈妈用品', 'third', '1个', '孕36周前', 'essential', 65, 'suggested', 'xiaohongshu_consensus'),

('站立小便器',
 '产后蹲下困难时使用，不用蹲着上厕所，非常实用。',
 '妈妈用品', 'third', '1个', '孕36周前', 'optional', 66, 'suggested', 'xiaohongshu_consensus'),

('安睡裤（产妇专用）',
 '产后恶露期使用，比普通产妇卫生巾好用，不容易侧漏。推荐小N、Babycare。',
 '妈妈用品', 'third', '2-3包', '孕36周前', 'essential', 67, 'suggested', 'xiaohongshu_consensus'),

('月子帽/月子披肩',
 '月子里空调房保护肩颈和头部，防止着凉。夏季可选薄款透气材料。',
 '妈妈用品', 'third', '1套', '孕36周前', 'recommended', 68, 'suggested', 'xiaohongshu_consensus'),

('集奶器（穿戴式）',
 '喂奶时接另一侧漏奶用，不用手扶，轻轻按压就能吸住。吸完可直接倒入储奶袋。',
 '妈妈用品', 'third', '1个', '产后按需', 'optional', 69, 'suggested', 'xiaohongshu_consensus'),

('产妇冰袋',
 '剖腹产后伤口冷敷、顺产会阴消肿用。',
 '妈妈用品', 'third', '2-3个', '孕36周前', 'recommended', 70, 'suggested', 'xiaohongshu_consensus'),

('哺乳枕/抱枕',
 '孕晚期帮助侧卧支撑肚子，产后哺乳时支撑宝宝。几十元即可解决孕晚期睡眠不适。',
 '妈妈用品', 'third', '1-2个', '孕晚期', 'recommended', 71, 'suggested', 'xiaohongshu_consensus'),

('分体恒温杯',
 '住院神器！医院不给用大功率电器，分体恒温杯免插电、加热速度快。分体设计安全卫生，洗杯子时电池不进水。注意避开一体式或内胆有胶圈的款式。推荐品牌：波咯咯。',
 '妈妈用品', 'third', '1个', '入院待产前', 'recommended', 72, 'suggested', 'xiaohongshu_consensus'),

('护腰坐垫',
 '办公室久坐孕妇必备。环住腰部承托肚子，减轻腰背压力。孕晚期怎么坐都不舒服时，往后靠可缓解呼吸不畅。哺乳期也可继续用。',
 '妈妈用品', 'second', '1个', '孕中期/孕晚期', 'recommended', 73, 'suggested', 'xiaohongshu_consensus'),

('勃肯/宽头拖鞋',
 '孕晚期脚肿时能穿的鞋。鞋头宽大、鞋内空间大，一脚蹬方便。散步穿不累脚。',
 '妈妈用品', 'third', '1双', '孕晚期脚肿时', 'recommended', 74, 'suggested', 'xiaohongshu_consensus'),

('孕妇枕',
 '孕晚期侧卧支撑肚子和腿部，提升睡眠质量。推荐舒适宝（贵/软）、Pima（平价）。',
 '妈妈用品', 'second', '1个', '孕中期/孕晚期', 'recommended', 75, 'suggested', 'xiaohongshu_consensus'),

('托腹带',
 '支撑腹部缓解腰背压力，孕晚期腹部明显下坠时使用。',
 '妈妈用品', 'second', '1条', '孕晚期腹部隆起后', 'recommended', 76, 'suggested', 'xiaohongshu_consensus'),

('妊娠油/按摩油',
 '保持腹部皮肤弹性，预防妊娠纹。每天坚持涂抹并按摩。',
 '妈妈用品', 'first', '2瓶', '孕早期开始', 'recommended', 77, 'suggested', 'xiaohongshu_consensus'),

('骨盆带',
 '耻骨联合分离过大、翻身太疼时绑它缓解。与收腹带功能不同——骨盆带绑胯骨部位。推荐嫚熙、十月结晶。',
 '产后恢复', 'third', '1条', '产后按需', 'recommended', 78, 'suggested', 'xiaohongshu_consensus'),

('优衣库连衣裙（孕妇可用）',
 '比同价位孕妇裙好穿N倍。面料舒服透气，对身形变化限制小，居家/通勤皆宜。可直接回购不同颜色穿到产后。',
 '妈妈用品', 'second', '2-3件', '孕中期', 'optional', 79, 'suggested', 'xiaohongshu_consensus'),

('Muji澡刷/长柄沐浴刷',
 '孕晚期沐浴之光。刷后背、刷腿不用弯腰。配合小矮凳，搭上腿轻松洗到脚踝脚背。',
 '妈妈用品', 'third', '1个', '孕晚期', 'optional', 80, 'suggested', 'xiaohongshu_consensus'),

('孕检收纳册',
 '孕检单多且大小不一，分类分页用贴纸标记项目，一目了然。生产时医生需要看。十几元即可解决。',
 '妈妈用品', 'first', '1本', '孕早期建档后', 'recommended', 81, 'suggested', 'xiaohongshu_consensus'),

-- ========== 洗护 ==========
('棉柔巾/云柔巾',
 '宝宝洗屁屁、擦口水用。消耗量大，可以多囤。即使宝宝用不完大人也能用，不浪费。',
 '洗护', 'third', '6-12包', '孕36周前', 'essential', 82, 'suggested', 'xiaohongshu_consensus'),

('护臀膏',
 '预防和治疗尿布疹。每次换尿布后涂抹。',
 '洗护', 'third', '1支', '孕36周前', 'essential', 83, 'suggested', 'xiaohongshu_consensus'),

-- ========== 出行 ==========
('DearMom罗马假日婴儿推车',
 '可双向轻便高景观（54cm），0.9秒丝滑换向。避震好，新生儿像睡在睡篮里。好折叠不重。强烈推荐纳入待产包。',
 '出行', 'second', '1辆', '孕28周前', 'essential', 84, 'suggested', 'xiaohongshu_consensus'),

-- ========== 喂养 ==========
('波咯咯分体恒温杯',
 '医院不给用大功率电器时替代恒温壶。免插电、加热速度快。分体设计安全卫生，内胆无胶圈不易滋生细菌。可热奶、冲奶。',
 '喂养', 'third', '1个', '入院待产前', 'recommended', 85, 'suggested', 'xiaohongshu_consensus'),

-- ========== 医疗 ==========
('爱乐维胆碱DHA',
 '含200mg DHA + 110mg 胆碱，助力宝宝视网膜和大脑发育。胆碱对妈妈记忆力也有好处。无腥味，0糖0香精0防腐。一人吃两人补。',
 '医疗', 'second', '1-2瓶', '孕中期开始', 'recommended', 86, 'suggested', 'xiaohongshu_consensus'),

('山姆高蛋白纤维麦片',
 '水果种类丰富，配酸奶/牛奶都好吃。孕期健康零食。',
 '医疗', 'second', '1袋', '随时', 'optional', 87, 'suggested', 'xiaohongshu_consensus'),

('无糖芝麻酥',
 '黑芝麻仁越嚼越有味，无糖配方看剧零食。',
 '医疗', 'second', '1袋', '随时', 'optional', 88, 'suggested', 'xiaohongshu_consensus'),

-- ========== 衣物 ==========
('夏季月子服（纯棉透气款）',
 '产后出虚汗多，一定要选透气面料柔软、有哺乳口和可调节腰带的款式。夏季可选短袖纯棉款。推荐品牌：宫熏、嫚熙。',
 '衣物', 'third', '2-3套', '孕36周前', 'essential', 89, 'suggested', 'xiaohongshu_consensus'),

('哺乳内衣（免拆洗款）',
 '孕期开始穿。弹力大不勒，解扣设计亲喂方便。推荐品牌：宫熏。',
 '衣物', 'second', '2-3件', '孕中期', 'essential', 90, 'suggested', 'xiaohongshu_consensus'),

('月子袜（纯棉透气）',
 '月子里穿袜子保护好脚踝。十几元可买多双。夏季选薄款透气棉袜。',
 '衣物', 'third', '5-10双', '孕36周前', 'recommended', 91, 'suggested', 'xiaohongshu_consensus'),

-- ========== 睡眠 ==========
('三角枕/侧卧支撑枕',
 '孕晚期各种躺姿都不舒服时的解决方案。便宜实用，十几元一个。生完还能当玩偶或靠枕。',
 '睡眠', 'third', '1-2个', '孕晚期', 'optional', 92, 'suggested', 'xiaohongshu_consensus');

-- =====================
-- 3. 插入全站共识谨慎/避坑项
-- =====================
INSERT INTO public.preset_items (name, description, category, period, quantity_suggestion, preparation_timing, essential_level, sort_order, recommendation_type, source) VALUES

('❌ 吸奶器（别急着买）',
 '⚠️ 孕晚期不要急着买吸奶器！不要想着用它开奶。等产后有吸奶需求再买。如果要提前备，先买回来测喇叭罩尺寸——过大易水肿，过小易摩擦。推荐品牌：贝瑞克（高端）、贝能（性价比）。',
 '喂养', 'third', '产后按需', '产后按需——不要提前囤', 'optional', 93, 'caution', 'xiaohongshu_consensus'),

('❌ 纸尿裤（别囤太多）',
 '⚠️ 不要一下子囤太多！建议先买2包NB码+2包S码。之后根据宝宝出生后的实际体重再补货。重点品牌：Babycare花苞裤（柔软舒适，新生儿可冲）、帮宝适黑金帮（真蚕丝，超软）、好奇（后漏便便兜设计，防漏）。',
 '洗护', 'third', '2包NB + 2包S（初期）', '孕36周前买初始量，别囤', 'essential', 94, 'caution', 'xiaohongshu_consensus'),

('❌ 刀纸（先看医院清单）',
 '⚠️ 很多医院的待产清单上并不需要刀纸！先对照自己建档医院给的清单买，不要跟风囤。有宝妈反映买了完全没用上。',
 '妈妈用品', 'third', '按医院清单', '先确认再购买', 'optional', 95, 'caution', 'xiaohongshu_consensus'),

('❌ 奶瓶（别买太多）',
 '⚠️ 奶瓶不需要买很多！宝宝奶量涨得快，小奶瓶用不久。建议买1个PPSU材质（轻便）+ 1个玻璃材质（热奶快）就够了。',
 '喂养', 'third', '1个PPSU + 1个玻璃', '孕36周前', 'essential', 96, 'caution', 'xiaohongshu_consensus'),

('❌ 一体式恒温杯',
 '⚠️ 避免购买一体式或内胆有胶圈的恒温杯！一是不安全，二是内胆胶圈如果拿来热奶，很容易清洗不到位、滋生细菌、产生奶臭味。推荐买分体设计的恒温杯，电池可分离，安全卫生。',
 '喂养', 'third', '0个（不建议买一体式）', '如需购买选分体式', 'optional', 97, 'caution', 'xiaohongshu_consensus'),

('❌ 月子鞋（包脚跟款）',
 '⚠️ 不要用拖鞋代替月子鞋！拖鞋不包脚跟，月子里容易受凉。建议买包脚后跟的软底月子鞋。不过夏季纯棉月子鞋即可，不用买太厚的。',
 '衣物', 'third', '1-2双', '孕36周前', 'recommended', 98, 'caution', 'xiaohongshu_consensus'),

('❌ 十月结晶一次性内裤（品质问题）',
 '⚠️ 小红书多位宝妈反馈十月结晶一次性内裤不好穿。如果选择该品牌建议先买少量试用。',
 '妈妈用品', 'third', '先少量试买', '确认品质后补货', 'optional', 99, 'caution', 'xiaohongshu_consensus'),

('❌ 52码婴儿服（别囤太多）',
 '⚠️ 新生儿52码衣服（0-1个月）不要买太多！宝宝长得快，很快就穿不下了。建议2-3件换洗足够。夏季优先选A类纯棉+无骨缝制的轻薄款。',
 '衣物', 'third', '2-3件（52码）', '孕36周前，别多囤', 'essential', 100, 'caution', 'xiaohongshu_consensus'),

('❌ 同一账号多端登录',
 '⚠️ 小红书同一账号不允许在多个网页端同时登录。如果在xiaohongshu-mcp等工具上登录了，就不要在其他网页端再登录，否则会被"踢出登录"。可以用手机App查看账号信息。',
 '其他', 'third', '—', '使用时注意', 'optional', 101, 'caution', 'xiaohongshu_consensus'),

('❌ 内容含引流/搬运词',
 '⚠️ 图文内容中不要出现引流、纯搬运等敏感词，这是小红书官方重点打击对象，容易导致曝光降低甚至限流。',
 '其他', 'third', '—', '发布内容时注意', 'optional', 102, 'caution', 'xiaohongshu_consensus');
