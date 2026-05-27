-- 预设任务表 — 完整孕期推荐待办
-- 作用：首次登录时自动插入 + 任务页"可添加任务"推荐
-- 来源：国家孕婴网、中华医学会产检指南、搜狐健康、丁香医生
-- 去重规则：按 (stage, title, type) 组合，同 stage+title 不同 type 可共存

-- 1. 重建表（扩展 stage 支持 'postpartum'，type 支持 'checkin'）
DROP TABLE IF EXISTS public.preset_tasks CASCADE;
CREATE TABLE IF NOT EXISTS public.preset_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  stage TEXT NOT NULL CHECK (stage IN ('preconception', 'first', 'second', 'third', 'postpartum')),
  type TEXT NOT NULL CHECK (type IN ('prenatal', 'daily', 'custom', 'checkin')),
  due_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 插入预设任务数据 — 按阶段分类
-- ========== 备孕阶段 ==========
INSERT INTO public.preset_tasks (title, description, stage, type, due_date) VALUES

-- 产检类
('孕前体检', '全面体检，包括血常规、尿常规、肝肾功能、血糖、血脂', 'preconception', 'prenatal', NULL),
('口腔检查', '孕期牙齿问题处理受限，提前完成洗牙、补牙、拔智齿', 'preconception', 'prenatal', NULL),
('遗传咨询', '如有家族遗传病史，提前进行遗传咨询和筛查', 'preconception', 'prenatal', NULL),
('疫苗抗体检查', '确认风疹、乙肝、水痘抗体，不足则补种疫苗', 'preconception', 'prenatal', NULL),
('妇科检查', '检查子宫、卵巢健康，排除肌瘤、囊肿等问题', 'preconception', 'prenatal', NULL),
('甲状腺功能检查', '甲状腺功能异常影响受孕和胎儿发育', 'preconception', 'prenatal', NULL),
('精液常规检查', '检查精子数量、活力、形态，确保男性生育能力', 'preconception', 'prenatal', NULL),
('性激素六项', '评估卵巢功能和内分泌状态', 'preconception', 'prenatal', NULL),

-- 日常类
('补充叶酸', '每天400-800微克叶酸，预防胎儿神经管畸形，双方同补', 'preconception', 'daily', NULL),
('作息调整', '保持规律作息，每晚7-8小时充足睡眠，避免熬夜', 'preconception', 'daily', NULL),
('体重管理', '将BMI调整至18.5-24的健康范围，过胖或过瘦均影响受孕', 'preconception', 'daily', NULL),
('规律运动', '每周150分钟中等强度运动，如快走、游泳、慢跑', 'preconception', 'daily', NULL),
('减少咖啡因', '每天咖啡因摄入不超过200mg（约1-2杯咖啡）', 'preconception', 'daily', NULL),
('均衡饮食', '增加蛋白质、蔬菜水果摄入，减少加工食品和外卖', 'preconception', 'daily', NULL),

-- 自定义类
('戒酒戒烟', '提前3个月戒酒戒烟，二手烟也要避免', 'preconception', 'custom', NULL),
('停服禁忌药物', '咨询医生调整用药，停用孕期禁忌药物（如维A酸类）', 'preconception', 'custom', NULL),
('学习排卵期知识', '掌握排卵期计算方法，使用排卵试纸提高受孕率', 'preconception', 'custom', NULL),
('生育保险规划', '了解生育保险政策，确认报销流程和产假天数', 'preconception', 'custom', NULL),
('购置备孕用品', '准备基础体温计、排卵试纸、验孕棒等', 'preconception', 'custom', NULL),
('工作环境评估', '排查工作环境中的辐射、化学毒物、高温等有害因素', 'preconception', 'custom', NULL),
('心理建设', '夫妻沟通生育计划，调整心态，减轻备孕焦虑', 'preconception', 'custom', NULL),

