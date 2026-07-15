import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PackagePlus, Store } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { NewCampaignButton, SellerCampaignActions } from "@/features/sellers/components/seller-actions";
import { getDictionary } from "@/lib/localization/dictionaries";
import { getLocale } from "@/lib/localization/locale";
import { formatMoney, isCurrency, money } from "@/lib/money";
import { formatDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Seller dashboard" };

export default async function SellerDashboardPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await getSupabaseServerClient();

  const { data: seller } = await supabase
    .from("seller_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!seller) redirect("/sell");

  const [{ data: campaigns }, { data: balances }, { data: payouts }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("*")
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false }),
    supabase.from("seller_balances").select("*").eq("seller_id", seller.id),
    supabase
      .from("payouts")
      .select("*")
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const rows = campaigns ?? [];
  const active = rows.filter((c) => ["active", "sold_out", "closing"].includes(c.status));
  const entriesSold = rows.reduce((sum, c) => sum + c.entries_confirmed, 0);
  const grossMinor = rows.reduce((sum, c) => sum + c.entries_confirmed * c.entry_price_minor, 0);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Seller dashboard</h1>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            {seller.public_name}
            <Badge
              variant={
                seller.status === "approved"
                  ? "success"
                  : seller.status === "pending"
                    ? "warning"
                    : "destructive"
              }
              className="capitalize"
            >
              {seller.status}
            </Badge>
            <Badge variant={seller.kyb_status === "verified" ? "success" : "neutral"}>
              KYC/KYB: {seller.kyb_status.replaceAll("_", " ")}
            </Badge>
          </p>
        </div>
        {seller.status === "approved" ? <NewCampaignButton /> : null}
      </div>

      {seller.status !== "approved" ? (
        <Card>
          <CardHeader>
            <CardTitle>Application under review</CardTitle>
            <CardDescription>
              Our team is reviewing your seller application{seller.kyb_status !== "verified" ? " and identity verification" : ""}. You&apos;ll be notified of the decision.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Live campaigns</CardDescription>
            <CardTitle className="text-3xl">{active.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Entries sold (all time)</CardDescription>
            <CardTitle className="text-3xl">{entriesSold.toLocaleString(locale)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gross entry revenue</CardDescription>
            <CardTitle className="text-3xl">
              {formatMoney(money(grossMinor, isCurrency(seller.country_code === "US" ? "USD" : "GBP") ? (seller.country_code === "US" ? "USD" : "GBP") : "GBP"), locale)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Before provider fees, commission, taxes, reserves and refunds.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available balance</CardDescription>
            <CardTitle className="text-3xl">
              {(balances ?? []).length > 0
                ? (balances ?? [])
                    .map((balance) =>
                      formatMoney(
                        money(balance.available_minor, isCurrency(balance.currency) ? balance.currency : "GBP"),
                        locale,
                      ),
                    )
                    .join(" · ")
                : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Net of fees per the ledger. Payouts are released after each campaign completes.
          </CardContent>
        </Card>
      </div>

      {/* Campaigns */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Campaigns</h2>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Store aria-hidden />}
            title="No campaigns yet"
            description="Create your first draft — it stays private until moderation approves it."
            action={seller.status === "approved" ? <NewCampaignButton /> : undefined}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Entries</TableHead>
                <TableHead>Entry price</TableHead>
                <TableHead>Closes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="max-w-64">
                    <span className="block truncate font-medium">{campaign.title}</span>
                    {campaign.rejection_reason && ["changes_requested", "rejected"].includes(campaign.status) ? (
                      <span className="block truncate text-xs text-destructive">
                        {campaign.rejection_reason}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <CampaignStatusBadge status={campaign.status} dictionary={t} />
                  </TableCell>
                  <TableCell>
                    {campaign.entries_confirmed.toLocaleString(locale)} /{" "}
                    {campaign.max_entries_total.toLocaleString(locale)}
                  </TableCell>
                  <TableCell>
                    {campaign.entry_price_minor === 0
                      ? "Free"
                      : formatMoney(
                          money(
                            campaign.entry_price_minor,
                            isCurrency(campaign.currency) ? campaign.currency : "GBP",
                          ),
                          locale,
                        )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {campaign.ends_at ? formatDate(campaign.ends_at, locale) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <SellerCampaignActions
                      campaignId={campaign.id}
                      slug={campaign.slug}
                      status={campaign.status}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {/* Payouts */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Recent payouts</h2>
        {(payouts ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No payouts yet. Funds are held until a campaign completes and the prize handover is
            confirmed, then released per the payout schedule.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payouts ?? []).map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>
                    {formatMoney(
                      money(payout.amount_minor, isCurrency(payout.currency) ? payout.currency : "GBP"),
                      locale,
                    )}
                  </TableCell>
                  <TableCell className="capitalize">
                    <Badge variant={payout.status === "paid" ? "success" : "neutral"}>
                      {payout.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(payout.created_at, locale)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        <PackagePlus className="mr-1 inline size-3.5" aria-hidden />
        Financial figures distinguish gross, provider fees, platform commission, taxes, reserves,
        refunds, estimated net and paid-out amounts in the ledger-backed statement of each
        campaign.
      </p>
    </div>
  );
}
