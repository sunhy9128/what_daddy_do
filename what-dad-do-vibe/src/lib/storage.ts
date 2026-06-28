import AsyncStorage from '@react-native-async-storage/async-storage';

// =============================================================
// 多宝宝架构: 命名空间化 + 双键懒迁移
//
// 规则:
//   - user-level key 不变 (e.g. ACTIVE_TOOLS_<userId>)
//   - baby-level key = `<base>_<userId>_<babyId>` (e.g. feeding_records_<uid>_<bid>)
//   - 读函数先查新 key，未命中读旧 key `<base>_<userId>` 并写回新 key
//   - 旧 key 保留不删，兜底用
// =============================================================

const KEYS = {
  // baby-level: 按宝宝独立（新格式）
  GROWTH_RECORDS:        (userId: string, babyId: string) => `growth_records_${userId}_${babyId}`,
  FEEDING_RECORDS:       (userId: string, babyId: string) => `feeding_records_${userId}_${babyId}`,
  BABY_CARE_LOG:         (userId: string, babyId: string) => `baby_care_log_${userId}_${babyId}`,
  SLEEP_RECORDS:         (userId: string, babyId: string) => `sleep_records_${userId}_${babyId}`,
  PRENATAL_CHECKUPS:     (userId: string, babyId: string) => `prenatal_checkups_${userId}_${babyId}`,
  CHILD_CHECKUPS:        (userId: string, babyId: string) => `child_checkups_${userId}_${babyId}`,

  // user-level: 跨宝宝共享
  ACTIVE_TOOLS:          (userId: string) => `user_tools_${userId}`,
  CURRENT_BABY:          (userId: string) => `current_baby_${userId}`,
  CONTRACTION_RECORDS:   (userId: string) => `contraction_records_${userId}`,
  KICK_RECORDS:          (userId: string) => `kick_records_${userId}`,
  MOM_WEIGHT_RECORDS:    (userId: string) => `mom_weight_records_${userId}`,
  MOM_WEIGHT_CONFIG:     (userId: string) => `mom_weight_config_${userId}`,
  MOOD_RECORDS:          (userId: string) => `mood_records_${userId}`,
  MOOD_CONFIG:           (userId: string) => `mood_config_${userId}`,
  DAD_PREP:              (userId: string) => `dad_prep_${userId}`,
  ONBOARDING_COMPLETED:  (userId: string) => `onboarding_completed_${userId}`,
  OVULATION_RECORDS:     (userId: string) => `ovulation_records_${userId}`,
  OVULATION_CONFIG:      (userId: string) => `ovulation_config_${userId}`,
  NOTIFICATION_CONFIG:   (userId: string) => `notification_config_${userId}`,
};

// 旧 key 基础名映射（用于懒迁移：旧 key = `<legacyBase>_<userId>`）
const LEGACY_BABY_BASES: Record<string, string> = {
  [KEYS.GROWTH_RECORDS('', '')]:    'growth_records',
  [KEYS.FEEDING_RECORDS('', '')]:   'feeding_records',
  [KEYS.BABY_CARE_LOG('', '')]:     'baby_care_log',
  [KEYS.SLEEP_RECORDS('', '')]:     'sleep_records',
  [KEYS.PRENATAL_CHECKUPS('', '')]: 'prenatal_checkups',
  [KEYS.CHILD_CHECKUPS('', '')]:    'child_checkups',
};

/**
 * 通用懒迁移读：先查新 key `<base>_<userId>_<babyId>`，未命中查旧 key `<legacyBase>_<userId>` 并写回新 key
 */
