-- 帖子点赞表
create table if not exists post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

-- 帖子评论表
create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- RLS
alter table post_likes enable row level security;
alter table post_comments enable row level security;

-- post_likes policies
create policy "Anyone can view likes"
  on post_likes for select
  using (true);

create policy "Users can like"
  on post_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike"
  on post_likes for delete
  using (auth.uid() = user_id);

-- post_comments policies
create policy "Anyone can view comments"
  on post_comments for select
  using (true);

create policy "Users can comment"
  on post_comments for insert
  with check (auth.uid() = user_id);

-- 索引
create index post_likes_post_idx on post_likes(post_id);
create index post_likes_user_post_idx on post_likes(user_id, post_id);
create index post_comments_post_idx on post_comments(post_id);
