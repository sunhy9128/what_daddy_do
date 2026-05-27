-- 宝宝表
-- 存储用户录入的怀孕/预产期信息
-- 根据预产期自动计算当前孕周和孕期阶段

create table if not exists babies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  due_date date not null,
  name text default '宝宝',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 启用 RLS
alter table babies enable row level security;

-- 用户只能看到自己的宝宝
create policy "Users can view their own babies"
  on babies for select
  using (auth.uid() = user_id);

-- 用户只能创建自己的宝宝
create policy "Users can create their own babies"
  on babies for insert
  with check (auth.uid() = user_id);

-- 用户只能更新自己的宝宝
create policy "Users can update their own babies"
  on babies for update
  using (auth.uid() = user_id);

-- 用户只能删除自己的宝宝
create policy "Users can delete their own babies"
  on babies for delete
  using (auth.uid() = user_id);

-- 索引：按用户查询
create index babies_user_idx on babies(user_id);
