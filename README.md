# 爸爸去哪了 — What Dad Do Vibe

孕产期跟踪助手 App，覆盖备孕、孕早期/中期/晚期、产后各阶段的任务管理、孕育记录与社区功能。

[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-blue)](#)

## 功能亮点

- **孕期阶段自动追踪** — 基于预产期推算当前阶段（备孕 → 孕早/中/晚期 → 产后），动态适配任务模板
- **智能任务管理** — 各阶段预设任务 + 自定义任务，完成状态本地/服务端同步
- **孕育工具箱** — 喂养计时器、生长图表（WHO 标准）、疫苗追踪与日历
- **成长里程碑祝贺页** — 达到新阶段时自动触发 confetti 动画庆祝
- **社区知识库** — 孕育知识文章阅读、点赞、评论，已读状态跨设备同步

## 技术栈

| 层级 | 技术 |
|------|------|
| 语言 | TypeScript 5.9 + strict mode |
| 框架 | Expo SDK 54 + expo-router（文件路由） |
| UI | React Native 0.81 + react-native-web |
| 后端 | Supabase（Auth + PostgreSQL + REST API） |
| 状态 | useReducer + Context（无外部状态库） |
| 图标 | @expo/vector-icons (Ionicons) |

## 项目结构

```
what-dad-do-vibe/
├── app/                          # expo-router 页面
│   ├── _layout.tsx               # 根布局
│   ├── (tabs)/                   # 底部 Tab 导航
│   │   ├── index.tsx             # 首页（阶段概览 + 工具入口）
│   │   ├── tasks.tsx             # 任务列表
│   │   ├── records.tsx           # 孕育记录
│   │   ├── community.tsx         # 社区
│   │   └── profile.tsx           # 个人中心
│   ├── login.tsx                 # 登录页
│   ├── baby-info.tsx             # 宝宝信息配置
│   └── congratulations.tsx        # 里程碑祝贺页
├── src/
│   ├── components/
│   │   ├── atoms/                 # 原子组件（Button, Card, Avatar, Badge…）
│   │   ├── molecules/            # 复合组件（PostCard, TaskCard, RecordEntry…）
│   │   ├── organisms/             # 组合组件（TabBar, CollapsibleGroup…）
│   │   └── tools/                # 工具组件（FeedingTimer, GrowthChart, VaccineTracker…）
│   ├── context/
│   │   ├── AppContext.tsx         # 全局状态（tasks, records, communityPosts, babies…）
│   │   └── AuthContext.tsx        # 认证状态
│   ├── lib/
│   │   ├── supabase.ts           # Supabase 客户端
│   │   ├── api.ts                # 所有 DB CRUD 操作
│   │   ├── stages.ts             # 孕期阶段计算
│   │   └── time.ts               # 时间格式化工具
│   └── styles/
│       └── tokens.ts             # 设计 tokens（colors, spacing, typography）
├── supabase/migrations/          # Raw SQL 数据库迁移
├── scripts/                      # 构建 APK、种子数据、Excel 导入工具
└── assets/                       # 应用图标 & 启动图
```

## 快速开始

### 环境要求

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS 模拟器 / Android 模拟器 / Web 浏览器

### 安装与运行

```bash
cd what-dad-do-vibe
npm install

# 开发服务器（默认）
npm start

# 指定平台
npm run ios      # iOS 模拟器
npm run android  # Android
npm run web      # Web 浏览器
```

### 类型检查

```bash
npx tsc --noEmit
```

### 构建 APK（Android）

```bash
npx eas build -p android --profile preview --non-interactive
```

> 需要在 `.env` 中配置 `EXPO_TOKEN`（从 Expo Dashboard 获取）

## 数据库

数据存储在 Supabase PostgreSQL，主要表结构：

| 表名 | 用途 |
|------|------|
| `babies` | 宝宝信息（预产期/出生日期） |
| `preset_tasks` | 各阶段预设任务模板 |
| `tasks` | 用户任务（关联宝宝与阶段） |
| `records` | 孕育记录（体检、体重等） |
| `community_posts` | 社区帖子/知识文章 |
| `post_likes` / `post_comments` | 互动数据 |
| `vaccines` | 疫苗时间表 |
| `vaccine_records` | 疫苗接种记录 |
| `user_knowledge_reads` | 文章已读状态 |

更多细节请参考 [REASONIX.md](./REASONIX.md)。

## 设计规范

- **Atomic Design 分层** — atoms → molecules → organisms → tools
- **命名导出** — 所有组件均使用 named export + default export
- **设计 Tokens** — 所有颜色/间距/字体从 `src/styles/tokens.ts` 引入，禁止硬编码
- **API 封装** — 所有 DB 操作通过 `src/lib/api.ts`，页面不直接调用 supabase 客户端

## 注意事项

- **Supabase RLS** — seed 脚本无法通过匿名 key 绕过 RLS，请通过 Dashboard SQL Editor 执行迁移
- **Web Alert 限制** — React Native Web 的 Alert 不支持按钮回调，Web 环境使用 `window.confirm()` 替代
- **生长图表** — 纯 View 实现，无 `react-native-svg` 依赖（因原生兼容性问题已移除）
- **工具排序** — 通过 AsyncStorage 持久化，▲/▼ 按钮交互（`react-native-draggable-flatlist` 与当前环境不兼容）

## License

MIT