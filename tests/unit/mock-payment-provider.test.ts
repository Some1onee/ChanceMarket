import { beforeAll, describe, expect, it } from "vitest";
import { MockPaymentProvider, signMockWebhook } from "@/lib/payments/mock-provider";

beforeAll(() => {
  process.env.PAYMENT_WEBHOOK_SECRET = "test-secret";
});

describe("MockPaymentProvider webhooks", () => {
  const provider = new MockPaymentProvider();

  it("signs and verifies payloads (HMAC-SHA256)", () => {
    const payload = JSON.stringify({ id: "evt_1", type: "payment.succeeded" });
    const signature = signMockWebhook(payload);
    expect(provider.verifyWebhook({ payload, signature })).toBe(true);
  });

  it("rejects tampered payloads", () => {
    const payload = JSON.stringify({ id: "evt_1", type: "payment.succeeded" });
    const signature = signMockWebhook(payload);
    expect(() =>
      provider.verifyWebhook({ payload: payload.replace("succeeded", "failed"), signature }),
    ).toThrow(/invalid webhook signature/);
  });

  it("rejects wrong-length signatures", () => {
    expect(() => provider.verifyWebhook({ payload: "{}", signature: "short" })).toThrow();
  });

  it("parses normalized events", () => {
    const payload = JSON.stringify({
      id: "evt_42",
      type: "payment.failed",
      payment_intent_id: "mock_pi_x",
      amount_minor: 199,
      currency: "GBP",
    });
    const event = provider.parseWebhook({ payload });
    expect(event).toMatchObject({
      id: "evt_42",
      type: "payment.failed",
      paymentIntentId: "mock_pi_x",
      amountMinor: 199,
      currency: "GBP",
    });
  });

  it("declines amounts ending in 99 (deterministic test hook)", () => {
    const declined = provider.buildOutcomeWebhook({
      intentId: "pi_1",
      amountMinor: 199,
      currency: "GBP",
    });
    expect(JSON.parse(declined.payload).type).toBe("payment.failed");

    const approved = provider.buildOutcomeWebhook({
      intentId: "pi_2",
      amountMinor: 200,
      currency: "GBP",
    });
    expect(JSON.parse(approved.payload).type).toBe("payment.succeeded");
    // Each outcome is independently signed and verifiable.
    expect(
      provider.verifyWebhook({ payload: approved.payload, signature: approved.signature }),
    ).toBe(true);
  });
});
