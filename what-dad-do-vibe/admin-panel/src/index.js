import path from 'path';
import { config as dotenvConfig } from 'dotenv';
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import { Database, Resource } from '@adminjs/prisma';
import { PrismaClient } from '@prisma/client';
import express from 'express';
import session from 'express-session';

// 加载 .env
dotenvConfig({ path: path.join(import.meta.dirname, '..', '.env') });

// ============================================================
// 1. 注册 Prisma 适配器 + 获取 DMMF 模型
// ============================================================
AdminJS.registerAdapter({ Database, Resource });

const prisma = new PrismaClient();

// 从 PrismaClient 获取模型元数据（Prisma v6 使用 _runtimeDataModel）
const models = prisma._runtimeDataModel.models;

// 辅助函数：构建资源对象
function resource(modelName, options = {}) {
  const m = models[modelName];
  if (!m) {
    console.warn(`⚠️  模型 "${modelName}" 未在 Prisma schema 中找到`);
    return null;
  }
  // Prisma v6 的 _runtimeDataModel.models 缺少 name 属性
  // @adminjs/prisma 需要 model.name → 拷贝并注入
  const model = { ...m, name: modelName };
  return { resource: { model, client: prisma }, options };
}

// ============================================================
// 3. 定义资源导航
// ============================================================
const navigation = {
  auth: { name: '用户与认证', icon: 'User' },
  tasks: { name: '任务管理', icon: 'CheckSquare' },
  pregnancy: { name: '孕期管理', icon: 'Heart' },
  community: { name: '社区内容', icon: 'MessageCircle' },
  medical: { name: '医疗健康', icon: 'Activity' },
  content: { name: '内容运营', icon: 'FileText' },
  preparation: { name: '物品准备', icon: 'Package' },
  system: { name: '系统配置', icon: 'Settings' },
};

// ============================================================
// 3. 构造资源列表
// ============================================================
const resources = [
  // ----- 用户 -----
  resource('users', {
    navigation: navigation.auth,
    properties: {
      id: { isVisible: { list: true, filter: true, show: true, edit: false } },
      createdAt: { label: '注册时间', type: 'datetime' },
    },
    sort: { sortBy: 'createdAt', direction: 'desc' },
  }),

  // ----- 孕期管理 -----
  resource('baby', {
    navigation: navigation.pregnancy,
    properties: {
      dueDate: { label: '预产期', type: 'date' },
      birthDate: { label: '出生日期', type: 'date' },
      gender: { label: '性别', availableValues: [
        { value: 'male', label: '男' },
        { value: 'female', label: '女' },
      ]},
    },
    sort: { sortBy: 'createdAt', direction: 'desc' },
  }),
  resource('pregnancy_stage', {
    navigation: navigation.pregnancy,
    properties: {
      weeksStart: { label: '起始周' },
      weeksEnd: { label: '结束周' },
    },
  }),

  // ----- 任务管理 -----
  resource('task', {
    navigation: navigation.tasks,
    properties: {
      isCompleted: { label: '已完成', type: 'boolean' },
      type: { label: '类型', availableValues: [
        { value: 'prenatal', label: '产检' },
        { value: 'daily', label: '日常' },
        { value: 'checkin', label: '打卡' },
      ]},
      stage: { label: '阶段', availableValues: [
        { value: 'preconception', label: '备孕' },
        { value: 'first', label: '孕早期' },
        { value: 'second', label: '孕中期' },
        { value: 'third', label: '孕晚期' },
        { value: 'postpartum', label: '产后' },
      ]},
      taskSubtype: { label: '子类型' },
    },
    sort: { sortBy: 'createdAt', direction: 'desc' },
  }),
  resource('preset_task', {
    navigation: navigation.tasks,
    properties: {
      type: { label: '类型', availableValues: [
        { value: 'prenatal', label: '产检' },
        { value: 'daily', label: '日常' },
        { value: 'checkin', label: '打卡' },
      ]},
      stage: { label: '阶段', availableValues: [
        { value: 'preconception', label: '备孕' },
        { value: 'first', label: '孕早期' },
        { value: 'second', label: '孕中期' },
        { value: 'third', label: '孕晚期' },
        { value: 'postpartum', label: '产后' },
      ]},
    },
    sort: { sortBy: 'stage', direction: 'asc' },
  }),

  // ----- 物品准备 -----
  resource('preset_item', {
    navigation: navigation.preparation,
    properties: {
      category: { label: '分类' },
      period: { label: '适用阶段' },
      essentialLevel: { label: '必需等级', availableValues: [
        { value: 'essential', label: '必需' },
        { value: 'recommended', label: '推荐' },
        { value: 'optional', label: '可选' },
      ]},
      quantitySuggestion: { label: '数量建议' },
      preparationTiming: { label: '准备时间' },
      sortOrder: { label: '排序' },
    },
    sort: { sortBy: 'sortOrder', direction: 'asc' },
  }),
  resource('user_preparation', {
    navigation: navigation.preparation,
    properties: {
      status: { label: '状态', availableValues: [
        { value: 'not_prepared', label: '未准备' },
        { value: 'prepared', label: '已准备' },
        { value: 'not_needed', label: '不需要' },
      ]},
    },
  }),

  // ----- 社区内容 -----
  resource('community_post', {
    navigation: navigation.community,
    properties: {
      authorName: { label: '作者' },
      content: { type: 'textarea' },
      createdAt: { label: '发布时间', type: 'datetime' },
    },
    sort: { sortBy: 'createdAt', direction: 'desc' },
  }),
  resource('post_comment', {
    navigation: navigation.community,
    properties: { content: { type: 'textarea' } },
  }),
  resource('post_like', { navigation: navigation.community }),

  // ----- 医疗健康 -----
  resource('vaccine', {
    navigation: navigation.medical,
    properties: {
      category: { label: '类别', availableValues: [
        { value: '免费', label: '免费' },
        { value: '自费', label: '自费' },
      ]},
    },
  }),
  resource('vaccine_dose', {
    navigation: navigation.medical,
    properties: {
      doseNumber: { label: '第几剂' },
      minAgeMonths: { label: '最小月龄' },
      maxAgeMonths: { label: '最大月龄' },
      minIntervalDays: { label: '最小间隔(天)' },
    },
  }),
  resource('user_vaccination', {
    navigation: navigation.medical,
    properties: {
      isVaccinated: { label: '已接种', type: 'boolean' },
      vaccinatedAt: { label: '接种日期' },
    },
  }),
  resource('food_safety', {
    navigation: navigation.medical,
    properties: {
      preconception: { label: '备孕' },
      first: { label: '孕早期' },
      second: { label: '孕中期' },
      third: { label: '孕晚期' },
      postpartum: { label: '产后' },
      baby0_3m: { label: '婴儿0-3月' },
      baby3_12m: { label: '婴儿3-12月' },
      baby1_3y: { label: '婴儿1-3岁' },
    },
    sort: { sortBy: 'sortOrder', direction: 'asc' },
  }),

  // ----- 内容运营 -----
  resource('knowledge_article', {
    navigation: navigation.content,
    properties: {
      isPublished: { label: '已发布', type: 'boolean' },
      content: { type: 'textarea' },
      sortOrder: { label: '排序' },
    },
    sort: { sortBy: 'sortOrder', direction: 'asc' },
  }),
  resource('psychological_support', {
    navigation: navigation.content,
    properties: {
      supportType: { label: '类型', availableValues: [
        { value: 'emotion', label: '情绪' },
        { value: 'communication', label: '沟通' },
        { value: 'action', label: '行动' },
        { value: 'knowledge', label: '知识' },
      ]},
      tips: { label: '建议列表' },
      isPublished: { label: '已发布', type: 'boolean' },
    },
  }),
  resource('urgent_note', {
    navigation: navigation.content,
    properties: {
      isActive: { label: '活跃', type: 'boolean' },
    },
  }),

  // ----- 其他 -----
  resource('record', {
    navigation: navigation.system,
    properties: {
      isPrivate: { label: '私密', type: 'boolean' },
      content: { type: 'textarea' },
    },
  }),
  resource('user_knowledge_read', { navigation: navigation.system }),
].filter(Boolean); // 过滤掉 null（未找到的模型）

