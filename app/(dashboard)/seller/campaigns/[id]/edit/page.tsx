import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSellerWizardOptions } from "@/features/compliance/seller-options";
import { CampaignWizard } from "@/features/campaigns/components/wizard/campaign-wizard";
import type { WizardDraftInput } from "@/features/campaigns/wizard-schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Edit campaign" };

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const RULES_TEMPLATE = `# Official rules (TEMPLATE — requires legal review)

1. The promoter is the seller named on the campaign page, trading on the platform.
2. Entry routes, pricing and the closing date are shown on the campaign page.
3. Where a free entry route applies, free entries carry identical winning chances.
4. Entrants must meet the minimum age and residency requirements.
5. The winner is selected after close by an auditable server-side draw; the draw record is public.
6. If the provisional winner is ineligible or unreachable for 14 days, a replacement draw from the same snapshot may occur.
7. Cancellation before the draw refunds all paid entries in full.

*This document is a template pending review by qualified local counsel.*`;

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await getSupabaseServerClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*, seller_profiles!inner(user_id)")
    .eq("id", id)
    .maybeSingle();

  const row = campaign as unknown as
    (NonNullable<typeof campaign> & { seller_profiles: { user_id: string } }) | null;
  if (!row || row.seller_profiles.user_id !== user.id) notFound();
  if (!["draft", "changes_requested"].includes(row.status)) redirect("/seller");

  const [options, imagesRes, regionsRes, rulesRes, skillRes] = await Promise.all([
    getSellerWizardOptions(),
    supabase.from("campaign_images").select("*").eq("campaign_id", id).order("sort_order"),
    supabase.from("campaign_eligibility_regions").select("*").eq("campaign_id", id),
    supabase
      .from("campaign_rules_versions")
      .select("content_md")
      .eq("campaign_id", id)
      .eq("is_current", true)
      .maybeSingle(),
    supabase
      .from("skill_questions")
      .select("question, skill_question_options(label, sort_order)")
      .eq("campaign_id", id)
      .eq("is_current", true)
      .maybeSingle(),
  ]);

  const defaults: WizardDraftInput = {
    campaignType: row.campaign_type,
    categoryId: row.category_id,
    title: row.title === "Untitled campaign" ? "" : row.title,
    summary: row.summary ?? "",
    description: row.description ?? "",
    prizeValueMajor: Math.max(Math.round(row.prize_value_minor / 100), 1),
    currency: (row.currency as "GBP" | "USD") ?? "GBP",
    entryPriceMinor: row.entry_price_minor,
    minEntriesPerOrder: row.min_entries_per_order,
    maxEntriesPerOrder: row.max_entries_per_order,
    maxEntriesPerUser: row.max_entries_per_user,
    maxEntriesTotal: row.max_entries_total,
    freeRouteEnabled: row.free_route_enabled,
    freeRouteInstructions: row.free_route_instructions ?? "",
    skillQuestionRequired: row.skill_question_required,
    minAge: row.min_age,
    startsAt: toLocalInput(row.starts_at),
    endsAt: toLocalInput(row.ends_at),
    locationCountry: row.location_country ?? "",
    locationRegion: row.location_region ?? "",
    deliveryPolicy: row.delivery_policy ?? "",
    rulesMd: rulesRes.data?.content_md ?? RULES_TEMPLATE,
  };

  const skill = skillRes.data as unknown as {
    question: string;
    skill_question_options: { label: string; sort_order: number }[];
  } | null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold">
          {row.status === "changes_requested" ? "Update your campaign" : "Create a campaign"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Drafts autosave. Nothing is public until moderation approves the campaign.
        </p>
      </div>

      {row.status === "changes_requested" && row.rejection_reason ? (
        <Alert variant="warning">
          <AlertTitle>Moderation requested changes</AlertTitle>
          <AlertDescription>{row.rejection_reason}</AlertDescription>
        </Alert>
      ) : null}

      {options.allowedTypes.length === 0 ? (
        <Alert variant="destructive">
          <AlertTitle>No campaign formats are currently enabled</AlertTitle>
          <AlertDescription>
            No active jurisdiction permits any campaign type yet. An administrator must configure
            and legally approve territory rules before campaigns can be created.
          </AlertDescription>
        </Alert>
      ) : (
        <CampaignWizard
          campaignId={row.id}
          userId={user.id}
          defaults={defaults}
          images={imagesRes.data ?? []}
          regions={(regionsRes.data ?? []).map((region) => ({
            countryCode: region.country_code,
            subdivisionCode: region.subdivision_code ?? "",
            mode: region.mode as "allow" | "deny",
          }))}
          skillQuestion={
            skill
              ? {
                  question: skill.question,
                  options: [...skill.skill_question_options]
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((option) => option.label),
                }
              : null
          }
          allowedTypes={options.allowedTypes}
          categories={options.allowedCategories}
          activeJurisdictions={options.activeJurisdictions}
        />
      )}
    </div>
  );
}
