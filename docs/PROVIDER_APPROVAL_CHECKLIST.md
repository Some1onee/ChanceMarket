# Provider approval checklist

No external provider goes live on assumption. One checklist per provider, kept with the
contract. The adapter may be merged, but its env credentials must not be set until this
is complete.

## Payment provider
- [ ] **Written confirmation** (contract or signed rider — not a sales email) that
      prize competitions / sweepstakes / raffles are an accepted business activity.
- [ ] Approved jurisdiction list — mirrored into `jurisdiction_rules
      .allowed_payment_providers` per territory.
- [ ] MCC / vertical classification agreed; volume expectations declared.
- [ ] Marketplace/split-payment model approved (platform fee + seller settlement),
      payout scheme for sellers (KYB'd sub-accounts or equivalent).
- [ ] Reserve/rolling-reserve terms understood and modelled in the ledger.
- [ ] Chargeback handling: evidence requirements, dispute webhooks mapped to
      `dispute.created`.
- [ ] Refund API semantics (partial, multiple, time limits) match `refundTransaction()`.
- [ ] Webhook signature scheme implemented in the adapter's `verifyWebhook` (timing-safe),
      event ids stable for replay protection.
- [ ] Idempotency key support on intents/refunds/payouts.
- [ ] PCI scope confirmation: card data never touches our servers (hosted fields/checkout).
- [ ] Sandbox test plan run: success, decline, refund, dispute, payout, replay.
- [ ] `ENABLE_REAL_PAYMENTS` flag procedure agreed (who flips it, when, rollback).

## Email provider
- [ ] Transactional-only stream separated from marketing; suppression list handling.
- [ ] SPF/DKIM/DMARC configured for the sending domain.
- [ ] Adapter respects `notification_preferences`; unsubscribe handling for marketing.

## KYC / identity provider
- [ ] Coverage for required checks: identity, age, KYB, proof of residence.
- [ ] Documents retained BY THE PROVIDER; we store references/statuses only.
- [ ] Webhook/callback security reviewed; statuses mapped to `verification_status`.
- [ ] Data-processing agreement + retention schedule aligned with Privacy Policy.

## Geolocation provider
- [ ] Accuracy/coverage acceptable for eligibility decisions in target territories.
- [ ] Server-side only; no client SDK deciding eligibility.
- [ ] IP handling contractually compatible with our hashed-storage policy.

Sign-off: engineering ______  compliance ______  finance ______  date ______
