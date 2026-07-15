import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import type { Currency } from "@/lib/config/brand";
import type {
  PaymentIntent,
  PaymentProvider,
  PayoutResult,
  RefundResult,
  SellerAccount,
  WebhookEvent,
} from "@/lib/payments/types";

/**
 * MockPaymentProvider — a complete, deterministic provider for development
 * and tests. No card data ever touches the application.
 *
 * Deterministic failure hook: any amount whose minor units end in 99 fails
 * at confirmation (e.g. £1.99 → declined). Everything else succeeds.
 *
 * Webhooks are HMAC-SHA256 signed with PAYMENT_WEBHOOK_SECRET, exactly like a
 * real provider, and delivered to /api/webhooks/payment.
 */

function secret(): string {
  return process.env.PAYMENT_WEBHOOK_SECRET ?? "dev-webhook-secret-change-me";
}

export function signMockWebhook(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async createCustomer(params: { userId: string }): Promise<{ customerId: string }> {
    return { customerId: `mock_cus_${params.userId.slice(0, 8)}` };
  }

  async createPaymentIntent(params: {
    customerId: string | null;
    amountMinor: number;
    currency: Currency;
    idempotencyKey: string;
    metadata: Record<string, string>;
  }): Promise<PaymentIntent> {
    return {
      id: `mock_pi_${randomUUID()}`,
      provider: this.name,
      clientSecret: null,
      status: "created",
      amountMinor: params.amountMinor,
      currency: params.currency,
    };
  }

  async confirmPayment(params: { intentId: string }): Promise<PaymentIntent> {
    // Status is resolved by the webhook; confirm just flips to processing.
    return {
      id: params.intentId,
      provider: this.name,
      clientSecret: null,
      status: "processing",
      amountMinor: 0,
      currency: "GBP",
    };
  }

  async cancelPayment(params: { intentId: string }): Promise<PaymentIntent> {
    return {
      id: params.intentId,
      provider: this.name,
      clientSecret: null,
      status: "cancelled",
      amountMinor: 0,
      currency: "GBP",
    };
  }

  async refundPayment(_params: {
    intentId: string;
    amountMinor: number;
    idempotencyKey: string;
  }): Promise<RefundResult> {
    return { id: `mock_re_${randomUUID()}`, status: "succeeded" };
  }

  async createSellerAccount(params: { sellerId: string }): Promise<SellerAccount> {
    return { id: `mock_acct_${params.sellerId.slice(0, 8)}`, status: "enabled", onboardingUrl: null };
  }

  async getSellerAccountStatus(params: { accountId: string }): Promise<SellerAccount> {
    return { id: params.accountId, status: "enabled", onboardingUrl: null };
  }

  async createPayout(): Promise<PayoutResult> {
    return { id: `mock_po_${randomUUID()}`, status: "paid" };
  }

  verifyWebhook(params: { payload: string; signature: string }): boolean {
    const expected = signMockWebhook(params.payload);
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(params.signature, "utf8");
    if (a.length !== b.length) throw new Error("invalid webhook signature");
    if (!timingSafeEqual(a, b)) throw new Error("invalid webhook signature");
    return true;
  }

  parseWebhook(params: { payload: string }): WebhookEvent {
    const body = JSON.parse(params.payload) as Record<string, unknown>;
    return {
      id: String(body.id ?? ""),
      type: body.type as WebhookEvent["type"],
      paymentIntentId: (body.payment_intent_id as string | undefined) ?? null,
      refundId: (body.refund_id as string | undefined) ?? null,
      payoutId: (body.payout_id as string | undefined) ?? null,
      amountMinor: (body.amount_minor as number | undefined) ?? null,
      currency: (body.currency as string | undefined) ?? null,
      raw: body,
    };
  }

  /** Simulate the provider's async outcome for an intent (used in dev/tests). */
  buildOutcomeWebhook(params: {
    intentId: string;
    amountMinor: number;
    currency: string;
  }): { payload: string; signature: string } {
    const declined = params.amountMinor % 100 === 99;
    const payload = JSON.stringify({
      id: `mock_evt_${randomUUID()}`,
      type: declined ? "payment.failed" : "payment.succeeded",
      payment_intent_id: params.intentId,
      amount_minor: params.amountMinor,
      currency: params.currency,
      failure_reason: declined ? "card_declined_test_amount" : undefined,
      created_at: new Date().toISOString(),
    });
    return { payload, signature: signMockWebhook(payload) };
  }
}
