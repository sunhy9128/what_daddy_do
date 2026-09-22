# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**爸爸去哪了** — 给准爸爸 / 新手爸爸的孕产期全程陪伴助手，覆盖备孕 → 孕早/中/晚期 → 产后五阶段。主线功能：**课程 + 实用工具**（喂奶计时 / 生长曲线 / 疫苗 / 宫缩计时 / 数胎动等 14 个）+ 任务/产检。社区与 AI 问答已于 2026-09 移除（见 docs/adr/0001），等有真实用户反馈后再决定是否重建。

**Stack:** TypeScript 5.9 (strict) + Expo SDK 54 + expo-router + React Native 0.81 + Supabase (Auth + PostgreSQL)。状态用 `useReducer` + Context，无外部状态库。

## 仓库布局（monorepo 风格）

仓库根包含多个子项目，**Expo 主应用的源码和所有 `npm` 命令在 `what-dad-do-vibe/` 子目录内**：

```
what-dad-do-vibe/     # Expo 主应用（本文件大部分内容描述它）
admin-panel/          # 空目录占位
design-bundle/, landing.html, product.html   # 设计稿与品牌资产
docs/adr/             # 架构决策记录（ADR）
CONTEXT.md            # 领域词汇表
```

（曾有 wechat-miniapp/ 小程序移植计划，因个人开发者无 ICP 备案无法上架，且目录只是空壳，已于 2026-09 删除。）

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
    tool-detail.tsx             # 工具全屏详情页：按 tool id 从 AVAILABLE_TOOLS 找组件渲染
    (tabs)/
      _layout.tsx               # 底部 4 tab: 首页/任务/课程/我的
      index.tsx                 # 首页: 阶段信息 + 物品准备 + 心理支持 + 工具栏
      tasks.tsx                 # 任务管理: 产检/日常/打卡,StageTabs 切换;产检详情含医院信息与一键导航
      courses.tsx               # 课程页（渲染层）；课程数据在 src/lib/courses-data.ts
      profile.tsx               # 个人中心 + 退出登录
  src/
    lib/
      supabase.ts               # Supabase client (anon key) + 所有 DB 行 TypeScript 类型
      api.ts                    # 所有 Supabase CRUD 函数 (pages/components 不直接调 supabase)
      stages.ts                 # 孕期阶段计算 (calculateStageFromDueDate / calculateBirthAge)
      preset-tasks.ts           # 预设任务数据（唯一数据源，142 条；原 DB preset_tasks 表已由 021 删除）
      storage.ts                # AsyncStorage 封装: 工具配置/喂奶记录/生长记录
      courses-data.ts           # 课程静态数据（主线内容，持续膨胀，将来可迁 DB/CMS）
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
- `useApp()` — 来自 `AppContext`，返回 `{ state, dispatch, toggleTask, addTask, updateTask, removeTask, addRecord, removeRecord, addUrgentNote, dismissUrgentNote, addBaby, updateBabyGender }`（社区相关 actions 已随社区功能移除）
- `useColors()` — 来自 `ThemeContext`，页面/组件颜色统一从这里取，配合 `src/styles/tokens.ts` 的 spacing/typography/radius
- `state.stage` 由 `babies[0].due_date` 在 `loadUserData` / `addBaby` / `updateBabyGender` 中自动计算并 dispatch，UI 不要手动改 stage
- 首次登录经 `ensurePresetTasks.ts` 种入预设任务（数据唯一源：`src/lib/preset-tasks.ts`）

## API 层约定

**所有 DB 调用必须经 `src/lib/api.ts`，不要在 page/component 直接 `import { supabase }`**。原因：类型契约统一，Supabase 行类型只在 `lib/supabase.ts` 定义。

`api.ts` 按域分块：Tasks / Records / UrgentNotes / Babies / Vaccines / PresetItems / UserPreparations / PsychologicalSupport / FoodSafety / WellChild。社区与知识文章域已移除（DB 表保留）。

## 工具栏系统 (`src/components/tools/`)

