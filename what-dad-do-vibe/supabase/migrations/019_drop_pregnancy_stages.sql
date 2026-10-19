-- 019: 删除 pregnancy_stages 死表
-- 背景：阶段计算自始在代码侧实现（src/lib/stages.ts 的 calculateStageFromDueDate），
-- 该表自 007 建表以来从未被任何代码读取。2026-09 功能取舍时确认删除。
DROP TABLE IF EXISTS pregnancy_stages;
