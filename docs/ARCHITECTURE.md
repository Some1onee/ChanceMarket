# ChanceMarket — Architecture

> Status: living document. Last updated: 2026-07-15.

## 1. Overview

ChanceMarket is an international marketplace for prize competitions, free draws and
sweepstakes. Approved sellers list prizes as campaigns; eligible users obtain entries
(paid, free-route, or skill-gated depending on jurisdiction and campaign configuration);
a server-side auditable draw selects a winner at close.

The system is **deny-by-default**: no campaign format is enabled anywhere unless a
database-stored, versioned, legally-flagged jurisdiction rule explicitly allows it.

## 2. Stack

| Layer          | Technology                                                        |
| -------------- | ----------------------------------------------------------------- |
| Frontend       | Next.js 15 (App Router, Server Components), React 19, TypeScript strict |
| Styling        | Tailwind CSS v4, custom shadcn-style component library, Framer Motion |
| Forms          | React Hook Form + Zod (client AND server validation)              |
| Client data    | TanStack Query (only where client-side flows justify it)          |
| Backend        | Supabase: Postgres, Auth, Storage, Realtime, Edge Functions       |
| Payments       | `PaymentProvider` interface; `MockPaymentProvider` shipped; no live provider enabled |
| Email          | `EmailProvider` interface; `log` provider shipped                 |
| Geolocation    | `GeolocationProvider` interface; header-based provider shipped    |
| KYC            | `IdentityVerificationProvider` interface; mock provider shipped   |
| Tests          | Vitest (unit + integration), Playwright (e2e), RLS test suite     |
| CI             | GitHub Actions                                                    |
| Deploy         | Vercel (Next.js) + Supabase (managed)                             |

## 3. Layering

```
Browser (untrusted)
  │  Server Components / Server Actions / Route Handlers
  ▼
Application layer (features/*/actions.ts, features/*/service.ts)
  │  Zod validation → use-case orchestration → authorization → audit
  ▼
Data & policy layer (Supabase)
  │  RLS on every exposed table
  │  SECURITY DEFINER SQL functions for critical transactional operations
  │  (entry confirmation, counters, ledger, draw pipeline, state transitions)
  ▼
Postgres (single source of truth)
```

Rules of the road:

- **The browser never decides eligibility.** UI hints are cosmetic; the same checks are
  re-run in server actions and again inside SQL functions/RLS.
- **Money is integer minor units** (`amount_minor` + `currency`), never floats.
- **Financial writes are append-only** (`financial_ledger`), transactional and idempotent
  (idempotency keys on orders/payments/webhooks).
- **Status changes go through SQL state-machine functions** — no direct `UPDATE ... SET status`.
- **The service-role key exists only server-side** (`lib/supabase/admin.ts`, guarded by
  `server-only`).

## 4. Directory map

```
app/            Route tree: (marketing), (auth), (dashboard), admin, api
components/     ui/ (design system), layout/, marketing/, campaigns/, ...
features/       Domain modules: auth, profiles, sellers, campaigns, entries,
                payments, draws, compliance, geolocation, verification,
                moderation, notifications, disputes, admin, analytics
lib/            supabase/, auth/, payments/, compliance/, security/, validation/,
                money/, dates/, localization/, rate-limit/, audit/, errors/,
                observability/, config (branding)
supabase/       migrations/, functions/ (edge), seed.sql, config.toml
emails/         Versioned transactional templates
tests/          unit/, integration/
e2e/            Playwright specs
docs/           This documentation set
```

Each `features/<domain>` module owns: `schema.ts` (Zod), `queries.ts` (reads),
`actions.ts` (server actions / mutations), `service.ts` (use-cases), `types.ts`.
UI components consume these; they never call Supabase directly.

## 5. Identity & authorization

- Supabase Auth (email+password with confirmation, optional Google).
- `profiles` row auto-created by a `SECURITY DEFINER` trigger on `auth.users`.
- Roles live in `user_roles` (server-managed table, **not** user-editable metadata):
  `user, seller, moderator, compliance, support, finance, admin, super_admin`.
- Authorization is enforced three times: route guards (middleware + layouts),
  server actions (`requireRole`), and RLS policies (`has_role()` helper, `SECURITY DEFINER`,
  fixed `search_path`).

## 6. Compliance engine

Database-driven rule engine (`features/compliance`, `lib/compliance`):

- Territorial hierarchy: global → country → subdivision → excluded zones.
- Tables: `jurisdictions`, `jurisdiction_rules`, `jurisdiction_campaign_types`,
  `jurisdiction_categories`, `legal_rule_versions`, plus decision audit
  (`compliance_decisions`) and `geo_checks`.
- Every rule row carries `requires_legal_approval` and effective/expiry dates.
- Decision function answers: can seller create X? can campaign be shown/entered here?
  is a free route mandatory? which payment provider is allowed? minimum age? KYC tier?
- **Deny by default**: absence of an approved allowing rule ⇒ blocked.
- Publication requires the configuration to be allowed in ≥1 active jurisdiction.

## 7. Entries, payments, draws (critical paths)

- **Entry confirmation** happens inside one SQL transaction
  (`confirm_entry_order()`): eligibility re-check → caps check with row locks →
  counter update → entry issuance → ledger append. Idempotent by order id + key.
- **Payments** flow through the `PaymentProvider` interface. Webhooks are signature-
  verified, recorded in `webhook_events` (unique event id ⇒ replay-proof), processed
  asynchronously via `outbox_events`.
- **Draws**: close entries → settle payments → freeze eligible set → canonical
  snapshot + SHA-256 hash → CSPRNG winner selection (server/edge only) → audit rows →
  winner verification → fulfilment. Re-roll requires reason + dual admin approval and
  is itself audited. Public verification page exposes draw id, snapshot hash, and
  privacy-preserving results.

## 8. Internationalization

- Locales: `en-GB` (default), `en-US`; dictionary files in `lib/localization`.
- Currencies: GBP, USD — minor units only; `Intl.NumberFormat` for display.
- All timestamps stored UTC (`timestamptz`); rendered in the viewer's timezone.
- Official rules are versioned per language (`campaign_rules_versions`).

## 9. Key decisions (ADR summary)

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Next 15.5 (latest 15.x stable) | Mature App Router; team knowledge; Next 16 migration is isolated to config |
| 2 | Hand-rolled shadcn-style UI kit | Full visual control ("strongly customized"), no CLI drift |
| 3 | Custom lightweight i18n dictionaries | 2 locales at launch; avoids heavy dependency; typed keys |
| 4 | Postgres enums for state machines | Statuses are closed sets guarded by transition functions |
| 5 | SQL `SECURITY DEFINER` functions for money/entries/draws | Transactionality + defense-in-depth below the app layer |
| 6 | Outbox pattern for notifications/emails/webhook side-effects | At-least-once delivery without dual-write anomalies |
| 7 | Mock providers behind interfaces (payments, email, KYC, geo) | No real provider may be assumed to allow this activity; swap without redeploying schema |
| 8 | Append-only `financial_ledger` with balance views | Auditable money; totals derived, never hand-edited |
