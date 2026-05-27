// 孕期阶段工具 — 统一的类型、标签、映射和计算

export type PregnancyStage = 'preconception' | 'first' | 'second' | 'third' | 'postpartum';

export const STAGE_KEYS: PregnancyStage[] = ['preconception', 'first', 'second', 'third', 'postpartum'];

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

export function getStageLabel(stage: PregnancyStage): string {
  return STAGE_LABELS[stage] || '未知';
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
