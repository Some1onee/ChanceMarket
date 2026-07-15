# Operations runbook

## Daily/weekly checks

- `/api/health` (wire to uptime monitoring; alert on non-200).
- `webhook_events` where `status='failed'` — investigate before retrying (idempotent).
- `outbox_events` `failed` with `attempts >= 8` — dead letters; fix cause, reset
  `status='pending', attempts=0`.
- Campaigns stuck in `closing` — usually payments still settling or zero eligible
  entries (`no_eligible_entries` needs a manual decision: cancel + refund, per rules).
- `risk_flags` open items; moderation/report/dispute queue ages.

## Routine tasks

| Task | How |
| --- | --- |
| Approve a seller | Admin → Sellers (justification recorded). |
| Moderate campaigns | Admin → Moderation: approve / request changes / reject. |
| Close early / force draw | Admin → Campaigns → "Close & draw now". |
| Verify a winner | Admin → Draws → Verify winner (compliance role). |
| Re-draw | Admin → Draws → Re-draw: reason + second admin email; public record keeps lineage. |
| Refund | Admin → Payments → Refund (finance role, partial allowed). |
| Cancel a campaign pre-draw | transition to `cancelled` (service/SQL), then refund every confirmed paid order via the refund flow; notify entrants (outbox). Runbook script recommended before v1. |
| Activate a territory | ONLY after counsel sign-off → Admin → Jurisdictions (justified, audited). |
| Loosen a user's spend limit | Support flow after the 24 h cooling-off — service-side update + admin_action entry. |
| Account deletion completion | Profiles `closed` → after statutory retention, purge PII (`user_private_details`, auth user) via service script, keep financial/draw records. |

## Metrics worth dashboards

Payments: success rate, failure reasons, webhook processing lag, refund/chargeback rates.
Draws: campaigns closed/day, time close→selection, re-draw count (should be ~0).
Fraud: geo mismatches, risk flags, per-user cap rejections. Product: entries/day,
free-route share, seller conversion. Infra: outbox backlog, cron latency, error rate by
correlation id.

## Backups & restore

Supabase PITR/daily backups. Restore drill quarterly: restore to a fresh project,
`supabase db push` is a no-op if migrations match, run integration suite against it.
The append-only tables (ledger, audit, snapshots) make partial recovery auditable.

## Scaling notes

Rate limiter → Redis when running multiple regions/instances. Catalogue queries are
index-backed; add read replicas before denormalizing. Draw pipeline is lock-serialized
per campaign — safe under horizontal scale.

## Upload hygiene

Bucket MIME/size limits enforce the first line; if malware scanning is required, add a
storage webhook → scanner → quarantine flow (interface point: campaign_documents.status).
