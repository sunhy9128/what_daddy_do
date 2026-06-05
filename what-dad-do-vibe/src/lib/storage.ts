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

// 妈妈体重记录
export interface MomWeightRecord {
  week: number;    // 孕周 0-40
  weight: number;  // 体重 kg
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
