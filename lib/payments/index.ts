import "server-only";

import type { PaymentProvider } from "@/lib/payments/types";
import { MockPaymentProvider } from "@/lib/payments/mock-provider";

/**
 * Provider registry. Real providers are ONLY constructed when explicitly
 * configured AND ENABLE_REAL_PAYMENTS=true — and must never be added without
 * contractual approval of this activity (docs/PROVIDER_APPROVAL_CHECKLIST.md).
 * Jurisdiction rules additionally constrain which provider may serve which
 * territory (jurisdiction_rules key "allowed_payment_providers").
 */
export function getPaymentProvider(): PaymentProvider {
  const configured = process.env.PAYMENT_PROVIDER ?? "mock";
  const realEnabled = process.env.ENABLE_REAL_PAYMENTS === "true";

  if (configured === "mock") return new MockPaymentProvider();

  if (!realEnabled) {
    throw new Error(
      `PAYMENT_PROVIDER=${configured} requires ENABLE_REAL_PAYMENTS=true. Real providers must not run without explicit opt-in and contractual approval.`,
    );
  }
  throw new Error(
    `Payment provider "${configured}" has no adapter. Implement lib/payments/${configured}-provider.ts behind the PaymentProvider interface after completing docs/PROVIDER_APPROVAL_CHECKLIST.md.`,
  );
}

export function getMockProvider(): MockPaymentProvider {
  return new MockPaymentProvider();
}
