import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CampaignRow,
  CampaignImageRow,
  CategoryRow,
  CampaignRulesVersionRow,
  CampaignEligibilityRegionRow,
  CampaignQuestionRow,
  DrawRow,
  SkillQuestionRow,
  SkillQuestionOptionRow,
} from "@/lib/supabase/database.types";
import { logError } from "@/lib/observability/logger";
import type { PublicCampaign } from "@/features/campaigns/queries";

export type CampaignDetail = CampaignRow & {
  categories: Pick<CategoryRow, "slug" | "name"> | null;
  campaign_images: CampaignImageRow[];
  seller_profiles: {
    id: string;
    public_name: string;
    public_bio: string | null;
    status: string;
    kyb_status: string;
    country_code: string;
    created_at: string;
  } | null;
};

export async function getCampaignDetail(slug: string): Promise<CampaignDetail | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select(
      "*, categories(slug, name), campaign_images(*), seller_profiles(id, public_name, public_bio, status, kyb_status, country_code, created_at)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    logError("campaign_detail_failed", error, { slug });
    return null;
  }
  return (data as unknown as CampaignDetail) ?? null;
}

export async function getCampaignExtras(campaignId: string): Promise<{
  rules: CampaignRulesVersionRow | null;
  regions: CampaignEligibilityRegionRow[];
  questions: CampaignQuestionRow[];
  draw: DrawRow | null;
  skillQuestion: (SkillQuestionRow & { skill_question_options: SkillQuestionOptionRow[] }) | null;
}> {
  const supabase = await getSupabaseServerClient();
  const [rulesRes, regionsRes, questionsRes, drawRes, skillRes] = await Promise.all([
    supabase
      .from("campaign_rules_versions")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("is_current", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("campaign_eligibility_regions").select("*").eq("campaign_id", campaignId),
    supabase
      .from("campaign_questions")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("is_public", true)
      .not("answer", "is", null)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("draws")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("skill_questions")
      .select("*, skill_question_options(*)")
      .eq("campaign_id", campaignId)
      .eq("is_current", true)
      .maybeSingle(),
  ]);

  return {
    rules: rulesRes.data ?? null,
    regions: regionsRes.data ?? [],
    questions: questionsRes.data ?? [],
    draw: drawRes.data ?? null,
    skillQuestion:
      (skillRes.data as unknown as SkillQuestionRow & {
        skill_question_options: SkillQuestionOptionRow[];
      }) ?? null,
  };
}

export async function getSimilarCampaigns(
  campaignId: string,
  categoryId: string,
  limit = 3,
): Promise<PublicCampaign[]> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("campaigns")
    .select(
      "*, categories(slug, name), campaign_images(storage_path, alt_text, sort_order, is_cover)",
    )
    .eq("category_id", categoryId)
    .eq("status", "active")
    .neq("id", campaignId)
    .limit(limit);
  return (data ?? []) as unknown as PublicCampaign[];
}

export async function getUserCampaignState(campaignId: string, userId: string | null) {
  if (!userId) return { isFavourite: false, confirmedEntries: 0 };
  const supabase = await getSupabaseServerClient();
  const [{ data: fav }, { count }] = await Promise.all([
    supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("campaign_id", campaignId)
      .maybeSingle(),
    supabase
      .from("entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("campaign_id", campaignId)
      .eq("status", "confirmed"),
  ]);
  return { isFavourite: !!fav, confirmedEntries: count ?? 0 };
}
