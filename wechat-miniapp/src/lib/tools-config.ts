export type ToolId = 'feeding' | 'growth' | 'vaccine' | 'food' | 'weight' | 'mood' | 'prenatal' | 'ai';

export interface ToolMeta {
  id: ToolId;
  title: string;
  emoji: string;
  description: string;
}

export const TOOLS: ToolMeta[] = [
  { id: 'feeding',   title: '喂奶计时',   emoji: '🍼', description: '记录哺乳时间' },
  { id: 'growth',    title: '生长记录',   emoji: '📏', description: '身高体重曲线' },
  { id: 'vaccine',   title: '疫苗本',     emoji: '💉', description: '宝宝疫苗接种' },
  { id: 'food',      title: '食物禁忌',   emoji: '🍽️', description: '孕期饮食查询' },
  { id: 'weight',    title: '妈妈体重',   emoji: '⚖️', description: '孕期体重曲线' },
  { id: 'mood',      title: '情绪自评',   emoji: '💗', description: '爸爸情绪 EPDS' },
  { id: 'prenatal',  title: '产检时间轴', emoji: '🩺', description: '产检时间一览' },
  { id: 'ai',        title: 'AI 问答',    emoji: '🤖', description: '智能助手' },
];

export const DEFAULT_TOOLS: ToolId[] = ['feeding', 'growth', 'vaccine', 'food', 'ai'];