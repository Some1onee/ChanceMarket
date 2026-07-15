import type { Metadata } from "next";
import { CheckCheck } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ReportControls } from "@/features/admin/components/controls";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Reports", robots: { index: false } };

export default async function AdminReportsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .in("status", ["open", "reviewing"])
    .order("created_at");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Reports</h1>
      {(reports ?? []).length === 0 ? (
        <EmptyState icon={<CheckCheck aria-hidden />} title="No open reports" />
      ) : (
        <ul className="space-y-3">
          {(reports ?? []).map((report) => (
            <li key={report.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="warning" className="capitalize">
                  {report.subject_type}
                </Badge>
                <span className="text-sm font-medium capitalize">
                  {report.reason.replaceAll("_", " ")}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(report.created_at).toLocaleString()}
                </span>
              </div>
              {report.details ? (
                <p className="mb-3 text-sm text-muted-foreground">{report.details}</p>
              ) : null}
              <p className="mb-3 font-mono text-xs text-muted-foreground">
                subject: {report.subject_id}
              </p>
              <ReportControls reportId={report.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
