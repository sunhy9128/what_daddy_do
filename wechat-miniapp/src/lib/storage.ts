import Taro from '@tarojs/taro';

const NS = 'what-dad-do:';

/** 同步读取（启动期可用） */
export function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = Taro.getStorageSync(NS + key);
    if (raw === '' || raw === null || raw === undefined) return fallback;
    return typeof raw === 'string' ? JSON.parse(raw) : (raw as T);
  } catch {
    return fallback;
  }
}

/** 同步写入 */
export function setItem<T>(key: string, value: T): void {
  try {
    Taro.setStorageSync(NS + key, JSON.stringify(value));
  } catch (e) {
    console.error('storage setItem failed', e);
  }
}

/** 异步读取（推荐；避免大对象阻塞主线程） */
export async function getItemAsync<T>(key: string, fallback: T): Promise<T> {
  try {
    const { data } = await Taro.getStorage({ key: NS + key });
    if (!data) return fallback;
    return typeof data === 'string' ? JSON.parse(data) : (data as T);
  } catch {
    return fallback;
  }
}

export async function setItemAsync<T>(key: string, value: T): Promise<void> {
  try {
    await Taro.setStorage({ key: NS + key, data: JSON.stringify(value) });
  } catch (e) {
    console.error('storage setItemAsync failed', e);
  }
}

export function removeItem(key: string) {
  try { Taro.removeStorageSync(NS + key); } catch {}
}

// 命名空间 keys（与 RN 端对齐命名空间化）
export const KEYS = {
  userTools: (uid: string) => `user_tools_${uid}`,
  feedingRecords: (uid: string) => `feeding_records_${uid}`,
  growthRecords: (uid: string) => `growth_records_${uid}`,
};