/**
 * @jest-environment node
 *
 * time.ts 单元测试
 * 相对时间格式化工具
 */
import { formatRelativeTime } from '../time';

describe('formatRelativeTime', () => {
  const REF_DATE = new Date('2026-06-10T12:00:00Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(REF_DATE);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  // --- 刚刚 ---
  it('不到 60 秒前显示 "刚刚"', () => {
    const now = new Date(REF_DATE.getTime() - 30 * 1000).toISOString();
    expect(formatRelativeTime(now)).toBe('刚刚');
  });

  it('正好 1 秒前显示 "刚刚"', () => {
    const now = new Date(REF_DATE.getTime() - 1000).toISOString();
    expect(formatRelativeTime(now)).toBe('刚刚');
  });

  // --- 分钟前 ---
  it('1 分钟前显示 "1分钟前"', () => {
    const t = new Date(REF_DATE.getTime() - 60 * 1000).toISOString();
    expect(formatRelativeTime(t)).toBe('1分钟前');
  });

  it('30 分钟前显示 "30分钟前"', () => {
    const t = new Date(REF_DATE.getTime() - 30 * 60 * 1000).toISOString();
    expect(formatRelativeTime(t)).toBe('30分钟前');
  });

  it('59 分钟前显示 "59分钟前"', () => {
    const t = new Date(REF_DATE.getTime() - 59 * 60 * 1000).toISOString();
    expect(formatRelativeTime(t)).toBe('59分钟前');
  });

  // --- 小时前 ---
  it('1 小时前显示 "1小时前"', () => {
    const t = new Date(REF_DATE.getTime() - 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(t)).toBe('1小时前');
  });

  it('5 小时前显示 "5小时前"', () => {
    const t = new Date(REF_DATE.getTime() - 5 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(t)).toBe('5小时前');
  });

  it('23 小时前显示 "23小时前"', () => {
    const t = new Date(REF_DATE.getTime() - 23 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(t)).toBe('23小时前');
  });

  // --- 天前 ---
  it('1 天前显示 "1天前"', () => {
    const t = new Date(REF_DATE.getTime() - 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(t)).toBe('1天前');
  });

  it('7 天前显示 "7天前"', () => {
    const t = new Date(REF_DATE.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(t)).toBe('7天前');
  });

  // --- 更早：当年内显示 M月D日 ---
  it('超过 7 天且在当年内显示 "M月D日"', () => {
    // 6月1日 → 9天前 → 6月1日
    const t = new Date('2026-06-01T12:00:00Z').toISOString();
    expect(formatRelativeTime(t)).toBe('6月1日');
  });

  // --- 更早：跨年显示 YYYY年M月D日 ---
  it('跨年显示 "YYYY年M月D日"', () => {
    // 去年 12 月
    const t = new Date('2025-12-25T12:00:00Z').toISOString();
    expect(formatRelativeTime(t)).toBe('2025年12月25日');
  });

  // --- 边界情况 ---
  it('刚好是 60 秒前（X分钟 vs 刚刚的边界）', () => {
    const t = new Date(REF_DATE.getTime() - 60 * 1000).toISOString();
    expect(formatRelativeTime(t)).toBe('1分钟前');
  });

  it('刚好是 60 分钟前（X小时 vs X分钟的边界）', () => {
    const t = new Date(REF_DATE.getTime() - 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(t)).toBe('1小时前');
  });

  it('刚好是 24 小时前（X天 vs X小时的边界）', () => {
    const t = new Date(REF_DATE.getTime() - 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(t)).toBe('1天前');
  });

  it('当前时间的格式', () => {
    expect(formatRelativeTime(new Date().toISOString())).toBe('刚刚');
  });

  it('禁止使用 emoji', () => {
    const t1 = new Date(REF_DATE.getTime() - 30 * 1000).toISOString();
    const t2 = new Date(REF_DATE.getTime() - 5 * 60 * 1000).toISOString();
    const t3 = new Date(REF_DATE.getTime() - 3 * 60 * 60 * 1000).toISOString();
    const t4 = new Date(REF_DATE.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(t1)).not.toMatch(/[\u{1F600}-\u{1F64F}]/u);
    expect(formatRelativeTime(t2)).not.toMatch(/[\u{1F600}-\u{1F64F}]/u);
    expect(formatRelativeTime(t3)).not.toMatch(/[\u{1F600}-\u{1F64F}]/u);
    expect(formatRelativeTime(t4)).not.toMatch(/[\u{1F600}-\u{1F64F}]/u);
  });
});
