// 孕期周数 → 水果/食物大小对比
// 来源：国家孕婴网、What to Expect、BabyCenter 综合整理
import { Ionicons } from '@expo/vector-icons';

export type BumpIconName = keyof typeof Ionicons.glyphMap;

export interface BumpSizeEntry {
  week: number;
  fruit: string;
  /** Ionicons 图标名，P1 #7 修复：每种水果使用专属图标以增强可视化区分 */
  iconName: BumpIconName;
  lengthCm: string;
  weightG: string;
  description: string;
}

/**
 * Ionicons 水果/食物图标映射
 * 选用 nutrition / flower 类别，避免全表使用同一图标导致可视化失去意义
 */
const ICONS: Record<string, BumpIconName> = {
  // 种子/小果实
  SEED:        'leaf-outline',      // 罂粟籽、芝麻
  BERRY:       'nutrition-outline',  // 蓝莓、葡萄柚
  CHERRY:      'close-circle-outline', // 樱桃
  STONE:       'ellipse-outline',    // 橄榄、红枣、李子
  LEMON:       'sunny-outline',      // 柠檬（椭圆形）
  MANGO:       'heart-outline',      // 芒果（心形）
  AVOCADO:     'ellipse-outline',    // 牛油果（梨形）
  BANANA:      'moon-outline',       // 香蕉（弧形）
  POMEGRANATE: 'git-commit-outline', // 石榴（多籽特征）
  COCONUT:     'ellipse-outline',    // 椰子
  GRAPEFRUIT:  'nutrition-outline',  // 葡萄柚
  CORN:        'barcode-outline',   // 玉米（条形）
  CAULIFLOWER: 'flower-outline',    // 花椰菜
  LETTUCE:     'leaf-outline',       // 生菜（叶形）
  EGGPLANT:    'ellipse-outline',    // 茄子
  PUMPKIN:     'bulb-outline',       // 南瓜、哈密瓜（圆形）
  CABBAGE:     'flower-outline',    // 白菜
  MELON:       'ellipse-outline',    // 蜜瓜、西瓜
  PAPAYA:      'heart-outline',      // 木瓜
  WINTERMELON: 'ellipse-outline',    // 冬瓜
  PINEAPPLE:   'ribbon-outline',    // 菠萝
};

