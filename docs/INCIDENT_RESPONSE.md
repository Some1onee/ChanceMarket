# Incident response

## Severity

- **SEV1** — draw integrity in question, funds at risk, PII breach, full outage.
- **SEV2** — payments degraded, webhooks failing, admin unavailable.
- **SEV3** — partial feature failure, elevated errors, single-campaign issues.

## First moves (any SEV)

1. Appoint an incident lead; open a timeline doc (UTC timestamps).
2. Stabilize with the narrowest lever available:
   - `ENABLE_PAID_ENTRIES=false` — stops new paid entries platform-wide.
   - `ENABLE_FREE_ENTRIES=false` — stops free routes.
   - Pause a single campaign: `transition_campaign_status(id, 'paused', reason)`.
   - Deactivate a jurisdiction (justified, audited) for territory-scoped issues.
3. Preserve evidence: `audit_logs`, `admin_actions`, `webhook_events`, `outbox_events`,
   `compliance_decisions` are append-only — do not "clean up" anything.

## Playbooks

**Draw integrity challenged (SEV1)** — Freeze fulfilment for the draw; pull the public
record + `audit_logs` for it; recompute the winning position from seed+snapshot
(`tests/unit/draw-verification.test.ts` formulas). If the result stands: publish the
verification walk-through. If not: controlled re-draw (reason + two admins) and a public
statement on the draw page — the superseded draw stays visible.

**Payment provider outage (SEV2)** — Entries fail closed (orders stay
`awaiting_payment`, reservations expire in 15 min — no stock leak). Consider
`ENABLE_PAID_ENTRIES=false` + a status banner. On recovery, `webhook_events` replays are
safe by design.

**Webhook signature failures** — Check for secret rotation mismatch; never bypass
verification; replay provider events once the secret is fixed.

**PII exposure (SEV1)** — Contain (revoke keys/sessions), scope via logs (correlation
ids), assess notification duties with counsel (72 h GDPR clock), rotate
`APP_ENCRYPTION_KEY`+secrets, document.

**Fraud ring** — `risk_flags` the accounts, restrict via account_status (justified),
exclude entries pre-snapshot via `entries.status='excluded'` (with audit) if rules allow,
never after a snapshot exists.

**Runaway cron / duplicate schedulers** — Safe: every pipeline step is idempotent and
lock-guarded. Disable one scheduler, verify counts, resume.

## Post-incident

Blameless review within 5 working days: timeline, root cause, user impact,
what limited/could have limited blast radius; convert actions into issues; update this
document and the threat model.
