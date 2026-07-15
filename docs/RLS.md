# Row Level Security

RLS is enabled on **every** table. No permissive catch-all policies exist; tables without
policies (service-only) deny all client access. Policies live next to their tables in the
migrations; automated multi-identity tests are in `tests/integration/rls.test.ts`.

## Principles

1. **Deny by default** — enabling RLS with no policy blocks anon & authenticated.
2. **Owner scope** — `user_id = (select auth.uid())` for personal rows.
3. **Staff scope** — `is_staff()` / `is_admin()` / `has_role()` SECURITY DEFINER helpers
   (fixed `search_path`, EXECUTE granted only to `authenticated`).
4. **No client status flips** — campaign/payment/seller statuses change only through
   SQL functions; UPDATE policies' WITH CHECK clauses pin status columns.
5. **service_role only** for: `skill_question_answers`, `entry_reservations`,
   `webhook_events`, `outbox_events`, jurisdiction writes, role grants, ledger writes.

## Matrix (summary)

| Table | anon | user | seller | staff | notes |
| --- | --- | --- | --- | --- | --- |
| campaigns | published lifecycle states | same | + own drafts (insert/update draft-only) | all | status pinned by WITH CHECK |
| campaign_images / rules / regions | public campaigns | same | + own (write while draft) | all | |
| campaign_documents | — | — | own | read | never public |
| skill_questions / options | public campaigns | same | own | all | |
| **skill_question_answers** | — | — | — | — | service only |
| skill_responses | — | own | — | read | correctness graded in SQL |
| entry_orders / entries | — | own | own campaigns' | read | inserts only via functions |
| free_entry_requests | — | own (+insert) | own campaigns' | read | processing via service |
| profiles | — | own (read/update, status pinned) | — | read | |
| user_roles | — | own read | — | admin read | **writes: service only** |
| user_private_details | — | own | — | compliance/admin read | |
| user_protection_settings | — | own | — | compliance read | loosening gated in action layer |
| payment_transactions / refunds | — | own read | — | finance/admin | writes: service |
| financial_ledger | — | — | — | finance/admin read | append-only + trigger |
| seller_balances / payouts | — | — | own read | finance/admin | |
| draws / draw_snapshots | read | read | read | read | public verification |
| draw_entries | — | — | own campaigns' | read | entry↔user mapping protected |
| winner_verifications / prize_fulfilments | — | own | own campaigns' (fulfilments) | read/write | |
| notifications / preferences | — | own | — | — | realtime-published |
| reports / disputes / support | — | own (+insert) | — | handle | |
| audit_logs / admin_actions | — | — | — | admin read | immutable triggers |
| jurisdictions / jct / jc | read (active/UI needs) | read | read | read | writes: service |
| jurisdiction_rules / legal texts | — | — | — | staff read | |
| compliance_decisions / geo_checks | — | own read | — | compliance | insert: service |
| feature_flags | read | read | read | read | writes: service |

## Storage policies

- `avatars`, `campaign-images`: public read; writes restricted to the `<auth.uid()>/…`
  folder (campaign images additionally require an approved seller profile).
- `campaign-documents`, `fulfilment-proofs`: no public read; owner-folder read/write plus
  staff read; access via signed URLs.

## Testing

`pnpm test:integration` (with a seeded local stack) covers: anon restrictions, cross-user
IDOR on orders/profiles, role self-grant rejection, skill-answer secrecy across roles,
direct status-flip rejection, draw-mapping privacy, audit-log confinement. Extend this
suite whenever a policy changes — a policy without a test is a regression waiting to ship.
