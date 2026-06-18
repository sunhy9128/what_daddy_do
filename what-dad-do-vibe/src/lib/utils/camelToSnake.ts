/**
 * camelCase → snake_case 转换
 *
 * 设计目标：
 * - 正确处理首字母大写：'FooBar' → 'foo_bar'
 * - 正确处理连续大写：'parseHTMLString' → 'parse_html_string'（虽然 React/Supabase
 *   中没有这种字段，但保险起见）
 * - 单字符大写：'X' → 'x'（无下划线）
 * - 已全小写：原样返回
 *
 * @example
 * camelToSnake('isCompleted')         // 'is_completed'
 * camelToSnake('dailyCount')          // 'daily_count'
 * camelToSnake('lastCheckinDate')     // 'last_checkin_date'
 * camelToSnake('BabyId')              // 'baby_id'
 * camelToSnake('id')                  // 'id'
 */
export function camelToSnake(input: string): string {
  if (!input) return input;
  // 先在每个大写字母前插入下划线（首字母除外），再统一小写
  return input.replace(/[A-Z]/g, (letter, offset) => (offset === 0 ? letter.toLowerCase() : `_${letter.toLowerCase()}`));
}

/**
 * 批量转换对象的所有键从 camelCase 到 snake_case
 *
 * @example
 * toSnakeCaseKeys({ isCompleted: true, dueDate: '2026-01-01' })
 * // { is_completed: true, due_date: '2026-01-01' }
 */
export function toSnakeCaseKeys<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnake(key)] = value;
  }
  return result;
}