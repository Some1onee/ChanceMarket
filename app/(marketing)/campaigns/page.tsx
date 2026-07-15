import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { CatalogFilters } from "@/features/campaigns/components/catalog-filters";
import { CatalogPagination } from "@/features/campaigns/components/catalog-pagination";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { CampaignListItem } from "@/components/campaigns/campaign-list-item";
import { EmptyState } from "@/components/ui/empty-state";
import {
  listActiveCategories,
  listPublicCampaigns,
  type CampaignFilters,
} from "@/features/campaigns/queries";
import { getDictionary } from "@/lib/localization/dictionaries";
import { getLocale } from "@/lib/localization/locale";
import type { CampaignType } from "@/lib/supabase/database.types";

export const metadata: Metadata = {
  title: "Browse competitions",
  description:
    "Live prize competitions, free draws and sweepstakes from verified sellers. Filter by category, entry price and closing date.",
};

const PAGE_SIZE = 12;

const VALID_TYPES: CampaignType[] = [
  "paid_prize_competition",
  "free_draw",
  "sweepstakes",
  "hybrid_paid_with_free_route",
  "skill_based_competition",
];

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const t = getDictionary(locale);

  const typeParam = first(params.type);
  const filters: CampaignFilters = {
    q: first(params.q),
    category: first(params.category),
    type: VALID_TYPES.includes(typeParam as CampaignType) ? (typeParam as CampaignType) : undefined,
    status: first(params.status) === "ended" ? "ended" : "open",
    sort: (first(params.sort) as CampaignFilters["sort"]) ?? "ending_soon",
    page: Math.max(Number.parseInt(first(params.page) ?? "1", 10) || 1, 1),
    pageSize: PAGE_SIZE,
  };
  const view = first(params.view) === "list" ? "list" : "grid";

  const [{ campaigns, total }, categories] = await Promise.all([
    listPublicCampaigns(filters),
    listActiveCategories(),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Browse competitions</h1>
        <p className="text-muted-foreground">
          {total.toLocaleString(locale)} {filters.status === "ended" ? "completed" : "open"}{" "}
          {total === 1 ? "campaign" : "campaigns"}. Availability depends on your region — we always
          tell you before you enter.
        </p>
      </div>

      <div className="mb-8">
        <CatalogFilters categories={categories} view={view} />
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={<SearchX aria-hidden />}
          title={t.common.noResults}
          description="Try removing a filter or searching for something broader."
        />
      ) : view === "list" ? (
        <div className="flex flex-col gap-4">
          {campaigns.map((campaign) => (
            <CampaignListItem
              key={campaign.id}
              campaign={campaign}
              locale={locale}
              dictionary={t}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign, index) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              locale={locale}
              dictionary={t}
              priority={index < 3}
            />
          ))}
        </div>
      )}

      <CatalogPagination page={filters.page ?? 1} pageSize={PAGE_SIZE} total={total} />
    </div>
  );
}
