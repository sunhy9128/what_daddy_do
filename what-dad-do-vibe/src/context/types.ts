/**
 * 共享类型 - AppContext / 4 个子 hook 共同依赖
 */
import type { PregnancyStage } from '../lib/stages';
import { calculateStageFromDueDate, calculateBirthAge } from '../lib/stages';

export interface Task {
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

export interface UserRecord {
  id: string;
  title: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface UrgentNote {
  id: string;
  content: string;
  isActive: boolean;
  createdAt: string;
}

export interface Baby {
  id: string;
  dueDate: string;
  birthDate?: string | null;
  name: string;
  gender?: string;
  is_active: boolean;
  is_archived: boolean;
  sort_order: number;
}

export interface CommunityPost {
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

export interface AppState {
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

export type AppAction =
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

export const initialState: AppState = {
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

// P1 #8 后续工作建议：把 reducer + types 抽到独立 .ts 文件，让 reducer.test.ts 直接 import，
// 不再需要复制实现。当前测试是 self-contained 副本，逻辑一致。
export function reducer(state: AppState, action: AppAction): AppState {
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
      const activeNow = nextBabies.filter(b => !b.is_archived);
      const effectiveBaby = nextBabies.find(b => b.id === nextCurrent) ?? activeNow[0];
      const stage: PregnancyStage = effectiveBaby?.dueDate
        ? calculateStageFromDueDate(effectiveBaby.dueDate).stage
        : 'preconception';
      const weeksPregnant = effectiveBaby?.dueDate
        ? calculateStageFromDueDate(effectiveBaby.dueDate).weeksPregnant
        : 0;
      const birthAgeLabel = stage === 'postpartum' && effectiveBaby
        ? calculateBirthAge(effectiveBaby.dueDate, effectiveBaby.birthDate)
        : '';
      return { ...state, babies: nextBabies, currentBabyId: nextCurrent, stage, weeksPregnant, birthAgeLabel };
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