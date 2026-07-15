import type { Metadata } from "next";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatMoney, isCurrency, money } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { getLocale } from "@/lib/localization/locale";

export const metadata: Metadata = { title: "My entries" };

const ORDER_BADGE: Record<string, "success" | "warning" | "neutral" | "destructive" | "info"> = {
  confirmed: "success",
  pending: "warning",
  awaiting_payment: "warning",
  processing: "info",
  cancelled: "neutral",
  failed: "destructive",
  refunded: "info",
};

export default async function EntriesPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const supabase = await getSupabaseServerClient();

  const { data: orders } = await supabase
    .from("entry_orders")
    .select("*, campaigns(title, slug, status)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (orders ?? []) as unknown as Array<
    (typeof orders extends Array<infer T> | null ? T : never) & {
      campaigns: { title: string; slug: string; status: string } | null;
    }
  >;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">My entries</h2>
      {rows.length === 0 ? (
        <EmptyState
          icon={<Ticket aria-hidden />}
          title="No entries yet"
          description="When you enter a competition, your tickets and receipts appear here."
          action={
            <Button asChild>
              <Link href="/campaigns">Browse competitions</Link>
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Entries</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Link
                    href={`/campaigns/${order.campaigns?.slug ?? ""}`}
                    className="font-medium hover:text-primary hover:underline"
                  >
                    {order.campaigns?.title ?? "Campaign"}
                  </Link>
                </TableCell>
                <TableCell>{order.quantity}</TableCell>
                <TableCell className="capitalize">{order.source.replaceAll("_", " ")}</TableCell>
                <TableCell>
                  {order.total_minor === 0
                    ? "Free"
                    : formatMoney(
                        money(
                          order.total_minor,
                          isCurrency(order.currency) ? order.currency : "GBP",
                        ),
                        locale,
                      )}
                </TableCell>
                <TableCell>
                  <Badge variant={ORDER_BADGE[order.status] ?? "neutral"} className="capitalize">
                    {order.status.replaceAll("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(order.created_at, locale)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
