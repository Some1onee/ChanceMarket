import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { CampaignType, CategoryRow } from "@/lib/supabase/database.types";

/**
 * Derive the choices a seller is ALLOWED to make in the campaign wizard from
 * the jurisdiction engine. The wizard never offers configurations that no
 * active jurisdiction permits — deny-by-default at authoring time too.
 */

export type AllowedTypeOption = {
  campaignType: CampaignType;
  freeRouteMandatory: boolean;
  skillRequired: boolean;
  minAge: number;
  maxEntryPriceMinor: number | null;
  jurisdictions: string[];
};

export type SellerWizardOptions = {
  allowedTypes: AllowedTypeOption[];
  allowedCategories: CategoryRow[];
  activeJurisdictions: { id: string; countryCode: string; name: string }[];
};

export async function getSellerWizardOptions(): Promise<SellerWizardOptions> {
  const supabase = await getSupabaseServerClient();

  const [{ data: jurisdictions }, { data: jctRows }, { data: jcRows }, { data: categories }] =
    await Promise.all([
      supabase.from("jurisdictions").select("id, country_code, name").eq("is_active", true),
      supabase
        .from("jurisdiction_campaign_types")
        .select("*")
        .eq("is_allowed", true)
        .lte("effective_from", new Date().toISOString()),
      supabase.from("jurisdiction_categories").select("*").eq("is_allowed", true),
      supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
    ]);

  const activeIds = new Set((jurisdictions ?? []).map((j) => j.id));
  const jurisdictionName = new Map((jurisdictions ?? []).map((j) => [j.id, j.name]));

  // Aggregate type allowances across active jurisdictions (still in force).
  const byType = new Map<CampaignType, AllowedTypeOption>();
  for (const row of jctRows ?? []) {
    if (!activeIds.has(row.jurisdiction_id)) continue;
    if (row.effective_until && new Date(row.effective_until) <= new Date()) continue;
    const existing = byType.get(row.campaign_type);
    const name = jurisdictionName.get(row.jurisdiction_id) ?? row.jurisdiction_id;
    if (!existing) {
      byType.set(row.campaign_type, {
        campaignType: row.campaign_type,
        freeRouteMandatory: row.free_route_mandatory,
        skillRequired: row.skill_required,
        minAge: row.min_age,
        maxEntryPriceMinor: row.max_entry_price_minor,
        jurisdictions: [name],
      });
    } else {
      // Conservative aggregation: strictest constraints win.
      existing.freeRouteMandatory = existing.freeRouteMandatory || row.free_route_mandatory;
      existing.skillRequired = existing.skillRequired || row.skill_required;
      existing.minAge = Math.max(existing.minAge, row.min_age);
      if (row.max_entry_price_minor !== null) {
        existing.maxEntryPriceMinor =
          existing.maxEntryPriceMinor === null
            ? row.max_entry_price_minor
            : Math.min(existing.maxEntryPriceMinor, row.max_entry_price_minor);
      }
      existing.jurisdictions.push(name);
    }
  }

  const allowedCategoryIds = new Set(
    (jcRows ?? [])
      .filter((row) => activeIds.has(row.jurisdiction_id))
      .map((row) => row.category_id),
  );

  return {
    allowedTypes: [...byType.values()],
    allowedCategories: (categories ?? []).filter((category) => allowedCategoryIds.has(category.id)),
    activeJurisdictions: (jurisdictions ?? []).map((j) => ({
      id: j.id,
      countryCode: j.country_code,
      name: j.name,
    })),
  };
}

/**
 * Publishability check: a campaign configuration must be allowed in at least
 * one ACTIVE jurisdiction. Returns the failing reasons when not.
 */
export async function checkCampaignPublishable(params: {
  campaignType: CampaignType;
  categoryId: string;
  entryPriceMinor: number;
  freeRouteEnabled: boolean;
  skillQuestionRequired: boolean;
}): Promise<{ publishable: boolean; reasons: string[]; matchedJurisdictions: string[] }> {
  const options = await getSellerWizardOptions();
  const reasons: string[] = [];

  const typeOption = options.allowedTypes.find((t) => t.campaignType === params.campaignType);
  if (!typeOption) {
    return {
      publishable: false,
      reasons: ["campaign_type_not_allowed_anywhere"],
      matchedJurisdictions: [],
    };
  }
  if (!options.allowedCategories.some((category) => category.id === params.categoryId)) {
    reasons.push("category_not_allowed_anywhere");
  }
  if (
    typeOption.maxEntryPriceMinor !== null &&
    params.entryPriceMinor > typeOption.maxEntryPriceMinor
  ) {
    reasons.push("entry_price_exceeds_all_caps");
  }
  if (typeOption.freeRouteMandatory && params.entryPriceMinor > 0 && !params.freeRouteEnabled) {
    reasons.push("free_route_mandatory");
  }
  if (typeOption.skillRequired && params.entryPriceMinor > 0 && !params.skillQuestionRequired) {
    reasons.push("skill_question_mandatory");
  }

  return {
    publishable: reasons.length === 0,
    reasons,
    matchedJurisdictions: typeOption.jurisdictions,
  };
}
