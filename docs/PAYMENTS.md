# Payments

## Architecture

```
Entry flow (server action)
  → create_entry_order()            SQL: caps/eligibility/idempotency + reservation
  → startPaidOrderCheckout()        service: PaymentProvider.createPaymentIntent
  → provider webhook (signed)       → /api/webhooks/payment
  → ingestPaymentWebhook()          verify sig → store event (unique) → process
      payment.succeeded → confirm_entry_order() + ledger + notification
      payment.failed    → cancel_entry_order() + notification
```

Everything after the webhook is idempotent: replayed events are no-ops, ledger rows carry
unique idempotency keys, `confirm_entry_order` returns unchanged when already confirmed.

## The PaymentProvider interface

`lib/payments/types.ts` — `createCustomer, createPaymentIntent, confirmPayment,
cancelPayment, refundPayment, createSellerAccount, getSellerAccountStatus, createPayout,
verifyWebhook, parseWebhook`. Adapters are constructed exclusively through
`getPaymentProvider()`.

### MockPaymentProvider (shipped, default)
- Full implementation for development, demos and tests.
- Deterministic outcomes: **minor amounts ending in 99 decline**, everything else succeeds.
- Emits HMAC-SHA256-signed webhooks (`PAYMENT_WEBHOOK_SECRET`) through the same route a
  real provider would use — the settlement path is identical.

### Real providers — hard requirements
1. **Contractual approval**: the provider must explicitly approve prize-competition /
   sweepstakes activity for each target jurisdiction. Do **not** integrate on the
   assumption that standard terms allow it — most PSPs restrict this vertical.
   Complete `docs/PROVIDER_APPROVAL_CHECKLIST.md` first.
2. `ENABLE_REAL_PAYMENTS=true` + `PAYMENT_PROVIDER=<name>` + credentials — otherwise the
   registry throws.
3. Per-jurisdiction allow-list via `jurisdiction_rules` key `allowed_payment_providers`
   so a provider only serves territories it accepted.
4. Implement the adapter file behind the interface; nothing else changes (route, service,
   ledger, statuses are provider-agnostic).

## Status machines

Payment: `created → requires_action → processing → succeeded → partially_refunded →
refunded / disputed` (guarded by a DB trigger). Payout: `pending → held → approved →
processing → paid / failed / reversed`.

## Ledger

Append-only `financial_ledger`. Per successful entry payment:
`entry_payment` +gross (seller) · `platform_fee` −fee (seller) · `platform_fee` +fee
(platform). Refunds append negative seller rows. `platform_fees` configures bp + fixed per
campaign (default 1000 bp). `seller_balances` is a cache recomputed from the ledger —
never hand-edited. Reserves/chargebacks use `reserve_hold/release`, `chargeback`,
`payout_reversal` entry types.

## Refunds

`refundTransaction()` (finance role + justification via admin UI): provider refund →
`refunds` row → transaction refunded/partially_refunded → negative ledger row → balance
refresh → user notification. Campaign cancellation before a draw refunds all confirmed
paid orders in full (operational runbook in OPERATIONS.md).

## Never

Card data in the app · secrets in client bundles · financial writes from the browser ·
a real provider without contractual approval · manual edits to ledger or balances.
