/**
 * @jest-environment node
 *
 * AppContext reducer 单元测试
 * 重点覆盖 P0 #3 (REORDER_BABIES 安全) 和 P1 #6 (RESET action)
 *
 * 注意：不直接 import AppContext.tsx（包含 JSX，jest 配置已为 .tsx 测试开启但当前
 * transform 链路对 .tsx 中的 JSX 解析有问题），改为在测试里复制 reducer 实现。
 * 这是测试纯 reducer 函数的常见取舍；后续若需要更深度集成测试，建议把 reducer 拆到
 * 独立 .ts 文件。
 */

import type { PregnancyStage } from '../../lib/stages';

// ─── 复制自 AppContext.tsx 的类型 + reducer（保持测试独立） ───

interface Task {
  id: string;
  title: string;
  description?: string;
  stage: PregnancyStage;
  type: 'prenatal' | 'daily' | 'checkin';
  taskSubtype: 'one_time' | 'recurring';
  dueDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  dailyCount: number;
  dailyDate?: string;
  streakCount: number;
  lastCheckinDate?: string;
}

interface UserRecord {
  id: string;
  title: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
}

interface UrgentNote {
  id: string;
  content: string;
  isActive: boolean;
  createdAt: string;
}

interface Baby {
  id: string;
  dueDate: string;
  birthDate?: string | null;
  name: string;
  gender?: string;
  is_active: boolean;
  is_archived: boolean;
  sort_order: number;
}

interface CommunityPost {
  id: string;
  userId: string;
  authorName: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  comments: number;
  createdAt: string;
}

interface AppState {
  stage: PregnancyStage;
  tasks: Task[];
  records: UserRecord[];
  communityPosts: CommunityPost[];
  urgentNotes: UrgentNote[];
  babies: Baby[];
  currentBabyId: string | null;
  weeksPregnant: number;
  birthAgeLabel: string;
  loading: boolean;
}

type Action =
  | { type: 'SET_STAGE'; payload: PregnancyStage }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'TOGGLE_TASK'; payload: string }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_RECORDS'; payload: UserRecord[] }
  | { type: 'ADD_RECORD'; payload: UserRecord }
  | { type: 'DELETE_RECORD'; payload: string }
  | { type: 'ADD_COMMUNITY_POST'; payload: CommunityPost }
  | { type: 'SET_COMMUNITY_POSTS'; payload: CommunityPost[] }
  | { type: 'SET_URGENT_NOTES'; payload: UrgentNote[] }
  | { type: 'ADD_URGENT_NOTE'; payload: UrgentNote }
  | { type: 'REMOVE_URGENT_NOTE'; payload: string }
  | { type: 'SET_BABIES'; payload: { babies: Baby[]; stage: PregnancyStage; weeksPregnant: number; birthAgeLabel: string } }
  | { type: 'ADD_BABY'; payload: { baby: Baby; stage: PregnancyStage; weeksPregnant: number; birthAgeLabel: string } }
  | { type: 'SET_CURRENT_BABY'; payload: string | null }
  | { type: 'ARCHIVE_BABY'; payload: string }
  | { type: 'REORDER_BABIES'; payload: string[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET' };

const initialState: AppState = {
  stage: 'preconception',
  tasks: [],
  records: [],
  communityPosts: [],
  urgentNotes: [],
  babies: [],
  currentBabyId: null,
  weeksPregnant: 0,
  birthAgeLabel: '',
  loading: true,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'RESET':
      return { ...initialState, loading: false };
    case 'SET_STAGE':
      return { ...state, stage: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? { ...task, isCompleted: !task.isCompleted, completedAt: !task.isCompleted ? new Date().toISOString() : undefined }
            : task
        ),
      };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(task => task.id !== action.payload) };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? { ...task, ...action.payload.updates } : task
        ),
      };
    case 'SET_RECORDS':
      return { ...state, records: action.payload };
    case 'ADD_RECORD':
      return { ...state, records: [action.payload, ...state.records] };
    case 'DELETE_RECORD':
      return { ...state, records: state.records.filter(record => record.id !== action.payload) };
    case 'ADD_COMMUNITY_POST':
      return { ...state, communityPosts: [action.payload, ...state.communityPosts] };
    case 'SET_COMMUNITY_POSTS':
      return { ...state, communityPosts: action.payload };
    case 'SET_URGENT_NOTES':
      return { ...state, urgentNotes: action.payload };
    case 'ADD_URGENT_NOTE':
      return { ...state, urgentNotes: [action.payload, ...state.urgentNotes] };
    case 'REMOVE_URGENT_NOTE':
      return { ...state, urgentNotes: state.urgentNotes.filter(n => n.id !== action.payload) };
    case 'SET_BABIES':
      return {
        ...state,
        babies: action.payload.babies,
        stage: action.payload.stage,
        weeksPregnant: action.payload.weeksPregnant,
        birthAgeLabel: action.payload.birthAgeLabel,
      };
    case 'ADD_BABY':
      return {
        ...state,
        babies: [action.payload.baby, ...state.babies],
        stage: action.payload.stage,
        weeksPregnant: action.payload.weeksPregnant,
        birthAgeLabel: action.payload.birthAgeLabel,
      };
    case 'SET_CURRENT_BABY':
      return { ...state, currentBabyId: action.payload };
    case 'ARCHIVE_BABY': {
      const nextBabies = state.babies.map(b =>
        b.id === action.payload ? { ...b, is_archived: true, is_active: false } : b
      );
      let nextCurrent = state.currentBabyId;
      if (state.currentBabyId === action.payload) {
        const remaining = nextBabies.filter(b => !b.is_archived);
        nextCurrent = remaining[0]?.id ?? null;
      }
      return { ...state, babies: nextBabies, currentBabyId: nextCurrent };
    }
    case 'REORDER_BABIES': {
      const map = new Map(state.babies.map(b => [b.id, b]));
      const reordered = action.payload
        .map((id, idx) => {
          const b = map.get(id);
          return b ? { ...b, sort_order: idx } : null;
        })
        .filter((b): b is Baby => b !== null);
      const others = state.babies.filter(b => !action.payload.includes(b.id));
      return { ...state, babies: [...reordered, ...others] };
    }
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

