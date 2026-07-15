import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Audit log", robots: { index: false } };

export default async function AdminAuditPage() {
  const supabase = await getSupabaseServerClient();
  const [{ data: audit }, { data: adminActions }] = await Promise.all([
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("admin_actions").select("*").order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold">Admin actions</h1>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Justification</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(adminActions ?? []).map((action) => (
              <TableRow key={action.id}>
                <TableCell className="font-medium">{action.action}</TableCell>
                <TableCell className="font-mono text-xs">
                  {action.subject_type}:{action.subject_id?.slice(0, 8)}
                  {action.second_approver_id ? " · dual-approved" : ""}
                </TableCell>
                <TableCell className="max-w-72 truncate text-muted-foreground">
                  {action.justification}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(action.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">System audit trail (immutable)</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(audit ?? []).map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{entry.event}</TableCell>
                <TableCell className="font-mono text-xs">
                  {entry.subject_type}:{entry.subject_id?.slice(0, 8)}
                </TableCell>
                <TableCell className="max-w-72 truncate font-mono text-[10px] text-muted-foreground">
                  {JSON.stringify(entry.data)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(entry.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
