/**
 * @jest-environment node
 *
 * stages.ts 单元测试
 * 核心业务逻辑：孕期阶段计算 + 出生年龄计算
 */
import {
  calculateStageFromDueDate,
  calculateBirthAge,
  STAGE_LABELS,
  STAGES,
  PregnancyStage,
} from '../stages';

// ============================================================
// STAGE_LABELS — 阶段标签完整性
// ============================================================
describe('STAGE_LABELS', () => {
  const expected: Record<PregnancyStage, string> = {
    preconception: '备孕',
    first: '孕早期',
    second: '孕中期',
    third: '孕晚期',
    postpartum: '产后',
  };

  it('包含全部 5 个孕期阶段', () => {
    expect(Object.keys(STAGE_LABELS)).toHaveLength(5);
  });

  it.each([
    ['preconception', '备孕'],
    ['first', '孕早期'],
    ['second', '孕中期'],
    ['third', '孕晚期'],
    ['postpartum', '产后'],
  ] as [PregnancyStage, string][])('阶段 %s 的标签为 %s', (stage, label) => {
    expect(STAGE_LABELS[stage]).toBe(label);
    expect(STAGE_LABELS[stage]).toBe(expected[stage]);
  });
});

// ============================================================
// STAGES — 阶段定义列表
// ============================================================
describe('STAGES', () => {
  it('包含 5 个阶段定义', () => {
    expect(STAGES).toHaveLength(5);
  });

  it('按孕期顺序排列', () => {
    const keys = STAGES.map(s => s.key);
    expect(keys).toEqual([
      'preconception',
      'first',
      'second',
      'third',
      'postpartum',
    ]);
  });

  it('每个阶段定义包含 key/label/weeks', () => {
    for (const stage of STAGES) {
      expect(stage).toHaveProperty('key');
      expect(stage).toHaveProperty('label');
      expect(stage).toHaveProperty('weeks');
      expect(typeof stage.weeks).toBe('string');
    }
  });
});

// ============================================================
// calculateBirthAge — 出生年龄文本
// ============================================================
describe('calculateBirthAge', () => {
  // 固定当前时间以稳定测试结果
  const REF_DATE = new Date('2026-06-10T12:00:00Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(REF_DATE);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('出生日期在未来时返回空字符串（未出生）', () => {
    expect(calculateBirthAge('2026-12-01', null)).toBe('');
  });

  it('出生日期为今天时返回 "0天"', () => {
    expect(calculateBirthAge('2026-06-10', null)).toBe('0天');
  });

  it('出生 2 周时返回 "2周"', () => {
    expect(calculateBirthAge('2026-05-27', '2026-05-27')).toBe('2周');
  });

  it('出生 3 周时返回 "3周"', () => {
    expect(calculateBirthAge('2026-05-20', '2026-05-20')).toBe('3周');
  });

  it('出生 1 年 2 周时返回 "1年1周"（非闰年 365 天/年计算差异）', () => {
    expect(calculateBirthAge('2025-05-28', '2025-05-28')).toBe('1年1周');
  });

  it('出生约 1 年时显示 "52周"（非闰年计算 365 < 365.25 导致年份 floor 为 0）', () => {
    expect(calculateBirthAge('2025-06-10', '2025-06-10')).toBe('52周');
  });

  it('出生 3 年及以上时返回 "X岁"', () => {
    expect(calculateBirthAge('2023-05-01', '2023-05-01')).toBe('3岁');
  });

  it('出生超过 3 年时返回 "X岁"', () => {
    expect(calculateBirthAge('2022-01-01', '2022-01-01')).toBe('4岁');
  });

  it('无 birthDate 时回退到 dueDate', () => {
    // 5月27日出生 → 2周前
    expect(calculateBirthAge('2026-05-27', undefined)).toBe('2周');
  });

  it('birthDate 为空字符串时回退到 dueDate', () => {
    expect(calculateBirthAge('2026-05-27', '')).toBe('2周');
  });

  it('出生不足 1 周时返回 "X天"', () => {
    expect(calculateBirthAge('2026-06-08', '2026-06-08')).toBe('2天');
  });
});

