# 爸爸去哪了 · 微信小程序端

微信小程序版本，基于 [Taro 4](https://docs.taro.zone/) + React + TypeScript，
与 `what-dad-do-vibe/` (RN/Expo) 共享同一份 Supabase 后端。

## 快速开始

```bash
cd wechat-miniapp
npm install

# 开发：监听 weapp 产物，导入微信开发者工具 dist/ 目录
npm run dev:weapp

# 单次构建
npm run build:weapp

# H5 预览
npm run dev:h5
```

## 配置 Supabase

修改 `src/lib/supabase.ts` 中的 `SUPABASE_URL` 与 `SUPABASE_ANON_KEY`
（与 `what-dad-do-vibe/src/lib/supabase.ts` 保持一致）。

微信小程序后台需要把 `supabase.co` 加入 `request 合法域名` 白名单。

## 项目结构

```
src/
  app.tsx                # 入口 + AuthProvider
  app.config.ts          # 小程序 pages / tabBar / window
  app.scss               # 全局样式 (Kami 暖羊皮纸 bg)
  pages/
    index/               # 首页 (阶段信息 + 物品准备)
    tasks/               # 任务 (产检/日常/打卡)
    community/           # 社区 (知识 + 帖子)
    profile/             # 我的
    login/               # 登录 / 注册
  components/
    StageTabs.tsx        # 阶段分段控件
  context/
    AuthContext.tsx      # supabase.auth 状态
  lib/
    supabase.ts          # client + 行类型
    api.ts               # 业务 CRUD (与 RN 端 src/lib/api.ts 对齐)
    stages.ts            # 孕期阶段计算
  styles/
    tokens.ts            # Kami 设计 token (颜色/间距/圆角/字号)
```

## 已有 vs 待补

- [x] tabBar 4 模块骨架 + 登录页
- [x] Supabase 接入 + Auth 持久化
- [x] 任务列表 (完成态切换)
- [x] 社区 (分类过滤 + 知识区)
- [ ] 首页：物品准备 / 心理支持 / 工具栏
- [ ] 我的：宝宝信息编辑 / 通知设置二级菜单
- [ ] tabBar 图标 (assets/tab/* 待补 PNG)
- [ ] DeepSeek AI 问答工具

## 与 RN 端的设计对齐

- 设计 token (`src/styles/tokens.ts`) 直接对齐 `what-dad-do-vibe/src/styles/tokens.ts`
- 行类型 (`src/lib/supabase.ts`) 直接对齐 RN 端 `src/lib/supabase.ts`
- API 函数 (`src/lib/api.ts`) 与 RN 端 `src/lib/api.ts` 字段保持一致