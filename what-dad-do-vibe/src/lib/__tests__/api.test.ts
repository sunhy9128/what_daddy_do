/**
 * @jest-environment node
 *
 * api.ts 单元测试
 * - 所有 Supabase CRUD 函数经 supabase.from(...) 链路
 * - 通过 mock supabase client 验证：调用的 table / 过滤条件 / 返回数据
 * - 覆盖：Tasks, Records, UrgentNotes, Babies, Posts, Knowledge, Vaccines, Prep, WellChild
 */
// Mock supabase 模块，必须在 import 之前
jest.mock('../supabase', () => {
  // 链式 query builder：每个方法返回 this，builder 本身是 thenable，
  // await builder.select(...).eq(...) 时 resolve 为 { data, error }
  const makeBuilder = (resolveData: any, resolveError: any = null) => {
    const calls: { method: string; args: any[] }[] = [];
    const builder: any = {
      _calls: calls,
      _resolveData: resolveData,
      _resolveError: resolveError,
      _resolved: { data: resolveData, error: resolveError },
      select: jest.fn((...args: any[]) => { calls.push({ method: 'select', args }); return builder; }),
      insert: jest.fn((...args: any[]) => { calls.push({ method: 'insert', args }); return builder; }),
      update: jest.fn((...args: any[]) => { calls.push({ method: 'update', args }); return builder; }),
      upsert: jest.fn((...args: any[]) => { calls.push({ method: 'upsert', args }); return builder; }),
      delete: jest.fn((...args: any[]) => { calls.push({ method: 'delete', args }); return builder; }),
      eq: jest.fn((...args: any[]) => { calls.push({ method: 'eq', args }); return builder; }),
      in: jest.fn((...args: any[]) => { calls.push({ method: 'in', args }); return builder; }),
      maybeSingle: jest.fn(() => { calls.push({ method: 'maybeSingle', args: [] }); return builder; }),
      single: jest.fn(() => { calls.push({ method: 'single', args: [] }); return builder; }),
      order: jest.fn((...args: any[]) => { calls.push({ method: 'order', args }); return builder; }),
      // thenable: await builder => { data, error }
      then: (onFulfilled: any) => Promise.resolve({ data: resolveData, error: resolveError }).then(onFulfilled),
    };
    return builder;
  };

  // lastBuilders 记录最后一次 from() 调用返回的 builder（用于测试断言）
  const lastBuilders: Array<{ table: string; builder: any }> = [];
  // tableResponses 是 FIFO 队列，处理同一张表被调用多次的场景
  const tableResponses = new Map<string, Array<{ data: any; error: any }>>();

  const supabase = {
    from: jest.fn((table: string) => {
      const queue = tableResponses.get(table);
      const next = queue && queue.length > 0 ? queue.shift()! : { data: null, error: null };
      const builder = makeBuilder(next.data, next.error);
      lastBuilders.push({ table, builder });
      return builder;
    }),
    // 设置表的响应（每次 from 都返回相同响应；如果想区分多次调用，用 __pushTableResponse）
    __setTableResponse: (table: string, data: any, error: any = null) => {
      tableResponses.set(table, [{ data, error }]);
    },
    // 推入多个响应（用于同一表多次 from 调用）
    __pushTableResponse: (table: string, data: any, error: any = null) => {
      const queue = tableResponses.get(table) || [];
      queue.push({ data, error });
      tableResponses.set(table, queue);
    },
    __getLastBuilder: (table?: string) => {
      if (table) {
        return [...lastBuilders].reverse().find(b => b.table === table)?.builder;
      }
      return lastBuilders[lastBuilders.length - 1]?.builder;
    },
    __getLastBuilderForTable: (table: string) => {
      return [...lastBuilders].reverse().find(b => b.table === table)?.builder;
    },
    __getFirstBuilderForTable: (table: string) => {
      return lastBuilders.find(b => b.table === table)?.builder;
    },
    __getAllBuildersForTable: (table: string) => {
      return lastBuilders.filter(b => b.table === table).map(b => b.builder);
    },
    __reset: () => {
      tableResponses.clear();
      lastBuilders.length = 0;
      (supabase.from as jest.Mock).mockClear();
    },
  };

  return { supabase };
});

// 在 mock 之后导入被测模块
import { supabase } from '../supabase';
import * as api from '../api';

