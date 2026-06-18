/**
 * AppContext — 全局状态管理
 *
 * P1 #8 拆分后的构架：
 * - AppContext.tsx     → Provider 外壳 + loadUserData + 类型重导出
 * - types.ts          → AppState / Action / reducer / initialState
 * - notifyError.ts    → 跨平台错误反馈工具
 * - ensurePresetTasks.ts → 预设任务注入工具
 * - hooks/useTaskActions.ts     → toggleTask / addTask / removeTask / updateTask
 * - hooks/useRecordActions.ts   → addRecord / removeRecord
 * - hooks/useCommunityActions.ts → refreshCommunityPosts / addPost / 紧急事项
 * - hooks/useBabyActions.ts     → addBaby / updateBabyGender / setActiveBaby / archiveBaby / reorderBabies
 *
 * 对外接口（不变）：
 * ```
 * import { useApp, Task, Record, Baby, CommunityPost } from '../context/AppContext';
 * const { state, dispatch, toggleTask, addTask, ... } = useApp();
 * ```
 */
import { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  getBabies, getTasks, getRecords, getCommunityPosts, getUrgentNotes,
} from '../lib/api';
import { calculateStageFromDueDate, calculateBirthAge } from '../lib/stages';
import { loadCurrentBabyId, saveCurrentBabyId } from '../lib/storage';
import { useTaskActions } from './hooks/useTaskActions';
import { useRecordActions } from './hooks/useRecordActions';
import { useCommunityActions } from './hooks/useCommunityActions';
import { useBabyActions } from './hooks/useBabyActions';
import { ensurePresetTasksForBaby } from './ensurePresetTasks';

// ─── 类型重导出（保持所有 useApp 调用者兼容） ───
export type {
  Task,
  UserRecord as Record,
  UrgentNote,
  Baby,
  CommunityPost,
  AppState,
  AppAction,
} from './types';

// 额外导出 initialState / reducer 供测试和内部使用
export { initialState, reducer } from './types';
import { initialState, reducer } from './types';
import type { AppState, AppAction } from './types';