-- 打卡类
('服用叶酸', '每天按时服用叶酸，夫妻同补效果更好', 'preconception', 'checkin', NULL),
('测量基础体温', '每天早晨醒来后测量基础体温，记录排卵周期', 'preconception', 'checkin', NULL),
('健康饮食打卡', '每天记录饮食，保证蛋白质和蔬果摄入', 'preconception', 'checkin', NULL);

-- ========== 孕早期 (1-12周) ==========
INSERT INTO public.preset_tasks (title, description, stage, type, due_date) VALUES

-- 产检类
('首次产检', '确认怀孕（血HCG+B超），建立孕期档案，查肝肾功能、血常规', 'first', 'prenatal', NULL),
('NT检查', '胎儿颈项透明层厚度检查，11-13周+6天最佳，早期筛查唐氏综合征', 'first', 'prenatal', NULL),
('建档', '到社区医院或产检医院建立《母子健康手册》', 'first', 'prenatal', NULL),
('早期唐氏筛查', '结合NT值+血清学指标，筛查21/18三体综合征', 'first', 'prenatal', NULL),
('血常规+尿常规', '基础血液和尿液检查，排查贫血、尿路感染', 'first', 'prenatal', NULL),
('肝肾功能检查', '评估肝脏和肾脏代谢功能', 'first', 'prenatal', NULL),
('传染病筛查', '乙肝、梅毒、艾滋病筛查，早发现早干预', 'first', 'prenatal', NULL),
('甲状腺功能检查', 'TSH、FT3、FT4，甲减影响胎儿智力发育', 'first', 'prenatal', NULL),
('ABO/Rh血型检查', '排查母婴血型不合导致的溶血风险', 'first', 'prenatal', NULL),
('心电图', '评估心脏功能，排查心脏疾病', 'first', 'prenatal', NULL),
('阴道分泌物检查', '排查阴道炎、衣原体等感染', 'first', 'prenatal', NULL),

-- 日常类
('应对早孕反应', '少食多餐，吃苏打饼干缓解孕吐，避免油腻刺激食物', 'first', 'daily', NULL),
('清淡饮食', '以易消化的粥、面、蒸菜为主，保证基本营养摄入', 'first', 'daily', NULL),
('保持水分', '每天喝足1.5-2升水，缓解孕吐导致的脱水', 'first', 'daily', NULL),
('避免久坐久站', '每1小时起来活动5分钟，促进血液循环', 'first', 'daily', NULL),

-- 自定义类
('选择生产医院', '考察家附近的产科医院，了解床位、技术、距离等因素', 'first', 'custom', NULL),
('办理生育登记', '到社区/线上办理生育服务登记，后续报销产检费用', 'first', 'custom', NULL),
('购买孕期保险', '了解孕产险、新生儿险，越早买选择越多', 'first', 'custom', NULL),
('学习孕早期知识', '了解1-12周胎儿发育过程和各阶段注意事项', 'first', 'custom', NULL),
('调整工作强度', '申请减少加班/重体力工作，避免有害工作环境', 'first', 'custom', NULL),
('停用化妆品', '停用含维A酸、水杨酸的护肤品及染发剂、指甲油', 'first', 'custom', NULL),
('确定预产期', '根据B超核对预产期，规划后续产检时间表', 'first', 'custom', NULL),

-- 打卡类
('服用叶酸', '每天按时服用叶酸400-800微克，至少到孕12周', 'first', 'checkin', NULL),
('记录身体变化', '每天记录早孕反应、体重、身体变化', 'first', 'checkin', NULL);

-- ========== 孕中期 (13-27周) ==========
INSERT INTO public.preset_tasks (title, description, stage, type, due_date) VALUES

-- 产检类
('中期唐氏筛查', '15-20周血清学筛查，评估染色体异常风险', 'second', 'prenatal', NULL),
('无创DNA检测（NIPT）', '12-22周，抽血检测胎儿染色体，准确率99%以上', 'second', 'prenatal', NULL),
('大排畸B超（四维彩超）', '20-24周系统超声检查，全面排查胎儿结构畸形', 'second', 'prenatal', NULL),
('糖耐量测试（OGTT）', '24-28周筛查妊娠期糖尿病，需要空腹8-12小时', 'second', 'prenatal', NULL),
('胎儿心脏彩超', '22-26周专项检查胎儿心脏结构和发育', 'second', 'prenatal', NULL),
('羊膜穿刺', '16-22周，适用于高龄(35+)/高风险者，确诊染色体问题', 'second', 'prenatal', NULL),

