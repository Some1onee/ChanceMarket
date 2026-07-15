import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { RefundControl } from "@/features/admin/components/controls";
import { Badge } from "@/components/ui/badge";
import { formatMoney, isCurrency, money } from "@/lib/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Payments", robots: { index: false } };

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "info" | "neutral"> = {
  succeeded: "success",
  processing: "info",
  created: "neutral",
  failed: "destructive",
  cancelled: "neutral",
  refunded: "info",
  partially_refunded: "warning",
  disputed: "destructive",
};

export default async function AdminPaymentsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: transactions } = await supabase
    .from("payment_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Payments</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Intent</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Refunded</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(transactions ?? []).map((transaction) => {
            const currency = isCurrency(transaction.currency) ? transaction.currency : "GBP";
            const refundable = transaction.amount_minor - transaction.refunded_minor;
            return (
              <TableRow key={transaction.id}>
                <TableCell className="font-mono text-xs">
                  {transaction.provider_intent_id}
                </TableCell>
                <TableCell>{formatMoney(money(transaction.amount_minor, currency))}</TableCell>
                <TableCell>
                  {transaction.refunded_minor > 0
                    ? formatMoney(money(transaction.refunded_minor, currency))
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={STATUS_VARIANT[transaction.status] ?? "neutral"}
                    className="capitalize"
                  >
                    {transaction.status.replaceAll("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(transaction.created_at).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {["succeeded", "partially_refunded", "disputed"].includes(transaction.status) &&
                  refundable > 0 ? (
                    <div className="flex justify-end">
                      <RefundControl
                        transactionId={transaction.id}
                        maxRefundableMinor={refundable}
                      />
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
