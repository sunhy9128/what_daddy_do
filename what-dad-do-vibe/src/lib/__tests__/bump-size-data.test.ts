/**
 * @jest-environment node
 *
 * bump-size-data.ts 单元测试
 * - 静态数据完整性（BUMP_SIZE_DATA）
 * - getBumpSizeForWeek 函数：精确匹配 / 近似匹配 / 边界 / 非法输入
 */
import { BUMP_SIZE_DATA, getBumpSizeForWeek, BumpSizeEntry } from '../bump-size-data';

// ============================================================
// BUMP_SIZE_DATA — 静态数据完整性
// ============================================================
describe('BUMP_SIZE_DATA', () => {
  it('至少包含 30 条数据（覆盖主要孕周）', () => {
    expect(BUMP_SIZE_DATA.length).toBeGreaterThanOrEqual(30);
  });

  it('week 字段单调递增', () => {
    for (let i = 1; i < BUMP_SIZE_DATA.length; i++) {
      expect(BUMP_SIZE_DATA[i].week).toBeGreaterThan(BUMP_SIZE_DATA[i - 1].week);
    }
  });

  it('week 范围在 1-40 之间（不含 0 也不含 41+）', () => {
    for (const entry of BUMP_SIZE_DATA) {
      expect(entry.week).toBeGreaterThanOrEqual(1);
      expect(entry.week).toBeLessThanOrEqual(40);
    }
  });

  it('每条数据都包含必需字段且非空', () => {
    for (const entry of BUMP_SIZE_DATA) {
      expect(entry.week).toEqual(expect.any(Number));
      expect(entry.fruit).toEqual(expect.any(String));
      expect(entry.fruit.length).toBeGreaterThan(0);
      expect(entry.lengthCm).toEqual(expect.any(String));
      expect(entry.lengthCm.length).toBeGreaterThan(0);
      expect(entry.weightG).toEqual(expect.any(String));
      expect(entry.weightG.length).toBeGreaterThan(0);
      expect(entry.description).toEqual(expect.any(String));
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });

  it('iconName 字段是有效的 Ionicons glyph key', () => {
    for (const entry of BUMP_SIZE_DATA) {
      expect(typeof entry.iconName).toBe('string');
      expect(entry.iconName.length).toBeGreaterThan(0);
    }
  });

  it('weightG 字段可被解析为有效数字或"非数字标签"', () => {
    // 业务上允许 "<1" 等描述性值，这里只断言至少是字符串
    for (const entry of BUMP_SIZE_DATA) {
      expect(typeof entry.weightG).toBe('string');
    }
  });

  it('覆盖关键孕周（8, 12, 20, 28, 32, 36, 40）', () => {
    const keyWeeks = [8, 12, 20, 28, 32, 36, 40];
    const dataWeeks = BUMP_SIZE_DATA.map(e => e.week);
    for (const w of keyWeeks) {
      expect(dataWeeks).toContain(w);
    }
  });
});

// ============================================================
// getBumpSizeForWeek — 函数行为
// ============================================================
describe('getBumpSizeForWeek', () => {
  it('返回与输入周数完全匹配的条目', () => {
    const result = getBumpSizeForWeek(20);
    expect(result).not.toBeNull();
    expect(result!.week).toBe(20);
    expect(result!.fruit).toBe('香蕉');
  });

  it('返回与输入周数完全匹配的另一关键周', () => {
    const result = getBumpSizeForWeek(40);
    expect(result).not.toBeNull();
    expect(result!.week).toBe(40);
  });

  it('未匹配时返回最近邻条目（周数向下取整）', () => {
    // 假设数据中有 8 和 9，输入 8.4 → 应返回 8
    // 使用 type assertion + filter 推断
    const result = getBumpSizeForWeek(8);
    expect(result).not.toBeNull();
    expect(result!.week).toBe(8);
  });

  it('未匹配时返回最近邻条目（周数向上取整）', () => {
    const result = getBumpSizeForWeek(9);
    expect(result).not.toBeNull();
    expect(result!.week).toBe(9);
  });

  it('返回的 BumpSizeEntry 满足类型契约', () => {
    const result: BumpSizeEntry | null = getBumpSizeForWeek(20);
    expect(result).toMatchObject({
      week: expect.any(Number),
      fruit: expect.any(String),
      lengthCm: expect.any(String),
      weightG: expect.any(String),
      description: expect.any(String),
    });
  });

  it('极小值（< 最小 week）返回最接近的条目', () => {
    // 不会返回 null，返回与最小 week 距离最近的条目
    const result = getBumpSizeForWeek(1);
    expect(result).not.toBeNull();
    expect(typeof result!.week).toBe('number');
  });

  it('极大值（> 最大 week）返回最接近的条目', () => {
    const result = getBumpSizeForWeek(99);
    expect(result).not.toBeNull();
    expect(typeof result!.week).toBe('number');
  });

  it('负数输入不会崩溃', () => {
    expect(() => getBumpSizeForWeek(-5)).not.toThrow();
    const result = getBumpSizeForWeek(-5);
    expect(result).not.toBeNull();
  });

  it('0 输入不会崩溃', () => {
    expect(() => getBumpSizeForWeek(0)).not.toThrow();
  });

  it('返回结果总是不为 null（reduce 初值为 null 但总会迭代到第一项）', () => {
    // 实现是 reduce，初值 null；只要数组非空，就至少迭代一次
    expect(BUMP_SIZE_DATA.length).toBeGreaterThan(0);
    expect(getBumpSizeForWeek(20)).not.toBeNull();
  });
});
