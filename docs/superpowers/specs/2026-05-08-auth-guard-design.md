# 登录状态路由守卫设计

**日期：** 2026-05-08

## 概述

当用户未登录时，访问需要登录的页面自动跳转到登录页，并显示提示。

## 组件设计

### AuthGuard 组件

**文件：** `components/AuthGuard.tsx`

```typescript
interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;  // 默认 '/login'
}
```

**流程：**
```
用户访问页面
    ↓
AuthGuard 检查 session
    ├── 已登录 → 渲染 children
    └── 未登录 → 显示 Alert("请先登录") → 跳转到登录页
```

### 主页布局保护

**文件：** `app/(tabs)/_layout.tsx`

- 包裹 `<TabLayout>` 在 `<AuthGuard>` 中

### 登录页已登录处理

**文件：** `app/login.tsx`

- 检查 session 状态
- 已登录则自动跳转到主页 `/`

## 数据流

```typescript
// AuthContext 提供
session: Session | null
isAdmin: boolean
```

- AuthGuard 读取 `useAuth()` 的 `session`
- `session === null` → 未登录

## 错误处理

- AuthContext 加载中时：渲染 children（Loading 状态在子组件处理）
- Alert 被拒绝：停留在当前页面
- 跳转失败：使用 `router.replace()`