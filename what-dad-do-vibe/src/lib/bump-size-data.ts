// 孕期周数 → 水果/食物大小对比
// 来源：国家孕婴网、What to Expect、BabyCenter 综合整理

export interface BumpSizeEntry {
  week: number;
  fruit: string;
  emoji: string;
  lengthCm: string;
  weightG: string;
  description: string;
}

export const BUMP_SIZE_DATA: BumpSizeEntry[] = [
  { week: 4,  fruit: '罂粟籽',   emoji: '🌱', lengthCm: '0.1',  weightG: '<1',    description: '胚胎着床，开始分泌HCG' },
  { week: 5,  fruit: '芝麻',     emoji: '🟤', lengthCm: '0.2',  weightG: '<1',    description: '心脏开始跳动，神经管形成' },
  { week: 6,  fruit: '绿豆',     emoji: '🫘', lengthCm: '0.4',  weightG: '<1',    description: '头部、四肢雏形出现' },
  { week: 7,  fruit: '蓝莓',     emoji: '🫐', lengthCm: '1.0',  weightG: '<1',    description: '大脑快速发育，面部器官形成' },
  { week: 8,  fruit: '樱桃',     emoji: '🍒', lengthCm: '1.6',  weightG: '1',     description: '手指脚趾分化，开始轻微活动' },
  { week: 9,  fruit: '橄榄',     emoji: '🫒', lengthCm: '2.3',  weightG: '2',     description: '胎芽变胎儿，主要器官已形成' },
  { week: 10, fruit: '红枣',     emoji: '🍒', lengthCm: '3.1',  weightG: '4',     description: '四肢可以弯曲，脐带清晰可见' },
  { week: 11, fruit: '无花果',   emoji: '🫒', lengthCm: '4.1',  weightG: '7',     description: '头部占身体一半，生殖器开始发育' },
  { week: 12, fruit: '柠檬',     emoji: '🍋', lengthCm: '5.4',  weightG: '14',    description: 'NT检查窗口期，胎儿开始吞咽羊水' },
  { week: 13, fruit: '豌豆荚',   emoji: '🌿', lengthCm: '6.7',  weightG: '23',    description: '声带形成，开始产生尿液' },
  { week: 14, fruit: '柠檬',     emoji: '🍋', lengthCm: '8.0',  weightG: '43',    description: '长出胎毛，开始有吮吸反射' },
  { week: 15, fruit: '橙子',     emoji: '🍊', lengthCm: '9.3',  weightG: '70',    description: '骨骼变硬，妈妈可能感受到胎动' },
  { week: 16, fruit: '牛油果',   emoji: '🥑', lengthCm: '10.8', weightG: '100',   description: '头部竖直，耳朵位置固定，中期唐筛' },
  { week: 17, fruit: '洋葱',     emoji: '🧅', lengthCm: '11.8', weightG: '140',   description: '脂肪开始囤积，脐带变粗变强' },
  { week: 18, fruit: '甜椒',     emoji: '🫑', lengthCm: '13.0', weightG: '190',   description: '胎动更明显，开始感知外界声音' },
  { week: 19, fruit: '芒果',     emoji: '🥭', lengthCm: '14.2', weightG: '240',   description: '胎脂覆盖保护皮肤，女宝宝卵巢形成' },
  { week: 20, fruit: '香蕉',     emoji: '🍌', lengthCm: '15.5', weightG: '300',   description: '大排畸B超，可以清楚看到器官结构' },
  { week: 21, fruit: '石榴',     emoji: '🍎', lengthCm: '16.8', weightG: '360',   description: '味蕾形成，能尝到羊水的味道' },
  { week: 22, fruit: '椰子',     emoji: '🥥', lengthCm: '18.1', weightG: '430',   description: '眉毛和睫毛长出，皮肤变薄变红' },
  { week: 23, fruit: '葡萄柚',   emoji: '🍈', lengthCm: '19.4', weightG: '500',   description: '肺部血管发育，为呼吸做准备' },
  { week: 24, fruit: '玉米',     emoji: '🌽', lengthCm: '20.7', weightG: '600',   description: '糖耐量测试，宝宝听觉系统成熟' },
  { week: 25, fruit: '花椰菜',   emoji: '🥦', lengthCm: '22.0', weightG: '660',   description: '开始有睡眠-清醒周期' },
  { week: 26, fruit: '生菜',     emoji: '🥬', lengthCm: '23.3', weightG: '760',   description: '眼睛可以睁开，会吸吮手指' },
  { week: 27, fruit: '花椰菜',   emoji: '🥦', lengthCm: '24.6', weightG: '875',   description: '大脑发育高峰期，对声音有反应' },
  { week: 28, fruit: '茄子',     emoji: '🍆', lengthCm: '26.0', weightG: '1000',  description: '小排畸B超，宝宝能眨眼' },
  { week: 29, fruit: '南瓜',     emoji: '🎃', lengthCm: '27.2', weightG: '1150',  description: '肌肉和肺部继续发育，胎位逐渐固定' },
  { week: 30, fruit: '白菜',     emoji: '🥬', lengthCm: '28.5', weightG: '1310',  description: '骨髓开始造血，头发变密' },
  { week: 31, fruit: '椰子',     emoji: '🥥', lengthCm: '29.8', weightG: '1500',  description: '体脂率上升，可以协调地吮吸' },
  { week: 32, fruit: '哈密瓜',   emoji: '🍈', lengthCm: '31.0', weightG: '1700',  description: '胎心监护开始，宝宝可能转为头位' },
  { week: 33, fruit: '菠萝',     emoji: '🍍', lengthCm: '32.3', weightG: '1900',  description: '指甲长到指尖，皮肤变粉嫩' },
  { week: 34, fruit: '南瓜',     emoji: '🎃', lengthCm: '33.5', weightG: '2100',  description: 'B族链球菌检测，免疫系统加强' },
  { week: 35, fruit: '蜜瓜',     emoji: '🍈', lengthCm: '34.8', weightG: '2400',  description: '肾脏发育完成，排泄功能完善' },
  { week: 36, fruit: '西瓜',     emoji: '🍉', lengthCm: '36.0', weightG: '2600',  description: '分娩方式评估，肺部基本成熟' },
  { week: 37, fruit: '西瓜',     emoji: '🍉', lengthCm: '37.2', weightG: '2900',  description: '足月！随时可能发动' },
  { week: 38, fruit: '小冬瓜',   emoji: '🥒', lengthCm: '38.4', weightG: '3100',  description: '胎脂开始脱落，头入盆' },
  { week: 39, fruit: '西瓜',     emoji: '🍉', lengthCm: '39.6', weightG: '3300',  description: '等待发动，宝宝继续囤积脂肪' },
  { week: 40, fruit: '小南瓜',   emoji: '🎃', lengthCm: '40.8', weightG: '3500',  description: '预产期！准备好迎接宝宝了' },
];

export function getBumpSizeForWeek(week: number): BumpSizeEntry | null {
  // 找最接近的周数
  return BUMP_SIZE_DATA.reduce((best, curr) => {
    if (!best) return curr;
    return Math.abs(curr.week - week) < Math.abs(best.week - week) ? curr : best;
  }, null as BumpSizeEntry | null);
}
