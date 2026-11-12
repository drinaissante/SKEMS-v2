# AGENTS.md — SKEMS Frontend

Sine Kultura Equipment Management System: React + Vite + TypeScript PWA
(Tailwind v4), Supabase backend (Postgres/RLS/Realtime/Storage), Vercel
serverless functions in `api/`, Tauri desktop shell in `src-tauri/`.

## Commands
- Dev: `npm run dev` (Vite; `/api/*` proxies to https://skems-v2.vercel.app)
- Build: `npm run build` (tsc -b + vite build)
- Verify EVERY change: `npx eslint <touched files>` + `npx tsc -b`; add
  `npx tsc -p api --noEmit` when `api/` or `lib/` changed. No test suite.
- Tauri: `npm run tauri build --bundles nsis` (cargo at
  `%USERPROFILE%\.cargo\bin` — prepend to PATH). Bump version in
  `src-tauri/tauri.conf.json` AND `Cargo.toml` together.
  Installer: `src-tauri\target\release\bundle\nsis\`.

## Env & deploy
- `.env` (gitignored): VITE_* (Supabase URL/key, hCaptcha, BASE_URL) +
  serverless secrets (DISCORD_*, SERVICE_ACCOUNT_KEY, GEMINI, LINK_SECRET).
- Frontend changes reach PWA + the Tauri shell (which loads the deployed
  site) only after a Vercel redeploy. Rust fixes need a new installer.
- Commit only when explicitly asked.

## Timezone rules (CRITICAL)
- Picked datetimes arrive as NAIVE strings (`datetime-local`, scan parser).
  Normalize with `toManilaIso()` (`utils/datetime.ts`) before inserting into
  timestamptz columns — naive = PH +08:00.
- DB timestamps (`created_at`, `returned_on`) are UTC ISO ("…Z").
- Display: `formatManila()` = always Asia/Manila; `formatWallClock()` =
  literal for naive strings, Manila for tz-tagged. Never render tagged
  timestamps as UTC; leave Borrowed/Due (naive) as literal wall times.
- Discord embeds: `formatDiscordDate` reads hours from the string (UTC) —
  pending fix for ISO-with-offset values.

## Database & SQL
- Migrations: plain `.sql` under `sql/`, run manually in the Supabase SQL
  editor (no CLI). Descriptive names, re-runnable statements (guard
  `cron.unschedule`), explicit warnings against double-running one-shot
  repairs. Text-typed columns need casts for date math (`::timestamptz`,
  parenthesized `- interval … at time zone`).
- Owner identity = name matching:
  `regexp_replace(lower(owner), '\s+', ' ', 'g')` vs
  `profiles.full_name` (see requests/equipments RLS policies — reuse for
  owner-scoped features).
- Tables: `requests` (+ `owner_status`/`owner_reason` two-step approval),
  `borrow_records` (TEXT date columns), `notifications` (RLS: own
  read/update, delete only read+>7d expired rows, admins read all),
  `equipments`, `profiles`, `discord_links`, `gradings`.

## React Query
- localStorage persister (7-day, key `skems-query-cache`) — NEVER store
  Maps/Date/class instances as query data (deserialise as plain objects;
  caused the `j.get` crash) — use `Record<string, boolean>`.
- Invalidate related keys after mutations: `equipments`, `my-equipments`,
  `admin-requests`, `my-requests`, `owner-requests`, `borrowed-items`.
- staleTime: equipments 30 min, requests 5 min, member names 5 min.

## Realtime
- One channel per name, subscribed ONCE — module-level registry + fan-out
  (pattern in `useNotifications.ts`). `.on()` always precedes `.subscribe()`.
  Expect double-mounted consumers (desktop + mobile layouts).

## UI conventions
- Dark theme, gold accents `#c89116`/`#fdb125`. Modal recipe: `bg-[#111]
  border border-[#5f5c5c93] rounded-xl shadow-xl`. z-order: modals z-50,
  tutorial z-[60], tour z-[80], toasts z-9999, PWA banner z-[9999].
- Mobile breakpoint `< 768px` (`md:` classes; `window.matchMedia` state).
- Shared components: `PaginationNav` (About-carousel chevrons — use for ALL
  pagination), `RequestCard` + `RequestInfoModal` (both request pages),
  `EquipmentCard` (dashboard + My Equipments — changes affect both),
  `OwnerRequestsModal`, `TourOverlay` (targets via `data-tour` attributes),
  toasts via `useToast()`.
- Uniform card heights: reserve variable blocks (comment/borrowed slots),
  `auto-rows-fr` + `h-full` cards.
- Guided walkthrough: `TutorialContext.openTutorial({ userId, isAdmin },
  { force? })` — admin-skip + per-user localStorage dismissal +
  first-request DB check; manual reopens use `force`.

## Serverless (`api/`, `lib/discord.ts`)
- Pattern: Bearer-token auth check via anon client; cross-user reads
  (discord_links) require `SUPABASE_SERVICE_ROLE_KEY`. Discord calls are
  fire-and-forget — never block user flows.

## Workflow
- Plan → user approves ("go for it") → implement → verify (Commands above).
- The user hand-edits files between sessions — re-read before editing.
- Schema changes ship as SQL for the user to run first; code follows.
