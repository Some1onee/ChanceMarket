# Testing

## Layers

| Layer | Tool | Location | Needs |
| --- | --- | --- | --- |
| Unit | Vitest (jsdom) | `tests/unit/` | nothing |
| Integration | Vitest (node, serial) | `tests/integration/` | local Supabase + env |
| E2E | Playwright (desktop + Pixel 7) | `e2e/` | local Supabase + dev server |
| RLS | part of integration | `tests/integration/rls.test.ts` | same |

## Unit (`pnpm test`)

Money arithmetic/fees/formatting · date/countdown/age logic · mock-provider webhook
signing/verification/deterministic declines · wizard draft/submit schema invariants ·
error-code → HTTP mapping · **pinned draw-verification formulas** (winner position from
seed — including the seeded demo vector — and canonical snapshot hashing). If SQL formulas
ever change, these tests fail first: update both together, deliberately.

## Integration (`pnpm test:integration`)

```bash
pnpm db:start && pnpm db:reset
# From `pnpm exec supabase status`:
$env:SUPABASE_TEST_URL="http://127.0.0.1:54321"
$env:SUPABASE_TEST_ANON_KEY="<anon>"
$env:SUPABASE_TEST_SECRET_KEY="<service_role>"
pnpm test:integration
```

Covers: RLS multi-identity matrix (anon/user/cross-user/staff/service), IDOR attempts,
role self-grant rejection, skill-answer secrecy, direct status-flip rejection,
territorial deny (US user on GB-only format), skill gating + attempt flow, order
idempotency, **concurrency oversell guard** (two 3-entry orders on a 5-cap campaign →
exactly one succeeds; repeated confirms never exceed the cap), close→snapshot→select
idempotence, snapshot tamper rejection, and the seeded public draw re-verified from the
recorded seed. Tests are skipped (not failed) when the env is absent.

## E2E (`pnpm test:e2e`)

Requires the seeded local stack + `.env.local` pointing at it (plus `CM_DEV_GEO=GB` so a
local visitor resolves to GB). Playwright starts `pnpm dev` itself.

Scenarios: sign-up → confirmation screen; sign-in/out; wrong password; protected-route
redirects; admin allowed / standard user rejected on `/admin`; open-redirect neutralised;
home + catalogue + URL-synced filters + category filter; campaign detail (price, value,
progress, rules, seller, countdown, free route); completed campaign → public draw
verification; winners page; free-draw entry end-to-end; paid entry with wrong-then-right
skill answer and mock payment; free-route request; the full serial lifecycle
seller-wizard → moderation approval → public visibility → participant entry → admin close
& draw → winner verification → public record; refunds. Both desktop and mobile projects.

## CI

`.github/workflows/ci.yml`: job 1 (format, lint, typecheck, unit, build, prod audit) and
job 2 (supabase start + **db reset re-applying all migrations**, integration, build
against the stack, Playwright with report artifact on failure). The pipeline fails on any
error.

## Conventions

Integration/e2e rely on seeded UUIDs from `supabase/seed.sql` (stable by design). New
tests must be idempotent per `db reset` (create their own campaigns with random slugs, or
use fresh idempotency keys). Never point tests at production: helpers read only
`SUPABASE_TEST_*` variables.
