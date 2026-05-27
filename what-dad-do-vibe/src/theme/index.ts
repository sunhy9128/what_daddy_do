// Kami Design Tokens
// Warm parchment · Ink-blue accent · Editorial restraint

export const colors = {
  // 主色调
  primary: '#2C3E6B',        // oklch(36% 0.06 270) 墨蓝
  primaryLight: '#E8ECF4',  // oklch(92% 0.008 270)
  primaryDark: '#1A2745',    // oklch(25% 0.05 270)

  // 背景色
  bg: '#F5F0E8',             // oklch(96% 0.01 60)  暖羊皮纸
  surface: '#FCFAF5',        // oklch(99% 0.006 60) 暖白
  surfaceSecondary: '#F0ECE4', // oklch(95% 0.008 60)

  // 文字色
  textPrimary: '#1A1A2E',     // oklch(18% 0.015 270) 浓墨
  textSecondary: '#5A5A6E',  // oklch(45% 0.012 270) 中墨
  textTertiary: '#8A8A9A',   // oklch(62% 0.008 270) 淡墨

  // 标签色
  tagShort: '#4A6B8A',      // oklch(48% 0.06 250)
  tagLong: '#4A7C5E',       // oklch(52% 0.08 155)
  tagCustom: '#B8963E',     // oklch(62% 0.10 85)
  tagDone: '#D4D0C8',       // oklch(82% 0.005 60)

  // 边框/分隔
  border: '#E8E4D9',         // oklch(91% 0.006 60)
  divider: '#F0ECE4',        // oklch(94% 0.005 60)

  // 功能色
  success: '#4A7C5E',
  warning: '#B8963E',
  error: '#B84A4A',
  info: '#4A6B8A',
} as const;

export const typography = {
  fontTitle: 28,
  fontHeading: 20,
  fontSubhead: 16,
  fontBody: 15,
  fontCaption: 13,
  fontTag: 12,

  fontWeightBold: 600,
  fontWeightMedium: 500,
  fontWeightRegular: 400,

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
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  xl: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
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
