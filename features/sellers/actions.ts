"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { AppError, toActionResult, type ActionResult } from "@/lib/errors";
import { sellerOnboardingSchema } from "@/features/sellers/schema";
import { getIdentityVerificationProvider } from "@/lib/verification/provider";
import { logInfo } from "@/lib/observability/logger";

export async function applyAsSellerAction(input: unknown): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const user = await requireUser();
    const data = sellerOnboardingSchema.parse(input);
    const supabase = await getSupabaseServerClient();

    const { data: existing } = await supabase
      .from("seller_profiles")
      .select("id, status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) {
      throw new AppError("state_conflict", "You already have a seller application on file.");
    }

    const { error } = await supabase.from("seller_profiles").insert({
      user_id: user.id,
      public_name: data.publicName,
      public_bio: data.publicBio || null,
      entity_type: data.entityType,
      business_name: data.entityType === "company" ? data.businessName || null : null,
      country_code: data.countryCode,
      status: "pending",
      terms_accepted_at: new Date().toISOString(),
    });
    if (error) throw new AppError("internal", "Could not submit your application.");

    logInfo("seller_application_submitted", { userId: user.id });
    revalidatePath("/seller");
    return undefined;
  });
}

/**
 * Kick off KYC/KYB with the configured IdentityVerificationProvider.
 * The mock provider auto-verifies in development so the flow is testable
 * end-to-end without a real vendor.
 */
export async function startSellerVerificationAction(): Promise<ActionResult<{ status: string }>> {
  return toActionResult(async () => {
    const user = await requireUser();
    const supabase = await getSupabaseServerClient();

    const { data: seller } = await supabase
      .from("seller_profiles")
      .select("id, entity_type, kyb_status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!seller) throw new AppError("not_found", "Apply as a seller first.");
    if (seller.kyb_status === "verified") return { status: "verified" };

    const provider = getIdentityVerificationProvider();
    const result = await provider.startVerification({
      userId: user.id,
      kind: seller.entity_type === "company" ? "kyb" : "identity",
    });

    return { status: result.status };
  });
}
