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
};

export const darkColors: ColorScheme = {
  // 主色调 — 亮蓝（深色背景上用更高亮度的蓝）
  accent: '#5A8BCE',       // oklch(58% 0.10 260) 亮墨蓝
  accentLight: '#2A2E4A',  // oklch(28% 0.04 260) 深蓝背景
  accentDark: '#7AA8E0',   // oklch(68% 0.10 260) 更亮强调

  // 背景色 — 深夜蓝
  bg: '#121220',            // oklch(12% 0.01 270) 深夜幕
  surface: '#1E1E30',       // oklch(16% 0.012 270) 暗面
  surfaceSecondary: '#28283C', // oklch(20% 0.012 270) 稍亮暗面

  // 文字色 — 暖白
  fg: '#EEE8E0',            // oklch(92% 0.008 60)  暖白墨
  fgSecondary: '#9994A0',   // oklch(62% 0.01 280) 中灰
  muted: '#6A6A7A',         // oklch(46% 0.01 280) 暗灰

  // 边框/分隔
  border: '#333348',        // oklch(24% 0.012 280) 暗边框
  divider: '#2A2A3E',       // oklch(20% 0.01 280)  暗分隔

  // 功能色（保持辨识度，略提亮）
  success: '#5A9E74',       // oklch(60% 0.10 150) 亮哑绿
  warning: '#D4A84E',       // oklch(68% 0.12 85)  亮琥珀
  error: '#D46A6A',         // oklch(55% 0.12 25)  亮哑红
  info: '#5A8AB0',          // oklch(55% 0.08 250) 亮钢蓝
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
