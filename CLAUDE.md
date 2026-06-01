# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**爸爸去哪了** — 给准爸爸 / 新手爸爸的孕产期全程陪伴助手,覆盖备孕 → 孕早/中/晚期 → 产后五阶段的任务管理、产检、记录、社区、知识、工具(喂奶计时 / 生长曲线 / 疫苗 / 食物禁忌)。

**Stack:** TypeScript 5.9 (strict) + Expo SDK 54 + expo-router + React Native 0.81 + Supabase (Auth + PostgreSQL)。状态用 `useReducer` + Context,无外部状态库。

## 常用命令

所有命令在 `what-dad-do-vibe/` 子目录下执行。

```bash
npm start              # 启动 Expo dev server
npm run ios            # iOS 模拟器
npm run android        # Android 模拟器/设备
npm run web            # Web (react-native-web, bundler=metro)
npx tsc --noEmit       # 类型检查 (无 lint/format/test 脚本)
```

**没有 `npm test` / `npm run lint` / `npm run format`** — 不要在 PR 中引用不存在的脚本。

### 打包与发布

```bash
# 本地 APK (需本地 Android SDK + JDK17 at /tmp/jdk17)
scripts/build-apk.sh

# EAS 云端构建 (需 EXPO_TOKEN,已在 scripts/eas-build.sh 硬编码)
scripts/eas-build.sh   # 等价于 npx eas build -p android --profile preview --non-interactive
```

EAS profiles (`eas.json`): `preview` = `apk` (用 `:app:assembleRelease`),`production` = `apk`。EAS project id 见 `app.json` → `extra.eas.projectId`。

## 项目布局

仓库根包含两层:外层 `what-dad-do-vibe/` 是 Expo 项目,根目录放的是文档/品牌资产(`landing.html`、`landing-preview.png`、`product.html`、`docs/`、`design-bundle/`、`.reasonix/`、`.claude/` 等)。**所有源码和 `npm` 命令在 `what-dad-do-vibe/` 子目录内。**

```
what-dad-do-vibe/
  app/                          # expo-router (file-based routing)
    _layout.tsx                 # 根 Stack: AuthProvider → AppProvider → AuthRedirector
    login.tsx                   # 邮箱+密码登录/注册
    baby-info.tsx               # 录入/修改预产期
    congratulations.tsx         # 宝宝性别确认 + 彩纸动画
    (tabs)/
      _layout.tsx               # 底部 4 tab: 首页/任务/社区/我的
      index.tsx                 # 首页: 阶段信息 + 物品准备 + 心理支持 + 工具栏
      tasks.tsx                 # 任务管理: 产检/日常/打卡,StageTabs 切换
      records.tsx               # 孕育记录 (hides from tab,linked from elsewhere)
      community.tsx             # 帖子 + 知识文章 + 点赞/评论
      profile.tsx               # 个人中心 + 退出登录
  src/
    lib/
      supabase.ts               # Supabase client (anon key) + 所有 DB 行 TypeScript 类型
      api.ts                    # 所有 Supabase CRUD 函数 (pages/components 不直接调 supabase)
      stages.ts                 # 孕期阶段计算 (calculateStageFromDueDate / calculateBirthAge)
      storage.ts                # AsyncStorage 封装: 工具配置/喂奶记录/生长记录
      time.ts                   # formatRelativeTime 友好时间格式
      growth-chart-data.ts      # WHO 生长曲线静态数据
    context/
      AuthContext.tsx           # 认证: supabase.auth + AsyncStorage 持久化 session
      AppContext.tsx            # 全局状态 useReducer,含首次登录的 presetTasks 硬编码种子
    components/
      atoms/                    # 基础组件 (Card, Button, Tag, Avatar, Badge, Progress)
      molecules/                # 复合组件 (TaskCard, PostCard, KnowledgeCard, RecordEntry, StageTabs, SearchBar)
      organisms/                # 复杂组件 (TabBar, SegmentControl, CollapsibleGroup)
      tools/                    # 可插拔工具栏: Toolbar + ToolBase + 各 Tool 实现
        ToolBase.tsx            # 工具卡片外壳 (拖拽手柄 / 折叠 / 移除)
        Toolbar.tsx             # 工具列表 + 添加选择器 + PanResponder 拖拽排序
        FeedingTimer.tsx        # 喂奶计时
        GrowthTracker.tsx       # 生长记录录入
        GrowthChart.tsx         # 生长曲线图 (纯 View,无 react-native-svg)
        VaccineTracker.tsx      # 疫苗本 (从 Supabase 读取)
        VaccineCalendar.tsx     # 疫苗日历视图
        FoodSafety.tsx          # 食物禁忌查询
    styles/tokens.ts            # Kami 设计 token (colors/spacing/typography/radius/shadows) ← 主用
    theme/index.ts              # 旧版 token,部分旧页面仍在用
  supabase/migrations/          # 原始 SQL,需通过 Dashboard SQL Editor 手动执行
  scripts/                      # build-apk.sh, eas-build.sh, seed-urgent-notes.mjs, read-xlsx.js
  preset_tasks.sql              # 100+ 条任务初始数据 (另存于根)
  app.json, eas.json, tsconfig.json, package.json
```

