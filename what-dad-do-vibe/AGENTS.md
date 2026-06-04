# 爸爸去哪了 (DadCare)

给准爸爸和新手爸爸的孕产期全程陪伴助手。备孕 → 孕早/中/晚期 → 产后五阶段。

## Stack

TypeScript 5.9 (strict) · Expo SDK 54 · expo-router (file-based routing) · React Native 0.81 · react-native-web 0.21 · Supabase (Auth + PostgreSQL) · @expo/vector-icons (Ionicons) · useReducer + Context (no external state lib)

## Commands

| Command | Action |
|---------|--------|
| `npm start` | Start Expo dev server |
| `npm run web` | Web target (metro bundler) |
| `npm run ios` | iOS simulator |
| `npm run android` | Android device/simulator |
| `npx tsc --noEmit` | Type check only |

No test/lint/format scripts exist. APK: `npx eas build -p android --profile preview --non-interactive` (needs EXPO_TOKEN).

## Architecture

```
app/              — expo-router pages (file-based routing)
  _layout.tsx     — Root: SafeArea → AuthProvider → AppProvider → AuthRedirector → Stack
  login.tsx       — Email/password login & signup
  baby-info.tsx   — Due date entry/edit
  congratulations.tsx — Gender confirmation + confetti
  profile-edit.tsx — Edit profile (name, baby info)
  (tabs)/         — Bottom tabs: index (home), tasks, community, profile
    _layout.tsx   — AuthGuard → 3 visible tabs (首页/任务/我的) + 2 hidden (community, records)
    index.tsx     — Home: stage info, prep items, psychological support, toolbar
    tasks.tsx     — Tasks: prenatal/daily/checkin with StageTabs
    community.tsx — Posts + knowledge articles + likes/comments
    records.tsx   — Memo records (hidden from tab bar)
    profile.tsx   — User profile + logout

src/
  lib/
    supabase.ts   — Supabase client + ALL TypeScript types (base types in one file)
    api.ts        — ALL Supabase CRUD functions (pages never import supabase directly)
    stages.ts     — PregnancyStage type, calculateStageFromDueDate, calculateBirthAge
    storage.ts    — AsyncStorage wrapper (tools config, feeding/growth records)
    time.ts       — formatRelativeTime
    growth-chart-data.ts — WHO growth curve static data
  context/
    AuthContext.tsx — Auth: supabase.auth session + AsyncStorage persistence
    AppContext.tsx  — Global state (useReducer): tasks, records, babies, community, urgent notes
  hooks/
    useTheme.ts    — Legacy theme hook (only useTheme export, negligible)
  components/
    atoms/         — Card, Button, Tag, Avatar, Badge, Progress
    molecules/     — TaskCard, PostCard, KnowledgeCard, RecordEntry, StageTabs, SearchBar
    organisms/     — TabBar, SegmentControl, CollapsibleGroup
    tools/         — Toolbar + ToolBase + FeedingTimer, GrowthTracker, GrowthChart,
                     VaccineTracker, VaccineCalendar, FoodSafety
  styles/
    tokens.ts      — Kami design tokens (WARM parchment bg #F5F0E8, ink-blue accent #2C3E6B)
  theme/
    index.ts       — Legacy tokens (don't import from here in new code)

supabase/migrations/ — 015 SQL files (run via Dashboard SQL Editor, not scripts)
scripts/             — build-apk.sh, eas-build.sh, seed-urgent-notes.mjs, read-xlsx.js
```

## State Management

- `useAuth()` → `{ session, user, loading, signIn, signUp, signOut }`
- `useApp()` → `{ state, dispatch, toggleTask, addTask, updateTask, removeTask, addRecord, removeRecord, refreshCommunityPosts, addUrgentNote, dismissUrgentNote, addBaby, updateBabyGender }`
- Stage auto-calculated from `babies[0].due_date` in `loadUserData` / `addBaby` / `updateBabyGender` — UI never sets stage directly
- ~60 hardcoded preset tasks on first login (in `AppContext.tsx`); full list in `preset_tasks.sql`

## Conventions

1. **Named + default exports** — all components export both.
2. **Kami tokens** — import `colors`, `spacing`, `typography`, `radius`, `shadows` from `src/styles/tokens.ts`; do NOT use `src/theme/`.
3. **DB via api.ts only** — no `import { supabase }` in pages or components; all CRUD goes through `src/lib/api.ts`.
4. **camelCase state fields** — AppContext types use camelCase (e.g. `isCompleted`, `dueDate`), DB row types in `supabase.ts` use snake_case.
5. **useRef guard** — API-triggering handlers use a `useRef(false)` to prevent double-submit.
6. **web-safe Alert** — `Alert.alert` doesn't support button callbacks on RN Web; use `window.confirm()` via `Platform.OS === 'web'` check.
7. **Mutation naming** — UI-facing actions in AppContext are imperative (`toggleTask`, `addRecord`); api.ts uses `createXxx`, `getXxx`, `deleteXxx`.

## Watch-outs

- **RLS blocks script inserts** — seed scripts with anon key are rejected; data migrations run only via Supabase Dashboard SQL Editor.
- **No react-native-svg** — `GrowthChart.tsx` is pure View-based; was removed for native compat.
- **Tool reorder via ▲/▼** — drag lib (`react-native-draggable-flatlist`) was incompatible; uses LayoutAnimation + button-based reorder.
- **Modal close flash** — `community.tsx` uses `lastPostRef` to cache post during modal fade-out.
- **Confetti animation** — `Confetti.tsx` uses `translateY` (not `top`) + `useNativeDriver: true`.
- **AsyncStorage keys namespaced** — `user_tools_<userId>`, `feeding_records_<userId>`, `growth_records_<userId>` — do not rename.
- **`EXPO_TOKEN` hardcoded** in `scripts/eas-build.sh` — should migrate to env variable before release.
- **`src/navigation/`** exists but is empty.
- **`app/login.tsx`** has inline colors (legacy); do not copy that pattern.

## Database Tables

All DB types defined in `src/lib/supabase.ts`: `tasks`, `records`, `babies`, `community_posts`, `post_likes`, `post_comments`, `urgent_notes`, `pregnancy_stages`, `user_knowledge_reads`, `knowledge_articles`, `preset_tasks`, `vaccines`, `vaccine_doses`, `user_vaccinations`, `preset_items`, `user_preparations`, `psychological_support`, `food_safety`.

## Notes

—
