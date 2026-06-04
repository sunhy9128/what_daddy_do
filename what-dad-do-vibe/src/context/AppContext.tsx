import { createContext, useContext, useEffect, useReducer, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getTasks, createTask, toggleTaskComplete, deleteTask, updateTask as updateTaskInDb, getRecords, createRecord, deleteRecord, getCommunityPosts, getUrgentNotes, dismissUrgentNote as dismissUrgentNoteInDb, createUrgentNote as createUrgentNoteInDb, getBabies, createBaby as createBabyInDb, updateBaby as updateBabyInDb } from '../lib/api';
import { PregnancyStage, calculateStageFromDueDate, calculateBirthAge } from '../lib/stages';
import { supabase } from '../lib/supabase';

// Types


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

export interface Record {
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
  urgentNotes: UrgentNote[];
  babies: Baby[];
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
  | { type: 'SET_RECORDS'; payload: Record[] }
  | { type: 'ADD_RECORD'; payload: Record }
  | { type: 'DELETE_RECORD'; payload: string }
  | { type: 'SET_COMMUNITY_POSTS'; payload: CommunityPost[] }
  | { type: 'SET_URGENT_NOTES'; payload: UrgentNote[] }
  | { type: 'ADD_URGENT_NOTE'; payload: UrgentNote }
  | { type: 'REMOVE_URGENT_NOTE'; payload: string }
  | { type: 'SET_BABIES'; payload: { babies: Baby[]; stage: PregnancyStage; weeksPregnant: number; birthAgeLabel: string } }
  | { type: 'ADD_BABY'; payload: { baby: Baby; stage: PregnancyStage; weeksPregnant: number; birthAgeLabel: string } }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AppState = {
  stage: 'preconception',
  tasks: [],
  records: [],
  communityPosts: [],
  urgentNotes: [],
  babies: [],
  weeksPregnant: 0,
  birthAgeLabel: '',
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
    case 'SET_URGENT_NOTES':
      return { ...state, urgentNotes: action.payload };
    case 'ADD_URGENT_NOTE':
      return { ...state, urgentNotes: [action.payload, ...state.urgentNotes] };
    case 'REMOVE_URGENT_NOTE':
      return { ...state, urgentNotes: state.urgentNotes.filter(n => n.id !== action.payload) };
    case 'SET_BABIES':
      return { ...state, babies: action.payload.babies, stage: action.payload.stage, weeksPregnant: action.payload.weeksPregnant, birthAgeLabel: action.payload.birthAgeLabel };
    case 'ADD_BABY':
      return { ...state, babies: [action.payload.baby, ...state.babies], stage: action.payload.stage, weeksPregnant: action.payload.weeksPregnant, birthAgeLabel: action.payload.birthAgeLabel };
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
  addUrgentNote: (content: string) => Promise<void>;
  dismissUrgentNote: (id: string) => Promise<void>;
  addBaby: (dueDate: string, name?: string, birthDate?: string) => Promise<void>;
  updateBabyGender: (babyId: string, gender: string, dueDate?: string, birthDate?: string) => Promise<void>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user } = useAuth();