export const BUMP_SIZE_DATA: BumpSizeEntry[] = [
  { week: 4,  fruit: '罂粟籽',   iconName: ICONS.SEED,       lengthCm: '0.1',  weightG: '<1',    description: '胚胎着床，开始分泌HCG' },
  { week: 5,  fruit: '芝麻',     iconName: ICONS.SEED,       lengthCm: '0.2',  weightG: '<1',    description: '心脏开始跳动，神经管形成' },
  { week: 6,  fruit: '绿豆',     iconName: ICONS.BERRY,      lengthCm: '0.4',  weightG: '<1',    description: '头部、四肢雏形出现' },
  { week: 7,  fruit: '蓝莓',     iconName: ICONS.BERRY,      lengthCm: '1.0',  weightG: '<1',    description: '大脑快速发育，面部器官形成' },
  { week: 8,  fruit: '樱桃',     iconName: ICONS.CHERRY,     lengthCm: '1.6',  weightG: '1',     description: '手指脚趾分化，开始轻微活动' },
  { week: 9,  fruit: '橄榄',     iconName: ICONS.STONE,      lengthCm: '2.3',  weightG: '2',     description: '胎芽变胎儿，主要器官已形成' },
  { week: 10, fruit: '红枣',     iconName: ICONS.STONE,      lengthCm: '3.1',  weightG: '4',     description: '四肢可以弯曲，脐带清晰可见' },
  { week: 11, fruit: '无花果',   iconName: ICONS.LEMON,      lengthCm: '4.1',  weightG: '7',     description: '头部占身体一半，生殖器开始发育' },
  { week: 12, fruit: '柠檬',     iconName: ICONS.LEMON,      lengthCm: '5.4',  weightG: '14',    description: 'NT检查窗口期，胎儿开始吞咽羊水' },
  { week: 13, fruit: '豌豆荚',   iconName: ICONS.BERRY,      lengthCm: '6.7',  weightG: '23',    description: '声带形成，开始产生尿液' },
  { week: 14, fruit: '柠檬',     iconName: ICONS.LEMON,      lengthCm: '8.0',  weightG: '43',    description: '长出胎毛，开始有吮吸反射' },
  { week: 15, fruit: '橙子',     iconName: ICONS.MELON,      lengthCm: '9.3',  weightG: '70',    description: '骨骼变硬，妈妈可能感受到胎动' },
  { week: 16, fruit: '牛油果',   iconName: ICONS.AVOCADO,    lengthCm: '10.8', weightG: '100',   description: '头部竖直，耳朵位置固定，中期唐筛' },
  { week: 17, fruit: '洋葱',     iconName: ICONS.CORN,       lengthCm: '11.8', weightG: '140',   description: '脂肪开始囤积，脐带变粗变强' },
  { week: 18, fruit: '甜椒',     iconName: ICONS.PUMPKIN,   lengthCm: '13.0', weightG: '190',   description: '胎动更明显，开始感知外界声音' },
  { week: 19, fruit: '芒果',     iconName: ICONS.MANGO,      lengthCm: '14.2', weightG: '240',   description: '胎脂覆盖保护皮肤，女宝宝卵巢形成' },
  { week: 20, fruit: '香蕉',     iconName: ICONS.BANANA,     lengthCm: '15.5', weightG: '300',   description: '大排畸B超，可以清楚看到器官结构' },
  { week: 21, fruit: '石榴',     iconName: ICONS.POMEGRANATE,lengthCm: '16.8', weightG: '360',   description: '味蕾形成，能尝到羊水的味道' },
  { week: 22, fruit: '椰子',     iconName: ICONS.COCONUT,    lengthCm: '18.1', weightG: '430',   description: '眉毛和睫毛长出，皮肤变薄变红' },
  { week: 23, fruit: '葡萄柚',   iconName: ICONS.GRAPEFRUIT, lengthCm: '19.4', weightG: '500',   description: '肺部血管发育，为呼吸做准备' },
  { week: 24, fruit: '玉米',     iconName: ICONS.CORN,       lengthCm: '20.7', weightG: '600',   description: '糖耐量测试，宝宝听觉系统成熟' },
  { week: 25, fruit: '花椰菜',   iconName: ICONS.CAULIFLOWER,lengthCm: '22.0', weightG: '660',   description: '开始有睡眠-清醒周期' },
  { week: 26, fruit: '生菜',     iconName: ICONS.LETTUCE,    lengthCm: '23.3', weightG: '760',   description: '眼睛可以睁开，会吸吮手指' },
  { week: 27, fruit: '花椰菜',   iconName: ICONS.CAULIFLOWER,lengthCm: '24.6', weightG: '875',   description: '大脑发育高峰期，对声音有反应' },
  { week: 28, fruit: '茄子',     iconName: ICONS.EGGPLANT,   lengthCm: '26.0', weightG: '1000',  description: '小排畸B超，宝宝能眨眼' },
  { week: 29, fruit: '南瓜',     iconName: ICONS.PUMPKIN,    lengthCm: '27.2', weightG: '1150',  description: '肌肉和肺部继续发育，胎位逐渐固定' },
  { week: 30, fruit: '白菜',     iconName: ICONS.CABBAGE,    lengthCm: '28.5', weightG: '1310',  description: '骨髓开始造血，头发变密' },
  { week: 31, fruit: '椰子',     iconName: ICONS.COCONUT,    lengthCm: '29.8', weightG: '1500',  description: '体脂率上升，可以协调地吮吸' },
  { week: 32, fruit: '哈密瓜',   iconName: ICONS.PUMPKIN,    lengthCm: '31.0', weightG: '1700',  description: '胎心监护开始，宝宝可能转为头位' },
  { week: 33, fruit: '菠萝',     iconName: ICONS.PINEAPPLE,  lengthCm: '32.3', weightG: '1900',  description: '指甲长到指尖，皮肤变粉嫩' },
  { week: 34, fruit: '南瓜',     iconName: ICONS.PUMPKIN,    lengthCm: '33.5', weightG: '2100',  description: 'B族链球菌检测，免疫系统加强' },
  { week: 35, fruit: '蜜瓜',     iconName: ICONS.MELON,      lengthCm: '34.8', weightG: '2400',  description: '肾脏发育完成，排泄功能完善' },
  { week: 36, fruit: '西瓜',     iconName: ICONS.MELON,      lengthCm: '36.0', weightG: '2600',  description: '分娩方式评估，肺部基本成熟' },
  { week: 37, fruit: '西瓜',     iconName: ICONS.MELON,      lengthCm: '37.2', weightG: '2900',  description: '足月！随时可能发动' },
  { week: 38, fruit: '小冬瓜',   iconName: ICONS.WINTERMELON,lengthCm: '38.4', weightG: '3100',  description: '胎脂开始脱落，头入盆' },
  { week: 39, fruit: '西瓜',     iconName: ICONS.MELON,      lengthCm: '39.6', weightG: '3300',  description: '等待发动，宝宝继续囤积脂肪' },
  { week: 40, fruit: '小南瓜',   iconName: ICONS.PUMPKIN,    lengthCm: '40.8', weightG: '3500',  description: '预产期！准备好迎接宝宝了' },
];

export function getBumpSizeForWeek(week: number): BumpSizeEntry | null {
  // 找最接近的周数
  return BUMP_SIZE_DATA.reduce((best, curr) => {
    if (!best) return curr;
    return Math.abs(curr.week - week) < Math.abs(best.week - week) ? curr : best;
  }, null as BumpSizeEntry | null);
}