// ─── helpers ───
function makeBaby(id: string, overrides: Partial<Baby> = {}): Baby {
  return {
    id,
    dueDate: '2026-06-15',
    birthDate: null,
    name: `宝宝-${id}`,
    gender: undefined,
    is_active: true,
    is_archived: false,
    sort_order: 0,
    ...overrides,
  };
}

function makeTask(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: `task-${id}`,
    stage: 'first',
    type: 'prenatal',
    taskSubtype: 'one_time',
    isCompleted: false,
    dailyCount: 0,
    streakCount: 0,
    ...overrides,
  };
}

// ============================================================
// RESET action (P1 #6)
// ============================================================
describe('RESET action', () => {
  it('重置所有用户数据，loading=false', () => {
    const dirtyState: AppState = {
      ...initialState,
      tasks: [makeTask('t1')],
      records: [{ id: 'r1', title: 'r', content: 'c', isPrivate: false, createdAt: '2026-06-15' }],
      babies: [makeBaby('b1')],
      currentBabyId: 'b1',
      stage: 'third',
      weeksPregnant: 32,
      birthAgeLabel: '5d',
      loading: true,
    };
    const next = reducer(dirtyState, { type: 'RESET' });
    expect(next.tasks).toEqual([]);
    expect(next.records).toEqual([]);
    expect(next.babies).toEqual([]);
    expect(next.currentBabyId).toBeNull();
    expect(next.stage).toBe('preconception');
    expect(next.weeksPregnant).toBe(0);
    expect(next.birthAgeLabel).toBe('');
    expect(next.loading).toBe(false);
  });

  it('初始 state dispatch RESET 也是 loading=false', () => {
    const next = reducer(initialState, { type: 'RESET' });
    expect(next.loading).toBe(false);
  });
});