-- 日常类
('补钙', '每天摄入1000-1200mg钙，豆制品、绿叶菜、牛奶', 'second', 'daily', NULL),
('补铁', '每天摄入27mg铁，红肉、动物肝脏配合维C吸收', 'second', 'daily', NULL),
('补充DHA', '每天200-300mg DHA，促进胎儿大脑和视网膜发育', 'second', 'daily', NULL),
('均衡营养', '增加优质蛋白（鱼、蛋、奶），控制体重每周增长0.3-0.5kg', 'second', 'daily', NULL),
('感受胎动并记录', '孕18-20周后开始感受胎动，每天固定时间记录次数', 'second', 'daily', NULL),
('孕期运动', '散步、孕妇瑜伽、游泳，每次30分钟，增强盆底肌', 'second', 'daily', NULL),
('控制体重', '孕中期每周增重0.3-0.5kg，保持合理增长速度', 'second', 'daily', NULL),
('妊娠纹护理', '每天涂抹妊娠纹护理油，保持腹部皮肤弹性', 'second', 'daily', NULL),
('穿着舒适', '穿宽松孕妇装、低跟防滑鞋，避免紧身衣和高跟鞋', 'second', 'daily', NULL),

-- 自定义类
('参加孕妇课程', '参加医院/社区组织的孕教课，学习分娩和育儿知识', 'second', 'custom', NULL),
('布置婴儿房', '规划宝宝房间，选购婴儿床、衣柜、收纳柜', 'second', 'custom', NULL),
('拍孕妇照', '24-28周肚子大小适中，是拍孕妇照的最佳时机', 'second', 'custom', NULL),
('选购婴儿大件', '选购婴儿床、推车、安全座椅、尿布台等大件用品', 'second', 'custom', NULL),
('开始海淘婴儿用品', '趁着有时间选购性价比高的婴儿用品、衣物', 'second', 'custom', NULL),
('准备婴儿衣物', '根据季节准备新生儿和尚服、包被、口水巾', 'second', 'custom', NULL),
('学习分娩知识', '了解顺产/剖腹产的区别、产程、止痛方式', 'second', 'custom', NULL),

-- 打卡类
('服用钙片', '每天按时补钙，预防抽筋和骨质流失', 'second', 'checkin', NULL),
('服用铁剂', '每天按时补铁，预防妊娠期贫血', 'second', 'checkin', NULL),
('孕期瑜伽', '每天进行孕期瑜伽练习，保持身体柔韧性', 'second', 'checkin', NULL),
('涂抹妊娠纹油', '每天早晚涂抹腹部、乳房、大腿根部', 'second', 'checkin', NULL),
('数胎动', '每天固定时间数胎动，了解宝宝活动规律', 'second', 'checkin', NULL);

-- ========== 孕晚期 (28-40周) ==========
INSERT INTO public.preset_tasks (title, description, stage, type, due_date) VALUES

-- 产检类
('小排畸B超', '28-32周超声检查，确认胎儿发育情况、羊水量、胎盘位置', 'third', 'prenatal', NULL),
('胎心监护（NST）', '32周后每2周一次，36周后每周一次，监测胎心和宫缩', 'third', 'prenatal', NULL),
('B族链球菌检测', '36-37周筛查，阳性需产时抗生素预防新生儿感染', 'third', 'prenatal', NULL),
('骨盆测量', '评估骨盆大小和形态，判断是否适合顺产', 'third', 'prenatal', NULL),
('胎位检查', '28-32周确定胎位，臀位/横位需考虑纠正措施', 'third', 'prenatal', NULL),
('肝功能复查', '排查妊娠期肝内胆汁淤积症（ICP），影响胎儿安全', 'third', 'prenatal', NULL),
('心电图复查', '评估孕晚期心脏负荷，排查妊娠期心脏问题', 'third', 'prenatal', NULL),
('分娩方式评估', '37周后综合评估，确定顺产或剖腹产方案', 'third', 'prenatal', NULL),
('血常规复查', '确认无贫血，为分娩储备足够的血红蛋白', 'third', 'prenatal', NULL),

