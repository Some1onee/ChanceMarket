# Database model

Postgres 17 (Supabase). Nine migrations in `supabase/migrations/`, applied in order.
Every table has `created_at` (and `updated_at` + trigger where mutable), UUID PKs,
FK/UNIQUE/CHECK constraints, and RLS enabled (see docs/RLS.md).

## Domains & tables

### Identity (00002)
| Table | Purpose |
| --- | --- |
| `profiles` | Public-safe user data (display name, country, locale, statuses). Auto-created by `handle_new_user()` trigger on signup. |
| `user_roles` | Server-managed roles (`user…super_admin`). Never client-writable — the anti-privilege-escalation boundary. |
| `user_private_details` | PII: legal name, DOB (age checks), phone. Owner + compliance read only. |
| `user_consents` | Append-only consent history (immutability trigger). |
| `user_protection_settings` | Spend limits, pause, self-exclusion — enforced inside `create_entry_order()`. |
| `identity_verifications` | KYC/KYB references & statuses only; documents stay with the provider. |
| `seller_profiles` | Seller identity, entity type, status, public name/bio; status changes server-side only. |

### Compliance (00003) — deny-by-default
`jurisdictions` (GLOBAL→country→subdivision), `jurisdiction_campaign_types` (format
allowances + free-route/skill/age/price caps, effective windows), `jurisdiction_categories`,
`jurisdiction_rules` (versioned JSON rules, immutable versions), `legal_rule_versions`,
`compliance_decisions` (append-only decision audit), `geo_checks` (hashed IPs only),
`risk_flags`, `feature_flags`.

### Catalogue (00004)
`categories`, `campaigns` (state machine column + counters + caps + CHECKs, e.g. free
formats must be price 0), `campaign_images`, `campaign_documents` (private),
`campaign_rules_versions` (per-language, versioned), `campaign_eligibility_regions`
(allow/deny), `campaign_questions`, `favorites`, `moderation_cases`.

### Entries (00005)
`skill_questions` / `skill_question_options` / **`skill_question_answers` (no client
policies — service only)** / `skill_responses`, `entry_orders` (idempotency key unique per
user), `entry_reservations` (15-min stock holds), `entries` (unique
`(campaign_id, entry_number)`), `free_entry_requests`.

### Finance (00006)
`payment_customers`, `payment_transactions` (status machine trigger, unique idempotency
key), `refunds`, **`financial_ledger` (append-only, immutability trigger, unique
idempotency keys)**, `seller_balances` (cache derived from the ledger via
`refresh_seller_balance()`), `payouts`, `platform_fees`, `webhook_events` (unique
`(provider, event_id)` ⇒ replay-proof), `outbox_events`.

### Draws (00007)
`draws` (public id, seed + seed hash, reroll lineage with dual-approver CHECK),
`draw_snapshots` (+hash, immutable), `draw_entries` (frozen positions, immutable),
`winner_verifications`, `prize_fulfilments` (12-state handover machine).

### Operations (00008)
`audit_logs` (immutable), `admin_actions` (immutable, justification ≥10 chars, distinct
second approver CHECK), `notifications` (+realtime publication), `notification_preferences`,
`reports`, `disputes`, `support_threads` / `support_messages`.

### Storage (00009)
Buckets: `avatars` (public), `campaign-images` (public), `campaign-documents` (private),
`fulfilment-proofs` (private). Paths namespaced `<user_id>/…` so policies bind on folder 1;
MIME allow-lists and size limits at the bucket level.

## Key functions (SECURITY DEFINER, fixed `search_path`)

| Function | Contract |
| --- | --- |
| `handle_new_user()` | Signup trigger: profile + `user` role + protection settings. |
| `has_role / is_staff / is_admin` | Role checks used by RLS policies. |
| `check_entry_eligibility(campaign, country, subdivision, qty)` | Territorial deny-by-default answer + reason codes. |
| `create_entry_order(...)` | Idempotent; locks the campaign; validates account status, protections, age, eligibility, quantity bounds, per-user & total caps (incl. live reservations), skill answer; reserves stock. |
| `confirm_entry_order(order, payment?)` | Idempotent; owner may confirm only zero-total orders; re-checks caps under lock; issues sequential entry numbers; flips `sold_out`. |
| `cancel_entry_order`, `release_expired_reservations` | Cleanup paths. |
| `submit_skill_response(question, option)` | Grades against the service-only answers table; 5-attempt cap. |
| `transition_campaign_status(campaign, status, reason)` | The ONLY way to change campaign status; validates the transition matrix + role rules; audits. |
| `close_campaign_entries` → `create_draw_snapshot` → `select_draw_winner` → `confirm_draw_winner` | The draw pipeline (docs/DRAWS.md). All idempotent. |
| `reroll_draw(draw, reason, approver1, approver2)` | Controlled re-draw: distinct admins enforced in SQL. |
| `record_ledger_entry(...)` | Idempotent append to the ledger (service only). |
| `enqueue_notification(...)` | Notification row + outbox event in one call. |

## Conventions

- Timestamps `timestamptz` UTC; render in the viewer's timezone.
- Money = `bigint` minor units + `text` currency, everywhere.
- Enums for closed state machines; `text + CHECK` for evolving sets.
- Counters (`entries_confirmed`) are only mutated inside locked SQL functions.
- Regenerate TS types with `pnpm db:types` after schema changes.