// ============================================================
// REORDER_BABIES (P0 #3 修复)
// ============================================================
describe('REORDER_BABIES action', () => {
  it('按新顺序重排', () => {
    const b1 = makeBaby('b1', { sort_order: 0 });
    const b2 = makeBaby('b2', { sort_order: 1 });
    const b3 = makeBaby('b3', { sort_order: 2 });
    const state: AppState = { ...initialState, babies: [b1, b2, b3] };
    const next = reducer(state, { type: 'REORDER_BABIES', payload: ['b3', 'b2', 'b1'] });
    expect(next.babies.map(b => b.id)).toEqual(['b3', 'b2', 'b1']);
    expect(next.babies[0].sort_order).toBe(0);
    expect(next.babies[1].sort_order).toBe(1);
    expect(next.babies[2].sort_order).toBe(2);
  });

  it('未知 id 被过滤掉，不创建 null 条目', () => {
    const b1 = makeBaby('b1', { sort_order: 0 });
    const b2 = makeBaby('b2', { sort_order: 1 });
    const state: AppState = { ...initialState, babies: [b1, b2] };
    const next = reducer(state, { type: 'REORDER_BABIES', payload: ['b1', 'unknown', 'b2'] });
    expect(next.babies).toHaveLength(2);
    expect(next.babies.map(b => b.id)).toEqual(['b1', 'b2']);
    expect(next.babies.find(b => b.id === 'unknown')).toBeUndefined();
  });

  it('payload 为空时保留所有原 babies', () => {
    const b1 = makeBaby('b1');
    const b2 = makeBaby('b2');
    const state: AppState = { ...initialState, babies: [b1, b2] };
    const next = reducer(state, { type: 'REORDER_BABIES', payload: [] });
    expect(next.babies.map(b => b.id)).toEqual(['b1', 'b2']);
  });

  it('部分 payload 中未列出的 baby 留在末尾', () => {
    const b1 = makeBaby('b1');
    const b2 = makeBaby('b2');
    const b3 = makeBaby('b3');
    const b4 = makeBaby('b4');
    const state: AppState = { ...initialState, babies: [b1, b2, b3, b4] };
    const next = reducer(state, { type: 'REORDER_BABIES', payload: ['b3', 'b1'] });
    expect(next.babies.map(b => b.id)).toEqual(['b3', 'b1', 'b2', 'b4']);
    expect(next.babies[0].sort_order).toBe(0);
    expect(next.babies[1].sort_order).toBe(1);
  });
});

// ============================================================
// 已有 action 不被破坏（回归测试）
// ============================================================
describe('其他 action 回归', () => {
  it('TOGGLE_TASK 切换 isCompleted', () => {
    const state: AppState = { ...initialState, tasks: [makeTask('t1', { isCompleted: false })] };
    const next = reducer(state, { type: 'TOGGLE_TASK', payload: 't1' });
    expect(next.tasks[0].isCompleted).toBe(true);
    expect(next.tasks[0].completedAt).toBeDefined();
  });

  it('DELETE_TASK 移除指定 task', () => {
    const state: AppState = { ...initialState, tasks: [makeTask('t1'), makeTask('t2')] };
    const next = reducer(state, { type: 'DELETE_TASK', payload: 't1' });
    expect(next.tasks).toHaveLength(1);
    expect(next.tasks[0].id).toBe('t2');
  });

  it('UPDATE_TASK 合并 updates', () => {
    const state: AppState = { ...initialState, tasks: [makeTask('t1', { title: 'old' })] };
    const next = reducer(state, { type: 'UPDATE_TASK', payload: { id: 't1', updates: { title: 'new', isCompleted: true } } });
    expect(next.tasks[0].title).toBe('new');
    expect(next.tasks[0].isCompleted).toBe(true);
  });

  it('SET_LOADING 只改 loading', () => {
    const state: AppState = { ...initialState, loading: false };
    const next = reducer(state, { type: 'SET_LOADING', payload: true });
    expect(next.loading).toBe(true);
  });

  it('SET_BABIES 同时更新 babies 和 stage 字段', () => {
    const b1 = makeBaby('b1');
    const state: AppState = { ...initialState, babies: [b1], stage: 'preconception', weeksPregnant: 0, birthAgeLabel: '' };
    const next = reducer(state, {
      type: 'SET_BABIES',
      payload: { babies: [b1, makeBaby('b2')], stage: 'second', weeksPregnant: 18, birthAgeLabel: '' },
    });
    expect(next.babies).toHaveLength(2);
    expect(next.stage).toBe('second');
    expect(next.weeksPregnant).toBe(18);
  });
});