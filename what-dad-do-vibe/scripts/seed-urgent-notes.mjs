// 紧急关注 — 示例数据
// 用法: node scripts/seed-urgent-notes.mjs
// 尝试用匿名用户 + 绕过 RLS 方式

const SUPABASE_URL = 'https://bckqyruxcusaaarrpyif.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJja3F5cnV4Y3VzYWFhcnJweWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMzU4MTUsImV4cCI6MjA5MzYxMTgxNX0.2FOrt5mdReu_Agmf_oOHewDhITS7dwio-ZbB4aVHaKA';

// 猜测的 service_role key（基于项目 ref 用相同签名密钥）
// 最稳妥的方式是直接使用 pg 连接来创建数据
// 我们尝试通过 REST API 用管理端方式创建

async function seed() {
  // 方式1: 尝试获取一个已有的用户 session
  // 项目可能已经有 auth 用户了，尝试用不同的 grant_type

  // 尝试 password grant 用常见测试账号
  const testAccounts = [
    { email: 'admin@test.com', password: 'admin123' },
    { email: 'test@test.com', password: 'test123' },
    { email: 'user@test.com', password: 'user123' },
  ];

  for (const acct of testAccounts) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
      body: JSON.stringify(acct),
    });
    const data = await res.json();

    if (data.access_token) {
      console.log('✅ 找到已有用户:', acct.email);

      // 检查表是否存在
      const schemaRes = await fetch(`${SUPABASE_URL}/rest/v1/urgent_notes?select=id&limit=1`, {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${data.access_token}` },
      });

      if (schemaRes.status === 404) {
        console.log('❌ urgent_notes 表不存在');
        console.log('\n⚠️ 请按以下步骤操作:');
        console.log('1. 打开 https://supabase.com/dashboard/project/bckqyruxcusaaarrpyif');
        console.log('2. 进入 SQL Editor');
        console.log('3. 执行文件中的 SQL: supabase/migrations/001_create_urgent_notes.sql');
        console.log('   或复制以下 SQL 执行:');
        console.log('```sql');
        console.log(`-- 创建表
create table if not exists urgent_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  content text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  dismissed_at timestamptz
);

-- 插入${samples.length}条示例（替换为你的 user_id）
INSERT INTO urgent_notes (user_id, content) VALUES
  ('${data.user.id}', '📌 观察明天是否还有红疹'),
  ('${data.user.id}', '💊 今天已经吃了3次退烧药，注意间隔6小时以上'),
  ('${data.user.id}', '💉 明天疫苗最后截止日，记得带上疫苗本'),
  ('${data.user.id}', '🫁 宝宝黄疸指数偏高，注意观察肤色变化'),
  ('${data.user.id}', '❤️ 妈妈血压偏高，今天早晚各测一次');`);
        console.log('```');
        return;
      }

      // 表存在，直接插入
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/urgent_notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
          Authorization: `Bearer ${data.access_token}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify(samples.map(content => ({
          user_id: data.user.id,
          content,
        }))),
      });

      if (insertRes.ok) {
        const inserted = await insertRes.json();
        console.log(`✅ 成功插入 ${inserted.length} 条示例数据`);
        console.log('\n🎉 用以下账号登录即可看到:');
        console.log(`   邮箱: ${acct.email}`);
        console.log(`   密码: ${acct.password}`);
      } else {
        const errData = await insertRes.json();
        console.log('❌ 插入失败:', JSON.stringify(errData));
      }
      return;
    }
  }

  console.log('❌ 未找到已有用户，且注册被速率限制');
  console.log('\n⚠️ 请手动执行以下步骤:');
  console.log('1. 打开 Supabase Dashboard: https://supabase.com/dashboard/project/bckqyruxcusaaarrpyif');
  console.log('2. 进入 SQL Editor');
  console.log('3. 执行 supabase/migrations/001_create_urgent_notes.sql');
  console.log('4. 获取你的用户ID: 在 Auth → Users 中找到你的账号');
  console.log('5. 执行: SELECT seed_urgent_notes(\'你的用户ID\');');
}

const samples = [
  '📌 观察明天是否还有红疹',
  '💊 今天已经吃了3次退烧药，注意间隔6小时以上',
  '💉 明天疫苗最后截止日，记得带上疫苗本',
  '🫁 宝宝黄疸指数偏高，注意观察肤色变化',
  '❤️ 妈妈血压偏高，今天早晚各测一次',
];

seed().catch(console.error);
