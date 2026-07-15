import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CampaignRow,
  CampaignImageRow,
  CategoryRow,
  CampaignType,
} from "@/lib/supabase/database.types";
import { logError } from "@/lib/observability/logger";

export type PublicCampaign = CampaignRow & {
  categories: Pick<CategoryRow, "slug" | "name"> | null;
  campaign_images: Pick<CampaignImageRow, "storage_path" | "alt_text" | "sort_order" | "is_cover">[];
};

export type CampaignFilters = {
  q?: string;
  category?: string;
  type?: CampaignType;
  minPrice?: number;
  maxPrice?: number;
  country?: string;
  sort?: "ending_soon" | "newest" | "price_asc" | "price_desc" | "progress";
  status?: "open" | "ended";
  page?: number;
  pageSize?: number;
};

const PUBLIC_STATUSES = ["active", "sold_out", "closing"] as const;
const ENDED_STATUSES = [
  "drawing",
  "winner_pending",
  "winner_confirmed",
  "fulfilment",
  "completed",
] as const;

const CARD_SELECT =
  "*, categories(slug, name), campaign_images(storage_path, alt_text, sort_order, is_cover)";

/**
 * Public catalogue query. RLS already restricts rows to published campaigns;
 * filters here are UX, not security. Region visibility is applied by the
 * caller via the compliance engine.
 */
export async function listPublicCampaigns(
  filters: CampaignFilters = {},
): Promise<{ campaigns: PublicCampaign[]; total: number }> {
  const supabase = await getSupabaseServerClient();
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 12, 1), 48);

  let query = supabase
    .from("campaigns")
    .select(CARD_SELECT, { count: "exact" })
    .in("status", filters.status === "ended" ? [...ENDED_STATUSES] : [...PUBLIC_STATUSES]);

  if (filters.q) {
    const term = filters.q.replaceAll("%", "\\%").replaceAll(",", " ");
    query = query.or(`title.ilike.%${term}%,summary.ilike.%${term}%`);
  }
  if (filters.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.category)
      .maybeSingle();
    if (cat) query = query.eq("category_id", cat.id);
  }
  if (filters.type) query = query.eq("campaign_type", filters.type);
  if (filters.minPrice !== undefined) query = query.gte("entry_price_minor", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("entry_price_minor", filters.maxPrice);

  switch (filters.sort) {
    case "newest":
      query = query.order("published_at", { ascending: false, nullsFirst: false });
      break;
    case "price_asc":
      query = query.order("entry_price_minor", { ascending: true });
      break;
    case "price_desc":
      query = query.order("entry_price_minor", { ascending: false });
      break;
    case "progress":
      query = query.order("entries_confirmed", { ascending: false });
      break;
    case "ending_soon":
    default:
      query = query.order("ends_at", { ascending: true, nullsFirst: false });
      break;
  }

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);

  if (error) {
    logError("list_campaigns_failed", error);
    return { campaigns: [], total: 0 };
  }
  return { campaigns: (data ?? []) as unknown as PublicCampaign[], total: count ?? 0 };
}

export async function getFeaturedCampaigns(limit = 6): Promise<PublicCampaign[]> {
  const { campaigns } = await listPublicCampaigns({ sort: "progress", pageSize: limit });
  return campaigns;
}

export async function getEndingSoonCampaigns(limit = 4): Promise<PublicCampaign[]> {
  const { campaigns } = await listPublicCampaigns({ sort: "ending_soon", pageSize: limit });
  return campaigns.filter((c) => c.ends_at && new Date(c.ends_at) > new Date());
}

export async function getCampaignBySlug(slug: string): Promise<PublicCampaign | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select(CARD_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    logError("get_campaign_failed", error, { slug });
    return null;
  }
  return (data as unknown as PublicCampaign) ?? null;
}

export async function listActiveCategories(): Promise<CategoryRow[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) {
    logError("list_categories_failed", error);
    return [];
  }
  return data ?? [];
}