// ============================================================
// 5. 创建 AdminJS 实例
// ============================================================
const PORT = parseInt(process.env.PORT || '3001', 10);
const SESSION_SECRET = process.env.SESSION_SECRET || 'dadcare-admin-secret';

const admin = new AdminJS({
  resources,
  rootPath: '/admin',
  branding: {
    companyName: '爸爸去哪了 · 管理后台',
    softwareBrothers: false,
    logo: false,
  },
  locale: {
    language: 'zh-CN',
    translations: {
      zh: {
        labels: {
          users: '用户管理',
          baby: '宝宝信息',
          pregnancy_stage: '孕期阶段',
          task: '用户任务',
          preset_task: '预设任务',
          record: '孕育记录',
          preset_item: '物品准备清单',
          user_preparation: '用户物品状态',
          community_post: '社区帖子',
          post_comment: '帖子评论',
          post_like: '帖子点赞',
          vaccine: '疫苗',
          vaccine_dose: '疫苗剂次',
          user_vaccination: '用户接种记录',
          food_safety: '食物安全',
          knowledge_article: '知识文章',
          psychological_support: '心理支持',
          urgent_note: '紧急关注',
          user_knowledge_read: '用户阅读记录',
        },
        actions: {
          new: '新增',
          edit: '编辑',
          show: '详情',
          delete: '删除',
          bulkDelete: '批量删除',
          list: '列表',
          search: '搜索',
          filter: '筛选',
        },
        messages: {
          successfullyCreated: '创建成功',
          successfullyUpdated: '更新成功',
          successfullyDeleted: '删除成功',
        },
      },
    },
  },
});

// ============================================================
// 6. 构建 Express 应用（带认证）
// ============================================================
const app = express();

const adminRouter = AdminJSExpress.buildAuthenticatedRouter(admin, {
  authenticate: async (email, password) => {
    if (email === 'admin@dadcare.com' && password === 'dadcare2024') {
      return { email, role: 'admin' };
    }
    return null;
  },
  cookiePassword: SESSION_SECRET,
}, null, {
  store: new session.MemoryStore(),
  secret: SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
});

app.use(admin.options.rootPath, adminRouter);

// ============================================================
// 7. 启动
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ 管理后台已启动`);
  console.log(`   地址: http://localhost:${PORT}${admin.options.rootPath}`);
  console.log(`   登录: admin@dadcare.com / dadcare2024\n`);
});
