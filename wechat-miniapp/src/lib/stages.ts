import { PregnancyStage } from './supabase';

const TOTAL_DAYS = 280;

export function calculateStageFromDueDate(dueDate?: string): {
  stage: PregnancyStage;
  weeksPregnant: number;
  daysToDue: number;
} {
  if (!dueDate) return { stage: 'preconception', weeksPregnant: 0, daysToDue: 0 };
  const due = new Date(dueDate);
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysToDue = Math.floor((due.getTime() - now.getTime()) / msPerDay);
  const daysPassed = TOTAL_DAYS - daysToDue;
  const weeksPregnant = Math.max(0, Math.floor(daysPassed / 7));

  if (daysToDue < 0) return { stage: 'postpartum', weeksPregnant, daysToDue };
  if (weeksPregnant < 13) return { stage: 'first', weeksPregnant, daysToDue };
  if (weeksPregnant < 28) return { stage: 'second', weeksPregnant, daysToDue };
  return { stage: 'third', weeksPregnant, daysToDue };
}

export function calculateBirthAge(dueDate: string, birthDate?: string | null): string {
  const refDate = birthDate ? new Date(birthDate) : new Date(new Date(dueDate).getTime() + TOTAL_DAYS * 86400000);
  const now = new Date();
  const days = Math.floor((now.getTime() - refDate.getTime()) / 86400000);
  if (days < 14) return `${days}天`;
  if (days < 60) return `${Math.floor(days / 7)}周`;
  if (days < 365) return `${Math.floor(days / 30)}个月`;
  const years = Math.floor(days / 365);
  const remainMonths = Math.floor((days % 365) / 30);
  return remainMonths > 0 ? `${years}岁${remainMonths}个月` : `${years}岁`;
}