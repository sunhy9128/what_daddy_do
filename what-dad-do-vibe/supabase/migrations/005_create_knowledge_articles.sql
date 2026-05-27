-- 孕期知识文章表

create table if not exists knowledge_articles (
  id serial primary key,
  emoji text not null default '📖',
  title text not null,
  content text not null,
  read_time text not null default '3分钟阅读',
  category text not null default '知识',
  stage text,                     -- 关联孕期阶段（备孕/孕早期/孕中期/孕晚期/产后）
  source text,                    -- 来源/权威参考
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 示例数据（迁移现有三条硬编码知识）
insert into knowledge_articles (emoji, title, content, read_time, category, stage, sort_order) values
('🫁', '准爸爸必看：孕26-28周该做什么', E'孕26-28周是孕晚期的开始，准爸爸需要了解这段时间的关键任务：\n\n1. 陪准妈妈做糖耐量测试（OGTT）\n2. 开始准备待产包，列好清单\n3. 了解分娩信号：见红、破水、规律宫缩\n4. 学习给准妈妈按摩缓解不适\n5. 关注胎动变化，每天记录\n\n这一阶段宝宝已经基本发育完全，主要是体重增长和器官成熟。准爸爸要多陪准妈妈散步，帮助控制体重。', '3分钟阅读', '知识', 'third', 1),
('👶', '宝宝胎动怎么数？准爸爸必会技能', E'数胎动是监测宝宝健康的重要方式：\n\n✅ 什么时候开始数？\n孕28周后每天数胎动，建议在固定时间（早、中、晚）\n\n✅ 怎么数？\n采用"12小时法"：每天早中晚各数1小时，3次相加×4=12小时总数\n正常范围：每小时3-10次，12小时30-40次以上\n\n✅ 什么情况要就医？\n- 12小时内胎动少于20次\n- 胎动突然剧烈后停止\n- 48小时无胎动\n\n准爸爸学会数胎动，能让准妈妈更安心！', '5分钟阅读', '知识', 'third', 2),
('🏥', '待产包清单：准爸爸打包指南', E'准爸爸必打包的待产包清单：\n\n👶 宝宝用品\n- 婴儿服2-3套（52码）\n- 包被、浴巾\n- 奶瓶、奶粉（小罐）\n- 纸尿裤NB码\n- 婴儿湿巾、护臀膏\n\n👩 妈妈用品\n- 产褥垫、刀纸\n- 一次性内裤\n- 哺乳内衣、月子服\n- 洗漱用品\n- 吸管杯、零食\n\n📄 重要文件\n- 产检本\n- 医保卡\n- 夫妻身份证\n- 准生证\n\n⚠️ 打包技巧：\n提前2个月准备好，分三个包（产房包、住院包、证件包），放在门口易取处！', '4分钟阅读', '知识', 'third', 3);

-- RLS：知识文章对所有用户只读
alter table knowledge_articles enable row level security;

create policy "Anyone can view knowledge articles"
  on knowledge_articles for select
  using (true);
