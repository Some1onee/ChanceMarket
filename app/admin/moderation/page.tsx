import type { Metadata } from "next";
import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ModerationControls } from "@/features/admin/components/controls";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatMoneyCompact, isCurrency, money } from "@/lib/money";

export const metadata: Metadata = { title: "Moderation queue", robots: { index: false } };

export default async function ModerationPage() {
  const supabase = await getSupabaseServerClient();

  const { data: cases } = await supabase
    .from("moderation_cases")
    .select(
      "*, campaigns(id, title, slug, status, campaign_type, entry_price_minor, prize_value_minor, currency, free_route_enabled, skill_question_required, seller_profiles(public_name, kyb_status))",
    )
    .in("status", ["pending", "escalated"])
    .order("created_at");

  const rows = (cases ?? []) as unknown as Array<{
    id: string;
    status: string;
    risk_score: number;
    created_at: string;
    campaigns: {
      id: string;
      title: string;
      slug: string;
      status: string;
      campaign_type: string;
      entry_price_minor: number;
      prize_value_minor: number;
      currency: string;
      free_route_enabled: boolean;
      skill_question_required: boolean;
      seller_profiles: { public_name: string; kyb_status: string } | null;
    } | null;
  }>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Moderation queue</h1>
      {rows.length === 0 ? (
        <EmptyState icon={<CheckCheck aria-hidden />} title="Queue is clear" description="No campaigns are waiting for review." />
      ) : (
        <ul className="space-y-4">
          {rows.map((item) => (
            <li key={item.id} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">{item.campaigns?.title}</h2>
                <Badge variant={item.risk_score > 50 ? "destructive" : item.risk_score > 25 ? "warning" : "neutral"}>
                  Risk {item.risk_score}
                </Badge>
                <Badge variant="info" className="capitalize">
                  {item.campaigns?.campaign_type.replaceAll("_", " ")}
                </Badge>
                {item.campaigns?.free_route_enabled ? <Badge variant="accent">Free route</Badge> : null}
                {item.campaigns?.skill_question_required ? <Badge variant="neutral">Skill Q</Badge> : null}
              </div>
              <p className="mb-1 text-sm text-muted-foreground">
                Seller: {item.campaigns?.seller_profiles?.public_name} (KYB:{" "}
                {item.campaigns?.seller_profiles?.kyb_status}) · Prize{" "}
                {item.campaigns
                  ? formatMoneyCompact(
                      money(
                        item.campaigns.prize_value_minor,
                        isCurrency(item.campaigns.currency) ? item.campaigns.currency : "GBP",
                      ),
                    )
                  : ""}{" "}
                · Entry{" "}
                {item.campaigns
                  ? item.campaigns.entry_price_minor === 0
                    ? "free"
                    : formatMoneyCompact(
                        money(
                          item.campaigns.entry_price_minor,
                          isCurrency(item.campaigns.currency) ? item.campaigns.currency : "GBP",
                        ),
                      )
                  : ""}
              </p>
              <p className="mb-4 text-xs text-muted-foreground">
                Submitted {new Date(item.created_at).toLocaleString()} ·{" "}
                <Link href={`/campaigns/${item.campaigns?.slug}`} className="underline underline-offset-2" target="_blank">
                  preview listing
                </Link>
              </p>
              {item.campaigns ? (
                <ModerationControls caseId={item.id} campaignId={item.campaigns.id} />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