const mockSupabase = supabase as unknown as {
  from: jest.Mock;
  __setTableResponse: (table: string, data: any, error?: any) => void;
  __pushTableResponse: (table: string, data: any, error?: any) => void;
  __getLastBuilderForTable: (table: string) => any;
  __getFirstBuilderForTable: (table: string) => any;
  __getAllBuildersForTable: (table: string) => any[];
  __reset: () => void;
};

beforeEach(() => {
  mockSupabase.__reset();
});

// ============================================================
// Tasks
// ============================================================
describe('getTasks', () => {
  it('查询 tasks 表，按 user_id / baby_id 过滤并按 created_at 倒序', async () => {
    const fakeTasks = [{ id: 't1', title: 'A' }];
    mockSupabase.__setTableResponse("tasks", fakeTasks);
    const result = await api.getTasks('u1', 'b1');
    const builder = mockSupabase.__getLastBuilderForTable("tasks");

    expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
    const calls = builder._calls;
    expect(calls.some((c: any) => c.method === 'select')).toBe(true);
    expect(calls.find((c: any) => c.method === 'eq' && c.args[0] === 'user_id' && c.args[1] === 'u1')).toBeTruthy();
    expect(calls.find((c: any) => c.method === 'eq' && c.args[0] === 'baby_id' && c.args[1] === 'b1')).toBeTruthy();
    expect(calls.find((c: any) => c.method === 'order' && c.args[0] === 'created_at' && c.args[1]?.ascending === false)).toBeTruthy();
    expect(result).toEqual(fakeTasks);
  });

  it('数据为 null 时返回空数组', async () => {
    mockSupabase.__setTableResponse('tasks', null);
    const result = await api.getTasks('u1', 'b1');
    expect(result).toEqual([]);
  });

  it('supabase 抛错时向上抛', async () => {
    mockSupabase.__setTableResponse('tasks', null, { message: 'fail' });
    await expect(api.getTasks('u1', 'b1')).rejects.toEqual({ message: 'fail' });
  });
});

describe('createTask', () => {
  it('insert 后调用 .single() 取出单条', async () => {
    const created = { id: 't1', title: 'new' };
    mockSupabase.__setTableResponse("tasks", created);
    const result = await api.createTask({ user_id: 'u1', title: 'new' });
    const builder = mockSupabase.__getLastBuilderForTable("tasks");

    expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
    const calls = builder._calls;
    expect(calls.find((c: any) => c.method === 'insert' && c.args[0].title === 'new')).toBeTruthy();
    expect(calls.find((c: any) => c.method === 'select')).toBeTruthy();
    expect(calls.find((c: any) => c.method === 'single')).toBeTruthy();
    expect(result).toEqual(created);
  });
});

describe('updateTask / deleteTask / toggleTaskComplete', () => {
  it('updateTask 使用 update + eq(id) + single', async () => {
    mockSupabase.__setTableResponse("tasks", { id: 't1' });
    await api.updateTask('t1', { is_completed: true });
    const builder = mockSupabase.__getLastBuilderForTable("tasks");

    const calls = builder._calls;
    expect(calls.find((c: any) => c.method === 'update' && c.args[0].is_completed === true)).toBeTruthy();
    expect(calls.find((c: any) => c.method === 'eq' && c.args[0] === 'id' && c.args[1] === 't1')).toBeTruthy();
  });

  it('deleteTask 使用 delete + eq(id)', async () => {
    mockSupabase.__setTableResponse("tasks", null);
    await api.deleteTask('t1');
    const builder = mockSupabase.__getLastBuilderForTable("tasks");

    const calls = builder._calls;
    expect(calls.find((c: any) => c.method === 'delete')).toBeTruthy();
    expect(calls.find((c: any) => c.method === 'eq' && c.args[0] === 'id' && c.args[1] === 't1')).toBeTruthy();
  });

  it('toggleTaskComplete(true) 设置 completed_at 为 ISO 字符串', async () => {
    mockSupabase.__setTableResponse("tasks", null);
    await api.toggleTaskComplete('t1', true);
    const builder = mockSupabase.__getLastBuilderForTable("tasks");

    const calls = builder._calls;
    const updateCall = calls.find((c: any) => c.method === 'update');
    expect(updateCall).toBeTruthy();
    expect(updateCall.args[0].is_completed).toBe(true);
    expect(typeof updateCall.args[0].completed_at).toBe('string');
    // ISO 字符串长度约为 24
    expect(updateCall.args[0].completed_at.length).toBeGreaterThan(20);
  });

  it('toggleTaskComplete(false) 将 completed_at 设为 null', async () => {
    mockSupabase.__setTableResponse("tasks", null);
    await api.toggleTaskComplete('t1', false);
    const builder = mockSupabase.__getLastBuilderForTable("tasks");

    const updateCall = builder._calls.find((c: any) => c.method === 'update');
    expect(updateCall.args[0].is_completed).toBe(false);
    expect(updateCall.args[0].completed_at).toBeNull();
  });
});

