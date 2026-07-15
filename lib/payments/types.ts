import type { Currency } from "@/lib/config/brand";

/**
 * Provider-agnostic payment abstraction. No real provider is enabled by
 * default; adapters must only be added once the provider has CONTRACTUALLY
 * approved prize-competition activity in the targeted jurisdictions
 * (docs/PROVIDER_APPROVAL_CHECKLIST.md).
 */

export type PaymentIntent = {
  id: string;
  provider: string;
  clientSecret: string | null;
  status: "created" | "requires_action" | "processing" | "succeeded" | "failed" | "cancelled";
  amountMinor: number;
  currency: Currency;
};

export type RefundResult = {
  id: string;
  status: "pending" | "succeeded" | "failed";
};

export type SellerAccount = {
  id: string;
  status: "pending" | "enabled" | "restricted";
  onboardingUrl: string | null;
};

export type PayoutResult = {
  id: string;
  status: "pending" | "processing" | "paid" | "failed";
};

export type WebhookEvent = {
  /** Provider-unique event id — used for replay protection. */
  id: string;
  type:
    | "payment.succeeded"
    | "payment.failed"
    | "payment.cancelled"
    | "payment.requires_action"
    | "refund.succeeded"
    | "refund.failed"
    | "payout.paid"
    | "payout.failed"
    | "dispute.created";
  paymentIntentId: string | null;
  refundId: string | null;
  payoutId: string | null;
  amountMinor: number | null;
  currency: string | null;
  raw: Record<string, unknown>;
};

export interface PaymentProvider {
  readonly name: string;

  createCustomer(params: { userId: string; email: string }): Promise<{ customerId: string }>;

  createPaymentIntent(params: {
    customerId: string | null;
    amountMinor: number;
    currency: Currency;
    idempotencyKey: string;
    metadata: Record<string, string>;
  }): Promise<PaymentIntent>;

  confirmPayment(params: { intentId: string }): Promise<PaymentIntent>;

  cancelPayment(params: { intentId: string }): Promise<PaymentIntent>;

  refundPayment(params: {
    intentId: string;
    amountMinor: number;
    reason: string;
    idempotencyKey: string;
  }): Promise<RefundResult>;

  createSellerAccount(params: { sellerId: string; countryCode: string }): Promise<SellerAccount>;

  getSellerAccountStatus(params: { accountId: string }): Promise<SellerAccount>;

  createPayout(params: {
    accountId: string;
    amountMinor: number;
    currency: Currency;
    idempotencyKey: string;
  }): Promise<PayoutResult>;

  /** Verify the webhook signature. Throws on invalid signatures. */
  verifyWebhook(params: { payload: string; signature: string }): boolean;

  /** Parse a verified webhook payload into a normalized event. */
  parseWebhook(params: { payload: string }): WebhookEvent;
}