async function loadBabyScoped<T>(
  newKey: string,
  legacyKey: string,
  fallback: T
): Promise<T> {
  try {
    const stored = await AsyncStorage.getItem(newKey);
    if (stored) return JSON.parse(stored) as T;

    const legacy = await AsyncStorage.getItem(legacyKey);
    if (legacy) {
      // 写回新 key 以加速后续读取
      await AsyncStorage.setItem(newKey, legacy);
      return JSON.parse(legacy) as T;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

async function saveBabyScoped<T>(newKey: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(newKey, JSON.stringify(value));
  } catch (e) {
    console.error(`saveBabyScoped failed for key ${newKey}:`, e);
  }
}

// =============================================================
// 工具实例（user-level, 不变）
// =============================================================
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

// =============================================================
// 新手引导完成标志（user-level, 新增）
// 兼容旧版 `guide_shown_<userId>` 键（一次性迁移）
// =============================================================
export async function loadOnboardingCompleted(userId: string): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETED(userId));
    if (v === '1') return true;
    // 兼容：旧版首页 GuideOverlay 的完成标志
    const legacy = await AsyncStorage.getItem(`guide_shown_${userId}`);
    return legacy === '1';
  } catch {
    return false;
  }
}

export async function saveOnboardingCompleted(userId: string, done: boolean): Promise<void> {
  try {
    if (done) {
      await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETED(userId), '1');
      // 清理旧版键，避免冗余
      await AsyncStorage.removeItem(`guide_shown_${userId}`).catch(() => {});
    } else {
      await AsyncStorage.removeItem(KEYS.ONBOARDING_COMPLETED(userId));
    }
  } catch (e) {
    console.error('saveOnboardingCompleted failed', e);
  }
}

// =============================================================
// 当前宝宝（user-level, 新增）
// =============================================================

export async function loadCurrentBabyId(userId: string): Promise<string | null> {
  try {
    const v = await AsyncStorage.getItem(KEYS.CURRENT_BABY(userId));
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

export async function saveCurrentBabyId(userId: string, babyId: string | null): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.CURRENT_BABY(userId), babyId ?? '');
  } catch (e) {
    console.error('saveCurrentBabyId failed', e);
  }
}

// =============================================================
// 身高体重记录（baby-level, 新格式 + 懒迁移）
// =============================================================
export interface GrowthRecordData {
  month: number;
  height: number;
  weight: number;
}

export async function loadGrowthRecords(userId: string, babyId: string): Promise<GrowthRecordData[]> {
  return loadBabyScoped<GrowthRecordData[]>(
    KEYS.GROWTH_RECORDS(userId, babyId),
    `growth_records_${userId}`,
    []
  );
}

export async function saveGrowthRecords(userId: string, babyId: string, records: GrowthRecordData[]): Promise<void> {
  return saveBabyScoped(KEYS.GROWTH_RECORDS(userId, babyId), records);
}

// =============================================================
// 喂奶记录（baby-level）
// =============================================================
export interface FeedingRecordData {
  id: number;
  time: string;
  date: string; // YYYY-MM-DD
}

export async function loadFeedingRecords(userId: string, babyId: string): Promise<FeedingRecordData[]> {
  return loadBabyScoped<FeedingRecordData[]>(
    KEYS.FEEDING_RECORDS(userId, babyId),
    `feeding_records_${userId}`,
    []
  );
}

export async function saveFeedingRecords(userId: string, babyId: string, records: FeedingRecordData[]): Promise<void> {
  return saveBabyScoped(KEYS.FEEDING_RECORDS(userId, babyId), records);
}

// =============================================================
// 宫缩计时记录（user-level, 妈妈自身）
// =============================================================
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
    const json = await AsyncStorage.getItem(KEYS.CONTRACTION_RECORDS(userId));
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

export async function saveContractionRecords(userId: string, records: ContractionRecord[]): Promise<void> {
  try { await AsyncStorage.setItem(KEYS.CONTRACTION_RECORDS(userId), JSON.stringify(records)); } catch (e) { console.error('saveContractionRecords failed', e); }
}

// =============================================================
// 胎动计数记录（user-level, 妈妈自身）
// =============================================================
export interface KickRecordData {
  date: string;       // YYYY-MM-DD
  count: number;
  sessions: { startTime: string; endTime?: string; count: number }[];
}