## 状态管理

- `useAuth()` — 来自 `AuthContext`,返回 `{ session, user, loading, signIn, signUp, signOut }`
- `useApp()` — 来自 `AppContext`,返回 `{ state, dispatch, toggleTask, addTask, updateTask, removeTask, addRecord, removeRecord, refreshCommunityPosts, addUrgentNote, dismissUrgentNote, addBaby, updateBabyGender }`
- `state.stage` 由 `babies[0].due_date` 在 `loadUserData` / `addBaby` / `updateBabyGender` 中自动计算并 dispatch,UI 不要手动改 stage
- 首次登录会种入 ~60 条硬编码 `presetTasks` (在 `AppContext.tsx`);完整推荐清单在 `preset_tasks.sql` (root)

## API 层约定

**所有 DB 调用必须经 `src/lib/api.ts`,不要在 page/component 直接 `import { supabase }`**。原因: 类型契约统一,Supabase 行类型只在 `lib/supabase.ts` 定义。

`api.ts` 按域分块:Tasks / Records / UrgentNotes / Babies / CommunityPosts (含 likes/comments) / KnowledgeArticles / Vaccines / PresetItems / UserPreparations / PsychologicalSupport / FoodSafety / PregnancyStages。

## 工具栏系统 (`src/components/tools/`)

Toolbar 是一个**运行时插件化**的 UI,顺序/启用状态存 AsyncStorage (`storage.ts` 的 `loadActiveTools` / `saveActiveTools`):

- `AVAILABLE_TOOLS` 在 `Toolbar.tsx` 顶部声明 — 加新工具只需:实现组件 + 加入映射表 + 加入 `AVAILABLE_TOOLS`
- `ToolBase` 是外壳,处理折叠/拖拽手柄/移除按钮 (Android 上去除按钮要放在 dragArea 外,见 `ToolBase.tsx:42` 注释)
- 拖拽排序:PanResponder 实现 (没用 `react-native-draggable-flatlist`,原因见下)

## 样式系统

**优先用 `src/styles/tokens.ts` 的 Kami design tokens** (墨蓝 accent + 暖羊皮纸背景 + 编辑级排版)。`src/theme/index.ts` 是旧版 token,旧页面残留使用,新增组件不要再从 `theme` 导入。

Login 页面 (`app/login.tsx`) 还内联了一份 colors 对象,属于遗留代码,不要照搬。

## 关键 Watch-outs

- **Supabase RLS 阻挡脚本写入** — `scripts/seed-urgent-notes.mjs` 等用 anon key 跑会被 RLS 拒绝;**数据迁移只能通过 Supabase Dashboard SQL Editor**,不要尝试在 CI/本地脚本里 insert
- **RLS 在 web 上的 Alert** — `Alert.alert` 在 RN Web 不支持 button callback,web 处理器用 `window.confirm()`
- **Modal 关闭闪空** — 帖子详情 modal 用 `lastPostRef` 缓存,在 fade-out 期间继续渲染旧内容 (`community.tsx`)
- **Confetti 动画** — `src/components/Confetti.tsx` 用 `translateY` transform 而非 `top`,`useNativeDriver: true` 要求
- **生长曲线无 SVG** — `GrowthChart.tsx` 纯 View 渲染,曾引入 `react-native-svg` 因 native 兼容问题移除
- **工具拖拽不用第三方库** — 之前试过 `react-native-draggable-flatlist` 与当前环境不兼容,改为 PanResponder 手写
- **AsyncStorage keys 已命名空间化** — `user_tools_<userId>` / `feeding_records_<userId>` / `growth_records_<userId>`,不要改 key 格式以免丢用户数据
- **`EXPO_TOKEN` 硬编码在 `scripts/eas-build.sh`** — 已知问题,正式发布前应迁到环境变量
- **类型检查** — 改完跑 `npx tsc --noEmit`,这是这个项目唯一的"lint"

## 数据库 schema 速查

表 (在 `src/lib/supabase.ts` 都有对应 TS 类型):`tasks`, `records`, `babies`, `community_posts`, `post_likes`, `post_comments`, `urgent_notes`, `pregnancy_stages`, `user_knowledge_reads`, `knowledge_articles`, `preset_tasks`, `vaccines`, `vaccine_doses`, `user_vaccinations`, `preset_items`, `user_preparations`, `psychological_support`, `food_safety`。

迁移按编号顺序,见 `supabase/migrations/001-…015_…sql`。后期大量 `00X` 编号迁移以"先聚合再分主题"方式组织 (e.g. `008_create_preparation_and_support_tables.sql` 包含多张物品/心理支持表)。

## 孕期阶段

```ts
type PregnancyStage = 'preconception' | 'first' | 'second' | 'third' | 'postpartum';
```

由 `calculateStageFromDueDate(dueDate)` 基于 280 天总长推算,week 1-12 = 早,13-27 = 中,28-40 = 晚。产后阶段显示 `calculateBirthAge(dueDate, birthDate)` (e.g. "3周" / "1年2周" / "3岁")。
