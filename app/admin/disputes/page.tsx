import type { Metadata } from "next";
import { CheckCheck } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { DisputeControls } from "@/features/admin/components/controls";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Disputes", robots: { index: false } };

export default async function AdminDisputesPage() {
  const supabase = await getSupabaseServerClient();
  const { data: disputes } = await supabase
    .from("disputes")
    .select("*")
    .in("status", ["open", "investigating", "escalated"])
    .order("created_at");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Disputes</h1>
      {(disputes ?? []).length === 0 ? (
        <EmptyState icon={<CheckCheck aria-hidden />} title="No open disputes" />
      ) : (
        <ul className="space-y-3">
          {(disputes ?? []).map((dispute) => (
            <li key={dispute.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="destructive" className="capitalize">
                  {dispute.kind}
                </Badge>
                <Badge variant="neutral" className="capitalize">
                  {dispute.status}
                </Badge>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(dispute.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mb-3 text-sm">{dispute.summary}</p>
              <DisputeControls disputeId={dispute.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
