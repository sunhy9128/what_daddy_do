import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACTIVE_TOOLS: (userId: string) => `user_tools_${userId}`,
  FEEDING_RECORDS: (userId: string) => `feeding_records_${userId}`,
};

// 工具实例
export interface StoredToolInstance {
  instanceId: string;
  toolId: string;
}

export async function loadActiveTools(userId: string): Promise<StoredToolInstance[]> {
  try {
    const json = await AsyncStorage.getItem(KEYS.ACTIVE_TOOLS(userId));
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function saveActiveTools(userId: string, tools: StoredToolInstance[]): Promise<void> {
  try { await AsyncStorage.setItem(KEYS.ACTIVE_TOOLS(userId), JSON.stringify(tools)); } catch (e) { console.error('saveActiveTools failed', e); }
}

// 身高体重记录
export interface GrowthRecordData {
  month: number;
  height: number;
  weight: number;
}

export async function loadGrowthRecords(userId: string): Promise<GrowthRecordData[]> {
  try {
    const json = await AsyncStorage.getItem(`growth_records_${userId}`);
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

export async function saveGrowthRecords(userId: string, records: GrowthRecordData[]): Promise<void> {
  try { await AsyncStorage.setItem(`growth_records_${userId}`, JSON.stringify(records)); } catch (e) { console.error('saveGrowthRecords failed', e); }
}

// 喂奶记录
export interface FeedingRecordData {
  id: number;
  time: string;
  date: string; // YYYY-MM-DD
}

export async function loadFeedingRecords(userId: string): Promise<FeedingRecordData[]> {
  try {
    const json = await AsyncStorage.getItem(KEYS.FEEDING_RECORDS(userId));
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function saveFeedingRecords(userId: string, records: FeedingRecordData[]): Promise<void> {
  try { await AsyncStorage.setItem(KEYS.FEEDING_RECORDS(userId), JSON.stringify(records)); } catch (e) { console.error('saveFeedingRecords failed', e); }
}

// 产检时间轴记录
export interface PrenatalRecord {
  week: number;
  completed: boolean;
  completedAt?: string;
}

export async function loadPrenatalRecords(userId: string): Promise<PrenatalRecord[]> {
  try {
    const json = await AsyncStorage.getItem(`prenatal_records_${userId}`);
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

export async function savePrenatalRecords(userId: string, records: PrenatalRecord[]): Promise<void> {
  try { await AsyncStorage.setItem(`prenatal_records_${userId}`, JSON.stringify(records)); } catch (e) { console.error('savePrenatalRecords failed', e); }
}

// 宫缩计时记录
export interface ContractionRecord {
  id: number;
  startTime: string;  // ISO string
  endTime: string;    // ISO string
  duration: number;   // seconds
  interval: number;   // seconds since previous start
  date: string;       // YYYY-MM-DD
}

export async function loadContractionRecords(userId: string): Promise<ContractionRecord[]> {
  try {
    const json = await AsyncStorage.getItem(`contraction_records_${userId}`);
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

export async function saveContractionRecords(userId: string, records: ContractionRecord[]): Promise<void> {
  try { await AsyncStorage.setItem(`contraction_records_${userId}`, JSON.stringify(records)); } catch (e) { console.error('saveContractionRecords failed', e); }
}

// 胎动计数记录
export interface KickRecordData {
  date: string;       // YYYY-MM-DD
  count: number;
  sessions: { startTime: string; endTime?: string; count: number }[];
}

export async function loadKickRecords(userId: string): Promise<KickRecordData[]> {
  try {
    const json = await AsyncStorage.getItem(`kick_records_${userId}`);
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

export async function saveKickRecords(userId: string, records: KickRecordData[]): Promise<void> {
  try { await AsyncStorage.setItem(`kick_records_${userId}`, JSON.stringify(records)); } catch (e) { console.error('saveKickRecords failed', e); }
}

// 妈妈体重记录（存储绝对体重，增重在展示时计算）
export interface MomWeightRecord {
  week: number;    // 孕周 0-42
  weight: number;  // 当前体重 kg（绝对值）
}

export interface MomWeightConfig {
  prePregnancyWeight: number;  // 孕前体重 kg
  height: number;              // 身高 cm（用于计算 BMI）
}

export async function loadMomWeightRecords(userId: string): Promise<MomWeightRecord[]> {
  try {
    const json = await AsyncStorage.getItem(`mom_weight_records_${userId}`);
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

export async function saveMomWeightRecords(userId: string, records: MomWeightRecord[]): Promise<void> {
  try { await AsyncStorage.setItem(`mom_weight_records_${userId}`, JSON.stringify(records)); } catch (e) { console.error('saveMomWeightRecords failed', e); }
}

export async function loadMomWeightConfig(userId: string): Promise<MomWeightConfig | null> {
  try {
    const json = await AsyncStorage.getItem(`mom_weight_config_${userId}`);
    return json ? JSON.parse(json) : null;
  } catch { return null; }
}

export async function saveMomWeightConfig(userId: string, config: MomWeightConfig): Promise<void> {
  try { await AsyncStorage.setItem(`mom_weight_config_${userId}`, JSON.stringify(config)); } catch (e) { console.error('saveMomWeightConfig failed', e); }
}

// 爸爸情绪自评记录
export interface MoodRecord {
  id: string;
  date: string;       // YYYY-MM-DD
  score: number;      // 0-30
  answers: number[];  // 每题得分 0-3, 共10题
  notes?: string;     // 备注
}

export interface MoodConfig {
  name: string;       // 用户昵称/称呼
  createdAt: string;  // ISO date
}

export async function loadMoodRecords(userId: string): Promise<MoodRecord[]> {
  try {
    const json = await AsyncStorage.getItem(`mood_records_${userId}`);
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

export async function saveMoodRecords(userId: string, records: MoodRecord[]): Promise<void> {
  try { await AsyncStorage.setItem(`mood_records_${userId}`, JSON.stringify(records)); } catch (e) { console.error('saveMoodRecords failed', e); }
}

export async function loadMoodConfig(userId: string): Promise<MoodConfig | null> {
  try {
    const json = await AsyncStorage.getItem(`mood_config_${userId}`);
    return json ? JSON.parse(json) : null;
  } catch { return null; }
}

export async function saveMoodConfig(userId: string, config: MoodConfig): Promise<void> {
  try { await AsyncStorage.setItem(`mood_config_${userId}`, JSON.stringify(config)); } catch (e) { console.error('saveMoodConfig failed', e); }
}

// ─── 产后护理日志（尿布/喂奶/俯趴） ───
export interface DiaperRecord {
  id: string;
  timestamp: string;      // ISO string
  date: string;           // YYYY-MM-DD
  type: 'wet' | 'dirty' | 'both';
  color?: 'yellow' | 'green' | 'brown' | 'black' | 'red' | 'white';
  consistency?: 'normal' | 'watery' | 'hard' | 'mucus';
  notes?: string;
}

export interface FeedingRecord {
  id: string;
  timestamp: string;      // ISO string
  date: string;           // YYYY-MM-DD
  type: 'breast_left' | 'breast_right' | 'breast_both' | 'formula' | 'mixed';
  amountMl?: number;      // for formula/mixed
  durationSec?: number;   // for breastfeeding
  notes?: string;
}

export interface TummyTimeRecord {
  id: string;
  timestamp: string;      // ISO string (start time)
  date: string;           // YYYY-MM-DD
  durationSec: number;
  notes?: string;
}

export type BabyCareLogEntry = {
  id: string;
  timestamp: string;
  date: string;
  type: 'diaper' | 'feeding' | 'tummy';
  data: DiaperRecord | FeedingRecord | TummyTimeRecord;
};

export async function loadBabyCareLog(userId: string): Promise<BabyCareLogEntry[]> {
  try {
    const json = await AsyncStorage.getItem(`baby_care_log_${userId}`);
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

export async function saveBabyCareLog(userId: string, entries: BabyCareLogEntry[]): Promise<void> {
  try { await AsyncStorage.setItem(`baby_care_log_${userId}`, JSON.stringify(entries)); } catch (e) { console.error('saveBabyCareLog failed', e); }
}

// ─── 宝宝睡眠日志 ───
export interface BabySleepRecord {
  id: string;
  startTime: string;     // ISO string
  endTime: string | null; // ISO string (null = 正在睡)
  date: string;          // YYYY-MM-DD
  durationSec: number;   // 实际睡眠秒数（结束时为0则按当前时间算）
  quality: 'good' | 'fair' | 'poor';
  notes: string;
}

export async function loadSleepRecords(userId: string): Promise<BabySleepRecord[]> {
  try {
    const json = await AsyncStorage.getItem(`sleep_records_${userId}`);
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

export async function saveSleepRecords(userId: string, records: BabySleepRecord[]): Promise<void> {
  try { await AsyncStorage.setItem(`sleep_records_${userId}`, JSON.stringify(records)); } catch (e) { console.error('saveSleepRecords failed', e); }
}

// ─── 产检报告记录 ───
export interface PrenatalCheckupRecord {
  id: string;
  taskId: string;          // 关联的任务ID
  date: string;            // YYYY-MM-DD
  week: number;            // 孕周
  systolicBP?: number;     // 收缩压
  diastolicBP?: number;    // 舒张压
  weight?: number;         // 体重 kg
  fetalHeartRate?: number; // 胎心
  urineProtein?: string;   // 尿蛋白（阴性/1+/2+/3+）
  fundalHeight?: number;   // 宫高 cm
  notes: string;
  createdAt: string;       // ISO string
}

export async function loadPrenatalCheckupRecords(userId: string): Promise<PrenatalCheckupRecord[]> {
  try {
    const json = await AsyncStorage.getItem(`prenatal_checkups_${userId}`);
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

export async function savePrenatalCheckupRecords(userId: string, records: PrenatalCheckupRecord[]): Promise<void> {
  try { await AsyncStorage.setItem(`prenatal_checkups_${userId}`, JSON.stringify(records)); } catch (e) { console.error('savePrenatalCheckupRecords failed', e); }
}

// ─── 儿童保健记录 ───
export interface ChildCheckupRecord {
  id: string;
  visitId: number;         // well_child_visits.id（来自 DB）
  date: string;           // YYYY-MM-DD 实际检查日期
  weight?: number;       // 体重 kg
  height?: number;       // 身高/身长 cm
  headCircumference?: number; // 头围 cm
  hemoglobin?: number;   // 血红蛋白 g/L
  visionLeft?: number;   // 左眼视力
  visionRight?: number;  // 右眼视力
  milestones?: string;    // 发育里程碑评估
  notes: string;         // 备注/医生建议
  createdAt: string;     // ISO string
}

export async function loadChildCheckupRecords(userId: string): Promise<ChildCheckupRecord[]> {
  try {
    const json = await AsyncStorage.getItem(`child_checkups_${userId}`);
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

export async function saveChildCheckupRecords(userId: string, records: ChildCheckupRecord[]): Promise<void> {
  try { await AsyncStorage.setItem(`child_checkups_${userId}`, JSON.stringify(records)); } catch (e) { console.error('saveChildCheckupRecords failed', e); }
}

// ─── 分娩准备清单（爸爸版） ───
export interface DadPrepItem {
  id: string;
  name: string;
  description: string;
  phase: 't-30' | 't-7' | 't-1';
  category: string;
}

export interface DadPrepProgress {
  itemId: string;
  isPrepared: boolean;
  preparedAt?: string;
}

export const DAD_PREP_ITEMS: DadPrepItem[] = [
  // T-30天
  { id: 'dp-leave', name: '申请陪产假', description: '了解公司陪产假政策并提交申请', phase: 't-30', category: '行政' },
  { id: 'dp-route', name: '规划医院路线', description: '试跑去医院路线，了解交通和停车情况', phase: 't-30', category: '准备' },
  { id: 'dp-contact', name: '整理紧急联系人', description: '列好可随时帮忙的亲友电话', phase: 't-30', category: '准备' },
  { id: 'dp-bag', name: '准备爸爸待产包', description: '换洗衣物、充电宝、零食、水、证件复印件', phase: 't-30', category: '物品' },
  { id: 'dp-knowledge', name: '学习分娩知识', description: '了解产程三阶段、呼吸法、陪产注意事项', phase: 't-30', category: '知识' },
  { id: 'dp-finance', name: '准备住院押金/医保', description: '确认医保卡、银行卡、现金准备', phase: 't-30', category: '行政' },
  // T-7天
  { id: 'dp-car', name: '加满油/充好电', description: '确保车辆随时可用', phase: 't-7', category: '准备' },
  { id: 'dp-hospital', name: '确认医院流程', description: '确认急诊入口、产科楼层、住院办理流程', phase: 't-7', category: '准备' },
  { id: 'dp-suitcase', name: '整理行李箱', description: '把爸爸待产包放进箱子里', phase: 't-7', category: '物品' },
  { id: 'dp-work', name: '工作交接', description: '告知同事并做好工作临时交接', phase: 't-7', category: '行政' },
  { id: 'dp-meal', name: '准备产后饮食计划', description: '了解月子餐/外卖/备餐方案', phase: 't-7', category: '准备' },
  { id: 'dp-birth-plan', name: '与妈妈过分娩计划', description: '了解妈妈的分娩意愿和应对方案', phase: 't-7', category: '沟通' },
  { id: 'dp-pet', name: '安排宠物/大孩', description: '如果家里有宠物或大宝，安排好住院期间照看', phase: 't-7', category: '准备' },
  // T-1天 — 临产
  { id: 'dp-alert', name: '设置医院快速拨号', description: '把医院电话存为快捷拨号', phase: 't-1', category: '准备' },
  { id: 'dp-check', name: '检查待产包', description: '确保所有物品都在包里且没有过期', phase: 't-1', category: '物品' },
  { id: 'dp-phone', name: '手机充满电', description: '并带上充电宝和数据线', phase: 't-1', category: '物品' },
  { id: 'dp-calm', name: '做一次深呼吸', description: '和心理准备：你准备好了，一切都会顺利的', phase: 't-1', category: '心理' },
];

export async function loadDadPrepProgress(userId: string): Promise<DadPrepProgress[]> {
  try {
    const json = await AsyncStorage.getItem(`dad_prep_${userId}`);
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

export async function saveDadPrepProgress(userId: string, progress: DadPrepProgress[]): Promise<void> {
  try { await AsyncStorage.setItem(`dad_prep_${userId}`, JSON.stringify(progress)); } catch (e) { console.error('saveDadPrepProgress failed', e); }
}
