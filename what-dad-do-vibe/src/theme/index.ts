// Design Tokens - Based on design-spec.md
// 爸爸去哪了 App 温暖实用男风格

export const colors = {
  // 主色调
  primary: '#E89B5A',        // oklch(58% 0.15 35)
  primaryLight: '#F2C08A',  // oklch(70% 0.12 35)
  primaryDark: '#D67A3D',    // oklch(48% 0.12 35)

  // 背景色
  bg: '#FAF5F0',             // oklch(98% 0.008 240) 奶白
  surface: '#FFFFFF',        // oklch(100% 0 0) 纯白
  surfaceSecondary: '#F5F1ED', // oklch(97% 0.005 240) 浅灰

  // 文字色
  textPrimary: '#2D2D2D',     // oklch(18% 0.012 250) 深灰
  textSecondary: '#6B6B6B',  // oklch(54% 0.012 250) 中灰
  textTertiary: '#A3A3A3',   // oklch(72% 0.008 240) 浅灰

  // 标签色
  tagShort: '#5D9CEC',      // oklch(55% 0.16 210) 蓝色 短期任务
  tagLong: '#5DD79F',       // oklch(58% 0.16 145) 绿色 长期任务
  tagCustom: '#F5C65D',     // oklch(68% 0.18 45) 黄色 自建任务
  tagDone: '#E5E5E5',       // oklch(72% 0.008 240) 灰色 已完成

  // 边框/分隔
  border: '#E8E8E8',         // oklch(92% 0.005 250)
  divider: '#F0F0F0',       // oklch(94% 0.003 240)

  // 功能色
  success: '#5DD79F',
  warning: '#F5C65D',
  error: '#E85D5D',
  info: '#5D9CEC',
} as const;

export const typography = {
  // 字号
  fontTitle: 28,
  fontHeading: 20,
  fontSubhead: 16,
  fontBody: 15,
  fontCaption: 13,
  fontTag: 12,

  // 字重
  fontWeightBold: 600,
  fontWeightMedium: 500,
  fontWeightRegular: 400,

  // 行高
  lineHeightTight: 1.2,
  lineHeightNormal: 1.4,
  lineHeightRelaxed: 1.6,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
} as const;

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} as const;

export type Theme = typeof theme;