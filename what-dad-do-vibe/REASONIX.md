# what-dad-do-vibe — 爸爸去哪了

## Stack

- **Language** — TypeScript 5.9 + strict mode
- **Framework** — Expo SDK 54 + expo-router (file-based routing)
- **UI** — React Native 0.81 + react-native-web 0.21
- **Icons** — @expo/vector-icons (Ionicons)
- **Backend** — Supabase (auth + PostgreSQL + REST API)
- **State** — useReducer + context (no external state lib)

## Layout

- `app/` — expo-router pages (`_layout.tsx` = root stack, `(tabs)/` = bottom tabs)
- `src/components/atoms/` — atomic UI primitives (Button, Card, Avatar, Badge…)
- `src/components/molecules/` — compound components (PostCard, TaskCard, RecordEntry…)
- `src/components/organisms/` — composite widgets (TabBar, CollapsibleGroup, SegmentControl)
- `src/components/tools/` — Toolbar system + tool components (FeedingTimer, GrowthTracker/Chart, VaccineTracker/Calendar)
- `src/context/` — AppContext (all app state) + AuthContext (auth flow)
- `src/lib/` — `supabase.ts` (client), `api.ts` (all DB CRUD), `stages.ts` (pregnancy stage calc), `storage.ts` (AsyncStorage), `growth-chart-data.ts` (WHO data), `time.ts` (formatRelativeTime)
- `supabase/migrations/` — raw SQL migrations (run via Supabase Dashboard)
- `scripts/` — build-apk, seed data, read-xlsx utility

## Commands

| command | what it does |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run web` | Start Expo with web target |
| `npm run ios` | Start Expo with iOS target |
| `npm run android` | Start Expo with Android target |

No test/lint/format scripts. Typecheck: `npx tsc --noEmit`. APK build via EAS: `npx eas build -p android --profile preview --non-interactive` (requires EXPO_TOKEN).

## Conventions

- **Named exports** — all components use named export + default export
- **File-based routing** — `app/(tabs)/index.tsx` → route `/`, `app/baby-info.tsx` → route `/baby-info`
- **Design tokens** — all components import `colors`, `spacing`, `typography` from `src/styles/tokens.ts`
- **Supabase CRUD** — all DB ops through `src/lib/api.ts`; no direct supabase calls in pages
- **Async guard** — API-triggering handlers use `useRef` guard to prevent double-submit

## Watch out for

- **RLS blocks script inserts** — seed scripts can't bypass Supabase RLS with anon key; run migrations via Dashboard SQL Editor
- **Alert.alert on web** — RN Web's Alert doesn't support button callbacks; web handlers use `window.confirm()` instead
- **Modal close flash** — post detail modal uses `lastPostRef` cache to prevent empty-content flash during fade-out
- **Confetti animation** — uses `translateY` transform (not `top`), required by native animated module's `useNativeDriver`
- **Growth chart** — pure View-based rendering, no `react-native-svg` dependency (was removed due to native compat issues)
- **Tool reorder** — ▲/▼ buttons with AsyncStorage persistence; drag lib (`react-native-draggable-flatlist`) was incompatible with current environment