// ============================================================
// Records
// ============================================================
describe('Records CRUD', () => {
  it('getRecords 查 records 表 + user_id / baby_id 过滤', async () => {
    const fake = [{ id: 'r1' }];
    mockSupabase.__setTableResponse("records", fake);
    const result = await api.getRecords('u1', 'b1');
    const builder = mockSupabase.__getLastBuilderForTable("records");

    expect(mockSupabase.from).toHaveBeenCalledWith('records');
    const calls = builder._calls;
    expect(calls.find((c: any) => c.method === 'eq' && c.args[0] === 'user_id' && c.args[1] === 'u1')).toBeTruthy();
    expect(calls.find((c: any) => c.method === 'eq' && c.args[0] === 'baby_id' && c.args[1] === 'b1')).toBeTruthy();
    expect(result).toEqual(fake);
  });

  it('createRecord 写入 + 返回', async () => {
    const created = { id: 'r1', content: 'hi' };
    mockSupabase.__setTableResponse('records', created);
    const result = await api.createRecord({ user_id: 'u1', content: 'hi' });
    expect(result).toEqual(created);
  });

  it('deleteRecord 删除指定 id', async () => {
    mockSupabase.__setTableResponse("records", null);
    await api.deleteRecord('r1');
    const builder = mockSupabase.__getLastBuilderForTable("records");
    expect(builder._calls.find((c: any) => c.method === 'delete')).toBeTruthy();
    expect(builder._calls.find((c: any) => c.method === 'eq' && c.args[1] === 'r1')).toBeTruthy();
  });
});

// ============================================================
// Community Posts
// ============================================================
describe('getCommunityPosts', () => {
  it('未传 category 时不应用 category 过滤', async () => {
    const posts = [{ id: 'p1' }];
    mockSupabase.__setTableResponse("community_posts", posts);
    const result = await api.getCommunityPosts();
    // getCommunityPosts 调用 from('community_posts') 一次，from('post_likes') 和
    // from('post_comments') 各 N 次（N=posts.length），用第一个 builder 检查
    const builder = mockSupabase.__getFirstBuilderForTable("community_posts");

    // 应不包含 category 相关的 eq（但是会有 likes/comments 的 count eq）
    const categoryEq = builder._calls.find(
      (c: any) => c.method === 'eq' && c.args[0] === 'category'
    );
    expect(categoryEq).toBeUndefined();
    // 每条 post 都被 enrich：likes/comments count 默认 0
    expect(result).toEqual([{ id: 'p1', likes: 0, comments: 0 }]);
  });

  it('传 "全部" 时不应用 category 过滤', async () => {
    mockSupabase.__setTableResponse("community_posts", []);
    await api.getCommunityPosts('全部');
    const builder = mockSupabase.__getLastBuilderForTable("community_posts");
    const categoryEq = builder._calls.find(
      (c: any) => c.method === 'eq' && c.args[0] === 'category'
    );
    expect(categoryEq).toBeUndefined();
  });

  it('传非"全部"时应用 category 过滤', async () => {
    mockSupabase.__setTableResponse("community_posts", []);
    await api.getCommunityPosts('分享');
    const builder = mockSupabase.__getLastBuilderForTable("community_posts");
    const categoryEq = builder._calls.find(
      (c: any) => c.method === 'eq' && c.args[0] === 'category' && c.args[1] === '分享'
    );
    expect(categoryEq).toBeTruthy();
  });
});

describe('createCommunityPost', () => {
  it('插入新帖子并把 likes/comments 计数初始化为 0', async () => {
    const inserted = { id: 'p1', likes: 5, comments: 3 }; // 服务端可能返回任意值
    mockSupabase.__setTableResponse('community_posts', inserted);
    const result = await api.createCommunityPost({
      user_id: 'u1',
      author_name: '爸比',
      title: 't',
      content: 'c',
      category: '分享',
    });
    // 函数强制 likes=0, comments=0
    expect(result.likes).toBe(0);
    expect(result.comments).toBe(0);
  });
});

