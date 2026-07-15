# Application security

## Layered enforcement

Every critical rule is enforced at least three times:
UI (cosmetic) → middleware/layout guards → **server actions** (Zod + session + role) →
**SQL functions & RLS** (final authority, under row locks). The browser never decides
eligibility, price, status, or randomness.

## Controls in place

| Area | Implementation |
| --- | --- |
| AuthN | Supabase Auth (email+confirmation, optional Google), HttpOnly cookies via @supabase/ssr, session refresh in middleware, global/others sign-out. |
| AuthZ | `user_roles` table (server-managed), `requireRole()` in every admin action, `has_role()` in RLS, admin layout guard. Roles never live in user-editable metadata. |
| CSRF | Server Actions use Next's origin-bound POST protections; no state-changing GET routes (cron GETs are bearer-token protected & idempotent). |
| Input validation | Zod on the client AND in every server action; SQL CHECK constraints behind that. |
| Output encoding | React escaping; the only `dangerouslySetInnerHTML` are the theme boot script (static) and JSON-LD (serialized from server data). |
| Headers | CSP (self + Supabase origins, `frame-ancestors 'none'`), HSTS, nosniff, referrer-policy, permissions-policy, X-Frame-Options DENY. |
| Rate limiting | Fixed-window per hashed IP on auth, entries, questions, reports (swap store for Redis in multi-instance deploys). |
| Anti-bot | Rate limits + server-side validation now; CAPTCHA hook points at sign-up/entry when needed (extensible by design). |
| Idempotency | Client-generated keys per entry flow; unique keys on orders, payments, ledger; webhook events unique per provider id. |
| Uploads | Bucket MIME allow-lists + size caps, owner-folder paths with unguessable UUID names, private buckets for documents, orphan deletion on image removal. Antivirus scanning: interface point documented in OPERATIONS. |
| IDOR | RLS ownership scopes; server actions re-verify ownership (`requireOwnedDraft` etc.); integration tests attack these paths. |
| Injection | PostgREST parameterization; no string-built SQL in app code; SECURITY DEFINER functions pin `search_path`. |
| Open redirects | `next` params sanitized (`/` prefix, no `//`). |
| Secrets | Service key/API secrets server-only (`server-only` imports make client bundling a build error); logger redacts sensitive keys; no secrets in the repo. |
| Errors | Central AppError → structured results; unexpected errors log with correlation id and return opaque messages. |
| Webhooks | HMAC verification (timing-safe), size cap, replay-proof event table, idempotent processing, 500-on-failure for provider retries. |
| Outbox | Critical side-effects (notifications→email) go through `outbox_events` with backoff — no dual-write loss. |
| Logs | Structured JSON, secret/IP redaction, correlation ids; IPs stored only as salted hashes in `geo_checks`. |
| Dependencies | `pnpm audit --prod --audit-level high` in CI; lockfile committed. |

## Cryptography

- Draw randomness: `pgcrypto gen_random_bytes(16)` inside the database transaction.
- Snapshot integrity: SHA-256 over the canonical ordered entry list.
- Webhook signatures: HMAC-SHA256, timing-safe comparison.
- IP privacy: SHA-256 with server salt (`APP_ENCRYPTION_KEY`).

## Known gaps / hardening backlog

- CSP still allows `'unsafe-inline'` scripts (Next bootstrap) — move to nonces.
- Rate limiting is in-memory per instance — move to Redis/Upstash for horizontal scale.
- Add TOTP/passkeys as a second factor for staff accounts before production.
- Add automated malware scanning on document uploads.
