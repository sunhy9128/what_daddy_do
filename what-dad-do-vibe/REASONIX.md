# what-dad-do-vibe — 爸爸去哪了

## Stack

- **Language** — TypeScript 5.9 + strict mode
- **Framework** — Expo SDK 54 + expo-router (file-based routing)
- **UI** — React Native 0.81 + react-native-web 0.21
- **Icons** — @expo/vector-icons (Ionicons)
- **Backend** — Supabase (auth + PostgreSQL + REST API)
- **State** — useReducer + context (no external state lib)
- **Design tokens** — custom `src/styles/tokens.ts` (Kami theme: warm parchment, ink-blue accent)

## Layout

- `app/` — expo-router pages (`_layout.tsx` = root stack, `(tabs)/` = bottom tabs)
- `src/components/atoms/` — atomic UI primitives (Button, Card, Avatar, Badge…)
- `src/components/molecules/` — compound components (PostCard, TaskCard, RecordEntry…)
- `src/components/organisms/` — composite widgets (TabBar, CollapsibleGroup, SegmentControl)
- `src/components/tools/` — Toolbar system + tool components (FeedingTimer, ToolBase…)
- `src/context/` — AppContext (all app state) + AuthContext (auth flow)
- `src/lib/` — `supabase.ts` (client), `api.ts` (all DB CRUD), `time.ts` (formatRelativeTime)
- `src/styles/tokens.ts` — design tokens shared by all components
- `supabase/migrations/` — raw SQL migrations for Supabase (run via Dashboard)
- `scripts/` — utility scripts (build-apk, seed data)

## Commands

| command | what it does |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run web` | Start Expo with web target |
| `npm run ios` | Start Expo with iOS target |
| `npm run android` | Start Expo with Android target |

No test/lint/format scripts exist. Typecheck manually: `npx tsc --noEmit`.

## Conventions

- **Named exports** — all components use named export + default export
- **File-based routing** — `app/(tabs)/index.tsx` → route `/`, `app/baby-info.tsx` → route `/baby-info`
- **Design tokens** — every component imports `colors`, `spacing`, `typography` from `src/styles/tokens.ts`; no raw color/font values
- **Supabase CRUD** — all DB operations go through `src/lib/api.ts` (one function per table operation); no direct supabase calls in pages
- **Async guard** — API-triggering handlers use `useRef` guard pattern to prevent double-submit (togglingRef, taskBusy, postingRef, likingRef)

## Watch out for

- **RLS blocks script inserts** — seed scripts can't bypass Supabase RLS with the anon key; run `supabase/migrations/` SQL via Dashboard SQL Editor
- **No test suite** — there are zero tests; verify changes by running the dev server and manual testing
- **Alert.alert on web** — React Native Web's Alert doesn't support button callbacks; web handlers use `window.confirm()` instead
- **Modal close flash** — post detail modal uses `lastPostRef` to cache the last selected post, preventing empty-content flash during fade-out animation