// ─── Context shape ───
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  toggleTask: (id: string) => Promise<void>;
  addTask: (task: Partial<import('./types').Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<import('./types').Task>) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  addRecord: (record: Partial<import('./types').UserRecord>) => Promise<void>;
  removeRecord: (id: string) => Promise<void>;
  refreshCommunityPosts: (category?: string) => Promise<void>;
  addPost: (post: { title: string; content: string; category: string }) => Promise<void>;
  addUrgentNote: (content: string) => Promise<void>;
  dismissUrgentNote: (id: string) => Promise<void>;
  addBaby: (dueDate: string, name?: string, birthDate?: string) => Promise<void>;
  updateBabyGender: (babyId: string, gender: string, dueDate?: string, birthDate?: string, name?: string) => Promise<void>;
  setActiveBaby: (id: string) => Promise<void>;
  archiveBaby: (id: string) => Promise<void>;
  reorderBabies: (orderedIds: string[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user } = useAuth();

  // ─── 子 hook 组合 ───
  const taskActions = useTaskActions(user, state, dispatch);
  const recordActions = useRecordActions(user, state, dispatch);
  const communityActions = useCommunityActions(user, state, dispatch);
  const babyActions = useBabyActions(user, state, dispatch);

  // ─── 数据加载 / 登出清理 ───
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      // P1 #6 修复：登出后清理 state，避免下一个登录账号短暂看到旧数据
      dispatch({ type: 'RESET' });
    }
  }, [user]);

  async function loadUserData() {
    // 函数依赖 user；useEffect 已经判断过 user 非空才调用，这里再做一次安全检查
    if (!user) return;
    const userId = user.id;
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // 从 DB 获取所有宝宝（按 sort_order 排序，排除已归档）
      const babiesData = await getBabies(userId);
      const activeBabies = babiesData.filter(b => !b.is_archived);

      // 持久化中读上次 currentBabyId，首位 active 宝宝兜底
      const persisted = await loadCurrentBabyId(userId);
      const currentBaby = activeBabies.find(b => b.id === persisted) ?? activeBabies[0] ?? null;
      const currentBabyId = currentBaby?.id ?? null;
      await saveCurrentBabyId(userId, currentBabyId);

      // 根据当前宝宝的预产期计算孕期
      let autoStage: import('./types').AppState['stage'] = 'preconception';
      let weeksPregnant = 0;
      let birthAgeLabel = '';
      if (currentBaby?.due_date) {
        const calc = calculateStageFromDueDate(currentBaby.due_date);
        autoStage = calc.stage;
        weeksPregnant = calc.weeksPregnant;
        if (calc.stage === 'postpartum') {
          birthAgeLabel = calculateBirthAge(currentBaby.due_date, currentBaby.birth_date);
        }
      }

      // 并行拉取按当前宝宝维度的数据
      const [tasksData, recordsData, postsData, urgentNotesData] = await Promise.all([
        currentBabyId ? getTasks(userId, currentBabyId) : Promise.resolve([]),
        currentBabyId ? getRecords(userId, currentBabyId) : Promise.resolve([]),
        getCommunityPosts(),
        getUrgentNotes(userId),
      ]);

      const todayStr = new Date().toISOString().split('T')[0];

      dispatch({
        type: 'SET_TASKS',
        payload: tasksData.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || undefined,
          stage: t.stage as import('./types').AppState['stage'],
          type: t.type,
          taskSubtype: t.task_subtype || 'one_time',
          dueDate: t.due_date || undefined,
          completedAt: t.completed_at || undefined,
          dailyCount: t.daily_date === todayStr ? t.daily_count : 0,
          dailyDate: t.daily_date === todayStr ? t.daily_date : undefined,
          isCompleted: t.type === 'checkin' ? t.last_checkin_date === todayStr : t.is_completed,
          streakCount: t.streak_count || 0,
          lastCheckinDate: t.last_checkin_date || undefined,
        })),
      });

      dispatch({
        type: 'SET_RECORDS',
        payload: recordsData.map(r => ({
          id: r.id,
          title: r.title,
          content: r.content,
          isPrivate: r.is_private,
          createdAt: new Date(r.created_at).toLocaleDateString('zh-CN'),
        })),
      });

      dispatch({
        type: 'SET_COMMUNITY_POSTS',
        payload: postsData.map(p => ({
          id: p.id,
          userId: p.user_id,
          authorName: p.author_name,
          title: p.title,
          content: p.content,
          category: p.category,
          likes: p.likes,
          comments: p.comments,
          createdAt: p.created_at,
        })),
      });

      dispatch({
        type: 'SET_URGENT_NOTES',
        payload: urgentNotesData.map(n => ({
          id: n.id,
          content: n.content,
          isActive: n.is_active,
          createdAt: new Date(n.created_at).toLocaleDateString('zh-CN'),
        })),
      });

      dispatch({ type: 'SET_STAGE', payload: autoStage });

      dispatch({
        type: 'SET_BABIES',
        payload: {
          babies: (babiesData || []).map(b => ({
            id: b.id,
            dueDate: b.due_date,
            birthDate: b.birth_date,
            name: b.name,
            gender: b.gender || undefined,
            is_active: b.is_active,
            is_archived: b.is_archived,
            sort_order: b.sort_order,
          })),
          stage: autoStage,
          weeksPregnant,
          birthAgeLabel,
        },
      });

      dispatch({ type: 'SET_CURRENT_BABY', payload: currentBabyId });

      // 预设任务注入：按 (user_id, title) 唯一判断，避免跨宝宝重复
      if (currentBabyId) {
        await ensurePresetTasksForBaby(userId, currentBabyId);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  // ─── Provider 值 ───
  const value: AppContextType = {
    state,
    dispatch,
    ...taskActions,
    ...recordActions,
    ...communityActions,
    ...babyActions,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
