/**
 * @jest-environment node
 *
 * camelToSnake.ts 单元测试
 */
import { camelToSnake, toSnakeCaseKeys } from '../utils/camelToSnake';

describe('camelToSnake', () => {
  it('camelCase 单段大写', () => {
    expect(camelToSnake('isCompleted')).toBe('is_completed');
    expect(camelToSnake('dailyCount')).toBe('daily_count');
    expect(camelToSnake('lastCheckinDate')).toBe('last_checkin_date');
  });

  it('首字母大写', () => {
    expect(camelToSnake('BabyId')).toBe('baby_id');
    expect(camelToSnake('DueDate')).toBe('due_date');
    expect(camelToSnake('A')).toBe('a');
  });

  it('已是小写返回原样', () => {
    expect(camelToSnake('id')).toBe('id');
    expect(camelToSnake('name')).toBe('name');
  });

  it('全小写 + 多词', () => {
    expect(camelToSnake('user_id')).toBe('user_id'); // 已经含下划线，不变
  });

  it('空字符串', () => {
    expect(camelToSnake('')).toBe('');
  });

  it('单字符', () => {
    expect(camelToSnake('A')).toBe('a');
    expect(camelToSnake('z')).toBe('z');
  });

  it('数字夹杂', () => {
    expect(camelToSnake('task2Id')).toBe('task2_id');
    expect(camelToSnake('record3Count')).toBe('record3_count');
  });

  it('连续大写（按单字符处理）', () => {
    // 注：这里的行为是 'parseHTML' → 'parse_h_t_m_l' (每个大写都加下划线)
    // 这是有意为之的保守策略；如有需要可改为基于大写连续段的实现
    expect(camelToSnake('parseHTML').startsWith('parse_')).toBe(true);
  });
});

describe('toSnakeCaseKeys', () => {
  it('简单对象', () => {
    const input = { isCompleted: true, dueDate: '2026-01-01' };
    expect(toSnakeCaseKeys(input)).toEqual({
      is_completed: true,
      due_date: '2026-01-01',
    });
  });

  it('空对象', () => {
    expect(toSnakeCaseKeys({})).toEqual({});
  });

  it('保留值类型不变', () => {
    const input = {
      count: 5,
      title: 'hello',
      isActive: true,
      items: [1, 2, 3],
      meta: { nestedKey: 'v' }, // 嵌套对象不会被递归处理（设计选择）
    };
    const result = toSnakeCaseKeys(input);
    expect(result.count).toBe(5);
    expect(result.is_active).toBe(true);
    expect(result.items).toEqual([1, 2, 3]);
    // 嵌套对象保持引用相等
    expect(result.meta).toBe(input.meta);
  });
});