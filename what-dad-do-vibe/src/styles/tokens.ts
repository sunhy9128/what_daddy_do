// Kami Design Tokens
// Warm parchment · Ink-blue accent · Editorial restraint

export const colors = {
  // 主色调 — 墨蓝（kami ink-blue）
  accent: '#2C3E6B',       // oklch(36% 0.06 270) 沉稳墨蓝
  accentLight: '#E8ECF4',  // oklch(92% 0.008 270) 浅墨蓝背景
  accentDark: '#1A2745',   // oklch(25% 0.05 270) 深墨蓝

  // 背景色 — 暖 parchment
  bg: '#F5F0E8',            // oklch(96% 0.01 60)  暖羊皮纸
  surface: '#FCFAF5',       // oklch(99% 0.006 60) 暖白
  surfaceSecondary: '#F0ECE4', // oklch(95% 0.008 60) 暖浅灰

  // 文字色 — 墨色
  fg: '#1A1A2E',            // oklch(18% 0.015 270) 浓墨
  fgSecondary: '#5A5A6E',   // oklch(45% 0.012 270) 中墨
  muted: '#8A8A9A',         // oklch(62% 0.008 270) 淡墨

  // 边框/分隔
  border: '#E8E4D9',        // oklch(91% 0.006 60)  暖灰边
  divider: '#F0ECE4',       // oklch(94% 0.005 60)  更浅分隔

  // 功能色（降饱和，保持 editorial 感）
  success: '#4A7C5E',       // oklch(52% 0.08 155) 哑绿
  warning: '#B8963E',       // oklch(62% 0.10 85)  哑琥珀
  error: '#B84A4A',         // oklch(46% 0.10 25)  哑红
  info: '#4A6B8A',          // oklch(48% 0.06 250) 哑钢蓝
} as const;

export const fonts = {
  display: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
    fontWeight: '700' as const,
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

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
} as const;

export const typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
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
