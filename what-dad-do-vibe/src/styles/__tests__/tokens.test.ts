/**
 * @jest-environment node
 *
 * tokens.ts 设计 token 完整性测试
 * 确保 light/dark 色板对称、所有 key 齐全
 */
import {
  colors,
  darkColors,
  spacing,
  radius,
  shadows,
  typography,
  fonts,
  ColorScheme,
} from '../tokens';

// ============================================================
// colors — 亮色色板
// ============================================================
describe('colors (light palette)', () => {
  it('包含所有必需的 color key', () => {
    const requiredKeys: (keyof ColorScheme)[] = [
      'accent', 'accentLight', 'accentDark',
      'bg', 'surface', 'surfaceSecondary',
      'fg', 'fgSecondary', 'muted',
      'border', 'divider',
      'success', 'warning', 'error', 'info',
    ];
    for (const key of requiredKeys) {
      expect(colors).toHaveProperty(key);
    }
  });

  it('所有颜色值为非空字符串', () => {
    for (const [key, value] of Object.entries(colors)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('所有颜色值以 # 开头（hex 格式）', () => {
    for (const value of Object.values(colors)) {
      expect(value).toMatch(/^#/);
    }
  });

  it('accent（墨蓝）为深色系', () => {
    // 粗略检查：hex R 值应该相对低
    const r = parseInt(colors.accent.slice(1, 3), 16);
    expect(r).toBeLessThan(80);
  });

  it('bg（羊皮纸）为暖色系', () => {
    const r = parseInt(colors.bg.slice(1, 3), 16);
    const g = parseInt(colors.bg.slice(3, 5), 16);
    const b = parseInt(colors.bg.slice(5, 7), 16);
    // 暖色：R 和 G 应该接近且 > B
    expect(r).toBeGreaterThan(b);
    expect(g).toBeGreaterThan(b);
  });
});

// ============================================================
// darkColors — 暗色色板
// ============================================================
describe('darkColors (dark palette)', () => {
  it('包含与亮色色板完全相同的 key', () => {
    const lightKeys = Object.keys(colors).sort();
    const darkKeys = Object.keys(darkColors).sort();
    expect(darkKeys).toEqual(lightKeys);
  });

  it('所有颜色值为非空字符串', () => {
    for (const value of Object.values(darkColors)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('所有颜色值以 # 开头', () => {
    for (const value of Object.values(darkColors)) {
      expect(value).toMatch(/^#/);
    }
  });

  it('dark bg 为深色（亮度低）', () => {
    const r = parseInt(darkColors.bg.slice(1, 3), 16);
    expect(r).toBeLessThan(30);
  });

  it('dark fg 为浅色（亮度高）', () => {
    const r = parseInt(darkColors.fg.slice(1, 3), 16);
    expect(r).toBeGreaterThan(200);
  });

  it('light 和 dark 的 bg 不同（确认不是同一份色板）', () => {
    expect(colors.bg).not.toBe(darkColors.bg);
  });
});

// ============================================================
// spacing — 间距
// ============================================================
describe('spacing', () => {
  it('包含所有必需的间距 key', () => {
    const required = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
    for (const key of required) {
      expect(spacing).toHaveProperty(key);
    }
  });

  it('间距值递增', () => {
    const vals = Object.values(spacing);
    for (let i = 1; i < vals.length; i++) {
      expect(vals[i]).toBeGreaterThan(vals[i - 1]);
    }
  });

  it('所有间距值为正整数', () => {
    for (const value of Object.values(spacing)) {
      expect(value).toBeGreaterThan(0);
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});

// ============================================================
// radius — 圆角
// ============================================================
describe('radius', () => {
  it('包含所有必需的 radius key', () => {
    const required = ['sm', 'md', 'lg', 'xl', 'full'];
    for (const key of required) {
      expect(radius).toHaveProperty(key);
    }
  });

  it('圆角值递增', () => {
    const vals = Object.values(radius);
    for (let i = 1; i < vals.length; i++) {
      expect(vals[i]).toBeGreaterThan(vals[i - 1]);
    }
  });

  it('full 为 9999', () => {
    expect(radius.full).toBe(9999);
  });
});

// ============================================================
// shadows — 阴影
// ============================================================
describe('shadows', () => {
  it('包含 sm, md, lg', () => {
    expect(shadows).toHaveProperty('sm');
    expect(shadows).toHaveProperty('md');
    expect(shadows).toHaveProperty('lg');
  });

  it('每层阴影包含必需字段', () => {
    for (const [, value] of Object.entries(shadows)) {
      expect(value).toHaveProperty('shadowColor');
      expect(value).toHaveProperty('shadowOffset');
      expect(value.shadowOffset).toHaveProperty('width');
      expect(value.shadowOffset).toHaveProperty('height');
      expect(value).toHaveProperty('shadowOpacity');
      expect(value).toHaveProperty('shadowRadius');
      expect(value).toHaveProperty('elevation');
    }
  });

  it('elevation 递增', () => {
    expect(shadows.sm.elevation).toBeLessThan(shadows.md.elevation);
    expect(shadows.md.elevation).toBeLessThan(shadows.lg.elevation);
  });

  it('shadowOpacity 递增', () => {
    expect(shadows.sm.shadowOpacity).toBeLessThan(shadows.md.shadowOpacity);
    expect(shadows.md.shadowOpacity).toBeLessThan(shadows.lg.shadowOpacity);
  });
});

// ============================================================
// typography — 字体
// ============================================================
describe('typography', () => {
  const requiredLevels = [
    'largeTitle', 'title1', 'title2', 'title3',
    'headline', 'body', 'callout', 'subhead',
    'footnote', 'caption1', 'caption2',
  ];

  it('包含所有必需的 level', () => {
    for (const level of requiredLevels) {
      expect(typography).toHaveProperty(level);
    }
  });

  it('每个 level 包含 fontSize, fontWeight, lineHeight', () => {
    for (const level of requiredLevels) {
      const style = typography[level as keyof typeof typography];
      expect(style).toHaveProperty('fontSize');
      expect(style).toHaveProperty('fontWeight');
      expect(style).toHaveProperty('lineHeight');
      expect(typeof style.fontSize).toBe('number');
      expect(typeof style.lineHeight).toBe('number');
    }
  });

  it('fontSize 递减排列', () => {
    const levelOrder = requiredLevels;
    for (let i = 1; i < levelOrder.length; i++) {
      const prev = typography[levelOrder[i - 1] as keyof typeof typography];
      const curr = typography[levelOrder[i] as keyof typeof typography];
      // 允许某些相邻级别 fontSize 相同（如 headline/body 都是 17），
      // 但整体趋势不可逆增
      expect(curr.fontSize).toBeLessThanOrEqual(prev.fontSize);
    }
  });
});

// ============================================================
// fonts — 字体族
// ============================================================
describe('fonts', () => {
  it('display 和 body 有 fontFamily 和 fontWeight', () => {
    expect(fonts.display).toHaveProperty('fontFamily');
    expect(fonts.display).toHaveProperty('fontWeight');
    expect(fonts.display.fontWeight).toBe('700');
    expect(fonts.body).toHaveProperty('fontFamily');
    expect(fonts.body).toHaveProperty('fontWeight');
    expect(fonts.body.fontWeight).toBe('400');
  });
});

// ============================================================
// 跨 token 约束
// ============================================================
describe('cross-token constraints', () => {
  it('lineHeight 始终大于 fontSize', () => {
    for (const [name, style] of Object.entries(typography)) {
      expect(style.lineHeight).toBeGreaterThan(style.fontSize);
    }
  });

  it('每层 radius 有至少一个对应的 spacing 值', () => {
    const radiusVals = Object.values(radius).filter(v => v < 1000);
    for (const r of radiusVals) {
      const hasMatch = Object.values(spacing).some(s => Math.abs(s - r) <= 4);
      expect(hasMatch).toBe(true);
    }
  });
});
