-- 补充孕期阶段数据

insert into pregnancy_stages (id, name, weeks_start, weeks_end)
  select 0, '备孕', 0, 0
  where not exists (select 1 from pregnancy_stages where name = '备孕');

insert into pregnancy_stages (id, name, weeks_start, weeks_end)
  select 99, '产后', 41, 99
  where not exists (select 1 from pregnancy_stages where name = '产后');