Toolbar 是一个**运行时插件化**的 UI，顺序/启用状态存 AsyncStorage（`storage.ts` 的 `loadActiveTools` / `saveActiveTools`）。当前 14 个工具（2026-09 砍掉了排卵追踪/情绪自评/妈妈体重/护理日志/睡眠日志 5 个）：

- `AVAILABLE_TOOLS` 在 `Toolbar.tsx` 顶部声明 — 加新工具只需：实现组件 + 加入映射表 + 加入 `AVAILABLE_TOOLS`；`app/tool-detail.tsx` 也按同一映射渲染全屏详情
- `ToolBase` 是外壳，处理折叠/拖拽手柄/移除按钮（Android 上去除按钮要放在 dragArea 外，见 `ToolBase.tsx` 注释）
- 拖拽排序：PanResponder 手写实现（不用第三方库，见 Watch-outs）

## 样式系统

**优先用 `src/styles/tokens.ts` + `useColors()`（ThemeContext）**（墨蓝 accent + 暖羊皮纸背景 + 编辑级排版）。`src/theme/index.ts` 与 `login.tsx` 内联 colors 是遗留代码，新增组件不要照搬。

## 关键 Watch-outs

- **Supabase RLS 阻挡脚本写入** — `scripts/seed-*.mjs` 等用 anon key 跑会被 RLS 拒绝；**数据迁移只能通过 Supabase Dashboard SQL Editor**，不要尝试在 CI/本地脚本里 insert
- **RN Web 的 Alert** — `Alert.alert` 在 RN Web 不支持 button callback，web 处理器用 `window.confirm()`
- **Confetti 动画** — `src/components/Confetti.tsx` 用 `translateY` transform 而非 `top`，`useNativeDriver: true` 要求
- **工具拖拽不用第三方库** — `react-native-draggable-flatlist` 与环境不兼容，已改 PanResponder 手写
- **AsyncStorage keys 已命名空间化** — `user_tools_<userId>` / `feeding_records_<userId>` / `growth_records_<userId>`，不要改 key 格式以免丢用户数据
- **`EXPO_TOKEN` 硬编码在 `scripts/eas-build.sh`** — 已知问题，正式发布前应迁到环境变量
- **类型检查** — 改完跑 `npx tsc --noEmit`
- **产检医院与导航** — `baby-info.tsx` 设置产检医院名称/地址；`tasks.tsx` 产检详情显示医院信息并通过 `Linking.openURL` 唤起系统地图；注意事项（空腹/携带资料）走任务的 description 字段
- **多宝宝** — `018_multi_baby.sql` 起支持多宝宝，改 babies 相关逻辑时注意不要再假设单宝宝

## 数据库 schema 速查

表（在 `src/lib/supabase.ts` 都有对应 TS 类型）：`tasks`, `records`, `babies`, `urgent_notes`, `vaccines`, `vaccine_doses`, `user_vaccinations`, `preset_items`, `user_preparations`, `psychological_support`, `food_safety`, `well_child_checkups`。另有 `community_posts`, `post_likes`, `post_comments`, `knowledge_articles`, `user_knowledge_reads` 五张表保留在 DB 但已无代码消费（社区暂缓，见 ADR 0001）；`pregnancy_stages`（019）、`preset_tasks`（021，内容收敛到代码）已删除。另：020 补齐了 tasks/records 的 schema 基线与 vaccines 的 RLS（此前 vaccines 裸奔可公开写）。

迁移按编号顺序执行（`supabase/migrations/001_…021_…sql`），部分同编号迁移按主题拆分（如 `016_add_hospital_fields.sql` / `016_add_streak_columns.sql`）。

## 孕期阶段

```ts
type PregnancyStage = 'preconception' | 'first' | 'second' | 'third' | 'postpartum';
```

由 `calculateStageFromDueDate(dueDate)` 基于 280 天总长推算，week 1-12 = 早，13-27 = 中，28-40 = 晚。产后阶段显示 `calculateBirthAge(dueDate, birthDate)`（如 "3周" / "1年2周" / "3岁"）。
