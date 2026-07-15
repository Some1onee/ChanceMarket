# ChanceMarket

An international marketplace for **prize competitions, free draws and sweepstakes** —
verified sellers, territory-aware compliance, and server-side draws anyone can verify.

> ⚠️ **Legal status**: nothing in this repository constitutes legal compliance. All legal
> documents are templates, all seeded jurisdiction rules are conservative placeholders
> flagged `requires_legal_approval = true`, and no real payment provider is enabled.
> See `docs/LEGAL_REVIEW_CHECKLIST.md` before any launch.

## Stack

Next.js 15 (App Router, Server Components) · React 19 · TypeScript strict · Tailwind v4 ·
custom shadcn-style UI kit · Supabase (Postgres 17, Auth, Storage, Realtime, Edge Functions) ·
Zod · React Hook Form · Vitest · Playwright · GitHub Actions · pnpm.

## Prerequisites

- Node.js ≥ 20 (tested on 22/24), pnpm ≥ 10 (`corepack enable pnpm`)
- Docker Desktop (for the local Supabase stack)
- Supabase CLI (installed as a devDependency — use `pnpm exec supabase …` or `pnpm db:*` scripts)

## Quick start

```bash
pnpm install

# 1. Start the local Supabase stack (Postgres, Auth, Storage, Realtime, Studio)
pnpm db:start          # prints API URL + keys

# 2. Apply ALL migrations and the demo seed
pnpm db:reset

# 3. Configure the app
cp .env.example .env.local
#    → NEXT_PUBLIC_SUPABASE_URL          = the printed API URL (http://127.0.0.1:54321)
#    → NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = the printed anon key
#    → SUPABASE_SECRET_KEY               = the printed service_role key
#    → CM_DEV_GEO=GB                      (simulates a GB visitor in dev)

# 4. Run
pnpm dev               # http://localhost:3000
```

### Demo accounts (password for all: `Demo1234!pass`)

| Email                 | Role(s)              |
| --------------------- | -------------------- |
| admin@demo.test       | admin + super_admin  |
| moderator@demo.test   | moderator            |
| finance@demo.test     | finance              |
| seller.one@demo.test  | approved seller (GB) |
| seller.two@demo.test  | approved seller (GB) |
| alice@demo.test       | user (GB)            |
| ben@demo.test         | user (GB) — winner of the seeded completed draw |
| chloe@demo.test       | user (US-CA)         |

The seed includes live GB/US campaigns, a campaign in moderation, a draft, and a
**completed campaign with a fully auditable draw** (`/draws/DRW-2026-000042`).

### Mock payments

`PAYMENT_PROVIDER=mock` processes checkout through HMAC-signed webhooks exactly like a
real provider. **Any amount whose minor units end in 99 is declined** (e.g. two £2.50
entries = £5.00 → succeeds; a £1.99 configuration → declined) — use it to test failure paths.

## Commands

| Command                 | Purpose                                       |
| ----------------------- | --------------------------------------------- |
| `pnpm dev` / `build` / `start` | Run / production build / serve         |
| `pnpm typecheck` / `lint` / `format:check` | Quality gates             |
| `pnpm test`             | Unit tests (Vitest)                           |
| `pnpm test:integration` | RLS/pipeline tests (needs local stack + env, see docs/TESTING.md) |
| `pnpm test:e2e`         | Playwright (desktop + mobile)                 |
| `pnpm db:start|stop|reset|push|diff` | Supabase lifecycle               |
| `pnpm db:types`         | Regenerate `lib/supabase/database.types.ts`   |

## Architecture (summary)

```
Browser (untrusted UI hints only)
  → Server Components / Server Actions  (Zod validation, sessions, rate limits)
  → features/* services                 (use-cases, compliance, payments, draws)
  → Supabase                            (RLS on every table + SECURITY DEFINER
                                         transactional functions for money,
                                         entries, state machines, draws)
```

- **Deny-by-default compliance engine**: campaign formats/categories/prices/ages are only
  available where an active, legally-flagged jurisdiction row explicitly allows them —
  checked when sellers author, when campaigns publish, when campaigns are shown, when
  entries are created (server), and again inside the SQL functions.
- **Money** is integer minor units end-to-end; the `financial_ledger` is append-only.
- **Draws**: frozen hashed snapshot → in-database CSPRNG selection → public verification
  page; re-draws need a reason + two distinct admins and stay publicly visible.

Full details: `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/COMPLIANCE_ENGINE.md`,
`docs/DRAWS.md`, `docs/PAYMENTS.md`, `docs/RLS.md`, `docs/SECURITY.md`.

## Deployment

Vercel (app + crons) + Supabase (managed). Step-by-step: `docs/DEPLOYMENT.md`.

## Repository map

```
app/           routes: (marketing) (auth) (dashboard) admin api
components/    ui kit, layout, campaign & marketing components
features/      auth profiles sellers campaigns entries payments draws
               compliance verification notifications admin
lib/           supabase auth payments compliance email money dates errors
               localization rate-limit observability config
supabase/      migrations (9) · functions (2 edge) · seed.sql · config.toml
emails/        versioned transactional templates
tests/ e2e/    vitest unit+integration · playwright specs
docs/          15 documents
```