  // 预设任务数据 - 按孕期阶段分类
  // 首次登录时自动插入的精选起始集；完整推荐清单见 preset_tasks.sql（~100 条）
  const presetTasks: {
    title: string;
    description: string;
    stage: PregnancyStage | 'postpartum';
    type: 'prenatal' | 'daily' | 'checkin';
    due_date?: string;
  }[] = [
    // ========== 备孕阶段 ==========
    { title: '孕前体检', description: '全面体检，包括血常规、尿常规、肝肾功能、血糖、血脂', stage: 'preconception', type: 'prenatal' },
    { title: '口腔检查', description: '孕期牙齿问题处理受限，提前完成洗牙、补牙、拔智齿', stage: 'preconception', type: 'prenatal' },
    { title: '遗传咨询', description: '如有家族遗传病史，提前进行遗传咨询和筛查', stage: 'preconception', type: 'prenatal' },
    { title: '疫苗抗体检查', description: '确认风疹、乙肝、水痘抗体，不足则补种', stage: 'preconception', type: 'prenatal' },
    { title: '补充叶酸', description: '每天400-800微克，预防胎儿神经管畸形，夫妻同补', stage: 'preconception', type: 'daily' },
    { title: '作息调整', description: '保持规律作息，每晚7-8小时充足睡眠', stage: 'preconception', type: 'daily' },
    { title: '规律运动', description: '每周150分钟中等强度运动，如快走、游泳、慢跑', stage: 'preconception', type: 'daily' },
    { title: '戒酒戒烟', description: '提前3个月戒酒戒烟，二手烟也要避免', stage: 'preconception', type: 'daily' },
    { title: '学习排卵期知识', description: '掌握排卵期计算方法，使用排卵试纸提高受孕率', stage: 'preconception', type: 'daily' },
    { title: '服用叶酸', description: '每天按时服用叶酸，夫妻同补效果更好', stage: 'preconception', type: 'checkin' },
    { title: '测量基础体温', description: '每天早晨测量基础体温，记录排卵周期', stage: 'preconception', type: 'checkin' },

    // ========== 孕早期 ==========
    { title: '首次产检', description: '确认怀孕，建立孕期档案，查肝肾功能、血常规', stage: 'first', type: 'prenatal' },
    { title: 'NT检查', description: '胎儿颈项透明层厚度检查，早期筛查唐氏综合征', stage: 'first', type: 'prenatal' },
    { title: '建档', description: '到社区医院或产检医院建立《母子健康手册》', stage: 'first', type: 'prenatal' },
    { title: '早期唐氏筛查', description: '结合NT值+血清学指标，筛查21/18三体综合征', stage: 'first', type: 'prenatal' },
    { title: '甲状腺功能检查', description: '甲减影响胎儿智力发育，早查早干预', stage: 'first', type: 'prenatal' },
    { title: '应对早孕反应', description: '少食多餐，吃苏打饼干缓解孕吐，避免油腻刺激食物', stage: 'first', type: 'daily' },
    { title: '清淡饮食', description: '以易消化的粥、面、蒸菜为主，保证基本营养摄入', stage: 'first', type: 'daily' },
    { title: '选择生产医院', description: '考察家附近的产科医院，了解床位、技术、距离', stage: 'first', type: 'daily' },
    { title: '办理生育登记', description: '到社区办理生育服务登记，后续报销产检费用', stage: 'first', type: 'daily' },
    { title: '学习孕早期知识', description: '了解1-12周胎儿发育过程和各阶段注意事项', stage: 'first', type: 'daily' },
    { title: '服用叶酸', description: '每天按时服用叶酸，至少到孕12周', stage: 'first', type: 'checkin' },
    { title: '记录身体变化', description: '每天记录早孕反应、体重变化', stage: 'first', type: 'checkin' },

    // ========== 孕中期 ==========
    { title: '无创DNA检测', description: '12-22周抽血检测胎儿染色体，准确率99%以上', stage: 'second', type: 'prenatal' },
    { title: '大排畸B超', description: '20-24周系统超声检查，全面排查胎儿结构畸形', stage: 'second', type: 'prenatal', due_date: '2026-08-15' },
    { title: '糖耐量测试', description: '24-28周筛查妊娠期糖尿病，需要空腹8-12小时', stage: 'second', type: 'prenatal', due_date: '2026-09-01' },
    { title: '胎儿心脏彩超', description: '22-26周专项检查胎儿心脏结构和发育', stage: 'second', type: 'prenatal' },
    { title: '补钙', description: '每天摄入1000-1200mg钙，豆制品、绿叶菜、牛奶', stage: 'second', type: 'daily' },
    { title: '补铁', description: '每天摄入27mg铁，红肉、动物肝脏配合维C', stage: 'second', type: 'daily' },
    { title: '补充DHA', description: '每天200-300mg，促进胎儿大脑和视网膜发育', stage: 'second', type: 'daily' },
    { title: '孕期运动', description: '散步、孕妇瑜伽、游泳，增强盆底肌', stage: 'second', type: 'daily' },
    { title: '妊娠纹护理', description: '每天涂抹护理油，保持腹部皮肤弹性', stage: 'second', type: 'daily' },
    { title: '参加孕妇课程', description: '参加孕教课，学习分娩和育儿知识', stage: 'second', type: 'daily' },
    { title: '布置婴儿房', description: '规划宝宝房间，选购婴儿床、衣柜等', stage: 'second', type: 'daily' },
    { title: '拍孕妇照', description: '24-28周肚子大小适中，是拍摄最佳时机', stage: 'second', type: 'daily' },
    { title: '孕期瑜伽', description: '每天进行孕期瑜伽练习', stage: 'second', type: 'checkin' },
    { title: '服用钙片', description: '每天按时补钙，预防抽筋', stage: 'second', type: 'checkin' },

    // ========== 孕晚期 ==========
    { title: '小排畸B超', description: '28-32周超声确认胎儿发育、羊水量、胎盘位置', stage: 'third', type: 'prenatal', due_date: '2026-10-15' },
    { title: '胎心监护', description: '32周后每2周一次，36周后每周一次', stage: 'third', type: 'prenatal' },
    { title: 'B族链球菌检测', description: '36-37周筛查，预防新生儿感染', stage: 'third', type: 'prenatal' },
    { title: '分娩方式评估', description: '37周后综合评估，确定顺产或剖腹产方案', stage: 'third', type: 'prenatal' },
    { title: '数胎动', description: '每天早中晚各数1小时，3-5次/小时为正常', stage: 'third', type: 'daily' },
    { title: '血糖监控', description: '每日三餐后测量血糖', stage: 'third', type: 'daily' },
    { title: '体重监测', description: '每周固定时间称重', stage: 'third', type: 'daily' },
    { title: '凯格尔运动', description: '每天做盆底肌训练，增强分娩力量', stage: 'third', type: 'daily' },
    { title: '待产包准备', description: '打包入院物品：产褥垫、卫生巾、哺乳衣、纸尿裤、包被等', stage: 'third', type: 'daily' },
    { title: '学习拉玛泽呼吸法', description: '学习分娩减痛呼吸法，陪产时帮助妈妈', stage: 'third', type: 'daily' },
    { title: '安排月子服务', description: '确定月嫂/月子中心/父母照顾', stage: 'third', type: 'daily' },
    { title: '学习新生儿护理', description: '学习抱娃、换尿布、洗澡、拍嗝、脐带护理', stage: 'third', type: 'daily' },
    { title: '安装婴儿安全座椅', description: '提前安装并调试，出院必备', stage: 'third', type: 'daily' },
    { title: '准爸爸产假申请', description: '向公司申请陪产假/护理假', stage: 'third', type: 'daily' },
    { title: '数胎动打卡', description: '每天早中晚各数1小时并记录', stage: 'third', type: 'checkin' },
    { title: '散步打卡', description: '每天散步30分钟以上，保持适度活动', stage: 'third', type: 'checkin' },
    { title: '凯格尔运动打卡', description: '每天做3组凯格尔运动，每组10-15次', stage: 'third', type: 'checkin' },

    // ========== 产后阶段 ==========
    { title: '新生儿首次体检', description: '出生后24小时内进行首次体格检查', stage: 'postpartum', type: 'prenatal' },
    { title: '新生儿听力筛查', description: '出生后48-72小时听力初筛', stage: 'postpartum', type: 'prenatal' },
    { title: '新生儿疾病筛查', description: '出生后72小时足底采血，筛查遗传代谢病', stage: 'postpartum', type: 'prenatal' },
    { title: '卡介苗+乙肝疫苗', description: '出生后24小时内接种', stage: 'postpartum', type: 'prenatal' },
    { title: '产后42天复查（妈妈）', description: '复查子宫恢复、伤口愈合、盆底功能', stage: 'postpartum', type: 'prenatal' },
    { title: '产后42天复查（宝宝）', description: '评估生长发育和神经发育', stage: 'postpartum', type: 'prenatal' },
    { title: '产后伤口护理', description: '伤口每日消毒护理，观察有无感染', stage: 'postpartum', type: 'daily' },
    { title: '母乳喂养', description: '按需哺乳，每2-3小时一次', stage: 'postpartum', type: 'daily' },
    { title: '产后情绪管理', description: '关注情绪变化，预防产后抑郁', stage: 'postpartum', type: 'daily' },
    { title: '产后修复运动', description: '从温和的腹式呼吸、凯格尔运动开始', stage: 'postpartum', type: 'daily' },
    { title: '办理出生医学证明', description: '医院/线上办理，后续上户口需要', stage: 'postpartum', type: 'daily' },
    { title: '给宝宝上户口', description: '携带出生证明到派出所落户', stage: 'postpartum', type: 'daily' },
    { title: '办理新生儿医保', description: '出生后90天内办理，可追溯报销', stage: 'postpartum', type: 'daily' },
    { title: '申请生育津贴', description: '准备材料申请生育津贴和报销产检费用', stage: 'postpartum', type: 'daily' },
    { title: '产后凯格尔运动', description: '每天坚持凯格尔运动，促进盆底恢复', stage: 'postpartum', type: 'checkin' },
    { title: '记录宝宝作息', description: '每天记录吃奶、睡觉、换尿布', stage: 'postpartum', type: 'checkin' },
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

      const [tasksData, recordsData, postsData, urgentNotesData, babiesData] = await Promise.all([
        getTasks(user!.id),
        getRecords(user!.id),
        getCommunityPosts(),
        getUrgentNotes(user!.id),
        getBabies(user!.id),
      ]);

      // 根据预产期自动计算孕期
      const currentBaby = babiesData?.[0];
      let autoStage: PregnancyStage = 'preconception';
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

      const todayStr = new Date().toISOString().split('T')[0];

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
          completedAt: t.completed_at || undefined,
          // 每日重置：只有当天有记录的才保留计数，否则从 0 开始
          dailyCount: t.daily_date === todayStr ? t.daily_count : 0,
          dailyDate: t.daily_date === todayStr ? t.daily_date : undefined,
          // 打卡任务：上次打卡日期是否为今天
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

      // 根据预产期自动设置孕期
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
          })),
          stage: autoStage,
          weeksPregnant,
          birthAgeLabel,
        },
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
          task_subtype: task.type === 'daily' ? 'recurring' : 'one_time',
          due_date: task.due_date || null,
          is_completed: false,
        });
      } catch (e) {
        console.error('Failed to create preset task:', task.title);
      }
    }
  }

  const togglingRef = useRef(false);
  const toggleTask = useCallback(async (id: string) => {
    if (togglingRef.current) return;
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    togglingRef.current = true;
    const today = new Date().toISOString().split('T')[0];

    try {
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
        }

        dispatch({
          type: 'UPDATE_TASK',
          payload: {
            id,
            updates: { streakCount: newStreak, lastCheckinDate: today, isCompleted: true }
          }
        });

        await updateTaskInDb(id, { streak_count: newStreak, last_checkin_date: today, is_completed: true });
      }
      // 日常任务：每日归零，点击 +1
      else if (task.taskSubtype === 'recurring' || task.type === 'daily') {
        const newCount = task.dailyDate === today ? task.dailyCount + 1 : 1;

        dispatch({
          type: 'UPDATE_TASK',
          payload: {
            id,
            updates: { dailyCount: newCount, dailyDate: today }
          }
        });

        await updateTaskInDb(id, { daily_count: newCount, daily_date: today });
      } else {
        // 一次性任务点击切换完成状态
        dispatch({ type: 'TOGGLE_TASK', payload: id });
        await toggleTaskComplete(id, !task.isCompleted);
      }
    } finally {
      togglingRef.current = false;
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

  const addUrgentNote = useCallback(async (content: string) => {
    if (!user) return;
    const note = await createUrgentNoteInDb({
      user_id: user.id,
      content,
    });
    dispatch({
      type: 'ADD_URGENT_NOTE',
      payload: {
        id: note.id,
        content: note.content,
        isActive: note.is_active,
        createdAt: new Date(note.created_at).toLocaleDateString('zh-CN'),
      },
    });
  }, [user]);

  const dismissUrgentNote = useCallback(async (id: string) => {
    dispatch({ type: 'REMOVE_URGENT_NOTE', payload: id });
    await dismissUrgentNoteInDb(id);
  }, []);

  const addBaby = useCallback(async (dueDate: string, name: string = '宝宝', birthDate?: string) => {
    if (!user) return;
    const baby = await createBabyInDb({
      user_id: user.id,
      due_date: dueDate,
      birth_date: birthDate || null,
      name,
    });
    const calc = calculateStageFromDueDate(dueDate);
    const birthAgeLabel = calc.stage === 'postpartum' ? calculateBirthAge(dueDate, birthDate) : '';
    dispatch({
      type: 'ADD_BABY',
      payload: {
        baby: { id: baby.id, dueDate: baby.due_date, birthDate: baby.birth_date, name: baby.name },
        stage: calc.stage,
        weeksPregnant: calc.weeksPregnant,
        birthAgeLabel,
      },
    });
    // 同步更新 stage
    dispatch({ type: 'SET_STAGE', payload: calc.stage });
  }, [user]);

  const updateBabyGender = useCallback(async (babyId: string, gender: string, dueDate?: string, birthDate?: string) => {
    const updates: any = { ...(dueDate ? { due_date: dueDate } : {}) };
    if (gender) updates.gender = gender;
    if (birthDate) updates.birth_date = birthDate;
    await updateBabyInDb(babyId, updates);
    const today = dueDate || new Date().toISOString().split('T')[0];
    const calc = calculateStageFromDueDate(today);
    const birthAgeLabel = calc.stage === 'postpartum' ? calculateBirthAge(today, birthDate) : '';
    dispatch({
      type: 'SET_BABIES',
      payload: {
        babies: state.babies.map(b => b.id === babyId ? { ...b, ...(gender ? { gender } : {}), dueDate: today, birthDate: birthDate || b.birthDate } : b),
        stage: calc.stage,
        weeksPregnant: calc.weeksPregnant,
        birthAgeLabel,
      },
    });
    dispatch({ type: 'SET_STAGE', payload: calc.stage });
  }, [state.babies, state.stage, state.weeksPregnant]);

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
        addUrgentNote,
        dismissUrgentNote,
        addBaby,
        updateBabyGender,
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