export async function loadKickRecords(userId: string): Promise<KickRecordData[]> {
  try {
    const json = await AsyncStorage.getItem(KEYS.KICK_RECORDS(userId));
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

export async function saveKickRecords(userId: string, records: KickRecordData[]): Promise<void> {
  try { await AsyncStorage.setItem(KEYS.KICK_RECORDS(userId), JSON.stringify(records)); } catch (e) { console.error('saveKickRecords failed', e); }
}

// =============================================================
// 妈妈体重记录（user-level, 妈妈自身）
// =============================================================
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
    const json = await AsyncStorage.getItem(KEYS.MOM_WEIGHT_RECORDS(userId));
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

export async function saveMomWeightRecords(userId: string, records: MomWeightRecord[]): Promise<void> {
  try { await AsyncStorage.setItem(KEYS.MOM_WEIGHT_RECORDS(userId), JSON.stringify(records)); } catch (e) { console.error('saveMomWeightRecords failed', e); }
}

export async function loadMomWeightConfig(userId: string): Promise<MomWeightConfig | null> {
  try {
    const json = await AsyncStorage.getItem(KEYS.MOM_WEIGHT_CONFIG(userId));
    return json ? JSON.parse(json) : null;
  } catch { return null; }
}

export async function saveMomWeightConfig(userId: string, config: MomWeightConfig): Promise<void> {
  try { await AsyncStorage.setItem(KEYS.MOM_WEIGHT_CONFIG(userId), JSON.stringify(config)); } catch (e) { console.error('saveMomWeightConfig failed', e); }
}

// =============================================================
// 爸爸情绪自评记录（user-level, 爸爸自身）
// =============================================================
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
    const json = await AsyncStorage.getItem(KEYS.MOOD_RECORDS(userId));
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

export async function saveMoodRecords(userId: string, records: MoodRecord[]): Promise<void> {
  try { await AsyncStorage.setItem(KEYS.MOOD_RECORDS(userId), JSON.stringify(records)); } catch (e) { console.error('saveMoodRecords failed', e); }
}

export async function loadMoodConfig(userId: string): Promise<MoodConfig | null> {
  try {
    const json = await AsyncStorage.getItem(KEYS.MOOD_CONFIG(userId));
    return json ? JSON.parse(json) : null;
  } catch { return null; }
}

export async function saveMoodConfig(userId: string, config: MoodConfig): Promise<void> {
  try { await AsyncStorage.setItem(KEYS.MOOD_CONFIG(userId), JSON.stringify(config)); } catch (e) { console.error('saveMoodConfig failed', e); }
}

// =============================================================
// 产后护理日志（baby-level）
// =============================================================
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

export async function loadBabyCareLog(userId: string, babyId: string): Promise<BabyCareLogEntry[]> {
  return loadBabyScoped<BabyCareLogEntry[]>(
    KEYS.BABY_CARE_LOG(userId, babyId),
    `baby_care_log_${userId}`,
    []
  );
}

export async function saveBabyCareLog(userId: string, babyId: string, entries: BabyCareLogEntry[]): Promise<void> {
  return saveBabyScoped(KEYS.BABY_CARE_LOG(userId, babyId), entries);
}

// =============================================================
// 宝宝睡眠日志（baby-level）
// =============================================================
export interface BabySleepRecord {
  id: string;
  startTime: string;     // ISO string
  endTime: string | null; // ISO string (null = 正在睡)
  date: string;          // YYYY-MM-DD
  durationSec: number;   // 实际睡眠秒数
  quality: 'good' | 'fair' | 'poor';
  notes: string;
}

export async function loadSleepRecords(userId: string, babyId: string): Promise<BabySleepRecord[]> {
  return loadBabyScoped<BabySleepRecord[]>(
    KEYS.SLEEP_RECORDS(userId, babyId),
    `sleep_records_${userId}`,
    []
  );
}

export async function saveSleepRecords(userId: string, babyId: string, records: BabySleepRecord[]): Promise<void> {
  return saveBabyScoped(KEYS.SLEEP_RECORDS(userId, babyId), records);
}

// =============================================================
// 产检报告记录（baby-level）
// =============================================================
export interface PrenatalCheckupRecord {
  id: string;
  taskId: string;          // 关联的任务ID
  date: string;            // YYYY-MM-DD
  week: number;            // 孕周
  systolicBP?: number;     // 收缩压
  diastolicBP?: number;    // 舒张压
  weight?: number;         // 体重 kg
  fetalHeartRate?: number; // 胎心
  urineProtein?: string;   // 尿蛋白
  fundalHeight?: number;   // 宫高 cm
  notes: string;
  createdAt: string;       // ISO string
}

export async function loadPrenatalCheckupRecords(userId: string, babyId: string): Promise<PrenatalCheckupRecord[]> {
  return loadBabyScoped<PrenatalCheckupRecord[]>(
    KEYS.PRENATAL_CHECKUPS(userId, babyId),
    `prenatal_checkups_${userId}`,
    []
  );
}

export async function savePrenatalCheckupRecords(userId: string, babyId: string, records: PrenatalCheckupRecord[]): Promise<void> {
  return saveBabyScoped(KEYS.PRENATAL_CHECKUPS(userId, babyId), records);
}

// =============================================================
// 儿童保健记录（baby-level）
// =============================================================
export interface ChildCheckupRecord {
  id: string;
  visitId: number;
  date: string;
  weight?: number;
  height?: number;
  headCircumference?: number;
  hemoglobin?: number;
  visionLeft?: number;
  visionRight?: number;
  milestones?: string;
  notes: string;
  createdAt: string;
}

export async function loadChildCheckupRecords(userId: string, babyId: string): Promise<ChildCheckupRecord[]> {
  return loadBabyScoped<ChildCheckupRecord[]>(
    KEYS.CHILD_CHECKUPS(userId, babyId),
    `child_checkups_${userId}`,
    []
  );
}

export async function saveChildCheckupRecords(userId: string, babyId: string, records: ChildCheckupRecord[]): Promise<void> {
  return saveBabyScoped(KEYS.CHILD_CHECKUPS(userId, babyId), records);
}

// =============================================================
// 分娩准备清单（user-level, 爸爸自身）
// =============================================================
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
  { id: 'dp-leave', name: '申请陪产假', description: '了解公司陪产假政策并提交申请', phase: 't-30', category: '行政' },
  { id: 'dp-route', name: '规划医院路线', description: '试跑去医院路线，了解交通和停车情况', phase: 't-30', category: '准备' },
  { id: 'dp-contact', name: '整理紧急联系人', description: '列好可随时帮忙的亲友电话', phase: 't-30', category: '准备' },
  { id: 'dp-bag', name: '准备爸爸待产包', description: '换洗衣物、充电宝、零食、水、证件复印件', phase: 't-30', category: '物品' },
  { id: 'dp-knowledge', name: '学习分娩知识', description: '了解产程三阶段、呼吸法、陪产注意事项', phase: 't-30', category: '知识' },
  { id: 'dp-finance', name: '准备住院押金/医保', description: '确认医保卡、银行卡、现金准备', phase: 't-30', category: '行政' },
  { id: 'dp-car', name: '加满油/充好电', description: '确保车辆随时可用', phase: 't-7', category: '准备' },
  { id: 'dp-hospital', name: '确认医院流程', description: '确认急诊入口、产科楼层、住院办理流程', phase: 't-7', category: '准备' },
  { id: 'dp-suitcase', name: '整理行李箱', description: '把爸爸待产包放进箱子里', phase: 't-7', category: '物品' },
  { id: 'dp-work', name: '工作交接', description: '告知同事并做好工作临时交接', phase: 't-7', category: '行政' },
  { id: 'dp-meal', name: '准备产后饮食计划', description: '了解月子餐/外卖/备餐方案', phase: 't-7', category: '准备' },
  { id: 'dp-birth-plan', name: '与妈妈过分娩计划', description: '了解妈妈的分娩意愿和应对方案', phase: 't-7', category: '沟通' },
  { id: 'dp-pet', name: '安排宠物/大孩', description: '如果家里有宠物或大宝，安排好住院期间照看', phase: 't-7', category: '准备' },
  { id: 'dp-alert', name: '设置医院快速拨号', description: '把医院电话存为快捷拨号', phase: 't-1', category: '准备' },
  { id: 'dp-check', name: '检查待产包', description: '确保所有物品都在包里且没有过期', phase: 't-1', category: '物品' },
  { id: 'dp-phone', name: '手机充满电', description: '并带上充电宝和数据线', phase: 't-1', category: '物品' },
  { id: 'dp-calm', name: '做一次深呼吸', description: '和心理准备：你准备好了，一切都会顺利的', phase: 't-1', category: '心理' },
];

export async function loadDadPrepProgress(userId: string): Promise<DadPrepProgress[]> {
  try {
    const json = await AsyncStorage.getItem(KEYS.DAD_PREP(userId));
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

export async function saveDadPrepProgress(userId: string, progress: DadPrepProgress[]): Promise<void> {
  try { await AsyncStorage.setItem(KEYS.DAD_PREP(userId), JSON.stringify(progress)); } catch (e) { console.error('saveDadPrepProgress failed', e); }
}

// =============================================================
// 备孕排卵追踪记录（user-level, 准妈妈自身）
// =============================================================
export interface OvulationRecord {
  date: string;           // YYYY-MM-DD
  temperature?: number;   // 基础体温 °C
  opkResult?: 'positive' | 'weak' | 'negative'; // 排卵试纸结果
  cervicalMucus?: 'dry' | 'sticky' | 'creamy' | 'watery' | 'egg-white'; // 宫颈粘液
  notes?: string;
}

export interface OvulationConfig {
  cycleLength: number;    // 周期长度，默认28
  periodLength: number;   // 经期长度，默认5
  lastPeriodStart?: string; // 上次经期开始日期 YYYY-MM-DD
}

export async function loadOvulationRecords(userId: string): Promise<OvulationRecord[]> {
  try {
    const json = await AsyncStorage.getItem(KEYS.OVULATION_RECORDS(userId));
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

export async function saveOvulationRecords(userId: string, records: OvulationRecord[]): Promise<void> {
  try { await AsyncStorage.setItem(KEYS.OVULATION_RECORDS(userId), JSON.stringify(records)); } catch (e) { console.error('saveOvulationRecords failed', e); }
}

export async function loadOvulationConfig(userId: string): Promise<OvulationConfig | null> {
  try {
    const json = await AsyncStorage.getItem(KEYS.OVULATION_CONFIG(userId));
    return json ? JSON.parse(json) : null;
  } catch { return null; }
}

export async function saveOvulationConfig(userId: string, config: OvulationConfig): Promise<void> {
  try { await AsyncStorage.setItem(KEYS.OVULATION_CONFIG(userId), JSON.stringify(config)); } catch (e) { console.error('saveOvulationConfig failed', e); }
}

// =============================================================
// 通知配置
// =============================================================
export interface NotificationConfig {
  enabled: boolean;
  checkinEnabled: boolean;
  checkinHour: number;
  checkinMinute: number;
  prenatalEnabled: boolean;
  vaccineEnabled: boolean;
}

export async function loadNotificationConfig(userId: string): Promise<NotificationConfig> {
  try {
    const json = await AsyncStorage.getItem(KEYS.NOTIFICATION_CONFIG(userId));
    return json ? JSON.parse(json) : {
      enabled: true,
      checkinEnabled: true,
      checkinHour: 9,
      checkinMinute: 0,
      prenatalEnabled: true,
      vaccineEnabled: true,
    };
  } catch { return { enabled: true, checkinEnabled: true, checkinHour: 9, checkinMinute: 0, prenatalEnabled: true, vaccineEnabled: true }; }
}

export async function saveNotificationConfig(userId: string, config: NotificationConfig): Promise<void> {
  try { await AsyncStorage.setItem(KEYS.NOTIFICATION_CONFIG(userId), JSON.stringify(config)); } catch (e) { console.error('saveNotificationConfig failed', e); }
}

// =============================================================
// 归档/删除宝宝时清理该宝宝的所有 AsyncStorage 数据
// =============================================================
export async function purgeBabyStorage(userId: string, babyId: string): Promise<void> {
  const keysToRemove = [
    KEYS.GROWTH_RECORDS(userId, babyId),
    KEYS.FEEDING_RECORDS(userId, babyId),
    KEYS.BABY_CARE_LOG(userId, babyId),
    KEYS.SLEEP_RECORDS(userId, babyId),
    KEYS.PRENATAL_CHECKUPS(userId, babyId),
    KEYS.CHILD_CHECKUPS(userId, babyId),
  ];
  await Promise.all(keysToRemove.map(k => AsyncStorage.removeItem(k).catch(() => {})));
}
