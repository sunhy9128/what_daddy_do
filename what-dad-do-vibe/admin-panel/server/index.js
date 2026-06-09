import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================
// 资源映射：React Admin 资源名 → Supabase 表名 + 主键
// ============================================================
const RESOURCES = {
  users:               { table: 'users',              schema: 'auth',  pk: 'id' },
  babies:              { table: 'babies',              schema: 'public', pk: 'id' },
  tasks:               { table: 'tasks',               schema: 'public', pk: 'id' },
  records:             { table: 'records',              schema: 'public', pk: 'id' },
  preset_tasks:        { table: 'preset_tasks',         schema: 'public', pk: 'id' },
  preset_items:        { table: 'preset_items',         schema: 'public', pk: 'id' },
  user_preparations:   { table: 'user_preparations',    schema: 'public', pk: 'id' },
  urgent_notes:        { table: 'urgent_notes',         schema: 'public', pk: 'id' },
  community_posts:     { table: 'community_posts',      schema: 'public', pk: 'id' },
  post_comments:       { table: 'post_comments',        schema: 'public', pk: 'id' },
  post_likes:          { table: 'post_likes',           schema: 'public', pk: 'id' },
  knowledge_articles:  { table: 'knowledge_articles',   schema: 'public', pk: 'id' },
  user_knowledge_reads:{ table: 'user_knowledge_reads',  schema: 'public', pk: 'id' },
  psychological_support:{table: 'psychological_support', schema: 'public', pk: 'id' },
  pregnancy_stages:    { table: 'pregnancy_stages',     schema: 'public', pk: 'id' },
  vaccines:            { table: 'vaccines',             schema: 'public', pk: 'id' },
  vaccine_doses:       { table: 'vaccine_doses',        schema: 'public', pk: 'id' },
  user_vaccinations:   { table: 'user_vaccinations',    schema: 'public', pk: 'id' },
  food_safety:         { table: 'food_safety',          schema: 'public', pk: 'id' },
};

const PORT = parseInt(process.env.PORT || '3001', 10);
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bckqyruxcusaaarrpyif.supabase.co';
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY || '';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dadcare-admin-secret-change-me';

if (!SERVICE_ROLE_KEY) {
  console.error('❌ 请设置 SERVICE_ROLE_KEY 环境变量');
  console.error('   在 .env 文件中添加: SERVICE_ROLE_KEY=你的service_role_key');
  process.exit(1);
}

// ============================================================
// Supabase 客户端（service_role — 绕过 RLS）
// ============================================================
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ============================================================
// Express 应用
// ============================================================
const app = express();
app.use(express.json());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));

// ============================================================
// 中间件：认证检查
// ============================================================
function requireAuth(req, res, next) {
  if (req.session?.authenticated) return next();
  // API 请求未认证返回 401，前端请求返回 HTML 登录页
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.redirect('/login');
}

