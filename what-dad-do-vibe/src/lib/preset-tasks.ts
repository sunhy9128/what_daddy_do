/**
 * 预设任务数据 - 按孕期阶段分类
 *
 * 来源：从 src/context/AppContext.tsx 提取（原内联在 AppProvider 内）。
 * 用作新用户首次登录时批量注入的种子任务，按 (user_id, title) 去重，跨宝宝只插入一次。
 *
 * 注意：此数据与 supabase/migrations/preset_tasks.sql 内容不完全一致——
 * SQL 文件包含更完整的分类（custom 类型、weekly checkin 等），DB 版本优先。
 * 这里的数据是"代码侧兜底"，用于兼容 DB seed 尚未跑过的环境。
 */

export type PregnancyStageOrPostpartum = 'preconception' | 'first' | 'second' | 'third' | 'postpartum';

export interface PresetTask {
  title: string;
  description: string;
  stage: PregnancyStageOrPostpartum;
  type: 'prenatal' | 'daily' | 'checkin';
  due_date?: string;
}

export const presetTasks: PresetTask[] = [
  { title: '孕前体检', description: '全面体检，包括血常规、尿常规、肝肾功能、血糖、血脂', stage: 'preconception', type: 'prenatal' },
  { title: '口腔检查', description: '孕期牙齿问题处理受限，提前完成洗牙、补牙、拔智齿', stage: 'preconception', type: 'prenatal' },
  { title: '遗传咨询', description: '如有家族遗传病史，提前进行遗传咨询和筛查', stage: 'preconception', type: 'prenatal' },
  { title: '疫苗抗体检查', description: '确认风疹、乙肝、水痘抗体，不足则补种', stage: 'preconception', type: 'prenatal' },
  { title: '补充叶酸', description: '每天400-800微克，预防胎儿神经管畸形，夫妻同补', stage: 'preconception', type: 'daily' },
  { title: '作息调整', description: '保持规律作息，每晚7-8小时充足睡眠', stage: 'preconception', type: 'daily' },
  { title: '规律运动', description: '每周150分钟中等强度运动，如快走、游泳、慢跑', stage: 'preconception', type: 'daily' },
  { title: '戒酒戒烟', description: '提前3个月戒酒戒烟，二手烟也要避免', stage: 'preconception', type: 'daily' },
  { title: '学习排卵期知识', description: '掌握排卵期计算方法，使用排卵试纸提高受孕率', stage: 'preconception', type: 'daily' },
  { title: '服用叶酸', description: '每天按时服用叶酸，夫妻同补效果更好', stage: 'preconception', type: 'checkin' },
  { title: '测量基础体温', description: '每天早晨测量基础体温，记录排卵周期', stage: 'preconception', type: 'checkin' },
  { title: '首次产检', description: '确认怀孕，建立孕期档案，查肝肾功能、血常规', stage: 'first', type: 'prenatal' },
  { title: 'NT检查', description: '胎儿颈项透明层厚度检查，早期筛查唐氏综合征', stage: 'first', type: 'prenatal' },
  { title: '建档', description: '到社区医院或产检医院建立《母子健康手册》', stage: 'first', type: 'prenatal' },
  { title: '早期唐氏筛查', description: '结合NT值+血清学指标，筛查21/18三体综合征', stage: 'first', type: 'prenatal' },
  { title: '甲状腺功能检查', description: '甲减影响胎儿智力发育，早查早干预', stage: 'first', type: 'prenatal' },
  { title: '应对早孕反应', description: '少食多餐，吃苏打饼干缓解孕吐，避免油腻刺激食物', stage: 'first', type: 'daily' },
  { title: '清淡饮食', description: '以易消化的粥、面、蒸菜为主，保证基本营养摄入', stage: 'first', type: 'daily' },
  { title: '选择生产医院', description: '考察家附近的产科医院，了解床位、技术、距离', stage: 'first', type: 'daily' },
  { title: '办理生育登记', description: '到社区办理生育服务登记，后续报销产检费用', stage: 'first', type: 'daily' },
  { title: '学习孕早期知识', description: '了解1-12周胎儿发育过程和各阶段注意事项', stage: 'first', type: 'daily' },
  { title: '服用叶酸', description: '每天按时服用叶酸，至少到孕12周', stage: 'first', type: 'checkin' },
  { title: '记录身体变化', description: '每天记录早孕反应、体重变化', stage: 'first', type: 'checkin' },
  { title: '无创DNA检测', description: '12-22周抽血检测胎儿染色体，准确率99%以上', stage: 'second', type: 'prenatal' },
  { title: '大排畸B超', description: '20-24周系统超声检查，全面排查胎儿结构畸形', stage: 'second', type: 'prenatal', due_date: '2026-08-15' },
  { title: '糖耐量测试', description: '24-28周筛查妊娠期糖尿病，需要空腹8-12小时', stage: 'second', type: 'prenatal', due_date: '2026-09-01' },
  { title: '胎儿心脏彩超', description: '22-26周专项检查胎儿心脏结构和发育', stage: 'second', type: 'prenatal' },
  { title: '补钙', description: '每天摄入1000-1200mg钙，豆制品、绿叶菜、牛奶', stage: 'second', type: 'daily' },
  { title: '补铁', description: '每天摄入27mg铁，红肉、动物肝脏配合维C', stage: 'second', type: 'daily' },
  { title: '补充DHA', description: '每天200-300mg，促进胎儿大脑和视网膜发育', stage: 'second', type: 'daily' },
  { title: '孕期运动', description: '散步、孕妇瑜伽、游泳，增强盆底肌', stage: 'second', type: 'daily' },
  { title: '妊娠纹护理', description: '每天涂抹护理油，保持腹部皮肤弹性', stage: 'second', type: 'daily' },
  { title: '参加孕妇课程', description: '参加孕教课，学习分娩和育儿知识', stage: 'second', type: 'daily' },
  { title: '布置婴儿房', description: '规划宝宝房间，选购婴儿床、衣柜等', stage: 'second', type: 'daily' },
  { title: '拍孕妇照', description: '24-28周肚子大小适中，是拍摄最佳时机', stage: 'second', type: 'daily' },
  { title: '孕期瑜伽', description: '每天进行孕期瑜伽练习', stage: 'second', type: 'checkin' },
  { title: '服用钙片', description: '每天按时补钙，预防抽筋', stage: 'second', type: 'checkin' },
  { title: '小排畸B超', description: '28-32周超声确认胎儿发育、羊水量、胎盘位置', stage: 'third', type: 'prenatal', due_date: '2026-10-15' },
  { title: '胎心监护', description: '32周后每2周一次，36周后每周一次', stage: 'third', type: 'prenatal' },
  { title: 'B族链球菌检测', description: '36-37周筛查，预防新生儿感染', stage: 'third', type: 'prenatal' },
  { title: '分娩方式评估', description: '37周后综合评估，确定顺产或剖腹产方案', stage: 'third', type: 'prenatal' },
  { title: '数胎动', description: '每天早中晚各数1小时，3-5次/小时为正常', stage: 'third', type: 'daily' },
  { title: '血糖监控', description: '每日三餐后测量血糖', stage: 'third', type: 'daily' },
  { title: '体重监测', description: '每周固定时间称重', stage: 'third', type: 'daily' },
  { title: '凯格尔运动', description: '每天做盆底肌训练，增强分娩力量', stage: 'third', type: 'daily' },
  { title: '待产包准备', description: '打包入院物品：产褥垫、卫生巾、哺乳衣、纸尿裤、包被等', stage: 'third', type: 'daily' },
  { title: '学习拉玛泽呼吸法', description: '学习分娩减痛呼吸法，陪产时帮助妈妈', stage: 'third', type: 'daily' },
  { title: '安排月子服务', description: '确定月嫂/月子中心/父母照顾', stage: 'third', type: 'daily' },
  { title: '学习新生儿护理', description: '学习抱娃、换尿布、洗澡、拍嗝、脐带护理', stage: 'third', type: 'daily' },
  { title: '安装婴儿安全座椅', description: '提前安装并调试，出院必备', stage: 'third', type: 'daily' },
  { title: '准爸爸产假申请', description: '向公司申请陪产假/护理假', stage: 'third', type: 'daily' },
  { title: '数胎动打卡', description: '每天早中晚各数1小时并记录', stage: 'third', type: 'checkin' },
  { title: '散步打卡', description: '每天散步30分钟以上，保持适度活动', stage: 'third', type: 'checkin' },
  { title: '凯格尔运动打卡', description: '每天做3组凯格尔运动，每组10-15次', stage: 'third', type: 'checkin' },
  { title: '新生儿首次体检', description: '出生后24小时内进行首次体格检查', stage: 'postpartum', type: 'prenatal' },
  { title: '新生儿听力筛查', description: '出生后48-72小时听力初筛', stage: 'postpartum', type: 'prenatal' },
  { title: '新生儿疾病筛查', description: '出生后72小时足底采血，筛查遗传代谢病', stage: 'postpartum', type: 'prenatal' },
  { title: '卡介苗+乙肝疫苗', description: '出生后24小时内接种', stage: 'postpartum', type: 'prenatal' },
  { title: '产后42天复查（妈妈）', description: '复查子宫恢复、伤口愈合、盆底功能', stage: 'postpartum', type: 'prenatal' },
  { title: '产后42天复查（宝宝）', description: '评估生长发育和神经发育', stage: 'postpartum', type: 'prenatal' },
  { title: '产后伤口护理', description: '伤口每日消毒护理，观察有无感染', stage: 'postpartum', type: 'daily' },
  { title: '母乳喂养', description: '按需哺乳，每2-3小时一次', stage: 'postpartum', type: 'daily' },
  { title: '产后情绪管理', description: '关注情绪变化，预防产后抑郁', stage: 'postpartum', type: 'daily' },
  { title: '产后修复运动', description: '从温和的腹式呼吸、凯格尔运动开始', stage: 'postpartum', type: 'daily' },
  { title: '办理出生医学证明', description: '医院/线上办理，后续上户口需要', stage: 'postpartum', type: 'daily' },
  { title: '给宝宝上户口', description: '携带出生证明到派出所落户', stage: 'postpartum', type: 'daily' },
  { title: '办理新生儿医保', description: '出生后90天内办理，可追溯报销', stage: 'postpartum', type: 'daily' },
  { title: '申请生育津贴', description: '准备材料申请生育津贴和报销产检费用', stage: 'postpartum', type: 'daily' },
  { title: '产后凯格尔运动', description: '每天坚持凯格尔运动，促进盆底恢复', stage: 'postpartum', type: 'checkin' },
  { title: '记录宝宝作息', description: '每天记录吃奶、睡觉、换尿布', stage: 'postpartum', type: 'checkin' },
];