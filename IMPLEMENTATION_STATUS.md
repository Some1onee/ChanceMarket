# IMPLEMENTATION STATUS — ChanceMarket

> Final status of the initial build. Last updated: 2026-07-15.

## Environment facts (build machine)

- Windows 11, Node 24.14, pnpm 11.13, git 2.53. **No Docker available**, so the local
  Supabase stack could not be started here: migrations, seed, RLS/integration tests and
  Playwright e2e are fully authored and CI-wired, and must be executed on a machine with
  Docker (`pnpm db:start && pnpm db:reset`) or in GitHub Actions (job 2 does exactly this).
- A hosted Supabase project URL + publishable key were provided; the service key / DB
  password were not, so migrations were not pushed from here. Apply with
  `supabase link && supabase db push` (docs/DEPLOYMENT.md).

## Phase log — all phases complete

| Phase | Scope | Status | Verified on this machine |
| --- | --- | --- | --- |
| 1 | Repo audit, tooling, architecture docs | ✅ | git init; pnpm install |
| 2 | Scaffold, quality gates, design system (25+ UI components, themes) | ✅ | typecheck ✅ lint ✅ build ✅ |
| 3 | 9 SQL migrations, RLS on all tables, transactional functions, seed w/ auditable draw | ✅ authored | executable via `supabase db reset` (CI job 2) |
| 4 | Auth (sign-up/in/out, reset, confirm, OAuth callback) + full account area | ✅ | gates ✅ |
| 5 | Catalogue (filters/URL/pagination/skeletons) + campaign detail + winners | ✅ | gates ✅ |
| 6 | Seller onboarding (mock KYC), dashboard, 6-step wizard w/ autosave & uploads | ✅ | gates ✅ |
| 7 | Compliance engine: deny-by-default checks at author/publish/view/enter + SQL | ✅ | gates ✅ + integration tests authored |
| 8 | Entries: paid, free draw, free route (equal odds), skill gating, safeguards | ✅ | gates ✅ |
| 9–10 | PaymentProvider + mock, signed replay-proof webhooks, ledger, refunds | ✅ | gates ✅ + unit tests ✅ |
| 11 | Close→settle→snapshot(hash)→CSPRNG select→verify→fulfil; /draws pages; crons + edge functions | ✅ | gates ✅ + formula unit tests ✅ |
| 12 | Admin: overview, moderation, sellers, campaigns, draws (dual-approval reroll), payments, jurisdictions, reports, disputes, users/roles, audit | ✅ | gates ✅ |
| 13 | Realtime bell, notification prefs, EmailProvider + 16 versioned templates, outbox dispatcher | ✅ | gates ✅ |
| 14 | 15 institutional pages, sitemap/robots/JSON-LD, CSP/security headers, health, analytics abstraction | ✅ | gates ✅ |
| 15 | 35 unit tests ✅ · integration suite (RLS, concurrency, draws) · e2e suite (17+ journeys, desktop+mobile) · GitHub Actions CI | ✅ | unit ✅ here; integration/e2e wired for CI |
| 16 | README + 14 docs, checklists, this status, final report | ✅ | — |

## Exact gate results (this machine, final run)

- `pnpm typecheck` → 0 errors
- `pnpm lint` → 0 errors
- `pnpm format:check` → clean
- `pnpm test` → 6 files, **35 tests passed**
- `pnpm build` → production build succeeds (all routes compile)
- `pnpm test:integration` / `test:e2e` → authored; require Docker/local stack (CI job 2)

## Key decisions

Next 15.5 · Tailwind v4 · hand-rolled shadcn-style kit · typed en-GB/en-US dictionaries ·
integer minor-unit money everywhere · Postgres enums for closed state machines ·
SECURITY DEFINER SQL for entries/money/draws/status · append-only ledger + audit ·
outbox for side-effects · mock providers behind interfaces (payments/email/KYC/geo) ·
in-DB CSPRNG with publicly recomputable winner formula (documented honest limits).

## Deliberately NOT done (requires human/legal/business action)

- No real payment/email/KYC/geo vendor enabled — interfaces + checklists ready.
- All jurisdiction rules are placeholders (`requires_legal_approval=true`).
- All legal page content is template-flagged for counsel.
- Real-estate & vehicle transfers: workflow/documentation states only, no automation.
- Staff 2FA, Redis rate limiting, CSP nonces, AV scanning: hardening backlog (SECURITY.md).