-- 日常类
('数胎动', '每天早中晚各数1小时胎动，3-5次/小时为正常', 'third', 'daily', NULL),
('血糖监控', '血糖偏高者每日三餐后测量血糖，控制在标准范围内', 'third', 'daily', NULL),
('体重监测', '每周固定时间称重，孕晚期每周增重0.3-0.5kg', 'third', 'daily', NULL),
('少盐饮食', '减少盐分摄入，减轻水肿和妊娠高血压风险', 'third', 'daily', NULL),
('少量多餐', '子宫增大压迫胃部，改为少量多餐减轻不适', 'third', 'daily', NULL),
('凯格尔运动', '每天做盆底肌训练，增强分娩力量，预防产后漏尿', 'third', 'daily', NULL),
('散步', '每天散步30-60分钟，有助于顺产和胎儿入盆', 'third', 'daily', NULL),
('左侧卧睡', '孕晚期建议左侧卧，改善胎盘血流，减轻水肿', 'third', 'daily', NULL),

-- 自定义类
('待产包准备', '打包入院物品：产褥垫、卫生巾、哺乳衣、吸管杯、纸尿裤、包被等', 'third', 'custom', NULL),
('学习拉玛泽呼吸法', '学习分娩减痛呼吸法，陪产时能帮助妈妈缓解疼痛', 'third', 'custom', NULL),
('确定陪产人', '确定谁进产房陪产，提前了解医院陪产政策', 'third', 'custom', NULL),
('办理入院手续', '提前到医院办理入院登记，准备好证件材料', 'third', 'custom', NULL),
('规划去医院的路线', '熟悉去医院的路线和交通情况，准备备用方案', 'third', 'custom', NULL),
('安排月子服务', '确定月嫂/月子中心/父母照顾，签订服务合同', 'third', 'custom', NULL),
('学习新生儿护理', '学习抱娃、换尿布、洗澡、拍嗝、脐带护理等技能', 'third', 'custom', NULL),
('安装婴儿安全座椅', '提前安装并调试婴儿安全座椅，出院必备', 'third', 'custom', NULL),
('准备月子餐清单', '根据产后恢复需求，规划第一周的月子餐', 'third', 'custom', NULL),
('整理家庭财务', '计算生育预算，安排好住院费和待产开支', 'third', 'custom', NULL),
('制定产后恢复计划', '了解产后恢复时间线，产后修复运动规划', 'third', 'custom', NULL),
('准爸爸产假申请', '向公司申请陪产假/护理假，了解相关政策', 'third', 'custom', NULL),
('准备育儿书籍', '准备育儿百科等参考书，随时查阅', 'third', 'custom', NULL),

-- 打卡类
('数胎动打卡', '每天早中晚各数1小时并记录胎动次数', 'third', 'checkin', NULL),
('服用叶酸', '每天按时服用叶酸，部分指南建议持续到哺乳期', 'third', 'checkin', NULL),
('凯格尔运动打卡', '每天做3组凯格尔运动，每组10-15次', 'third', 'checkin', NULL),
('散步打卡', '每天散步30分钟以上，保持适度活动', 'third', 'checkin', NULL),
('血糖测量', '每天三餐后测量血糖并记录', 'third', 'checkin', NULL);

-- ========== 产后阶段 ==========
INSERT INTO public.preset_tasks (title, description, stage, type, due_date) VALUES

