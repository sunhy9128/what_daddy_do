/**
 * @jest-environment node
 *
 * storage.ts 单元测试
 * - 用户级 / 宝宝级 key 命名空间化
 * - 懒迁移（旧 key → 新 key）
 * - 各种 CRUD 函数（save/load）
 * - 错误处理（AsyncStorage 抛错时返回 fallback）
 * - purgeBabyStorage 清理
 * - DAD_PREP_ITEMS 静态数据完整性
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  loadActiveTools,
  saveActiveTools,
  loadCurrentBabyId,
  saveCurrentBabyId,
  loadGrowthRecords,
  saveGrowthRecords,
  loadFeedingRecords,
  saveFeedingRecords,
  loadContractionRecords,
  saveContractionRecords,
  loadKickRecords,
  saveKickRecords,
  loadMomWeightRecords,
  saveMomWeightRecords,
  loadMomWeightConfig,
  saveMomWeightConfig,
  loadMoodRecords,
  saveMoodRecords,
  loadMoodConfig,
  saveMoodConfig,
  loadBabyCareLog,
  saveBabyCareLog,
  loadSleepRecords,
  saveSleepRecords,
  loadPrenatalCheckupRecords,
  savePrenatalCheckupRecords,
  loadChildCheckupRecords,
  saveChildCheckupRecords,
  loadDadPrepProgress,
  saveDadPrepProgress,
  DAD_PREP_ITEMS,
  purgeBabyStorage,
  GrowthRecordData,
  FeedingRecordData,
  ContractionRecord,
  KickRecordData,
  MomWeightRecord,
  MomWeightConfig,
  MoodRecord,
  MoodConfig,
  BabyCareLogEntry,
  BabySleepRecord,
  PrenatalCheckupRecord,
  ChildCheckupRecord,
  DadPrepItem,
  DadPrepProgress,
  StoredToolInstance,
} from '../storage';

// ============================================================
// 测试前重置 mock
// ============================================================
const USER_A = 'user-aaa';
const USER_B = 'user-bbb';
const BABY_1 = 'baby-001';
const BABY_2 = 'baby-002';

beforeEach(async () => {
  await AsyncStorage.clear();
});

// ============================================================
// Active tools
// ============================================================
describe('loadActiveTools / saveActiveTools', () => {
  it('首次读取返回空数组', async () => {
    const tools = await loadActiveTools(USER_A);
    expect(tools).toEqual([]);
  });

  it('保存后再读取能取回相同数据', async () => {
    const tools: StoredToolInstance[] = [
      { instanceId: 'i1', toolId: 'feeding-timer' },
      { instanceId: 'i2', toolId: 'growth-tracker' },
    ];
    await saveActiveTools(USER_A, tools);
    expect(await loadActiveTools(USER_A)).toEqual(tools);
  });

  it('不同用户互不干扰（user-level 命名空间）', async () => {
    await saveActiveTools(USER_A, [{ instanceId: 'i1', toolId: 'a' }]);
    await saveActiveTools(USER_B, [{ instanceId: 'i2', toolId: 'b' }]);
    expect(await loadActiveTools(USER_A)).toEqual([{ instanceId: 'i1', toolId: 'a' }]);
    expect(await loadActiveTools(USER_B)).toEqual([{ instanceId: 'i2', toolId: 'b' }]);
  });
});

// ============================================================
// Current baby
// ============================================================
describe('loadCurrentBabyId / saveCurrentBabyId', () => {
  it('首次读取返回 null', async () => {
    expect(await loadCurrentBabyId(USER_A)).toBeNull();
  });

  it('保存非空值后能取回', async () => {
    await saveCurrentBabyId(USER_A, BABY_1);
    expect(await loadCurrentBabyId(USER_A)).toBe(BABY_1);
  });

  it('保存 null 时存为空串（避免 AsyncStorage 存 null 触发警告）', async () => {
    await saveCurrentBabyId(USER_A, null);
    // 读取时仍返回 null（兼容空串）
    expect(await loadCurrentBabyId(USER_A)).toBeNull();
  });
});

// ============================================================
// Baby-scoped: Growth
// ============================================================
describe('loadGrowthRecords / saveGrowthRecords', () => {
  it('首次读取返回空数组', async () => {
    expect(await loadGrowthRecords(USER_A, BABY_1)).toEqual([]);
  });

  it('保存后再读取能取回', async () => {
    const records: GrowthRecordData[] = [
      { month: 6, height: 65, weight: 7.5 },
      { month: 12, height: 75, weight: 9.5 },
    ];
    await saveGrowthRecords(USER_A, BABY_1, records);
    expect(await loadGrowthRecords(USER_A, BABY_1)).toEqual(records);
  });

  it('不同宝宝的数据独立', async () => {
    const r1: GrowthRecordData[] = [{ month: 6, height: 65, weight: 7.5 }];
    const r2: GrowthRecordData[] = [{ month: 12, height: 75, weight: 9.5 }];
    await saveGrowthRecords(USER_A, BABY_1, r1);
    await saveGrowthRecords(USER_A, BABY_2, r2);
    expect(await loadGrowthRecords(USER_A, BABY_1)).toEqual(r1);
    expect(await loadGrowthRecords(USER_A, BABY_2)).toEqual(r2);
  });
});

// ============================================================
// Baby-scoped: Feeding
// ============================================================
describe('loadFeedingRecords / saveFeedingRecords', () => {
  it('首次读取返回空数组', async () => {
    expect(await loadFeedingRecords(USER_A, BABY_1)).toEqual([]);
  });

  it('保存后能取回', async () => {
    const records: FeedingRecordData[] = [
      { id: 1, time: '08:00', date: '2026-06-10' },
      { id: 2, time: '12:00', date: '2026-06-10' },
    ];
    await saveFeedingRecords(USER_A, BABY_1, records);
    expect(await loadFeedingRecords(USER_A, BABY_1)).toEqual(records);
  });
});

// ============================================================
// User-scoped: Contraction
// ============================================================
describe('loadContractionRecords / saveContractionRecords', () => {
  it('首次读取返回空数组', async () => {
    expect(await loadContractionRecords(USER_A)).toEqual([]);
  });

  it('保存后能取回', async () => {
    const records: ContractionRecord[] = [
      {
        id: 1,
        startTime: '2026-06-10T08:00:00Z',
        endTime: '2026-06-10T08:01:30Z',
        duration: 90,
        interval: 0,
        date: '2026-06-10',
      },
    ];
    await saveContractionRecords(USER_A, records);
    expect(await loadContractionRecords(USER_A)).toEqual(records);
  });
});

// ============================================================
// User-scoped: Kick
// ============================================================
describe('loadKickRecords / saveKickRecords', () => {
  it('首次读取返回空数组', async () => {
    expect(await loadKickRecords(USER_A)).toEqual([]);
  });

  it('保存后能取回', async () => {
    const records: KickRecordData[] = [
      {
        date: '2026-06-10',
        count: 12,
        sessions: [{ startTime: '2026-06-10T09:00:00Z', endTime: '2026-06-10T09:30:00Z', count: 12 }],
      },
    ];
    await saveKickRecords(USER_A, records);
    expect(await loadKickRecords(USER_A)).toEqual(records);
  });
});

// ============================================================
// User-scoped: MomWeight
// ============================================================
describe('MomWeight CRUD', () => {
  it('loadMomWeightRecords 首次读取返回空数组', async () => {
    expect(await loadMomWeightRecords(USER_A)).toEqual([]);
  });

  it('saveMomWeightRecords + load 能取回', async () => {
    const records: MomWeightRecord[] = [
      { week: 12, weight: 55 },
      { week: 20, weight: 58 },
    ];
    await saveMomWeightRecords(USER_A, records);
    expect(await loadMomWeightRecords(USER_A)).toEqual(records);
  });

  it('loadMomWeightConfig 首次返回 null', async () => {
    expect(await loadMomWeightConfig(USER_A)).toBeNull();
  });

  it('saveMomWeightConfig + load 能取回', async () => {
    const config: MomWeightConfig = { prePregnancyWeight: 50, height: 165 };
    await saveMomWeightConfig(USER_A, config);
    expect(await loadMomWeightConfig(USER_A)).toEqual(config);
  });
});

// ============================================================
// User-scoped: Mood
// ============================================================
describe('Mood CRUD', () => {
  it('loadMoodRecords 首次返回空数组', async () => {
    expect(await loadMoodRecords(USER_A)).toEqual([]);
  });

  it('saveMoodRecords + load 能取回', async () => {
    const records: MoodRecord[] = [
      {
        id: 'm1',
        date: '2026-06-10',
        score: 15,
        answers: [1, 1, 1, 2, 1, 1, 2, 1, 2, 2],
        notes: 'test',
      },
    ];
    await saveMoodRecords(USER_A, records);
    expect(await loadMoodRecords(USER_A)).toEqual(records);
  });

  it('loadMoodConfig 首次返回 null', async () => {
    expect(await loadMoodConfig(USER_A)).toBeNull();
  });

  it('saveMoodConfig + load 能取回', async () => {
    const config: MoodConfig = { name: '爸比', createdAt: '2026-06-10T00:00:00Z' };
    await saveMoodConfig(USER_A, config);
    expect(await loadMoodConfig(USER_A)).toEqual(config);
  });
});

// ============================================================
// Baby-scoped: BabyCareLog
// ============================================================
describe('BabyCareLog CRUD', () => {
  it('首次读取返回空数组', async () => {
    expect(await loadBabyCareLog(USER_A, BABY_1)).toEqual([]);
  });

  it('保存后能取回', async () => {
    const entries: BabyCareLogEntry[] = [
      {
        id: 'e1',
        timestamp: '2026-06-10T08:00:00Z',
        date: '2026-06-10',
        type: 'diaper',
        data: { id: 'd1', timestamp: '2026-06-10T08:00:00Z', date: '2026-06-10', type: 'wet' },
      },
    ];
    await saveBabyCareLog(USER_A, BABY_1, entries);
    expect(await loadBabyCareLog(USER_A, BABY_1)).toEqual(entries);
  });
});

// ============================================================
// Baby-scoped: Sleep
// ============================================================
describe('Sleep CRUD', () => {
  it('首次读取返回空数组', async () => {
    expect(await loadSleepRecords(USER_A, BABY_1)).toEqual([]);
  });

  it('保存后能取回', async () => {
    const records: BabySleepRecord[] = [
      {
        id: 's1',
        startTime: '2026-06-10T20:00:00Z',
        endTime: '2026-06-10T22:00:00Z',
        date: '2026-06-10',
        durationSec: 7200,
        quality: 'good',
        notes: '',
      },
    ];
    await saveSleepRecords(USER_A, BABY_1, records);
    expect(await loadSleepRecords(USER_A, BABY_1)).toEqual(records);
  });
});

// ============================================================
// Baby-scoped: PrenatalCheckups
// ============================================================
describe('PrenatalCheckup CRUD', () => {
  it('首次读取返回空数组', async () => {
    expect(await loadPrenatalCheckupRecords(USER_A, BABY_1)).toEqual([]);
  });

  it('保存后能取回', async () => {
    const records: PrenatalCheckupRecord[] = [
      {
        id: 'p1',
        taskId: 't1',
        date: '2026-06-10',
        week: 16,
        systolicBP: 120,
        diastolicBP: 80,
        weight: 60,
        notes: '',
        createdAt: '2026-06-10T10:00:00Z',
      },
    ];
    await savePrenatalCheckupRecords(USER_A, BABY_1, records);
    expect(await loadPrenatalCheckupRecords(USER_A, BABY_1)).toEqual(records);
  });
});

// ============================================================
// Baby-scoped: ChildCheckups
// ============================================================
describe('ChildCheckup CRUD', () => {
  it('首次读取返回空数组', async () => {
    expect(await loadChildCheckupRecords(USER_A, BABY_1)).toEqual([]);
  });

  it('保存后能取回', async () => {
    const records: ChildCheckupRecord[] = [
      {
        id: 'c1',
        visitId: 1,
        date: '2026-06-10',
        weight: 7.5,
        height: 65,
        notes: '',
        createdAt: '2026-06-10T10:00:00Z',
      },
    ];
    await saveChildCheckupRecords(USER_A, BABY_1, records);
    expect(await loadChildCheckupRecords(USER_A, BABY_1)).toEqual(records);
  });
});

// ============================================================
// User-scoped: DadPrepProgress
// ============================================================
describe('DadPrepProgress CRUD', () => {
  it('首次读取返回空数组', async () => {
    expect(await loadDadPrepProgress(USER_A)).toEqual([]);
  });

  it('保存后能取回', async () => {
    const progress: DadPrepProgress[] = [
      { itemId: 'dp-leave', isPrepared: true, preparedAt: '2026-06-10T00:00:00Z' },
    ];
    await saveDadPrepProgress(USER_A, progress);
    expect(await loadDadPrepProgress(USER_A)).toEqual(progress);
  });
});

// ============================================================
// DAD_PREP_ITEMS 静态数据
// ============================================================
describe('DAD_PREP_ITEMS', () => {
  it('至少 10 条建议', () => {
    expect(DAD_PREP_ITEMS.length).toBeGreaterThanOrEqual(10);
  });

  it('每条都有 id / name / description / phase / category', () => {
    for (const item of DAD_PREP_ITEMS) {
      expect(item.id).toEqual(expect.any(String));
      expect(item.id.length).toBeGreaterThan(0);
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
      expect(['t-30', 't-7', 't-1']).toContain(item.phase);
      expect(item.category.length).toBeGreaterThan(0);
    }
  });

  it('id 唯一', () => {
    const ids = DAD_PREP_ITEMS.map(i => i.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('phase 分布合理（t-30, t-7, t-1 都有）', () => {
    const phases = new Set(DAD_PREP_ITEMS.map(i => i.phase));
    expect(phases.has('t-30')).toBe(true);
    expect(phases.has('t-7')).toBe(true);
    expect(phases.has('t-1')).toBe(true);
  });
});

// ============================================================
// 懒迁移：旧 key → 新 key
// ============================================================
describe('legacy migration (lazy)', () => {
  it('growth_records：旧 key 数据被读出并写到新 key', async () => {
    const legacyKey = `growth_records_${USER_A}`;
    const newKey = `growth_records_${USER_A}_${BABY_1}`;
    const legacyData: GrowthRecordData[] = [{ month: 6, height: 65, weight: 7.5 }];

    // 写入旧 key
    await AsyncStorage.setItem(legacyKey, JSON.stringify(legacyData));

    // 读取：应该自动从旧 key 取，并写到新 key
    const result = await loadGrowthRecords(USER_A, BABY_1);
    expect(result).toEqual(legacyData);

    // 验证新 key 也被写入了
    const newKeyData = await AsyncStorage.getItem(newKey);
    expect(newKeyData).not.toBeNull();
    expect(JSON.parse(newKeyData!)).toEqual(legacyData);
  });

  it('feeding_records：旧 key 懒迁移', async () => {
    const legacyKey = `feeding_records_${USER_A}`;
    const legacyData: FeedingRecordData[] = [
      { id: 1, time: '08:00', date: '2026-06-10' },
    ];
    await AsyncStorage.setItem(legacyKey, JSON.stringify(legacyData));

    const result = await loadFeedingRecords(USER_A, BABY_1);
    expect(result).toEqual(legacyData);
  });

  it('存在新 key 时不会去读旧 key（避免覆盖用户更新）', async () => {
    const legacyKey = `growth_records_${USER_A}`;
    const newKey = `growth_records_${USER_A}_${BABY_1}`;
    const legacyData: GrowthRecordData[] = [{ month: 6, height: 65, weight: 7.5 }];
    const newData: GrowthRecordData[] = [{ month: 12, height: 75, weight: 9.5 }];

    await AsyncStorage.setItem(legacyKey, JSON.stringify(legacyData));
    await AsyncStorage.setItem(newKey, JSON.stringify(newData));

    const result = await loadGrowthRecords(USER_A, BABY_1);
    expect(result).toEqual(newData);
  });
});

// ============================================================
// purgeBabyStorage
// ============================================================
describe('purgeBabyStorage', () => {
  it('清理指定宝宝的所有 baby-level 记录', async () => {
    const records1: GrowthRecordData[] = [{ month: 6, height: 65, weight: 7.5 }];
    const records2: FeedingRecordData[] = [{ id: 1, time: '08:00', date: '2026-06-10' }];
    const careLog: BabyCareLogEntry[] = [];
    const sleep: BabySleepRecord[] = [];
    const prenatal: PrenatalCheckupRecord[] = [];
    const child: ChildCheckupRecord[] = [];

    await saveGrowthRecords(USER_A, BABY_1, records1);
    await saveFeedingRecords(USER_A, BABY_1, records2);
    await saveBabyCareLog(USER_A, BABY_1, careLog);
    await saveSleepRecords(USER_A, BABY_1, sleep);
    await savePrenatalCheckupRecords(USER_A, BABY_1, prenatal);
    await saveChildCheckupRecords(USER_A, BABY_1, child);

    await purgeBabyStorage(USER_A, BABY_1);

    expect(await loadGrowthRecords(USER_A, BABY_1)).toEqual([]);
    expect(await loadFeedingRecords(USER_A, BABY_1)).toEqual([]);
    expect(await loadBabyCareLog(USER_A, BABY_1)).toEqual([]);
    expect(await loadSleepRecords(USER_A, BABY_1)).toEqual([]);
    expect(await loadPrenatalCheckupRecords(USER_A, BABY_1)).toEqual([]);
    expect(await loadChildCheckupRecords(USER_A, BABY_1)).toEqual([]);
  });

  it('不删除其他宝宝的数据', async () => {
    const r1: GrowthRecordData[] = [{ month: 6, height: 65, weight: 7.5 }];
    const r2: GrowthRecordData[] = [{ month: 12, height: 75, weight: 9.5 }];
    await saveGrowthRecords(USER_A, BABY_1, r1);
    await saveGrowthRecords(USER_A, BABY_2, r2);

    await purgeBabyStorage(USER_A, BABY_1);

    expect(await loadGrowthRecords(USER_A, BABY_1)).toEqual([]);
    expect(await loadGrowthRecords(USER_A, BABY_2)).toEqual(r2);
  });

  it('不删除 user-level 数据（active tools 等）', async () => {
    const tools: StoredToolInstance[] = [{ instanceId: 'i1', toolId: 'a' }];
    await saveActiveTools(USER_A, tools);
    await saveGrowthRecords(USER_A, BABY_1, [{ month: 6, height: 65, weight: 7.5 }]);

    await purgeBabyStorage(USER_A, BABY_1);

    expect(await loadActiveTools(USER_A)).toEqual(tools);
  });
});

// ============================================================
// Key 命名空间化（不变更格式以免丢用户数据）
// ============================================================
describe('key naming convention', () => {
  it('user-level key 包含 userId', async () => {
    await saveActiveTools(USER_A, [{ instanceId: 'i1', toolId: 'a' }]);
    const keys = await AsyncStorage.getAllKeys();
    expect(keys).toContain(`user_tools_${USER_A}`);
  });

  it('baby-level key 包含 userId 和 babyId', async () => {
    await saveGrowthRecords(USER_A, BABY_1, [{ month: 6, height: 65, weight: 7.5 }]);
    const keys = await AsyncStorage.getAllKeys();
    expect(keys).toContain(`growth_records_${USER_A}_${BABY_1}`);
  });

  it('保存后实际的存储 key 符合命名规则', async () => {
    await saveCurrentBabyId(USER_A, BABY_1);
    const stored = await AsyncStorage.getItem(`current_baby_${USER_A}`);
    expect(stored).toBe(BABY_1);
  });
});

// ============================================================
// 错误处理
// ============================================================
describe('error handling', () => {
  it('save 在底层报错时不会抛出（吞掉错误避免崩溃）', async () => {
    // 模拟 setItem 抛错
    const spy = jest
      .spyOn(AsyncStorage, 'setItem')
      .mockRejectedValueOnce(new Error('storage full'));

    // 不应抛出
    await expect(saveActiveTools(USER_A, [])).resolves.toBeUndefined();

    spy.mockRestore();
  });
});
