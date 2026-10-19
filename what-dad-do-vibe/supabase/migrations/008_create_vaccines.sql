-- 国家免疫规划疫苗表（含自费）
create table if not exists vaccines (
  id serial primary key,
  name text not null,                  -- 疫苗名称，如"乙肝疫苗"
  disease text not null,               -- 预防疾病
  category text not null check (category in ('免费', '自费')),  -- 免费/自费
  total_doses integer not null,        -- 总接种剂次
  notes text                           -- 备注
);

-- 疫苗剂次表（每次接种的详细要求）
create table if not exists vaccine_doses (
  id serial primary key,
  vaccine_id integer not null references vaccines(id) on delete cascade,
  dose_number integer not null,        -- 第几剂（1, 2, 3...）
  min_age_months integer not null,     -- 最早接种月龄
  max_age_months integer,              -- 最晚接种月龄（nullable）
  min_interval_days integer,           -- 与上一剂最短间隔天数
  notes text                           -- 剂次说明
);

-- 用户接种记录表
create table if not exists user_vaccinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  dose_id integer not null references vaccine_doses(id) on delete cascade,
  vaccinated_at date,                  -- 实际接种日期
  is_vaccinated boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, dose_id)
);

-- RLS
alter table user_vaccinations enable row level security;

drop policy if exists "Users can view their own vaccinations" on user_vaccinations;
create policy "Users can view their own vaccinations"
  on user_vaccinations for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own vaccinations" on user_vaccinations;
create policy "Users can insert their own vaccinations"
  on user_vaccinations for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own vaccinations" on user_vaccinations;
create policy "Users can update their own vaccinations"
  on user_vaccinations for update using (auth.uid() = user_id);

-- 索引
create index if not exists user_vaccinations_user_idx on user_vaccinations(user_id);
create index if not exists vaccine_doses_vaccine_idx on vaccine_doses(vaccine_id);

-- ====== 数据 ======

-- 免费疫苗
insert into vaccines (name, disease, category, total_doses, notes) values
('乙肝疫苗', '乙型肝炎', '免费', 3, '出生后24小时内接种第一剂'),
('卡介苗', '结核病', '免费', 1, '出生后尽早接种'),
('脊灰灭活疫苗(IPV)', '脊髓灰质炎', '免费', 2, null),
('脊灰减毒活疫苗(bOPV)', '脊髓灰质炎', '免费', 2, null),
('百白破疫苗', '百日咳、白喉、破伤风', '免费', 4, null),
('白破疫苗', '白喉、破伤风', '免费', 1, '6岁接种'),
('麻腮风疫苗', '麻疹、腮腺炎、风疹', '免费', 2, null),
('乙脑减毒活疫苗', '流行性乙型脑炎', '免费', 2, null),
('A群流脑多糖疫苗', '流行性脑脊髓膜炎', '免费', 2, null),
('A+C群流脑多糖疫苗', '流行性脑脊髓膜炎', '免费', 2, null),
('甲肝减毒活疫苗', '甲型肝炎', '免费', 1, null);

-- 自费疫苗
insert into vaccines (name, disease, category, total_doses, notes) values
('13价肺炎球菌疫苗', '肺炎球菌性疾病', '自费', 4, null),
('水痘疫苗', '水痘', '自费', 2, null),
('口服轮状病毒疫苗', '轮状病毒腹泻', '自费', 3, null),
('流感疫苗', '流行性感冒', '自费', 2, '每年接种'),
('EV71灭活疫苗', '手足口病（重症）', '自费', 2, null),
('五联疫苗', '百白破+脊灰+Hib', '自费', 4, '替代百白破+IPV+Hib');

-- 免费疫苗剂次
insert into vaccine_doses (vaccine_id, dose_number, min_age_months, max_age_months, min_interval_days, notes) values
-- 乙肝疫苗 (id=1)
(1, 1, 0, 1, 0, '出生后24小时内'),
(1, 2, 1, 2, 30, null),
(1, 3, 6, 12, 150, null),
-- 卡介苗 (id=2)
(2, 1, 0, 3, 0, '出生后尽早接种'),
-- 脊灰IPV (id=3)
(3, 1, 2, 3, 0, null),
(3, 2, 3, 4, 30, null),
-- 脊灰bOPV (id=4)
(4, 1, 4, 4, 30, null),
(4, 2, 4, 4, 30, null),
-- 百白破 (id=5)
(5, 1, 3, 4, 0, null),
(5, 2, 4, 5, 30, null),
(5, 3, 5, 6, 30, null),
(5, 4, 18, 24, 360, null),
-- 白破 (id=6)
(6, 1, 72, 84, 0, '6岁'),
-- 麻腮风 (id=7)
(7, 1, 8, 10, 0, null),
(7, 2, 18, 24, 300, null),
-- 乙脑 (id=8)
(8, 1, 8, 10, 0, null),
(8, 2, 24, 30, 360, null),
-- A群流脑 (id=9)
(9, 1, 6, 7, 0, null),
(9, 2, 9, 10, 30, null),
-- A+C群流脑 (id=10)
(10, 1, 36, 40, 0, '3岁'),
(10, 2, 72, 84, 0, '6岁'),
-- 甲肝 (id=11)
(11, 1, 18, 24, 0, null);

-- 自费疫苗剂次
insert into vaccine_doses (vaccine_id, dose_number, min_age_months, max_age_months, min_interval_days, notes) values
-- 13价肺炎 (id=12)
(12, 1, 2, 3, 0, null),
(12, 2, 4, 5, 30, null),
(12, 3, 6, 7, 30, null),
(12, 4, 12, 15, 180, null),
-- 水痘 (id=13)
(13, 1, 12, 18, 0, null),
(13, 2, 48, 60, 0, null),
-- 轮状病毒 (id=14)
(14, 1, 2, 3, 0, null),
(14, 2, 4, 5, 30, null),
(14, 3, 6, 7, 30, null),
-- 流感 (id=15)
(15, 1, 6, 36, 0, '首次接种2剂'),
(15, 2, 7, 37, 30, null),
-- EV71 (id=16)
(16, 1, 6, 7, 0, null),
(16, 2, 7, 8, 30, null),
-- 五联 (id=17)
(17, 1, 2, 3, 0, '替代方案'),
(17, 2, 3, 4, 30, null),
(17, 3, 4, 5, 30, null),
(17, 4, 18, 24, 360, null);