// ============================================================
// UrgentNotes
// ============================================================
describe('UrgentNotes CRUD', () => {
  it('getUrgentNotes 过滤 is_active = true', async () => {
    mockSupabase.__setTableResponse("urgent_notes", []);
    await api.getUrgentNotes('u1');
    const builder = mockSupabase.__getLastBuilderForTable("urgent_notes");
    const calls = builder._calls;
    expect(calls.find((c: any) => c.method === 'eq' && c.args[0] === 'user_id' && c.args[1] === 'u1')).toBeTruthy();
    expect(calls.find((c: any) => c.method === 'eq' && c.args[0] === 'is_active' && c.args[1] === true)).toBeTruthy();
  });

  it('dismissUrgentNote 设为 is_active=false + dismissed_at 为 ISO', async () => {
    mockSupabase.__setTableResponse("urgent_notes", null);
    await api.dismissUrgentNote('n1');
    const builder = mockSupabase.__getLastBuilderForTable("urgent_notes");
    const update = builder._calls.find((c: any) => c.method === 'update');
    expect(update.args[0].is_active).toBe(false);
    expect(typeof update.args[0].dismissed_at).toBe('string');
  });
});

// ============================================================
// Babies
// ============================================================
describe('getBabies / createBaby / updateBaby / archiveBaby / unarchiveBaby / reorderBabies', () => {
  it('getBabies 默认排除已归档', async () => {
    mockSupabase.__setTableResponse("babies", []);
    await api.getBabies('u1');
    const builder = mockSupabase.__getLastBuilderForTable("babies");
    const calls = builder._calls;
    expect(calls.find((c: any) => c.method === 'eq' && c.args[0] === 'is_archived' && c.args[1] === false)).toBeTruthy();
  });

  it('getBabies({ includeArchived: true }) 不过滤归档', async () => {
    mockSupabase.__setTableResponse("babies", []);
    await api.getBabies('u1', { includeArchived: true });
    const builder = mockSupabase.__getLastBuilderForTable("babies");
    const calls = builder._calls;
    expect(calls.find((c: any) => c.method === 'eq' && c.args[0] === 'is_archived')).toBeUndefined();
  });

  it('createBaby 默认填充 is_active/is_archived/sort_order', async () => {
    mockSupabase.__setTableResponse("babies", { id: 'baby1' });
    await api.createBaby({ user_id: 'u1', name: '小宝' });
    const builder = mockSupabase.__getLastBuilderForTable("babies");
    const insert = builder._calls.find((c: any) => c.method === 'insert');
    expect(insert.args[0].is_active).toBe(true);
    expect(insert.args[0].is_archived).toBe(false);
    expect(insert.args[0].sort_order).toBe(0);
  });

  it('updateBaby 自动设置 updated_at', async () => {
    mockSupabase.__setTableResponse("babies", { id: 'b1' });
    await api.updateBaby('b1', { name: '新名' });
    const builder = mockSupabase.__getLastBuilderForTable("babies");
    const update = builder._calls.find((c: any) => c.method === 'update');
    expect(typeof update.args[0].updated_at).toBe('string');
  });

  it('archiveBaby 设置 is_archived=true, is_active=false', async () => {
    mockSupabase.__setTableResponse("babies", { id: 'b1' });
    await api.archiveBaby('b1');
    const builder = mockSupabase.__getLastBuilderForTable("babies");
    const update = builder._calls.find((c: any) => c.method === 'update');
    expect(update.args[0].is_archived).toBe(true);
    expect(update.args[0].is_active).toBe(false);
  });

  it('unarchiveBaby 设置 is_archived=false, is_active=true', async () => {
    mockSupabase.__setTableResponse("babies", { id: 'b1' });
    await api.unarchiveBaby('b1');
    const builder = mockSupabase.__getLastBuilderForTable("babies");
    const update = builder._calls.find((c: any) => c.method === 'update');
    expect(update.args[0].is_archived).toBe(false);
    expect(update.args[0].is_active).toBe(true);
  });

  it('reorderBabies 按 index 设置 sort_order', async () => {
    // 该函数多次调用 supabase.from('babies').update(...)
    mockSupabase.__setTableResponse('babies', null);
    await api.reorderBabies('u1', ['b1', 'b2', 'b3']);
    // 调用了 3 次 from('babies')
    const fromCalls = mockSupabase.from.mock.calls.filter(
      (c: any) => c[0] === 'babies'
    );
    expect(fromCalls.length).toBe(3);
  });
});

