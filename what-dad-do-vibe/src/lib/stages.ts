// 孕期阶段工具 — 统一的类型、标签、映射和计算

export type PregnancyStage = 'preconception' | 'first' | 'second' | 'third' | 'postpartum';
export const STAGE_LABELS: Record<PregnancyStage, string> = {
  preconception: '备孕',
  first: '孕早期',
  second: '孕中期',
  third: '孕晚期',
  postpartum: '产后',
};

export const STAGES = [
  { key: 'preconception' as const, label: '备孕', weeks: '0周' },
  { key: 'first' as const, label: '孕早期', weeks: '1-12周' },
  { key: 'second' as const, label: '孕中期', weeks: '13-27周' },
  { key: 'third' as const, label: '孕晚期', weeks: '28-40周' },
  { key: 'postpartum' as const, label: '产后', weeks: '41周+' },
];

/**
 * 计算宝宝出生后的年龄显示文本
 * 优先使用 birthDate，无则回退到 dueDate
 * - 未出生返回空字符串
 * - < 1 岁：x周
 * - 1 ~ 3 岁：x年x周
 * - >= 3 岁：x岁
 */
export function calculateBirthAge(dueDate: string, birthDate?: string | null): string {
  const today = new Date();
  const birth = birthDate ? new Date(birthDate) : new Date(dueDate);
  const msSinceBirth = today.getTime() - birth.getTime();

  if (msSinceBirth <= 0) return ''; // 还未出生

  const totalDays = Math.floor(msSinceBirth / (1000 * 60 * 60 * 24));
  const years = Math.floor(totalDays / 365.25);
  const remainingDays = Math.round(totalDays - years * 365.25);
  const weeks = Math.floor(remainingDays / 7);

  if (years >= 3) {
    return `${years}岁`;
  }

  if (years > 0) {
    return `${years}年${weeks}周`;
  }

  // < 1 岁：只显示周数
  if (weeks > 0) {
    return `${weeks}周`;
  }
  return `${totalDays}天`;
}

/**
 * 根据预产期计算当前孕期阶段
 */
export function calculateStageFromDueDate(dueDate: string): {
  stage: PregnancyStage;
  weeksPregnant: number;
  stageLabel: string;
} {
  const today = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  // 孕周 = (280 - 剩余天数) / 7
  const weeksPregnant = Math.max(0, Math.floor((280 - daysLeft) / 7));

  let stage: PregnancyStage;
  if (daysLeft > 280) {
    stage = 'preconception';
  } else if (weeksPregnant <= 12) {
    stage = 'first';
  } else if (weeksPregnant <= 27) {
    stage = 'second';
  } else if (weeksPregnant <= 40) {
    stage = 'third';
  } else {
    stage = 'postpartum';
  }

  return { stage, weeksPregnant, stageLabel: STAGE_LABELS[stage] };
}
