import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CloseCampaignControl } from "@/features/admin/components/controls";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { getDictionary } from "@/lib/localization/dictionaries";
import { getLocale } from "@/lib/localization/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Campaigns", robots: { index: false } };

export default async function AdminCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("campaigns")
    .select("*, seller_profiles(public_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) query = query.eq("status", status as never);
  const { data: campaigns } = await query;

  const rows = (campaigns ?? []) as unknown as Array<
    NonNullable<typeof campaigns>[number] & { seller_profiles: { public_name: string } | null }
  >;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Campaigns</h1>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {["", "active", "under_review", "closing", "drawing", "completed", "cancelled"].map(
            (filter) => (
              <Link
                key={filter || "all"}
                href={filter ? `/admin/campaigns?status=${filter}` : "/admin/campaigns"}
                className={`rounded-full border px-2.5 py-1 ${status === filter || (!status && !filter) ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
              >
                {filter ? filter.replaceAll("_", " ") : "all"}
              </Link>
            ),
          )}
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Seller</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Entries</TableHead>
            <TableHead>Ends</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((campaign) => (
            <TableRow key={campaign.id}>
              <TableCell className="max-w-64">
                <Link
                  href={`/campaigns/${campaign.slug}`}
                  className="block truncate font-medium hover:underline"
                  target="_blank"
                >
                  {campaign.title}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {campaign.seller_profiles?.public_name}
              </TableCell>
              <TableCell>
                <CampaignStatusBadge status={campaign.status} dictionary={t} />
              </TableCell>
              <TableCell>
                {campaign.entries_confirmed}/{campaign.max_entries_total}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {campaign.ends_at ? new Date(campaign.ends_at).toLocaleDateString() : "—"}
              </TableCell>
              <TableCell className="text-right">
                {["active", "sold_out", "paused", "closing"].includes(campaign.status) ? (
                  <div className="flex justify-end">
                    <CloseCampaignControl campaignId={campaign.id} />
                  </div>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