-- 产检类
('新生儿首次体检', '出生后24小时内进行首次体格检查', 'postpartum', 'prenatal', NULL),
('新生儿听力筛查', '出生后48-72小时进行听力初筛，未通过42天复查', 'postpartum', 'prenatal', NULL),
('新生儿疾病筛查', '出生后72小时足底采血，筛查苯丙酮尿症、甲减等遗传病', 'postpartum', 'prenatal', NULL),
('卡介苗+乙肝疫苗', '出生后24小时内接种卡介苗和第一针乙肝疫苗', 'postpartum', 'prenatal', NULL),
('产后42天复查（妈妈）', '产后42天到医院复查子宫恢复、伤口愈合、盆底功能', 'postpartum', 'prenatal', NULL),
('产后42天复查（宝宝）', '宝宝42天体检，评估生长发育和神经发育', 'postpartum', 'prenatal', NULL),
('满月体检', '满月后全面体检，测量身高、体重、头围、听力复查', 'postpartum', 'prenatal', NULL),
('盆底肌功能评估', '产后42天后评估盆底肌恢复情况，必要时进行康复治疗', 'postpartum', 'prenatal', NULL),
('产后腹部B超', '检查子宫复旧情况，确认恶露排净', 'postpartum', 'prenatal', NULL),

-- 日常类
('产后伤口护理', '顺产侧切/剖腹产伤口每日消毒护理，观察有无感染', 'postpartum', 'daily', NULL),
('母乳喂养', '按需哺乳，每2-3小时一次，注意正确衔乳姿势', 'postpartum', 'daily', NULL),
('记录喂养和排便', '记录每次吃奶时间、量和大小便次数，判断摄入是否充足', 'postpartum', 'daily', NULL),
('产后情绪管理', '关注情绪变化，预防产后抑郁，必要时寻求心理帮助', 'postpartum', 'daily', NULL),
('恶露观察', '观察恶露颜色、量、气味变化，异常及时就医', 'postpartum', 'daily', NULL),
('产后修复运动', '从温和的腹式呼吸、凯格尔运动开始，逐步恢复', 'postpartum', 'daily', NULL),
('保证休息', '宝宝睡的时候妈妈也睡，尽量保证充足休息', 'postpartum', 'daily', NULL),

-- 自定义类
('办理出生医学证明', '医院/线上办理出生医学证明，后续上户口需要', 'postpartum', 'custom', NULL),
('给宝宝上户口', '携带出生证明、父母身份证/户口本到派出所落户', 'postpartum', 'custom', NULL),
('办理新生儿医保', '出生后90天内办理，可追溯报销出生后的医疗费用', 'postpartum', 'custom', NULL),
('学习婴儿抚触', '学习婴儿抚触手法，促进宝宝神经发育和亲子关系', 'postpartum', 'custom', NULL),
('学习拍嗝和排气操', '掌握正确拍嗝手法和排气操，缓解宝宝肠胀气', 'postpartum', 'custom', NULL),
('预约42天检查', '提前预约妈妈和宝宝42天体检', 'postpartum', 'custom', NULL),
('整理产后康复计划', '制定科学的产后康复计划，包括盆底肌、腹直肌修复', 'postpartum', 'custom', NULL),
('申请生育津贴', '准备材料申请生育津贴和报销产检、住院费用', 'postpartum', 'custom', NULL),
('安排满月酒', '如有需要，规划满月酒/百日宴的时间和筹备', 'postpartum', 'custom', NULL),

-- 打卡类
('产后凯格尔运动', '每天坚持凯格尔运动，促进盆底肌恢复', 'postpartum', 'checkin', NULL),
('记录宝宝作息', '每天记录宝宝吃奶、睡觉、换尿布的时间', 'postpartum', 'checkin', NULL),
('产后心情记录', '每天记录情绪变化，关注产后情绪健康', 'postpartum', 'checkin', NULL);

-- 3. RLS策略（可选）
ALTER TABLE public.preset_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "允许所有人读取预设任务" ON preset_tasks FOR SELECT USING (true);
CREATE POLICY "仅服务端可写入预设任务" ON preset_tasks FOR INSERT WITH CHECK (false);
