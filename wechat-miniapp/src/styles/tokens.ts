/**
 * Kami 设计 token - 与 RN 端 src/styles/tokens.ts 对齐
 * 颜色以小写 hex 导出，便于 rpx 直接使用
 */
export const colors = {
  bg: '#FAF6EF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0E9DC',
  divider: '#E5DDD0',
  border: '#D9D2C2',

  fg: '#1F2937',
  fgSecondary: '#4B5563',
  muted: '#9CA3AF',

  // 墨蓝 accent
  accent: '#1F3A5F',
  accentLight: '#E7EEF5',
  accentDark: '#152944',

  // 阶段色
  stageFirst: '#F5C6C0',
  stageSecond: '#C8DCC4',
  stageThird: '#A8C6D9',
  stagePostpartum: '#E5C8E0',
  stagePreconception: '#F0DCC0',

  // 警示
  danger: '#D9534F',
  warning: '#E6A23C',
  success: '#67C23A',

  switchTrackOff: '#D1D5DB',
} as const;

export const spacing = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  full: 9999,
} as const;

export const fontSize = {
  caption: 22,
  footnote: 24,
  body: 28,
  callout: 30,
  headline: 36,
  title: 44,
} as const;