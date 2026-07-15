import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getVisitorLocation } from "@/lib/compliance/geo";
import { getSessionUser } from "@/lib/auth/session";
import { getClientIpHash } from "@/lib/rate-limit";
import { logError, logWarn } from "@/lib/observability/logger";

/**
 * Compliance decision service. The browser never decides eligibility: this
 * runs server-side, and the same checks run AGAIN inside SQL functions at
 * order time. Deny-by-default throughout.
 */

export type EligibilityResult = {
  allowed: boolean;
  reasons: string[];
  /** Location the decision was based on. */
  countryCode: string | null;
  subdivisionCode: string | null;
  /** True when IP location and declared profile country disagree. */
  locationMismatch: boolean;
};

/** Resolve the effective location: IP headers first, profile declaration as
 * fallback, mismatch flagged for review. */
export async function resolveEffectiveLocation(): Promise<{
  countryCode: string | null;
  subdivisionCode: string | null;
  locationMismatch: boolean;
}> {
  const [ipLocation, user] = await Promise.all([getVisitorLocation(), getSessionUser()]);
  const declaredCountry = user?.countryCode ?? null;
  const declaredSubdivision = user?.subdivisionCode ?? null;

  const countryCode = ipLocation.countryCode ?? declaredCountry;
  const subdivisionCode =
    ipLocation.countryCode !== null
      ? (ipLocation.subdivisionCode ??
        (ipLocation.countryCode === declaredCountry ? declaredSubdivision : null))
      : declaredSubdivision;

  const locationMismatch =
    ipLocation.countryCode !== null &&
    declaredCountry !== null &&
    ipLocation.countryCode !== declaredCountry;

  return { countryCode, subdivisionCode, locationMismatch };
}

export async function checkCampaignEligibility(
  campaignId: string,
  quantity = 1,
): Promise<EligibilityResult> {
  const supabase = await getSupabaseServerClient();
  const { countryCode, subdivisionCode, locationMismatch } = await resolveEffectiveLocation();

  const { data, error } = await supabase.rpc("check_entry_eligibility", {
    p_campaign_id: campaignId,
    p_country_code: countryCode ?? "",
    p_subdivision_code: subdivisionCode,
    p_quantity: quantity,
  });

  if (error) {
    logError("eligibility_rpc_failed", error, { campaignId });
    return {
      allowed: false,
      reasons: ["eligibility_check_failed"],
      countryCode,
      subdivisionCode,
      locationMismatch,
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const reasons = [...(row?.reasons ?? [])];
  let allowed = row?.allowed ?? false;

  if (locationMismatch) {
    // Conservative: mismatches block paid entry until reviewed/proven.
    allowed = false;
    reasons.push("location_mismatch_requires_review");
  }

  return { allowed, reasons, countryCode, subdivisionCode, locationMismatch };
}

/**
 * Record a geo check + compliance decision for auditing. Uses the service
 * client (tables are service-write-only). Soft-fails when the secret key is
 * absent (e.g. local dev without secrets) — the DENY behaviour above does not
 * depend on this audit write.
 */
export async function recordEntryComplianceDecision(params: {
  campaignId: string;
  userId: string;
  result: EligibilityResult;
}): Promise<string | null> {
  try {
    const admin = getSupabaseAdminClient();
    const ipHash = await getClientIpHash();

    const { data: geo } = await admin
      .from("geo_checks")
      .insert({
        user_id: params.userId,
        country_code: params.result.countryCode,
        subdivision_code: params.result.subdivisionCode,
        ip_hash: ipHash,
        method: "ip_headers",
        is_consistent: !params.result.locationMismatch,
        flagged_reason: params.result.locationMismatch ? "ip_vs_declared_mismatch" : null,
      })
      .select("id")
      .single();

    await admin.from("compliance_decisions").insert({
      subject_type: "entry",
      subject_id: params.campaignId,
      user_id: params.userId,
      campaign_id: params.campaignId,
      decision: params.result.allowed ? "allow" : "deny",
      reasons: params.result.reasons,
      rule_snapshot: {
        country: params.result.countryCode,
        subdivision: params.result.subdivisionCode,
      },
    });

    return geo?.id ?? null;
  } catch (error) {
    logWarn("compliance_audit_write_skipped", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}

/** Human-readable messages for eligibility reason codes. */
export function eligibilityReasonMessage(reason: string): string {
  const messages: Record<string, string> = {
    campaign_not_active: "This campaign is not currently open for entries.",
    campaign_not_started: "This campaign has not started yet.",
    campaign_ended: "This campaign has closed.",
    location_unknown:
      "We could not determine your location. Set your country in your account profile.",
    jurisdiction_not_enabled: "This service is not yet available in your territory.",
    campaign_type_not_allowed_in_jurisdiction:
      "This kind of campaign is not available in your territory.",
    category_not_allowed_in_jurisdiction: "This prize category is not available in your territory.",
    entry_price_exceeds_jurisdiction_cap: "This entry price is not permitted in your territory.",
    free_route_required_but_missing: "This campaign is missing a required free entry route.",
    region_excluded_by_campaign: "The seller has excluded your region from this campaign.",
    region_not_in_campaign_allow_list: "This campaign is limited to specific regions.",
    location_mismatch_requires_review:
      "Your detected location does not match your profile country. Update your profile or contact support.",
    eligibility_check_failed: "We could not verify eligibility. Please try again.",
    invalid_quantity: "Invalid quantity.",
  };
  return messages[reason] ?? "Not available in your region.";
}
