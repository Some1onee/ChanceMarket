# IMPLEMENTATION STATUS — ChanceMarket

> Updated after each phase. Honest record of what is built, verified, and pending.

## Environment facts (this machine)

- Windows 11, Node 24.14, pnpm 11.13, git 2.53.
- **No Docker / no local Supabase stack available here** → migrations, seed, RLS tests,
  integration tests and full e2e runs are authored and CI-wired but must be executed on a
  machine with Docker (`pnpm db:start && pnpm db:reset`) or in CI (Linux runners).
- A hosted Supabase project URL + publishable key were provided; the secret key and DB
  password were **not**, so migrations cannot be pushed to it from here. Apply them with
  `supabase db push` after `supabase link` (see docs/DEPLOYMENT.md).

## Phase log

| Phase | Scope | Status | Verification |
| ----- | ----- | ------ | ------------ |
| 1 | Repo audit, tooling, architecture docs | ✅ done | repo was empty; git init; pnpm install OK |
| 2 | Next.js scaffold, quality gates, design system | ✅ done | typecheck ✅ lint ✅ build ✅ |
| 3 | Supabase schema, migrations, RLS, seed | ✅ authored | 9 migrations + seed written; executable via `supabase db reset` (Docker) / CI — no Docker on this machine |
| 4 | Auth & profiles | ⬜ | |
| 5 | Catalog & campaign pages | ⬜ | |
| 6 | Seller area & campaign wizard | ⬜ | |
| 7 | Compliance engine | ⬜ | |
| 8 | Free entries & skill competitions | ⬜ | |
| 9–10 | Payment abstraction, mock provider, ledger, webhooks, refunds | ⬜ | |
| 11 | Close, snapshot, draw, winner | ⬜ | |
| 12 | Admin & moderation | ⬜ | |
| 13 | Notifications, emails, realtime | ⬜ | |
| 14 | Security, a11y, performance, SEO | ⬜ | |
| 15 | Tests & CI | ⬜ | |
| 16 | Docs & final audit | ⬜ | |

## Decisions taken (see docs/ARCHITECTURE.md §9 for rationale)

- Next 15.5.x, React 19, Tailwind v4, Zod 4.
- pnpm build-script allowlist lives in `pnpm-workspace.yaml` (pnpm 11 syntax).
- Hand-rolled shadcn-style UI kit; custom typed i18n dictionaries (en-GB, en-US).
- Deny-by-default DB-driven compliance engine; append-only ledger; outbox events.

## Outstanding items requiring human validation

Tracked in docs/LEGAL_REVIEW_CHECKLIST.md and docs/PROVIDER_APPROVAL_CHECKLIST.md.
Nothing in this repository constitutes legal compliance; all seeded jurisdiction rules
are `requires_legal_approval = true` and conservative.
