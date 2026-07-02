# Payment Reconciliation Dashboard

A reconciliation tool for a SaaS billing operation. It pulls incoming bank
transfers (as delivered by a bank's API), automatically matches them to
customer companies by tax ID (INN), lets an operator resolve the leftovers by
hand, and reports **expected vs. actual** revenue per company, per month.

Built as a take-home with a deliberate focus on **clean layering, type-safety
end-to-end, and an architecture that holds up at scale** (millions of
transactions).

> **Live demo:** https://geo-safety-opal.vercel.app
> **Walkthrough video:** _add your 5-minute screen recording link here_

---

## Tech stack

| Area       | Choice                                                          |
| ---------- | -------------------------------------------------------------- |
| Framework  | **Next.js 16** (App Router, **Cache Components / PPR**)         |
| Language   | **TypeScript** (strict)                                         |
| Data       | **Supabase** (Postgres) via `@supabase/supabase-js`            |
| Server API | **Route Handlers** (`app/api/*`) — a thin, typed backend-for-frontend |
| Client     | **TanStack Query** (caching, mutations, optimistic updates)    |
| Validation | **Zod** (shared between client query-building and server input) |
| Styling    | **Tailwind CSS v4** with a token-based design system           |

### A note on the Next.js version

This project targets **Next.js 16**, which ships breaking changes vs. the 13–15
era. The implementation follows the bundled docs (`node_modules/next/dist/docs`)
rather than older conventions. Concretely it uses:

- **Cache Components** (`cacheComponents: true`) — Partial Prerendering is the
  default. The dashboard route is a **static shell** with the dynamic,
  URL-driven UI streamed behind a `<Suspense>` boundary.
- **`unstable_instant`** on the dashboard route to declare static
  instant-navigation prefetching. _Validation_ is explicitly opted out
  (`unstable_disableValidation: true`) — the draft build-time validator
  currently false-flags the legitimate "`useSearchParams` suspends on cold
  load" pattern, and I won't gate a production build on a draft check. The
  Instant-Navs DevTools overlay is still enabled in dev (`next.config.ts`).
- **`connection()`** to opt Route Handlers into request-time execution under
  Cache Components, so they never touch the database during `next build`.
- **`unstable_rethrow()`** in the API error funnel so framework control-flow
  signals (redirect / prerender bailout) aren't swallowed as 500s.
- **Async `params`** in route handlers and lazy, memoised env validation so the
  build succeeds without secrets present.

---

## Architecture

```
 Browser (Client Components)
   └─ TanStack Query hooks ──HTTP──▶ Route Handlers (app/api/*)
        useStats / useTransactions          │  Zod-validated input
        useUpdateTransaction (optimistic)    ▼
                                       Service layer (lib/services/*)
                                         typed mappers, no SQL leaks
                                             │
                                             ▼
                                       Supabase (Postgres)
                                         RPCs: reconcile_by_inn,
                                         reconciliation_stats,
                                         company_reconciliation
```

**Why this shape:**

- **The client never talks to Supabase directly.** It calls our Route Handlers,
  which use the **service-role key on the server only** (guarded by
  `server-only`, never `NEXT_PUBLIC_`). This keeps secrets off the wire and
  gives us one place to add auth, rate-limiting, or audit logging later.
- **A service layer maps snake_case rows → camelCase domain types** so the
  database naming convention never leaks into the API or UI. Domain types
  (`lib/types/domain.ts`) are the single contract shared by both sides.
- **Zod schemas are shared**: the client builds query strings from the same
  schema the server validates against, so the contract can't drift.

### Layout

```
app/
  api/                      Route Handlers (the backend-for-frontend)
    transactions/route.ts        GET list (filter/sort/paginate)
    transactions/[id]/route.ts   PATCH match | ignore | unmatch
    stats/route.ts               GET portfolio summary
    reconciliation/route.ts      GET expected-vs-actual per company
    reconciliation/run/route.ts  POST trigger INN auto-match
    companies/route.ts           GET company list (manual-match picker)
  page.tsx                  Static shell + <Suspense> + unstable_instant
  layout.tsx, error.tsx, not-found.tsx
components/
  dashboard/                Feature components (stats, tables, dialog, toolbar)
  ui/                       Design-system primitives (Button, Card, Badge, …)
  providers/                TanStack Query provider
hooks/                      use-dashboard-params (URL state), queries, mutations
lib/
  services/                 Typed DB access + mappers (server-only)
  supabase/                 Server client + hand-authored Database types
  validation/               Zod schemas
  reconciliation/           Expected-vs-actual verdict (single source of truth)
  query/                    Query-key factory + QueryClient
  utils/                    format, periods, csv, cn
  types/                    Domain models
supabase/
  reconcile.sql             RPC functions (matching + reconciliation)
```

---

## The matching logic

**Where:** in the database, as the `reconcile_by_inn()` Postgres function
(`supabase/reconcile.sql`). **Why there, not in the client or Node:**

- It's a single **set-based `UPDATE … FROM`** that matches every unmatched row
  in **one round-trip and one transaction** — no fetch-all / loop / write-back.
- It's **atomic and concurrency-safe**: two operators clicking "Run" at once
  can't double-match.
- It **scales**: the match key (`sender_inn`) and the `status` filter are both
  indexed, so Postgres does a join instead of N network calls. This is the
  difference between O(1) round-trips and O(n).

**The rule:** match an `unmatched` transaction when `sender_inn = company.tax_id`
exactly → set `match_method='inn_exact'`, `match_confidence=1.00`,
`status='matched'`. Edge cases fall out of the predicate itself:

- **Personal IDs / wrong-format INNs** (e.g. the 11-digit `01234567890`) never
  collide with a 9-digit `tax_id` → stay unmatched.
- **NULL / empty `sender_inn`** → never equals a tax_id → stays unmatched.
- **Unknown company INN** → no join partner → stays unmatched.
- The update is **scoped to `status='unmatched'`**, so it never overwrites a
  manual match or an ignored row. It's idempotent and safe to re-run.

Everything else (name typos, fuzzy variants like _"ბათუმი (ფილიალი)"_,
overpayments, prepayments, refunds) is intentionally left **unmatched** for the
operator to resolve via the manual-match dialog — which is the realistic
reconciliation workflow.

## Expected vs. actual

Per company, per month (`company_reconciliation(period_start, period_end)`):

- **expected** = Σ `monthly_amount` of contracts that were **active during that
  month**. Contract `status` is point-in-time (what the contract is *now*), so
  historical months are resolved by date: a contract bills a month iff it had
  started by the month's end and hadn't stopped (`end_date`) before the month
  began. Example from the seed: Safe Transport's contract is `paused` with
  `end_date = 2026-05-15`, so it still bills April and May 2026 — but not June.
- **actual** = Σ `amount` of that company's **matched** transactions in the month.
- **verdict** (`lib/reconciliation/status.ts`, the one place this rule lives):
  `on track` (within rounding tolerance) · `underpaid` · `overpaid` ·
  `no payments` · `no active contract` — colored per the brief: green when paid
  ≥ expected, red when paid less, grey when nothing was paid.

---

## Features

- **Dashboard summary**: total / matched / unmatched / ignored counts + amounts
  and a live match rate (ignored rows excluded from the denominator).
- **Per-company reconciliation** for a chosen month, with totals and **CSV
  export** (bonus).
- **Transactions table**: server-side **filtering** (status + full-text search
  over name/INN/purpose), **sortable** columns, and **pagination** — all driven
  by **URL state** so views are shareable and survive refresh/back.
- **Manual reconciliation**: match to a company, ignore, or reset, with
  **optimistic updates** and automatic cache invalidation. The dialog
  **suggests the likely company** (bonus): exact INN → tax-ID equality first,
  then fuzzy name matching that ignores legal forms and branch suffixes — so
  _"გეოტრანსი (ფილიალი)"_ pre-selects _"შპს გეოტრანსი"_
  (`lib/reconciliation/suggest.ts`).
- **One-click INN auto-match** with an inline result summary.
- **Month selector** (April–June 2026 seed data) wiring stats, the per-company
  view, and the transaction list together.
- Loading **skeletons**, **error states** with retry, and an empty state.

---

## Getting started

### 1. Prerequisites

- Node.js 20+
- A free [Supabase](https://supabase.com) project

### 2. Create the database

In the Supabase **SQL Editor**, run these three scripts **in order**:

1. `seed_schema.sql` — tables, indexes, the `updated_at` trigger, 15 companies,
   18 contracts. _(provided with the task)_
2. `seed_transactions.sql` — 89 bank transactions (Apr–Jun 2026), all seeded as
   `unmatched`. _(provided with the task)_
3. `supabase/reconcile.sql` — the matching + reconciliation RPC functions.
   _(in this repo)_

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in from **Supabase → Project Settings → API**:

```bash
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role secret>   # server-only, never exposed
```

### 4. Run

```bash
npm install
npm run dev          # http://localhost:3000
```

Then click **Run auto-match** to reconcile by INN, and resolve the rest by hand.

```bash
npm run build && npm start   # production build
npm run lint                 # eslint
npx tsc --noEmit             # typecheck
```

---

## Deploying to Vercel

1. Push to a public GitHub repo and **Import** it in Vercel.
2. Add the two env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) in
   **Project → Settings → Environment Variables**.
3. Deploy. The build needs no database connection (env is validated lazily at
   request time, and Route Handlers run on demand).

---

## Scaling & trade-offs

**Built to scale:**

- Matching and aggregations run **in Postgres** (set-based, indexed), not in app
  code — the expensive path stays O(1) round-trips as data grows.
- **Server-side pagination** (`range` + exact count) means the transactions list
  is bounded regardless of table size.
- A clean **service boundary** makes it trivial to add auth/RLS, caching
  (`use cache` + `cacheTag` on read endpoints), or move heavy work to a queue.

**What I'd add next given more time:**

- Auth + Supabase **Row Level Security** (the task scopes auth out).
- Ranked multi-candidate suggestions (name similarity scores, amount
  proximity) on top of the current single best-guess suggestion.
- Month-over-month trends on the company drill-down view.
- E2E tests with `@next/playwright`, including an `instant()` navigation check.
