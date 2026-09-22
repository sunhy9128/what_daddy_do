# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**爸爸去哪了** — 给准爸爸 / 新手爸爸的孕产期全程陪伴助手，覆盖备孕 → 孕早/中/晚期 → 产后五阶段的任务管理、产检、课程、社区、知识、工具（喂奶计时 / 生长曲线 / 疫苗 / 宫缩计时 / 数胎动等 20+ 个）。

**Stack:** TypeScript 5.9 (strict) + Expo SDK 54 + expo-router + React Native 0.81 + Supabase (Auth + PostgreSQL)。状态用 `useReducer` + Context，无外部状态库。

## 仓库布局（monorepo 风格）

仓库根包含多个子项目，**Expo 主应用的源码和所有 `npm` 命令在 `what-dad-do-vibe/` 子目录内**：

```
what-dad-do-vibe/     # Expo 主应用（本文件大部分内容描述它）
wechat-miniapp/       # 微信小程序移植版：Taro 3 + React 18 + TS（早期阶段，独立 package.json）
admin-panel/          # 空目录占位
docs/, ppt/, design-bundle/, landing.html, product.html   # 文档与品牌资产
```

小程序版命令（在 `wechat-miniapp/` 下）：`npm run dev:weapp`（watch 构建）、`npm run build:weapp`、`npm run type-check`。

## 常用命令（what-dad-do-vibe/ 子目录）

```bash
npm start              # 启动 Expo dev server
npm run ios            # iOS 模拟器
npm run android        # Android 模拟器/设备
npm run web            # Web (react-native-web, bundler=metro)
npm run typecheck      # TypeScript 类型检查 (tsc --noEmit)
npm run lint           # ESLint 代码检查
npm test               # Jest 单元测试
npx jest src/lib/__tests__/stages.test.ts   # 跑单个测试文件
npx jest -t "calculateStage"                # 按用例名过滤
```

### 打包与发布

```bash
scripts/build-apk.sh   # 本地 APK (需本地 Android SDK + JDK17 at /tmp/jdk17)
scripts/eas-build.sh   # EAS 云端构建 (EXPO_TOKEN 硬编码在脚本里，已知问题)
```

EAS profiles (`eas.json`): `preview` = `apk`（`:app:assembleRelease`），`production` = `apk`。EAS project id 见 `app.json` → `extra.eas.projectId`。

## Expo 应用结构

```
what-dad-do-vibe/
  app/                          # expo-router (file-based routing)
    _layout.tsx                 # 根 Stack: AuthProvider → AppProvider → AuthRedirector
    login.tsx / onboarding.tsx / baby-info.tsx / congratulations.tsx / profile-edit.tsx
    ai.tsx                      # 独立 AI 问答页（包装 AIChat 组件）
    tool-detail.tsx             # 工具全屏详情页：按 tool id 从 AVAILABLE_TOOLS 找组件渲染
    (tabs)/
      _layout.tsx               # 底部 5 tab: 首页/任务/课程/社区/我的
      index.tsx                 # 首页: 阶段信息 + 物品准备 + 心理支持 + 工具栏
      tasks.tsx                 # 任务管理: 产检/日常/打卡,StageTabs 切换;产检详情含医院信息与一键导航
      courses.tsx               # 课程: 按阶段+分类(喂养/护理/抚触/睡眠/早教/急救)的静态内容
      community.tsx             # 帖子 + 知识文章 + 点赞/评论
      profile.tsx               # 个人中心 + 退出登录
  src/
    lib/
      supabase.ts               # Supabase client (anon key) + 所有 DB 行 TypeScript 类型
      api.ts                    # 所有 Supabase CRUD 函数 (pages/components 不直接调 supabase)
      stages.ts                 # 孕期阶段计算 (calculateStageFromDueDate / calculateBirthAge)
      preset-tasks.ts           # 新用户种子任务（代码侧兜底，DB 的 preset_tasks.sql 优先）
      storage.ts                # AsyncStorage 封装: 工具配置/喂奶记录/生长记录
      ai-chat.ts                # DeepSeek API 调用（AIChat 的后端）
      notifications.ts          # expo-notifications 封装
      time.ts / growth-chart-data.ts / *-data.ts   # 工具函数与静态数据（WHO 生长曲线、用药安全、辅食等）
      utils/camelToSnake.ts     # 字段名转换
    context/
      AuthContext.tsx           # 认证: supabase.auth + AsyncStorage 持久化 session
      AppContext.tsx            # 全局状态 useReducer; 种子逻辑在 ensurePresetTasks.ts
      ThemeContext.tsx          # useColors() 主题色（页面级 colors 来源）
      ensurePresetTasks.ts      # 首次登录种入预设任务，按 (user_id, title) 去重
    components/
      atoms/ molecules/ organisms/   # 基础 → 复合 → 复杂组件
      tools/                    # 可插拔工具栏: Toolbar + ToolBase + 20+ 个 Tool 实现
    styles/tokens.ts            # Kami 设计 token (colors/spacing/typography/radius/shadows) ← 主用
  supabase/migrations/          # 原始 SQL,需通过 Dashboard SQL Editor 手动执行
  __tests__ 分布于 src/**/__tests__/  # jest + ts-jest
```

## 状态管理

