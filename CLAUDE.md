# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**爸爸去哪了** - 孕产期跟踪助手 App，支持备孕、孕早期/中期/晚期、产后各阶段的任务管理、记录、社区功能。

技术栈：Expo Router + React Native + Supabase

## 常用命令

```bash
cd what-dad-do-vibe
npm start          # 启动开发服务器
npm run ios        # iOS 模拟器
npm run android    # Android
npm run web        # Web
```

## 架构

### 目录结构

```
app/                    # Expo Router 页面 (file-based routing)
  (tabs)/               # 底部 Tab 导航
    index.tsx           # 首页
    tasks.tsx           # 任务列表
    records.tsx          # 孕育记录
    community.tsx       # 社区
    profile.tsx         # 个人中心
  _layout.tsx           # 根布局
  login.tsx             # 登录页
  baby-info.tsx         # 宝宝信息页
src/
  lib/
    supabase.ts         # Supabase 客户端 + 原始 DB 类型
    api.ts              # API 函数（CRUD + 业务逻辑）
    time.ts             # 时间工具
  context/
    AppContext.tsx      # 全局状态（useReducer）
    AuthContext.tsx     # 认证状态
  components/
    atoms/              # 基础组件（Button, Badge, Avatar...）
    molecules/          # 复合组件（TaskCard, PostCard, RecordEntry...）
    organisms/          # 复杂组件（TabBar, CollapsibleGroup...）
  styles/tokens.ts      # 设计 tokens
```

### 状态管理

- `AuthContext` - 用户认证状态
- `AppContext` - 全局应用状态（tasks, records, communityPosts, babies 等），使用 `useReducer`
- 组件通过 `useApp()` / `useAuth()` 获取状态

### API 层

`src/lib/api.ts` 封装所有 Supabase 操作：
- 任务 CRUD：`getTasks`, `createTask`, `toggleTaskComplete`, `deleteTask`
- 记录 CRUD：`getRecords`, `createRecord`, `deleteRecord`
- 社区：`getCommunityPosts`, `toggleLike`, `addComment`
- 宝宝：`getBabies`, `createBaby`, `updateBaby`
- 孕期阶段计算：`calculateStageFromDueDate`（基于预产期推算当前阶段）

### 孕期阶段

```
preconception → first(0-12周) → second(13-27周) → third(28-40周) → postpartum
```

## Supabase 数据库表

`preset_tasks`, `tasks`, `records`, `babies`, `community_posts`, `post_likes`, `post_comments`, `urgent_notes`, `pregnancy_stages`, `user_knowledge_reads`

## 组件设计

采用 Atomic Design 分层：
- **atoms** - 最小可复用单元
- **molecules** - 由 atoms 组成
- **organisms** - 复杂业务组件

## 知识已读功能

`app/(tabs)/community.tsx` 中 `KnowledgeCard` 支持点击查看详情，详情弹窗有"已读"按钮。已读状态通过 `AsyncStorage` 本地存储（key: `@read_knowledge_ids`），或通过 `user_knowledge_reads` 表同步到服务器。