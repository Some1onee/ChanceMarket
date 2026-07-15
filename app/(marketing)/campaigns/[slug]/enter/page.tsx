import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCampaignDetail, getCampaignExtras, getUserCampaignState } from "@/features/campaigns/detail-queries";
import { checkCampaignEligibility, eligibilityReasonMessage } from "@/features/compliance/service";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { EntryFlow } from "@/features/entries/components/entry-flow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatMoneyCompact, isCurrency, money } from "@/lib/money";

export const metadata: Metadata = { title: "Enter campaign", robots: { index: false } };

export default async function EnterCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ route?: string }>;
}) {
  const { slug } = await params;
  const { route } = await searchParams;

  const user = await getSessionUser();
  if (!user) redirect(`/sign-in?next=/campaigns/${slug}/enter`);

  const campaign = await getCampaignDetail(slug);
  if (!campaign) notFound();

  const [extras, userState, eligibility] = await Promise.all([
    getCampaignExtras(campaign.id),
    getUserCampaignState(campaign.id, user.id),
    checkCampaignEligibility(campaign.id),
  ]);

  const supabase = await getSupabaseServerClient();
  const { data: privateDetails } = await supabase
    .from("user_private_details")
    .select("date_of_birth")
    .eq("user_id", user.id)
    .maybeSingle();

  const currency = isCurrency(campaign.currency) ? campaign.currency : "GBP";
  const isOpen =
    campaign.status === "active" &&
    (!campaign.ends_at || new Date(campaign.ends_at) > new Date());

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <Link
        href={`/campaigns/${slug}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden /> Back to campaign
      </Link>

      <div className="mb-8 space-y-1">
        <h1 className="font-display text-2xl font-bold text-balance">{campaign.title}</h1>
        <p className="text-sm text-muted-foreground">
          {campaign.entry_price_minor === 0
            ? "Free entry"
            : `${formatMoneyCompact(money(campaign.entry_price_minor, currency))} per entry`}{" "}
          · prize value {formatMoneyCompact(money(campaign.prize_value_minor, currency))}
        </p>
      </div>

      {!isOpen ? (
        <Alert variant="warning">
          <AlertTitle>Entries are closed</AlertTitle>
          <AlertDescription>This campaign is not currently accepting entries.</AlertDescription>
        </Alert>
      ) : !eligibility.allowed ? (
        <Alert variant="warning">
          <AlertTitle>Not available in your region</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4">
              {[...new Set(eligibility.reasons)].slice(0, 3).map((reason) => (
                <li key={reason}>{eligibilityReasonMessage(reason)}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-md">
          <EntryFlow
            campaign={{
              id: campaign.id,
              slug: campaign.slug,
              title: campaign.title,
              entryPriceMinor: campaign.entry_price_minor,
              currency: campaign.currency,
              minPerOrder: campaign.min_entries_per_order,
              maxPerOrder: campaign.max_entries_per_order,
              maxPerUser: campaign.max_entries_per_user,
              remainingTotal: Math.max(campaign.max_entries_total - campaign.entries_confirmed, 0),
              userConfirmed: userState.confirmedEntries,
              freeRouteEnabled: campaign.free_route_enabled,
              freeRouteInstructions: campaign.free_route_instructions,
              skillRequired: campaign.skill_question_required,
              minAge: campaign.min_age,
              campaignType: campaign.campaign_type,
            }}
            skillQuestion={
              extras.skillQuestion
                ? {
                    id: extras.skillQuestion.id,
                    question: extras.skillQuestion.question,
                    options: [...extras.skillQuestion.skill_question_options]
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((option) => ({ id: option.id, label: option.label })),
                  }
                : null
            }
            initialRoute={route === "free" ? "free" : "paid"}
            hasDateOfBirth={!!privateDetails?.date_of_birth}
          />
        </div>
      )}
    </div>
  );
}
