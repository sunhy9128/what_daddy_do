-- user_knowledge_reads 重建（修复列名不匹配）

drop table if exists user_knowledge_reads;

create table user_knowledge_reads (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  article_id integer not null,
  read_at timestamptz not null default now()
);

alter table user_knowledge_reads enable row level security;

create policy "Users can view their own reads"
  on user_knowledge_reads for select
  using (auth.uid()::text = user_id);

create policy "Users can insert their own reads"
  on user_knowledge_reads for insert
  with check (auth.uid()::text = user_id);
