# Draws

## Pipeline (all server-side, all idempotent)

1. **Close** — `close_campaign_entries()`: status → `closing`, unpaid orders cancelled,
   reservations released. Triggered by the scheduler at `ends_at`, on sell-out, or by an
   admin ("Close & draw now", justification required).
2. **Settle** — the pipeline defers while any related payment is `created/processing`;
   the next scheduler run retries.
3. **Freeze** — `create_draw_snapshot()`: confirmed entries copied into `draw_entries`
   with positions ordered by entry number; `snapshot_hash = SHA-256("position:entry_id"
   lines joined by \n)`; current rules version recorded. Snapshot + entries are immutable
   (DB triggers reject UPDATE/DELETE).
4. **Select** — `select_draw_winner()`: 16 bytes from pgcrypto's CSPRNG;
   `seed_hash = SHA-256(seed)` recorded;
   **winning position = (first 8 seed bytes as sign-masked uint64) mod N + 1**.
   Modulo bias is < 2⁻⁵⁰ for N ≤ 10⁶ — negligible and documented. Re-running the function
   on a selected draw returns the SAME result: silent re-rolls are impossible.
   Never `Math.random()`, never in a browser.
5. **Verify** — compliance confirms the provisional winner's eligibility
   (`winner_verifications`), then `confirm_draw_winner()` opens `prize_fulfilments`.
   An ineligible/unresponsive winner (14 days per template rules) goes to the re-draw
   procedure.
6. **Publish** — `/draws/[publicId]` shows: snapshot hash, entries count, revealed seed,
   seed hash, winning position, timestamps, and any re-draw lineage. Personal data is
   masked; entrants match their own positions from their receipts.

## Re-draws (strictly controlled)

`reroll_draw(draw, reason ≥ 10 chars, approver1, approver2)` — two **distinct** admins
(CHECK constraint + SQL validation), original draw kept public with status `rerolled` and
its reason, new draw reuses the SAME immutable snapshot, everything lands in
`admin_actions` + `audit_logs`. Exposed only through the admin UI's dual-approval dialog.

## Public verifiability — and its honest limits

Anyone can recompute `position = uint64(seed[0:8]) mod N + 1` and check the seed hash.
This proves the published result matches the recorded seed and the frozen snapshot; it
does **not** prove the seed wasn't chosen adversarially before publication (a
commit-reveal with a public beacon — e.g. drand — would; the `selection_method =
'external_seed'` column reserves that path). We deliberately do not market this as
"provably fair" beyond what it actually guarantees.

## Scheduling

- Vercel Cron: `/api/cron/close-campaigns` every 10 min (Bearer `CRON_SECRET`).
- Or Supabase Edge Function `close-campaigns` with pg_cron + `net.http_post`.
- Both paths call the same SQL functions and can run concurrently safely (idempotent,
  row-locked).
