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
