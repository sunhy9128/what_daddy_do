-- 021: 删除 preset_tasks 表
-- 背景：2026-09 静态内容归属决策——「DB = 用户数据，代码 = 内容」。
-- 预设任务数据已收敛为代码单源（src/lib/preset-tasks.ts，142 条，
-- 合并自原 DB 种子与代码兜底，custom 类型已归入 daily），
-- getPresetTasks 的 DB 读取已从代码移除。preset_tasks.sql 种子文件同时归档删除。
DROP TABLE IF EXISTS public.preset_tasks;