// ============================================================
// 登录/登出
// ============================================================
app.get('/login', (req, res) => {
  if (req.session?.authenticated) return res.redirect('/');
  res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>登录 - 管理后台</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f5f5f7; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .box { background: white; border-radius: 16px; padding: 40px; width: 360px; box-shadow: 0 2px 20px rgba(0,0,0,.08); }
  h1 { font-size: 22px; font-weight: 600; margin-bottom: 8px; color: #1d1d1f; }
  p { font-size: 14px; color: #86868b; margin-bottom: 24px; }
  input { width: 100%; padding: 12px 14px; border: 1px solid #d2d2d7; border-radius: 10px; font-size: 15px; margin-bottom: 12px; outline: none; }
  input:focus { border-color: #0071e3; }
  button { width: 100%; padding: 12px; background: #0071e3; color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 500; cursor: pointer; }
  button:hover { background: #0068d1; }
  .error { color: #ff3b30; font-size: 13px; margin-top: 8px; text-align: center; }
</style></head>
<body>
  <div class="box">
    <h1>管理后台</h1>
    <p>爸爸去哪了 · 数据维护</p>
    <form method="POST" action="/login">
      <input type="email" name="email" placeholder="邮箱" required autofocus>
      <input type="password" name="password" placeholder="密码" required>
      <button type="submit">登录</button>
      ${req.query.error ? '<div class="error">邮箱或密码错误</div>' : ''}
    </form>
  </div>
</body></html>`);
});

app.post('/login', express.urlencoded({ extended: true }), (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@dadcare.com' && password === 'dadcare2024') {
    req.session.authenticated = true;
    return res.redirect('/');
  }
  res.redirect('/login?error=1');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// ============================================================
// API 路由（所有 CRUD）
// ============================================================

// 解析 ra-data-simple-rest 参数
function parseQuery(query) {
  let sort = 'id';
  let order = 'ASC';
  try {
    sort = query.sort ? JSON.parse(query.sort) : 'id';
  } catch {
    sort = query.sort || 'id';
  }
  order = query.order || 'ASC';
  const page = parseInt(query.page || '1', 10);
  const perPage = parseInt(query.perPage || '20', 10);
  let filter = {};
  try {
    filter = query.filter ? JSON.parse(query.filter) : {};
  } catch {
    filter = {};
  }
  return { sort, order, page, perPage, filter };
}

// 列表
app.get('/api/:resource', requireAuth, async (req, res) => {
  const resource = RESOURCES[req.params.resource];
  if (!resource) return res.status(404).json({ error: 'Unknown resource' });

  const { sort, order, page, perPage, filter } = parseQuery(req.query);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const pk = resource.pk || 'id';

  let query = supabase
    .from(resource.table)
    .select('*', { count: 'exact' });

  if (resource.schema === 'auth') {
    query = query.schema('auth');
  }

  // 应用筛选
  for (const [key, value] of Object.entries(filter)) {
    if (value !== '' && value !== null && value !== undefined) {
      if (key === 'q') continue; // 全文搜索不在此处处理
      query = query.eq(key, value);
    }
  }

  const { data, error, count } = await query
    .order(sort, { ascending: order === 'ASC' })
    .range(from, to);

  if (error) return res.status(400).json({ error: error.message });

  res.json({
    data: data || [],
    total: count || 0,
  });
});

// 详情
app.get('/api/:resource/:id', requireAuth, async (req, res) => {
  const resource = RESOURCES[req.params.resource];
  if (!resource) return res.status(404).json({ error: 'Unknown resource' });
  const pk = resource.pk || 'id';

  let query = supabase.from(resource.table).select('*').eq(pk, req.params.id);
  if (resource.schema === 'auth') query = query.schema('auth');

  const { data, error } = await query.single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

// 创建
app.post('/api/:resource', requireAuth, async (req, res) => {
  const resource = RESOURCES[req.params.resource];
  if (!resource) return res.status(404).json({ error: 'Unknown resource' });

  let query = supabase
    .from(resource.table)
    .insert(req.body)
    .select()
    .single();

  if (resource.schema === 'auth') query = query.schema('auth');

  const { data, error } = await query;

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ data });
});

// 更新
app.put('/api/:resource/:id', requireAuth, async (req, res) => {
  const resource = RESOURCES[req.params.resource];
  if (!resource) return res.status(404).json({ error: 'Unknown resource' });
  const pk = resource.pk || 'id';

  // 只对非 auth schema 的表添加 updated_at
  const updates = resource.schema === 'auth' ? req.body : { ...req.body, updated_at: new Date().toISOString() };

  let query = supabase
    .from(resource.table)
    .update(updates)
    .eq(pk, req.params.id)
    .select()
    .single();

  if (resource.schema === 'auth') query = query.schema('auth');

  const { data, error } = await query;

  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

// 删除
app.delete('/api/:resource/:id', requireAuth, async (req, res) => {
  const resource = RESOURCES[req.params.resource];
  if (!resource) return res.status(404).json({ error: 'Unknown resource' });
  const pk = resource.pk || 'id';

  let query = supabase
    .from(resource.table)
    .delete()
    .eq(pk, req.params.id);

  if (resource.schema === 'auth') query = query.schema('auth');

  const { error } = await query;

  if (error) return res.status(400).json({ error: error.message });
  res.json({ data: { id: req.params.id } });
});

// ============================================================
// 前端 — 提供 React Admin SPA 或简易 HTML 页面
// ============================================================
const frontendPath = join(__dirname, '..', 'frontend');

// 如果有 built 的 React 前台则提供，否则用简易版
app.get('/', requireAuth, (req, res) => {
  const builtPath = join(frontendPath, 'dist', 'index.html');
  if (existsSync(builtPath)) {
    return res.sendFile(builtPath);
  }
  // 简易版管理页面 — 自包含，无需构建
  res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>爸爸去哪了 · 管理后台</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/inter@5/css/inter.min.css">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f5f5f7; color: #1d1d1f; }
.sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 220px; background: #1d1d1f; color: #fff; padding: 20px; overflow-y: auto; z-index: 10; }
.sidebar h1 { font-size: 16px; font-weight: 600; margin-bottom: 20px; color: #fff; }
.sidebar a { display: block; padding: 8px 12px; color: #a1a1a6; text-decoration: none; font-size: 13px; border-radius: 6px; margin-bottom: 2px; }
.sidebar a:hover, .sidebar a.active { background: rgba(255,255,255,.1); color: #fff; }
.main { margin-left: 220px; padding: 24px; min-height: 100vh; }
.header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.header h2 { font-size: 20px; font-weight: 600; }
.header a { font-size: 13px; color: #0071e3; text-decoration: none; }
.toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.search-input { padding: 8px 12px; border: 1px solid #d2d2d7; border-radius: 8px; font-size: 13px; width: 240px; outline: none; }
.search-input:focus { border-color: #0071e3; }
.btn { padding: 8px 16px; border: none; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; }
.btn-primary { background: #0071e3; color: #fff; }
.btn-primary:hover { background: #0068d1; }
.btn-danger { background: #ff3b30; color: #fff; }
.btn-outline { background: transparent; border: 1px solid #d2d2d7; color: #1d1d1f; }
table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 10px rgba(0,0,0,.04); }
th { background: #f5f5f7; text-align: left; padding: 10px 14px; font-size: 12px; font-weight: 600; color: #6e6e73; white-space: nowrap; cursor: pointer; user-select: none; }
th:hover { color: #1d1d1f; }
td { padding: 10px 14px; font-size: 13px; border-top: 1px solid #f0f0f2; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
tr:hover td { background: #fafafa; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 16px; font-size: 13px; color: #6e6e73; }
.pagination button { padding: 6px 12px; border: 1px solid #d2d2d7; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px; }
.pagination button:disabled { opacity: .4; cursor: default; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: #fff; border-radius: 16px; padding: 24px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; }
.modal h3 { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
.form-row { margin-bottom: 12px; }
.form-row label { display: block; font-size: 12px; font-weight: 500; color: #6e6e73; margin-bottom: 4px; }
.form-row input, .form-row textarea, .form-row select { width: 100%; padding: 8px 10px; border: 1px solid #d2d2d7; border-radius: 8px; font-size: 13px; outline: none; font-family: inherit; }
.form-row input:focus, .form-row textarea:focus, .form-row select:focus { border-color: #0071e3; }
.form-row textarea { min-height: 60px; resize: vertical; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
.badge-green { background: #34c75920; color: #34c759; }
.badge-orange { background: #ff9f0a20; color: #ff9f0a; }
.badge-red { background: #ff3b3020; color: #ff3b30; }
.badge-blue { background: #0071e320; color: #0071e3; }
.toast { position: fixed; top: 16px; right: 16px; background: #1d1d1f; color: #fff; padding: 10px 20px; border-radius: 10px; font-size: 13px; z-index: 200; opacity: 0; transition: .3s; }
.toast.show { opacity: 1; }
.loading { display: flex; align-items: center; justify-content: center; padding: 60px; color: #86868b; font-size: 14px; }
.loading::after { content: ''; width: 20px; height: 20px; border: 2px solid #e0e0e0; border-top-color: #0071e3; border-radius: 50%; animation: spin .6s linear infinite; margin-left: 8px; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 768px) { .sidebar { width: 100%; position: static; } .main { margin-left: 0; } }
</style>
</head>
<body>
<div id="sidebar" class="sidebar"><h1>爸爸去哪了</h1><div id="nav"></div></div>
<div class="main" id="app"><div class="loading">加载中</div></div>
<div id="toast" class="toast"></div>
<script>
const API = '';
let currentResource = null;
let currentPage = 1;
let currentSort = 'id';
let currentOrder = 'ASC';
let currentSearch = '';
let totalCount = 0;
const PER_PAGE = 20;

const RESOURCES = ${JSON.stringify(Object.keys(RESOURCES))};

const LABELS = {
  users: '用户管理', babies: '宝宝信息', tasks: '用户任务', records: '孕育记录',
  preset_tasks: '预设任务', preset_items: '物品准备清单', user_preparations: '用户物品状态',
  urgent_notes: '紧急关注', community_posts: '社区帖子', post_comments: '帖子评论',
  post_likes: '帖子点赞', knowledge_articles: '知识文章', user_knowledge_reads: '用户阅读记录',
  psychological_support: '心理支持', pregnancy_stages: '孕期阶段',
  vaccines: '疫苗', vaccine_doses: '疫苗剂次', user_vaccinations: '用户接种记录',
  food_safety: '食物安全',
};

function $(s, p) { return (p||document).querySelector(s); }
function $$(s, p) { return [...(p||document).querySelectorAll(s)]; }

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.className = 'toast show';
  setTimeout(() => t.className = 'toast', 2500);
}

async function api(method, path, body) {
  const opt = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opt.body = JSON.stringify(body);
  const r = await fetch('/api' + path, opt);
  if (!r.ok) { const e = await r.json().catch(()=>({})); throw new Error(e.error || r.statusText); }
  return r.json();
}

// 侧边栏导航
function renderNav(active) {
  const nav = $('#nav');
  nav.innerHTML = RESOURCES.map(r =>
    '<a href="#" class="' + (r === active ? 'active' : '') + '" onclick="switchResource(\\'' + r + '\\')">' + (LABELS[r] || r) + '</a>'
  ).join('');
}

function switchResource(name) {
  currentResource = name;
  currentPage = 1;
  currentSort = 'id';
  currentOrder = 'ASC';
  currentSearch = '';
  renderNav(name);
  loadList();
}

function loadList() {
  if (!currentResource) return;
  const app = $('#app');
  app.innerHTML = '<div class="loading">加载中</div>';

  const params = new URLSearchParams({
    sort: currentSort, order: currentOrder,
    page: currentPage, perPage: PER_PAGE,
    filter: currentSearch ? JSON.stringify({ q: currentSearch }) : '{}'
  });

  api('GET', '/' + currentResource + '?' + params)
    .then(({ data, total }) => {
      totalCount = total || 0;
      renderList(data, total || 0);
    })
    .catch(e => { app.innerHTML = '<div class="error">加载失败: ' + e.message + '</div>'; });
}

function renderList(data, total) {
  if (!currentResource) return;
  const columns = data.length > 0 ? Object.keys(data[0]).filter(k => !k.includes('password')) : ['id'];

  const app = $('#app');
  const label = LABELS[currentResource] || currentResource;

  // 过滤长字段
  const hiddenCols = ['content', 'description', 'note', 'tips', 'notes'];

  app.innerHTML = \`
    <div class="header">
      <h2>\${label}</h2>
      <a href="/logout" onclick="event.preventDefault();fetch('/logout').then(()=>location.reload())">退出</a>
    </div>
    <div class="toolbar">
      <input class="search-input" placeholder="搜索 \${label}..." value="\${currentSearch}" onchange="currentSearch=this.value;currentPage=1;loadList()">
      <button class="btn btn-primary" onclick="openCreate()">+ 新增</button>
    </div>
    <table>
      <thead><tr>
        \${columns.map(c => '<th onclick="sortBy(\\'' + c + '\\')">' + c + (currentSort === c ? (currentOrder === 'ASC' ? ' ▲' : ' ▼') : '') + '</th>').join('')}
        <th style="width:80px">操作</th>
      </tr></thead>
      <tbody>
        \${data.map(row => '<tr>' +
          columns.map(c => {
            let val = row[c];
            if (val === null || val === undefined) return '<td>—</td>';
            const str = String(val);
            if (hiddenCols.includes(c) && str.length > 80) return '<td title="' + str.replace(/"/g,'&quot;') + '">' + str.slice(0, 80) + '…</td>';
            if (val === true) return '<td><span class="badge badge-green">是</span></td>';
            if (val === false) return '<td><span class="badge badge-red">否</span></td>';
            if (c === 'category' || c === 'stage' || c === 'type' || c === 'period' || c === 'essential_level') return '<td><span class="badge badge-blue">' + str + '</span></td>';
            if (str.length > 100) return '<td title="' + str.replace(/"/g,'&quot;') + '">' + str.slice(0, 100) + '…</td>';
            return '<td title="' + str.replace(/"/g,'&quot;') + '">' + str + '</td>';
          }).join('') +
          '<td><button class="btn btn-outline" onclick="openEdit(\\'' + row.id + '\\')" style="padding:4px 8px;font-size:11px">编辑</button></td>' +
        '</tr>').join('')}
      </tbody>
    </table>
    <div class="pagination">
      <button onclick="currentPage--;loadList()" disabled="\${currentPage <= 1 ? 'disabled' : ''}">上一页</button>
      <span>第 \${currentPage} / \${Math.max(1, Math.ceil(total / PER_PAGE))} 页（共 \${total} 条）</span>
      <button onclick="currentPage++;loadList()" disabled="\${currentPage * PER_PAGE >= total ? 'disabled' : ''}">下一页</button>
    </div>\`;
}

function sortBy(col) {
  if (currentSort === col) { currentOrder = currentOrder === 'ASC' ? 'DESC' : 'ASC'; }
  else { currentSort = col; currentOrder = 'ASC'; }
  loadList();
}

// 字段类型到表单控件的映射
function renderFormField(name, value, type) {
  const label = name.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());
  const str = value === null || value === undefined ? '' : String(value);

  // 布尔值
  if (type === 'boolean') {
    return \`<div class="form-row"><label>\${label}</label><select name="\${name}" data-type="boolean">
      <option value="false"\${str === 'false' || str === '' ? ' selected' : ''}>否</option>
      <option value="true"\${str === 'true' ? ' selected' : ''}>是</option>
    </select></div>\`;
  }

  // 枚举字段
  const enums = { category: ['喂养','洗护','衣物','睡眠','出行','妈妈用品','产后恢复','医疗','其他'],
    period: ['preconception','first','second','third','postpartum'],
    stage: ['preconception','first','second','third','postpartum'],
    type: ['prenatal','daily','checkin'],
    essential_level: ['essential','recommended','optional'],
    status: ['not_prepared','prepared','not_needed'],
    support_type: ['emotion','communication','action','knowledge'],
    category_food: ['蔬菜','水果','肉类','海鲜','蛋奶','豆制品','谷物','饮品','调味品','零食','药材','其他'],
    safety_level: ['safe','caution','forbidden'],
  };

  const enumValues = enums[name] || enums[name.replace('_', '')] || null;
  if (enumValues) {
    return \`<div class="form-row"><label>\${label}</label><select name="\${name}">
      \${enumValues.map(v => '<option value="' + v + '"' + (str === v ? ' selected' : '') + '>' + v + '</option>').join('')}
    </select></div>\`;
  }

  // 长文本
  if (type === 'textarea' || (str && str.length > 80)) {
    return \`<div class="form-row"><label>\${label}</label><textarea name="\${name}" rows="3">\${str}</textarea></div>\`;
  }

  // 日期
  if (name.endsWith('_at') || name.endsWith('_date') || name === 'due_date' || name === 'birth_date') {
    return \`<div class="form-row"><label>\${label}</label><input name="\${name}" type="text" value="\${str}" placeholder="\${type || 'text'}"></div>\`;
  }

  return \`<div class="form-row"><label>\${label}</label><input name="\${name}" type="text" value="\${str}"></div>\`;
}

function openCreate() {
  const app = $('#app');
  const columns = ['id']; // 最少字段

  api('GET', '/' + currentResource + '?perPage=1')
    .then(({ data }) => {
      const sample = data[0] || {};
      const fields = Object.keys(sample).filter(k => !['created_at','updated_at','id'].includes(k));
      const formFields = fields.map(k => {
        const val = sample[k];
        const type = typeof val === 'boolean' ? 'boolean' : (typeof val === 'string' && val.length > 80 ? 'textarea' : 'string');
        return { name: k, type, value: '' };
      });

      renderModal('新增 ' + (LABELS[currentResource] || currentResource),
        formFields.map(f => renderFormField(f.name, '', f.type)).join(''),
        async () => {
          const data = {};
          $$('[name]', $('#modal-content')).forEach(el => {
            let val = el.value;
            if (el.dataset.type === 'boolean') val = val === 'true';
            data[el.name] = val;
          });
          await api('POST', '/' + currentResource, data);
          closeModal();
          toast('创建成功');
          loadList();
        }
      );
    });
}

function openEdit(id) {
  api('GET', '/' + currentResource + '/' + id)
    .then(({ data }) => {
      const fields = Object.keys(data).filter(k => !['created_at','updated_at'].includes(k));
      const formFields = fields.map(k => {
        const val = data[k];
        const type = typeof val === 'boolean' ? 'boolean' : (val && String(val).length > 80 ? 'textarea' : 'string');
        return { name: k, type, value: val };
      });

      renderModal('编辑 ' + (LABELS[currentResource] || currentResource),
        formFields.map(f => renderFormField(f.name, f.value, f.type)).join(''),
        async () => {
          const body = {};
          $$('[name]', $('#modal-content')).forEach(el => {
            let val = el.value;
            if (el.dataset.type === 'boolean') val = val === 'true';
            body[el.name] = val;
          });
          await api('PUT', '/' + currentResource + '/' + id, body);
          closeModal();
          toast('保存成功');
          loadList();
        },
        async () => {
          if (!confirm('确定删除这条记录？')) return;
          await api('DELETE', '/' + currentResource + '/' + id);
          closeModal();
          toast('删除成功');
          loadList();
        }
      );
    });
}

function renderModal(title, formContent, onSave, onDelete) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = \`
    <div class="modal" id="modal-content">
      <h3>\${title}</h3>
      <form onsubmit="event.preventDefault()">
        \${formContent}
      </form>
      <div class="modal-actions">
        \${onDelete ? '<button class="btn btn-danger" onclick="window._del()">删除</button>' : ''}
        <button class="btn btn-outline" onclick="this.closest(\\'.modal-overlay\\').remove()">取消</button>
        <button class="btn btn-primary" onclick="window._save()">保存</button>
      </div>
    </div>\`;
  window._save = onSave;
  window._del = onDelete;
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

function closeModal() {
  const m = $('.modal-overlay');
  if (m) m.remove();
  delete window._save;
  delete window._del;
}

// 初始化
switchResource('babies');
</script>
</body></html>`);
});

app.use(express.static(frontendPath));

// ============================================================
// 启动
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ 管理后台已启动`);
  console.log(`   地址: http://localhost:${PORT}`);
  console.log(`   登录: admin@dadcare.com / dadcare2024`);
  console.log(`   退出: http://localhost:${PORT}/logout\n`);
});
