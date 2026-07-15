import type { MetadataRoute } from "next";
import { brand } from "@/lib/config/brand";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/campaigns",
    "/winners",
    "/draws",
    "/how-it-works",
    "/trust-safety",
    "/free-entry-route",
    "/responsible-participation",
    "/seller-standards",
    "/prohibited-items",
    "/official-rules",
    "/privacy",
    "/terms",
    "/cookies",
    "/accessibility",
    "/help",
    "/contact",
    "/complaints",
    "/dispute-resolution",
    "/sell",
  ].map((path) => ({
    url: `${brand.url}${path}`,
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : path === "/campaigns" ? 0.9 : 0.5,
  }));

  try {
    const supabase = await getSupabaseServerClient();
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("slug, updated_at")
      .in("status", ["active", "sold_out", "closing"])
      .limit(1000);

    const campaignPaths = (campaigns ?? []).map((campaign) => ({
      url: `${brand.url}/campaigns/${campaign.slug}`,
      lastModified: new Date(campaign.updated_at),
      changeFrequency: "hourly" as const,
      priority: 0.8,
    }));
    return [...staticPaths, ...campaignPaths];
  } catch {
    return staticPaths;
  }
}