// ============================================================
// calculateStageFromDueDate — 孕期阶段推算
// ============================================================
describe('calculateStageFromDueDate', () => {
  const REF_DATE = new Date('2026-06-10T12:00:00Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(REF_DATE);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  // --- 备孕期 ---
  it('预产期 > 280 天后为备孕期', () => {
    // 280+ 天后
    const result = calculateStageFromDueDate('2027-04-01');
    expect(result.stage).toBe('preconception');
    expect(result.weeksPregnant).toBe(0);
    expect(result.stageLabel).toBe('备孕');
  });

  // --- 孕早期 ---
  it('孕周 1-12 周为孕早期', () => {
    // 预产期在约 280-12*7 = ~196 天后 → 孕早期末
    const result = calculateStageFromDueDate('2026-12-20');
    // 2026-12-20 减去 2026-06-10 = 193 天 → 280-193=87 → ~12周
    // 12周 (84-90天) 范围
    expect(result.stage).toBe('first');
    expect(result.stageLabel).toBe('孕早期');
  });

  it('孕周接近 0 周时仍为孕早期', () => {
    // 预产期 ≈ 280 天后
    const result = calculateStageFromDueDate('2027-03-17');
    expect(result.stage).toBe('first');
    expect(result.weeksPregnant).toBeLessThanOrEqual(1);
  });

  // --- 孕中期 ---
  it('孕周 13-27 周为孕中期', () => {
    // 预产期在约 280-13*7 = ~189 天后
    const result = calculateStageFromDueDate('2026-12-10');
    // 183 天 → 280-183=97 → ~13周
    expect(result.stage).toBe('second');
    expect(result.stageLabel).toBe('孕中期');
  });

  it('孕周 27 周为孕中期', () => {
    // 280-27*7 = 91 天后
    const result = calculateStageFromDueDate('2026-09-09');
    // 91 天 → 280-91=189 → 27周
    expect(result.stage).toBe('second');
  });

  // --- 孕晚期 ---
  it('孕周 28-40 周为孕晚期', () => {
    // 预产期在约 280-28*7 = ~84 天后
    const result = calculateStageFromDueDate('2026-09-02');
    expect(result.stage).toBe('third');
    expect(result.stageLabel).toBe('孕晚期');
  });

  it('预产期在今天（0 天剩余）按当前实现算产后（daysLeft <= 0 边界）', () => {
    // 实际行为：daysLeft=0 命中 `else if (daysLeft <= 0)` 分支 → postpartum
    // 测试断言与 stages.ts 实现保持一致，不擅自修改业务边界
    const result = calculateStageFromDueDate('2026-06-10');
    expect(result.stage).toBe('postpartum');
    expect(result.weeksPregnant).toBe(40);
  });

  it('预产期 1 天后为孕晚期 (40 周前一天)', () => {
    // daysLeft=1 → weeksPregnant=(280-1)/7=39 → third
    const result = calculateStageFromDueDate('2026-06-11');
    expect(result.stage).toBe('third');
    expect(result.weeksPregnant).toBe(39);
  });

  // --- 产后 ---
  it('预产期已过为产后', () => {
    const result = calculateStageFromDueDate('2026-05-01');
    expect(result.stage).toBe('postpartum');
    expect(result.stageLabel).toBe('产后');
  });

  it('预产期已过很久为产后', () => {
    const result = calculateStageFromDueDate('2025-01-01');
    expect(result.stage).toBe('postpartum');
  });

  // --- 孕周计算 ---
  it('未出生时 weeksPregnant 在 0-40 之间', () => {
    const early = calculateStageFromDueDate('2027-03-17');
    expect(early.weeksPregnant).toBeGreaterThanOrEqual(0);
    expect(early.weeksPregnant).toBeLessThanOrEqual(40);

    const late = calculateStageFromDueDate('2026-09-02');
    expect(late.weeksPregnant).toBeGreaterThanOrEqual(0);
    expect(late.weeksPregnant).toBeLessThanOrEqual(40);
  });

  it('预产期已过时 weeksPregnant 可能超过 40', () => {
    const post = calculateStageFromDueDate('2026-05-01');
    expect(post.weeksPregnant).toBeGreaterThan(40);
  });

  it('禁止使用 emoji 作为返回内容', () => {
    const result = calculateStageFromDueDate('2026-10-01');
    expect(result.stageLabel).not.toMatch(/[\u{1F600}-\u{1F64F}]/u);
    expect(result.stageLabel).not.toMatch(/[\u{1F300}-\u{1F5FF}]/u);
  });
});