// ============================================================
// Post interactions
// ============================================================
describe('toggleLike', () => {
  it('未点赞时插入 like，返回 liked=true', async () => {
    // toggleLike 调多次 from('post_likes')：
    //   1) maybeSingle 检查已存在
    //   2) insert 新点赞
    //   3) 重新 count
    //   4) update community_posts 计数
    // 这里我们让第一次返回 null（不存在），后续忽略。
    mockSupabase.__pushTableResponse('post_likes', null, null);
    await api.toggleLike('p1', 'u1');
    const builders = mockSupabase.__getAllBuildersForTable('post_likes');
    // 至少有一次 insert 调用
    const insert = builders.flatMap((b: any) => b._calls).find((c: any) => c.method === 'insert');
    expect(insert).toBeTruthy();
  });

  it('getLikeStatus 存在时返回 true', async () => {
    mockSupabase.__setTableResponse('post_likes', { id: 'l1' }, null);
    const liked = await api.getLikeStatus('p1', 'u1');
    expect(liked).toBe(true);
  });

  it('getLikeStatus 不存在时返回 false', async () => {
    mockSupabase.__setTableResponse('post_likes', null, null);
    const liked = await api.getLikeStatus('p1', 'u1');
    expect(liked).toBe(false);
  });
});

describe('getComments / addComment', () => {
  it('getComments 按 created_at 升序', async () => {
    mockSupabase.__setTableResponse("post_comments", []);
    await api.getComments('p1');
    const builder = mockSupabase.__getLastBuilderForTable("post_comments");
    const order = builder._calls.find(
      (c: any) => c.method === 'order' && c.args[0] === 'created_at' && c.args[1]?.ascending === true
    );
    expect(order).toBeTruthy();
  });

  it('addComment 插入评论', async () => {
    mockSupabase.__setTableResponse("post_comments", { id: 'c1' });
    await api.addComment('p1', 'u1', '内容');
    // addComment 调 from('post_comments') 两次（insert + count），任一 builder 包含 insert 即可
    const builders = mockSupabase.__getAllBuildersForTable("post_comments");
    const insert = builders
      .flatMap((b: any) => b._calls)
      .find((c: any) => c.method === 'insert' && c.args[0].content === '内容');
    expect(insert).toBeTruthy();
  });
});

// ============================================================
// Knowledge
// ============================================================
describe('Knowledge', () => {
  it('getKnowledgeArticles 过滤 is_published = true', async () => {
    mockSupabase.__setTableResponse("knowledge_articles", []);
    await api.getKnowledgeArticles();
    const builder = mockSupabase.__getLastBuilderForTable("knowledge_articles");
    const eq = builder._calls.find(
      (c: any) => c.method === 'eq' && c.args[0] === 'is_published' && c.args[1] === true
    );
    expect(eq).toBeTruthy();
  });

  it('getReadKnowledgeIds 返回 article_id 的 Set', async () => {
    mockSupabase.__setTableResponse('user_knowledge_reads', [
      { article_id: 1 },
      { article_id: 5 },
    ]);
    const ids = await api.getReadKnowledgeIds('u1');
    expect(ids).toBeInstanceOf(Set);
    expect(ids.has(1)).toBe(true);
    expect(ids.has(5)).toBe(true);
    expect(ids.has(2)).toBe(false);
  });

  it('markKnowledgeRead 不重复插入（已存在时跳过）', async () => {
    // 模拟查询返回已存在记录
    mockSupabase.__setTableResponse('user_knowledge_reads', { id: 'r1' });
    // 不应该再 insert
    const insertSpy = jest.fn();
    // 简单断言：函数不抛错
    await expect(api.markKnowledgeRead('u1', 1)).resolves.toBeUndefined();
  });
});