- `useAuth()` — 来自 `AuthContext`，返回 `{ session, user, loading, signIn, signUp, signOut }`
- `useApp()` — 来自 `AppContext`，返回 `{ state, dispatch, toggleTask, addTask, updateTask, removeTask, addRecord, removeRecord, refreshCommunityPosts, addUrgentNote, dismissUrgentNote, addBaby, updateBabyGender }`
- `useColors()` — 来自 `ThemeContext`，页面/组件颜色统一从这里取，配合 `src/styles/tokens.ts` 的 spacing/typography/radius
- `state.stage` 由 `babies[0].due_date` 在 `loadUserData` / `addBaby` / `updateBabyGender` 中自动计算并 dispatch，UI 不要手动改 stage
- 首次登录经 `ensurePresetTasks.ts` 种入预设任务（数据在 `src/lib/preset-tasks.ts`）；完整推荐清单在 `supabase/migrations/preset_tasks.sql`（DB 版本优先）

## API 层约定

**所有 DB 调用必须经 `src/lib/api.ts`，不要在 page/component 直接 `import { supabase }`**。原因：类型契约统一，Supabase 行类型只在 `lib/supabase.ts` 定义。

`api.ts` 按域分块：Tasks / Records / UrgentNotes / Babies / CommunityPosts (含 likes/comments) / KnowledgeArticles / Vaccines / PresetItems / UserPreparations / PsychologicalSupport / FoodSafety / PregnancyStages。

## 工具栏系统 (`src/components/tools/`)

Toolbar 是一个**运行时插件化**的 UI，顺序/启用状态存 AsyncStorage（`storage.ts` 的 `loadActiveTools` / `saveActiveTools`）：

- `AVAILABLE_TOOLS` 在 `Toolbar.tsx` 顶部声明 — 加新工具只需：实现组件 + 加入映射表 + 加入 `AVAILABLE_TOOLS`；`app/tool-detail.tsx` 也按同一映射渲染全屏详情
- `ToolBase` 是外壳，处理折叠/拖拽手柄/移除按钮（Android 上去除按钮要放在 dragArea 外，见 `ToolBase.tsx` 注释）
- 拖拽排序：PanResponder 手写实现（不用第三方库，见 Watch-outs）

## 样式系统

**优先用 `src/styles/tokens.ts` + `useColors()`（ThemeContext）**（墨蓝 accent + 暖羊皮纸背景 + 编辑级排版）。`src/theme/index.ts` 与 `login.tsx` 内联 colors 是遗留代码，新增组件不要照搬。

## 关键 Watch-outs

- **Supabase RLS 阻挡脚本写入** — `scripts/seed-*.mjs` 等用 anon key 跑会被 RLS 拒绝；**数据迁移只能通过 Supabase Dashboard SQL Editor**，不要尝试在 CI/本地脚本里 insert
- **RN Web 的 Alert** — `Alert.alert` 在 RN Web 不支持 button callback，web 处理器用 `window.confirm()`
- **Modal 关闭闪空** — 帖子详情 modal 用 `lastPostRef` 缓存，在 fade-out 期间继续渲染旧内容（`community.tsx`）
- **Confetti 动画** — `src/components/Confetti.tsx` 用 `translateY` transform 而非 `top`，`useNativeDriver: true` 要求
- **react-native-svg 是必需依赖** — `MomWeightTracker.tsx` 直接用 SVG；`react-native-gifted-charts`（`MoodCheckIn.tsx`）间接依赖。`GrowthChart.tsx` 已改纯 View，但 svg 不能从依赖中移除
- **工具拖拽不用第三方库** — `react-native-draggable-flatlist` 与环境不兼容，已改 PanResponder 手写
- **AsyncStorage keys 已命名空间化** — `user_tools_<userId>` / `feeding_records_<userId>` / `growth_records_<userId>`，不要改 key 格式以免丢用户数据
- **`EXPO_TOKEN` 硬编码在 `scripts/eas-build.sh`** — 已知问题，正式发布前应迁到环境变量
- **类型检查** — 改完跑 `npx tsc --noEmit`
- **AI 问答助手** — `AIChat.tsx` + `src/lib/ai-chat.ts` 调 DeepSeek API，Key 经 `.env` 的 `EXPO_PUBLIC_DEEPSEEK_API_KEY` 传入；System Prompt 按宝宝阶段/姓名/性别自动定制
- **产检医院与导航** — `baby-info.tsx` 设置产检医院名称/地址；`tasks.tsx` 产检详情显示医院信息并通过 `Linking.openURL` 唤起系统地图；注意事项（空腹/携带资料）走任务的 description 字段
- **多宝宝** — `018_multi_baby.sql` 起支持多宝宝，改 babies 相关逻辑时注意不要再假设单宝宝

## 数据库 schema 速查

表（在 `src/lib/supabase.ts` 都有对应 TS 类型）：`tasks`, `records`, `babies`, `community_posts`, `post_likes`, `post_comments`, `urgent_notes`, `pregnancy_stages`, `user_knowledge_reads`, `knowledge_articles`, `preset_tasks`, `vaccines`, `vaccine_doses`, `user_vaccinations`, `preset_items`, `user_preparations`, `psychological_support`, `food_safety`, `well_child_checkups`。

迁移按编号顺序执行（`supabase/migrations/001_…018_…sql`），部分同编号迁移按主题拆分（如 `016_add_hospital_fields.sql` / `016_add_streak_columns.sql`）。

## 孕期阶段

```ts
type PregnancyStage = 'preconception' | 'first' | 'second' | 'third' | 'postpartum';
```

由 `calculateStageFromDueDate(dueDate)` 基于 280 天总长推算，week 1-12 = 早，13-27 = 中，28-40 = 晚。产后阶段显示 `calculateBirthAge(dueDate, birthDate)`（如 "3周" / "1年2周" / "3岁"）。
