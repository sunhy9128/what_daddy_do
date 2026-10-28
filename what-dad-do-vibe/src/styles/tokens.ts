// Wabi-sabi Design Tokens
// 和纸底色 · 苔绿点缀 · 土色点缀 · 大量留白 · 克制的阴影与圆角

export const colors = {
  // 主色调 — 苔绿（wabi-sabi moss）
  accent: '#4A5A42',       // 苔绿，深而安静
  accentLight: '#E9EBE3',  // 苔浅底
  accentDark: '#39452F',   // 深苔

  // 背景色 — 和纸
  bg: '#F3F0EA',            // 和纸底
  surface: '#FAF8F3',       // 纸面白
  surfaceSecondary: '#EAE6DC', // 土灰面

  // 文字色 — 墨
  fg: '#26241E',            // 浓墨
  fgSecondary: '#6E695E',   // 中墨
  muted: '#9C968A',         // 淡墨

  // 边框/分隔
  border: '#DCD6C8',        // 纸边
  divider: '#E8E4D8',       // 更浅分隔

  // 功能色（全部降饱和，土色系）
  success: '#6B7B57',       // 苔绿
  warning: '#A98B4F',       // 枯茶
  error: '#AE5D4C',         // 柿色
  info: '#647B85',          // 青灰
  // 危险/警告状态色
  dangerSurface: '#F6EDE8',
  dangerBorder: '#E2C4B8',
  dangerFg: '#7C4433',
  warningSurface: '#F5F0E4',
  warningBorder: '#E0D2AC',
  warningFg: '#6E5A2E',
  // 宝宝相关色（土布色系）
  babyCardBg: '#F7F4EC',
  babyCardBorder: '#E3D9C6',
  babyName: '#5C4A33',
  babyAccent: '#B39B78',
  babyGirl: '#C9A6A0',
  babyBoy: '#9FAEC2',
  genderUnknown: '#8A7A5E',
  // 开关轨道
  switchTrackOff: '#CCC6B8',
} as const;

export type ColorScheme = {
  accent: string;
  accentLight: string;
  accentDark: string;
  bg: string;
  surface: string;
  surfaceSecondary: string;
  fg: string;
  fgSecondary: string;
  muted: string;
  border: string;
  divider: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  // 危险/警告状态色
  dangerSurface: string;
  dangerBorder: string;
  dangerFg: string;
  warningSurface: string;
  warningBorder: string;
  warningFg: string;
  // 宝宝相关色
  babyCardBg: string;
  babyCardBorder: string;
  babyName: string;
  babyAccent: string;
  babyGirl: string;
  babyBoy: string;
  genderUnknown: string;
  // 开关轨道
  switchTrackOff: string;
};

export const darkColors: ColorScheme = {
  // 主色调 — 亮苔
  accent: '#A3B48F',
  accentLight: '#2E332A',
  accentDark: '#C2D1AE',

  // 背景色 — 暗夜土色
  bg: '#141311',
  surface: '#1E1C18',
  surfaceSecondary: '#292621',

  // 文字色 — 和纸白
  fg: '#ECE7DC',
  fgSecondary: '#A29C8E',
  muted: '#6E695E',

  // 边框/分隔
  border: '#3A372F',
  divider: '#262420',

  // 功能色（提亮保持辨识度）
  success: '#8FA375',
  warning: '#C2A96B',
  error: '#C97F6C',
  info: '#8AA0AC',
  // 危险/警告状态色
  dangerSurface: '#33231D',
  dangerBorder: '#4E332A',
  dangerFg: '#D9A18E',
  warningSurface: '#332C1C',
  warningBorder: '#4E422A',
  warningFg: '#D9C58A',
  // 宝宝相关色
  babyCardBg: '#1E1C18',
  babyCardBorder: '#3A372F',
  babyName: '#D9CCB2',
  babyAccent: '#4E4030',
  babyGirl: '#C9A6A0',
  babyBoy: '#9FAEC2',
  genderUnknown: '#A89A7E',
  // 开关轨道
  switchTrackOff: '#4A463C',
} as const;

export const fonts = {
  display: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
    fontWeight: '600' as const,
  },
  body: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
    fontWeight: '400' as const,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

/**
 * 系统字体缩放（Android 字体大小 / 显示大小）的上限。
 * RN 的 Text 默认跟随系统 fontScale，固定高度的 tab 栏、计数圆、
 * 分页列表等会被放大后的文字撑破；在布局敏感的文字上统一传入
 * maxFontSizeMultiplier={MAX_FONT_SCALE}，既保留一定可读性又保证排版稳定。
 */
export const MAX_FONT_SCALE = 1.2;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#26241E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#26241E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#26241E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 3,
  },
} as const;

export const typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '600' as const,
    lineHeight: 41,
  },
  title1: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: '500' as const,
    lineHeight: 28,
  },
  title3: {
    fontSize: 20,
    fontWeight: '500' as const,
    lineHeight: 25,
  },
  headline: {
    fontSize: 17,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 21,
  },
  subhead: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 13,
  },
} as const;

// 导出综合tokens对象
export const tokens = {
  colors,
  fonts,
  spacing,
  radius,
  shadows,
  typography,
};

export default tokens;