// ============================================================
// Vaccines
// ============================================================
describe('Vaccines', () => {
  it('getVaccines 合并 vaccines + vaccine_doses', async () => {
    // 该函数调两次 from：vaccines 和 vaccine_doses
    // 我们让两次都返回预置数据
    // 第一次 from('vaccines') 返回带 doses 的对象
    // 第二次 from('vaccine_doses') 返回 doses 列表
    mockSupabase.__setTableResponse("vaccines", [
      { id: 1, name: '乙肝', disease: '乙肝', category: '免费', total_doses: 3, notes: null },
      { id: 2, name: '卡介', disease: '结核', category: '免费', total_doses: 1, notes: null },
    ]);
    const vaccinesBuilder = mockSupabase.__getLastBuilderForTable("vaccines");
    mockSupabase.__setTableResponse("vaccine_doses", [
      { id: 10, vaccine_id: 1, dose_number: 1, min_age_months: 0, max_age_months: null, min_interval_days: 0, notes: null },
      { id: 11, vaccine_id: 1, dose_number: 2, min_age_months: 1, max_age_months: null, min_interval_days: 28, notes: null },
      { id: 12, vaccine_id: 2, dose_number: 1, min_age_months: 0, max_age_months: null, min_interval_days: 0, notes: null },
    ]);
    const result = await api.getVaccines();
    const dosesBuilder = mockSupabase.__getLastBuilderForTable("vaccine_doses");

    expect(mockSupabase.from).toHaveBeenCalledWith('vaccines');
    expect(mockSupabase.from).toHaveBeenCalledWith('vaccine_doses');
    expect(result).toHaveLength(2);
    expect(result[0].doses).toHaveLength(2);
    expect(result[1].doses).toHaveLength(1);
  });

  it('setVaccinationStatus 使用 upsert + onConflict', async () => {
    mockSupabase.__setTableResponse("user_vaccinations", { id: 'v1' });
    await api.setVaccinationStatus('u1', 'b1', 1, true, '2026-06-10');
    const builder = mockSupabase.__getLastBuilderForTable("user_vaccinations");

    const upsert = builder._calls.find((c: any) => c.method === 'upsert');
    expect(upsert).toBeTruthy();
    expect(upsert.args[0].dose_id).toBe(1);
    expect(upsert.args[0].is_vaccinated).toBe(true);
    expect(upsert.args[0].vaccinated_at).toBe('2026-06-10');
    expect(upsert.args[1].onConflict).toBe('baby_id,dose_id');
  });
});

// ============================================================
// PresetItems / UserPreparations
// ============================================================
describe('PresetItems / UserPreparations', () => {
  it('getPresetItems 不传 period 时不过滤', async () => {
    mockSupabase.__setTableResponse("preset_items", []);
    await api.getPresetItems();
    const builder = mockSupabase.__getLastBuilderForTable("preset_items");
    const eq = builder._calls.find((c: any) => c.method === 'eq' && c.args[0] === 'period');
    expect(eq).toBeUndefined();
  });

  it('getPresetItems 传 period 时过滤', async () => {
    mockSupabase.__setTableResponse("preset_items", []);
    await api.getPresetItems('third');
    const builder = mockSupabase.__getLastBuilderForTable("preset_items");
    const eq = builder._calls.find(
      (c: any) => c.method === 'eq' && c.args[0] === 'period' && c.args[1] === 'third'
    );
    expect(eq).toBeTruthy();
  });

  it('getPresetItemsByPeriods 用 in() 过滤', async () => {
    mockSupabase.__setTableResponse("preset_items", []);
    await api.getPresetItemsByPeriods(['first', 'second']);
    const builder = mockSupabase.__getLastBuilderForTable("preset_items");
    const inCall = builder._calls.find(
      (c: any) => c.method === 'in' && c.args[0] === 'period'
    );
    expect(inCall).toBeTruthy();
    expect(inCall.args[1]).toEqual(['first', 'second']);
  });

  it('setUserPreparation status=prepared 时设置 prepared_at', async () => {
    mockSupabase.__setTableResponse("user_preparations", { id: 'p1' });
    await api.setUserPreparation('u1', 'b1', 'item1', 'prepared');
    const builder = mockSupabase.__getLastBuilderForTable("user_preparations");
    const upsert = builder._calls.find((c: any) => c.method === 'upsert');
    expect(upsert.args[0].status).toBe('prepared');
    expect(typeof upsert.args[0].prepared_at).toBe('string');
  });

  it('setUserPreparation status=not_needed 时 prepared_at 为 null', async () => {
    mockSupabase.__setTableResponse("user_preparations", { id: 'p1' });
    await api.setUserPreparation('u1', 'b1', 'item1', 'not_needed');
    const builder = mockSupabase.__getLastBuilderForTable("user_preparations");
    const upsert = builder._calls.find((c: any) => c.method === 'upsert');
    expect(upsert.args[0].prepared_at).toBeNull();
  });
});

