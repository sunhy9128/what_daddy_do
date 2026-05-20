# 登录状态路由守卫实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 当用户未登录时，访问需要登录的页面自动跳转到登录页，并显示提示

**Architecture:** 创建 AuthGuard 组件包装需要保护的路由，在 AuthContext 中获取 session 状态，未登录时显示 Alert 并跳转

**Tech Stack:** React Native, Expo Router, Supabase

---

### Task 1: 创建 AuthGuard 组件

**Files:**
- Create: `what-dad-do-vibe/src/components/AuthGuard.tsx`

- [ ] **Step 1: 创建 AuthGuard 组件**

```typescript
import { useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

export function AuthGuard({ children, redirectTo = '/login' }: AuthGuardProps) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      Alert.alert(
        '提示',
        '请先登录',
        [
          {
            text: '确定',
            onPress: () => router.replace(redirectTo),
          },
        ],
        { cancelable: false }
      );
    }
  }, [session, loading, redirectTo]);

  if (!session) {
    return null;
  }

  return children;
}
```

- [ ] **Step 2: 导出到 index**

在 `what-dad-do-vibe/src/components/index.ts` 添加导出（如果文件存在）

---

### Task 2: 主页布局应用 AuthGuard

**Files:**
- Modify: `what-dad-do-vibe/app/(tabs)/_layout.tsx:1-57`

- [ ] **Step 1: 导入 AuthGuard**

```typescript
import { AuthGuard } from '../../src/components/AuthGuard';
```

- [ ] **Step 2: 用 AuthGuard 包裹 Tabs**

```typescript
export default function TabLayout() {
  return (
    <AuthGuard>
      <Tabs screenOptions={{ ... }}>
        {/* tabs content */}
      </Tabs>
    </AuthGuard>
  );
}
```

---

### Task 3: 登录页已登录处理

**Files:**
- Modify: `what-dad-do-vibe/app/login.tsx`

- [ ] **Step 1: 添加 session 检查和 loading 检测**

```typescript
const { session, loading } = useAuth();

useEffect(() => {
  if (!loading && session) {
    router.replace('/(tabs)');
  }
}, [session, loading]);
```

- [ ] **Step 2: 加载中返回 null**

```typescript
if (loading) {
  return null;
}
```

---

### Task 4: 提交变更

**Files:**
- Modified: Tasks 1-3 创建/修改的文件

- [ ] **提交变更**

```bash
git add src/components/AuthGuard.tsx app/\(tabs\)/_layout.tsx app/login.tsx
git commit -m "feat: add auth guard for protected routes"
```

---

**Plan complete.** Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?