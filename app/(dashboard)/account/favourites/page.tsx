import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import type { PublicCampaign } from "@/features/campaigns/queries";
import { getDictionary } from "@/lib/localization/dictionaries";
import { getLocale } from "@/lib/localization/locale";

export const metadata: Metadata = { title: "Favourites" };

export default async function FavouritesPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase
    .from("favorites")
    .select(
      "id, campaigns(*, categories(slug, name), campaign_images(storage_path, alt_text, sort_order, is_cover))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const campaigns = (data ?? [])
    .map((row) => (row as unknown as { campaigns: PublicCampaign | null }).campaigns)
    .filter((c): c is PublicCampaign => c !== null);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Favourites</h2>
      {campaigns.length === 0 ? (
        <EmptyState
          icon={<Heart aria-hidden />}
          title="No favourites yet"
          description="Tap the heart on any campaign to keep an eye on it here."
          action={
            <Button asChild>
              <Link href="/campaigns">Browse competitions</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} locale={locale} dictionary={t} />
          ))}
        </div>
      )}
    </div>
  );
}