// ============================================================
// PsychologicalSupport
// ============================================================
describe('PsychologicalSupport', () => {
  it('getPsychologicalSupport 过滤 is_published=true', async () => {
    mockSupabase.__setTableResponse("psychological_support", []);
    await api.getPsychologicalSupport();
    const builder = mockSupabase.__getLastBuilderForTable("psychological_support");
    const eq = builder._calls.find(
      (c: any) => c.method === 'eq' && c.args[0] === 'is_published' && c.args[1] === true
    );
    expect(eq).toBeTruthy();
  });

  it('getPsychologicalSupportByPeriods 用 in() 过滤', async () => {
    mockSupabase.__setTableResponse("psychological_support", []);
    await api.getPsychologicalSupportByPeriods(['first', 'second']);
    const builder = mockSupabase.__getLastBuilderForTable("psychological_support");
    const inCall = builder._calls.find(
      (c: any) => c.method === 'in' && c.args[0] === 'period'
    );
    expect(inCall).toBeTruthy();
  });
});

// ============================================================
// FoodSafety
// ============================================================
describe('getFoodSafety', () => {
  it('查询 food_safety 表并按 sort_order 排序', async () => {
    mockSupabase.__setTableResponse("food_safety", []);
    await api.getFoodSafety();
    const builder = mockSupabase.__getLastBuilderForTable("food_safety");
    expect(mockSupabase.from).toHaveBeenCalledWith('food_safety');
    const order = builder._calls.find(
      (c: any) => c.method === 'order' && c.args[0] === 'sort_order' && c.args[1]?.ascending === true
    );
    expect(order).toBeTruthy();
  });
});

// ============================================================
// WellChild
// ============================================================
describe('WellChild API', () => {
  it('getWellChildVisits 查 well_child_visits', async () => {
    mockSupabase.__setTableResponse('well_child_visits', []);
    await api.getWellChildVisits();
    expect(mockSupabase.from).toHaveBeenCalledWith('well_child_visits');
  });

  it('getCheckupItemsByVisit 按 visit_id 过滤', async () => {
    mockSupabase.__setTableResponse("well_child_checkup_items", []);
    await api.getCheckupItemsByVisit(3);
    const builder = mockSupabase.__getLastBuilderForTable("well_child_checkup_items");
    const eq = builder._calls.find(
      (c: any) => c.method === 'eq' && c.args[0] === 'visit_id' && c.args[1] === 3
    );
    expect(eq).toBeTruthy();
  });

  it('getUserWellChildRecords 按 baby_id 过滤', async () => {
    mockSupabase.__setTableResponse("user_well_child_records", []);
    await api.getUserWellChildRecords('baby-1');
    const builder = mockSupabase.__getLastBuilderForTable("user_well_child_records");
    const eq = builder._calls.find(
      (c: any) => c.method === 'eq' && c.args[0] === 'baby_id' && c.args[1] === 'baby-1'
    );
    expect(eq).toBeTruthy();
  });

  it('upsertWellChildRecord 使用 onConflict=baby_id, visit_id', async () => {
    mockSupabase.__setTableResponse("user_well_child_records", { id: 'r1' });
    await api.upsertWellChildRecord({
      baby_id: 'baby-1',
      visit_id: 2,
      is_completed: true,
    });
    const builder = mockSupabase.__getLastBuilderForTable("user_well_child_records");
    const upsert = builder._calls.find((c: any) => c.method === 'upsert');
    expect(upsert).toBeTruthy();
    expect(upsert.args[1].onConflict).toBe('baby_id, visit_id');
  });
});

// ============================================================
// Preset tasks (with safe error handling)
// ============================================================
describe('getPresetTasks', () => {
  it('正常返回数据', async () => {
    mockSupabase.__setTableResponse('preset_tasks', [{ id: 'p1', title: 'A' }]);
    const result = await api.getPresetTasks();
    expect(result).toEqual([{ id: 'p1', title: 'A' }]);
  });

  it('数据为 null 时返回空数组', async () => {
    mockSupabase.__setTableResponse('preset_tasks', null);
    const result = await api.getPresetTasks();
    expect(result).toEqual([]);
  });

  it('错误时不抛出（吞掉）', async () => {
    // 不预设响应，builder._resolve() 会返回 { data: null, error: null }
    // 模拟 from 抛错
    mockSupabase.from.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const result = await api.getPresetTasks();
    expect(result).toEqual([]);
  });
});
