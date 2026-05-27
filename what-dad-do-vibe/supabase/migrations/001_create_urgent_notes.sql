-- 紧急关注表
-- 不属于待办类，创建后会一直在首页顶部展示，用户手动关闭才不再展示
-- 适用于医疗类或特别关注类提醒（如 "观察明天是否还有红疹"）

create table if not exists urgent_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  dismissed_at timestamptz
);

-- 启用 RLS
alter table urgent_notes enable row level security;

-- 用户只能看到自己的紧急关注
create policy "Users can view their own urgent notes"
  on urgent_notes for select
  using (auth.uid() = user_id);

-- 用户只能创建自己的紧急关注
create policy "Users can create their own urgent notes"
  on urgent_notes for insert
  with check (auth.uid() = user_id);

-- 用户只能更新自己的紧急关注（关闭场景）
create policy "Users can update their own urgent notes"
  on urgent_notes for update
  using (auth.uid() = user_id);

-- 用户只能删除自己的紧急关注
create policy "Users can delete their own urgent notes"
  on urgent_notes for delete
  using (auth.uid() = user_id);

-- 索引：按用户 + 活跃状态查询
create index urgent_notes_user_active_idx on urgent_notes(user_id, is_active);

-- 种子数据函数（SECURITY DEFINER 绕过 RLS）
create or replace function seed_urgent_notes(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 清除旧数据
  delete from urgent_notes where user_id = p_user_id;

  -- 插入示例
  insert into urgent_notes (user_id, content) values
    (p_user_id, '📌 观察明天是否还有红疹'),
    (p_user_id, '💊 今天已经吃了3次退烧药，注意间隔6小时以上'),
    (p_user_id, '💉 明天疫苗最后截止日，记得带上疫苗本'),
    (p_user_id, '🫁 宝宝黄疸指数偏高，注意观察肤色变化'),
    (p_user_id, '❤️ 妈妈血压偏高，今天早晚各测一次');
end;
$$;
