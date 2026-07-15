import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/marketing/section";
import { formatDate } from "@/lib/dates";
import { getLocale } from "@/lib/localization/locale";

export const metadata: Metadata = {
  title: "Winners",
  description: "Completed draws with public, privacy-preserving verification records.",
};

export default async function WinnersPage() {
  const locale = await getLocale();
  const supabase = await getSupabaseServerClient();

  const { data: draws } = await supabase
    .from("draws")
    .select("id, public_id, status, selected_at, campaigns(title, slug, prize_value_minor, currency)")
    .in("status", ["selected", "winner_verified"])
    .order("selected_at", { ascending: false })
    .limit(30);

  const rows = (draws ?? []) as unknown as Array<{
    id: string;
    public_id: string;
    status: string;
    selected_at: string | null;
    campaigns: { title: string; slug: string } | null;
  }>;

  return (
    <Section
      eyebrow="Results"
      title="Recent winners"
      description="Every completed draw publishes a verification record: the frozen entry snapshot hash, the selection seed, and the winning position. Personal details stay private."
    >
      {rows.length === 0 ? (
        <EmptyState
          icon={<Trophy aria-hidden />}
          title="No completed draws yet"
          description="Winners appear here as soon as campaigns close and draws run."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((draw) => (
            <li key={draw.id} className="rounded-xl border border-border bg-card p-5 shadow-xs">
              <div className="mb-3 flex items-center justify-between">
                <Badge variant={draw.status === "winner_verified" ? "success" : "info"}>
                  {draw.status === "winner_verified" ? "Winner verified" : "Winner pending verification"}
                </Badge>
                {draw.selected_at ? (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(draw.selected_at, locale)}
                  </span>
                ) : null}
              </div>
              <h2 className="mb-2 font-semibold">
                <Link
                  href={`/campaigns/${draw.campaigns?.slug ?? ""}`}
                  className="hover:text-primary hover:underline"
                >
                  {draw.campaigns?.title ?? "Campaign"}
                </Link>
              </h2>
              <Link
                href={`/draws/${draw.public_id}`}
                className="verification-strip block hover:border-primary"
              >
                {draw.public_id} — view verification
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
