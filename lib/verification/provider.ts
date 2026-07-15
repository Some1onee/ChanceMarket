import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { VerificationStatus } from "@/lib/supabase/database.types";
import { logInfo, logWarn } from "@/lib/observability/logger";

/**
 * IdentityVerificationProvider abstraction (KYC / KYB / age / residence).
 * Documents are held by the provider, never by this application — we store
 * only references, statuses and minimal result summaries.
 */

export type VerificationKind = "identity" | "age" | "kyb" | "residence";

export type VerificationRequest = {
  userId: string;
  kind: VerificationKind;
};

export type VerificationResult = {
  providerRef: string | null;
  status: VerificationStatus;
  /** Provider-hosted URL for the user to complete verification, if any. */
  redirectUrl?: string;
};

export interface IdentityVerificationProvider {
  readonly name: string;
  startVerification(request: VerificationRequest): Promise<VerificationResult>;
  getStatus(providerRef: string): Promise<VerificationStatus>;
}

/**
 * Mock provider: records the verification and auto-verifies. Development and
 * demo environments only — selected via KYC_PROVIDER=mock.
 */
class MockIdentityVerificationProvider implements IdentityVerificationProvider {
  readonly name = "mock";

  async startVerification(request: VerificationRequest): Promise<VerificationResult> {
    const providerRef = `mock_kyc_${crypto.randomUUID()}`;
    try {
      const admin = getSupabaseAdminClient();
      await admin.from("identity_verifications").insert({
        user_id: request.userId,
        provider: this.name,
        provider_ref: providerRef,
        kind: request.kind,
        status: "verified",
        result_summary: { mock: true },
      });
      if (request.kind === "kyb" || request.kind === "identity") {
        await admin
          .from("seller_profiles")
          .update({ kyb_status: "verified" })
          .eq("user_id", request.userId);
      }
      if (request.kind === "identity" || request.kind === "age") {
        await admin
          .from("profiles")
          .update(
            request.kind === "identity"
              ? { identity_status: "verified" }
              : { age_status: "verified" },
          )
          .eq("id", request.userId);
      }
      logInfo("mock_verification_completed", { kind: request.kind });
    } catch (error) {
      logWarn("mock_verification_persist_skipped", {
        reason: error instanceof Error ? error.message : "unknown",
      });
      return { providerRef, status: "pending" };
    }
    return { providerRef, status: "verified" };
  }

  async getStatus(): Promise<VerificationStatus> {
    return "verified";
  }
}

export function getIdentityVerificationProvider(): IdentityVerificationProvider {
  const provider = process.env.KYC_PROVIDER ?? "mock";
  switch (provider) {
    case "mock":
      return new MockIdentityVerificationProvider();
    default:
      // Real vendors (Onfido, Sumsub, Persona…) implement the same interface.
      throw new Error(
        `KYC provider "${provider}" is not implemented. Set KYC_PROVIDER=mock or add an adapter in lib/verification/provider.ts.`,
      );
  }
}
