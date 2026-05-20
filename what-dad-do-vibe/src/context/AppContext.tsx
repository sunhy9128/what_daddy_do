import { createContext, useContext, useEffect, useReducer, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getTasks, createTask, toggleTaskComplete, deleteTask, updateTask as updateTaskInDb, getRecords, createRecord, deleteRecord, getCommunityPosts, incrementDailyCount as incrementDailyCountApi } from '../lib/api';
import { supabase } from '../lib/supabase';

// Types
export type PregnancyStage = 'preconception' | 'first' | 'second' | 'third';

export interface Task {
  id: string;
  title: string;
  description?: string;
  stage: PregnancyStage;
  type: 'prenatal' | 'daily' | 'custom' | 'checkin';
  taskSubtype: 'one_time' | 'recurring';
  dueDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  dailyCount: number;
  dailyDate?: string;
  streakCount: number;
  lastCheckinDate?: string;
}

export interface Record {
  id: string;
  title: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
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
  records: Record[];
  communityPosts: CommunityPost[];
  loading: boolean;
}

type Action =
  | { type: 'SET_STAGE'; payload: PregnancyStage }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'TOGGLE_TASK'; payload: string }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_RECORDS'; payload: Record[] }
  | { type: 'ADD_RECORD'; payload: Record }
  | { type: 'DELETE_RECORD'; payload: string }
  | { type: 'SET_COMMUNITY_POSTS'; payload: CommunityPost[] }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AppState = {
  stage: 'first',
  tasks: [],
  records: [],
  communityPosts: [],
  loading: true,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
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
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates }
            : task
        ),
      };
    case 'SET_RECORDS':
      return { ...state, records: action.payload };
    case 'ADD_RECORD':
      return { ...state, records: [action.payload, ...state.records] };
    case 'DELETE_RECORD':
      return { ...state, records: state.records.filter(record => record.id !== action.payload) };
    case 'SET_COMMUNITY_POSTS':
      return { ...state, communityPosts: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  toggleTask: (id: string) => Promise<void>;
  addTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  addRecord: (record: Partial<Record>) => Promise<void>;
  removeRecord: (id: string) => Promise<void>;
  refreshCommunityPosts: (category?: string) => Promise<void>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user } = useAuth();

  // 预设任务数据 - 按孕期阶段分类
  const presetTasks = [
    // 备孕阶段
    { title: '孕前体检', description: '全面体检，包括血常规、尿常规、肝肾功能', stage: 'preconception' as const, type: 'prenatal' as const },
    { title: '补充叶酸', description: '每天400微克，预防胎儿神经管畸形', stage: 'preconception' as const, type: 'daily' as const },
    { title: '戒酒戒烟', description: '提前3个月戒酒戒烟', stage: 'preconception' as const, type: 'custom' as const },
    { title: '作息调整', description: '保持规律作息，充足睡眠', stage: 'preconception' as const, type: 'daily' as const },
    // 孕早期
    { title: '首次产检', description: '确认怀孕，建立孕期档案', stage: 'first' as const, type: 'prenatal' as const, due_date: '2026-06-15' },
    { title: 'NT检查', description: '胎儿颈项透明层厚度检查', stage: 'first' as const, type: 'prenatal' as const, due_date: '2026-07-01' },
    { title: '建档', description: '建立母子健康档案', stage: 'first' as const, type: 'prenatal' as const },
    { title: '唐氏筛查', description: '早期唐氏综合征筛查', stage: 'first' as const, type: 'prenatal' as const },
    // 孕中期
    { title: '大排畸B超', description: '系统超声检查，全面排查胎儿结构畸形', stage: 'second' as const, type: 'prenatal' as const, due_date: '2026-08-15' },
    { title: '糖耐量测试', description: '筛查妊娠期糖尿病', stage: 'second' as const, type: 'prenatal' as const, due_date: '2026-09-01' },
    { title: '胎儿心脏彩超', description: '检查胎儿心脏发育', stage: 'second' as const, type: 'prenatal' as const },
    { title: '营养补充', description: '补充钙、铁、DHA', stage: 'second' as const, type: 'daily' as const },
    // 孕晚期
    { title: '小排畸B超', description: '孕晚期超声检查，确认胎儿发育情况', stage: 'third' as const, type: 'prenatal' as const, due_date: '2026-10-15' },
    { title: '胎心监护', description: '32周后每周一次，36周后每周两次', stage: 'third' as const, type: 'prenatal' as const },
    { title: 'B族链球菌检测', description: '36周筛查，预防新生儿感染', stage: 'third' as const, type: 'prenatal' as const },
    { title: '数胎动', description: '每日3次记录胎动', stage: 'third' as const, type: 'daily' as const },
    { title: '血糖监控', description: '每日三餐后测量', stage: 'third' as const, type: 'daily' as const },
    { title: '体重监测', description: '每周固定时间测量', stage: 'third' as const, type: 'daily' as const },
    { title: '待产包准备', description: '打包入院物品清单', stage: 'third' as const, type: 'custom' as const },
    { title: '产后准备', description: '了解产后护理知识', stage: 'third' as const, type: 'custom' as const },
    // 日打卡任务
    { title: '服用叶酸', description: '每天服用叶酸补充剂', stage: 'preconception' as const, type: 'checkin' as const },
    { title: '服用叶酸', description: '每天服用叶酸补充剂', stage: 'first' as const, type: 'checkin' as const },
    { title: '服用叶酸', description: '每天服用叶酸补充剂', stage: 'second' as const, type: 'checkin' as const },
    { title: '服用叶酸', description: '每天服用叶酸补充剂', stage: 'third' as const, type: 'checkin' as const },
    { title: '孕期瑜伽', description: '每天进行孕期瑜伽练习', stage: 'second' as const, type: 'checkin' as const },
    { title: '数胎动', description: '每日3次记录胎动', stage: 'third' as const, type: 'checkin' as const },
  ];

  // 加载用户数据
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  async function loadUserData() {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const [tasksData, recordsData, postsData] = await Promise.all([
        getTasks(user!.id),
        getRecords(user!.id),
        getCommunityPosts(),
      ]);

      dispatch({
        type: 'SET_TASKS',
        payload: tasksData.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || undefined,
          stage: t.stage as PregnancyStage,
          type: t.type,
          taskSubtype: t.task_subtype || 'one_time',
          dueDate: t.due_date || undefined,
          isCompleted: t.is_completed,
          completedAt: t.completed_at || undefined,
          dailyCount: t.daily_count || 0,
          dailyDate: t.daily_date || undefined,
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
          authorName: p.author_name,
          title: p.title,
          content: p.content,
          category: p.category,
          likes: p.likes,
          comments: p.comments,
          createdAt: p.created_at,
        })),
      });

      // 首次加载时如果没有任务，自动添加预设任务
      if (tasksData.length === 0) {
        await addPresetTasks(user!.id);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  async function addPresetTasks(userId: string) {
    for (const task of presetTasks) {
      try {
        await createTask({
          user_id: userId,
          title: task.title,
          description: task.description,
          stage: task.stage,
          type: task.type,
          due_date: task.due_date || null,
          is_completed: false,
        });
      } catch (e) {
        console.error('Failed to create preset task:', task.title);
      }
    }
  }

  const toggleTask = useCallback(async (id: string) => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    const today = new Date().toISOString().split('T')[0];

    // 日打卡任务：计算连续打卡天数
    if (task.type === 'checkin') {
      let newStreak = 1;
      if (task.lastCheckinDate) {
        const lastDate = new Date(task.lastCheckinDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          // 今天已打卡，不重复打卡
          return;
        } else if (diffDays === 1) {
          // 昨天打卡了，连续
          newStreak = task.streakCount + 1;
        }
        // 否则中断了，streak 归零重新开始
      }

      dispatch({
        type: 'UPDATE_TASK',
        payload: {
          id,
          updates: { streakCount: newStreak, lastCheckinDate: today }
        }
      });

      await updateTaskInDb(id, { streak_count: newStreak, last_checkin_date: today });
    }
    // 日常任务点击增加计数
    else if (task.taskSubtype === 'recurring') {
      const newCount = task.dailyDate === today ? task.dailyCount + 1 : 1;

      dispatch({
        type: 'UPDATE_TASK',
        payload: {
          id,
          updates: { dailyCount: newCount, dailyDate: today }
        }
      });

      await incrementDailyCountApi(id, task.dailyCount);
    } else {
      // 一次性任务点击切换完成状态
      dispatch({ type: 'TOGGLE_TASK', payload: id });
      await toggleTaskComplete(id, !task.isCompleted);
    }
  }, [state.tasks]);

  const addTask = useCallback(async (task: Partial<Task>) => {
    if (!user) return;

    const taskSubtype = task.taskSubtype || (task.type === 'daily' ? 'recurring' : 'one_time');

    const newTask = await createTask({
      user_id: user.id,
      title: task.title,
      description: task.description || null,
      stage: task.stage,
      type: task.type,
      task_subtype: taskSubtype,
      due_date: task.dueDate || null,
      is_completed: false,
      daily_count: 0,
    });

    dispatch({
      type: 'ADD_TASK',
      payload: {
        id: newTask.id,
        title: newTask.title,
        description: newTask.description || undefined,
        stage: newTask.stage as PregnancyStage,
        type: newTask.type,
        taskSubtype: newTask.task_subtype as 'one_time' | 'recurring',
        dueDate: newTask.due_date || undefined,
        isCompleted: false,
        dailyCount: 0,
        streakCount: 0,
        lastCheckinDate: undefined,
      },
    });
  }, [user]);

  const removeTask = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
    await deleteTask(id);
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id, updates } });
    await updateTaskInDb(id, updates);
  }, []);

  const addRecord = useCallback(async (record: Partial<Record>) => {
    if (!user) return;

    const newRecord = await createRecord({
      user_id: user.id,
      title: record.title,
      content: record.content,
      is_private: record.isPrivate,
    });

    dispatch({
      type: 'ADD_RECORD',
      payload: {
        id: newRecord.id,
        title: newRecord.title,
        content: newRecord.content,
        isPrivate: newRecord.is_private,
        createdAt: new Date(newRecord.created_at).toLocaleDateString('zh-CN'),
      },
    });
  }, [user]);

  const removeRecord = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_RECORD', payload: id });
    await deleteRecord(id);
  }, []);

  const refreshCommunityPosts = useCallback(async (category?: string) => {
    const posts = await getCommunityPosts(category);
    dispatch({
      type: 'SET_COMMUNITY_POSTS',
      payload: posts.map(p => ({
        id: p.id,
        authorName: p.author_name,
        title: p.title,
        content: p.content,
        category: p.category,
        likes: p.likes,
        comments: p.comments,
        createdAt: p.created_at,
      })),
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        toggleTask,
        addTask,
        updateTask,
        removeTask,
        addRecord,
        removeRecord,
        refreshCommunityPosts,
      }}
    >
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