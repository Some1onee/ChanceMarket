# Threat model

## Assets
Entrant funds & entitlements (entries) · prize items & their handover · draw integrity
(the core trust asset) · PII (DOB, legal names, verification statuses) · seller balances
& payouts · platform reputation & the audit trail itself.

## Actors
Anonymous visitors · registered entrants · sellers · staff (moderator, compliance,
support, finance, admin, super_admin) · payment/KYC providers · infrastructure operators.

## Trust boundaries
Browser ⇄ Next server (untrusted → validated) · Next server ⇄ Supabase (anon-key + RLS vs
service-key paths) · platform ⇄ payment/KYC webhooks (signature-verified) · staff UI ⇄
privileged actions (role + justification + audit).

## Scenarios & mitigations

| # | Scenario | Mitigations |
| --- | --- | --- |
| 1 | **Draw manipulation** (insider or attacker re-rolls / picks a winner) | Selection only via SQL function with CSPRNG; idempotent (re-run returns same winner); snapshot + entries immutable by trigger; re-draw demands reason + two distinct admins, recorded publicly; audit log append-only. |
| 2 | **Double spend / oversell** (buy more entries than exist) | Campaign row lock in create/confirm; reservations counted in caps; final cap re-check at confirmation; unique entry numbers; concurrency integration test. |
| 3 | **Double credit** (replayed webhook confirms twice) | Unique `(provider, event_id)`; idempotent confirm; unique ledger idempotency keys. |
| 4 | **Participant fraud** (multi-account, cap evasion) | Per-user caps in SQL; one online free-route per user; rate limits; risk_flags for manual review; DOB required. |
| 5 | **Geo circumvention** (VPN, false declarations) | Server-side IP headers vs declared profile; mismatch ⇒ deny + review flag + geo_check record; deny-by-default jurisdictions; residence proof escalation path. |
| 6 | **Seller fraud** (fake/undelivered/counterfeit prize) | KYC/KYB + manual approval; ownership documents; human moderation; funds held until confirmed receipt; fulfilment states; disputes; reports. |
| 7 | **Skill-answer extraction** | Answers in a service-only table (no RLS policy at all); grading server-side; 5-attempt cap; never serialized to the client. |
| 8 | **Privilege escalation** | Roles in a server-managed table (no client INSERT/UPDATE policy); role grants super_admin-only with justification; RLS tests attack this. |
| 9 | **Account takeover** | Password policy, confirmation emails, session revocation ("sign out others"), rate-limited auth, opaque credential errors. Backlog: staff 2FA. |
| 10 | **KYC falsification** | Verification delegated to provider; only statuses stored; re-verification triggers configurable; compliance review states. |
| 11 | **Refund abuse / chargebacks** | Refunds gated by finance role + justification; partial refund caps vs refundable balance; disputes mark transactions; reserves supported in ledger model. |
| 12 | **Admin abuse** | Least-privilege roles; justification (≥10 chars) recorded for every sensitive action; dual approval for re-draws; immutable admin_actions/audit_logs; read-only patterns for non-super roles. |
| 13 | **Log/audit tampering** | Append-only triggers on audit_logs, admin_actions, ledger, consents, decisions, snapshots; DB-level, not app-level. |
| 14 | **Prize theft (fulfilment)** | Tracked fulfilment states, proof uploads (private bucket), winner confirmation gate before payout release. |
| 15 | **PII exposure** | PII split into `user_private_details`; staff reads scoped to compliance; hashed IPs; masked winner announcements; export/delete flows. |
| 16 | **Payment data exposure** | No card data ever touches the app (provider-hosted); logger redaction; PCI scope stays with the provider. |

## Residual risks (accepted for MVP, tracked)
In-memory rate limiting per instance · no staff 2FA yet · CSP inline scripts ·
no automated document malware scanning · postal free-route processing is manual by design.
