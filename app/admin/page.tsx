import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin overview", robots: { index: false } };

export default async function AdminOverviewPage() {
  const supabase = await getSupabaseServerClient();

  const [
    pendingModeration,
    pendingSellers,
    openReports,
    openDisputes,
    activeCampaigns,
    pendingDraws,
  ] = await Promise.all([
    supabase
      .from("moderation_cases")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("seller_profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("disputes").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .in("status", ["active", "sold_out", "closing"]),
    supabase.from("draws").select("id", { count: "exact", head: true }).eq("status", "selected"),
  ]);

  const tiles = [
    { label: "Pending moderation", value: pendingModeration.count ?? 0, href: "/admin/moderation" },
    { label: "Seller applications", value: pendingSellers.count ?? 0, href: "/admin/sellers" },
    { label: "Winners to verify", value: pendingDraws.count ?? 0, href: "/admin/draws" },
    { label: "Open reports", value: openReports.count ?? 0, href: "/admin/reports" },
    { label: "Open disputes", value: openDisputes.count ?? 0, href: "/admin/disputes" },
    { label: "Live campaigns", value: activeCampaigns.count ?? 0, href: "/admin/campaigns" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className="group">
            <Card className="transition-shadow group-hover:shadow-md">
              <CardHeader>
                <CardDescription>{tile.label}</CardDescription>
                <CardTitle className="text-4xl tabular-nums">{tile.value}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        All admin operations require a written justification and are recorded in the immutable audit
        log. Some operations (re-draws) require dual approval.
      </p>
    </div>
  );
}
