import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { WinnerControls } from "@/features/admin/components/controls";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Draws & winners", robots: { index: false } };

export default async function AdminDrawsPage() {
  const supabase = await getSupabaseServerClient();

  const { data: draws } = await supabase
    .from("draws")
    .select("*, campaigns(title, slug), winner_verifications(status, notes)")
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (draws ?? []) as unknown as Array<
    NonNullable<typeof draws>[number] & {
      campaigns: { title: string; slug: string } | null;
      winner_verifications: { status: string; notes: string | null }[];
    }
  >;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Draws &amp; winners</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Draw</TableHead>
            <TableHead>Campaign</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Verification</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((draw) => {
            const verification = draw.winner_verifications[0];
            return (
              <TableRow key={draw.id}>
                <TableCell>
                  <Link
                    href={`/draws/${draw.public_id}`}
                    className="font-mono text-xs text-primary hover:underline"
                    target="_blank"
                  >
                    {draw.public_id}
                  </Link>
                </TableCell>
                <TableCell className="max-w-56">
                  <span className="block truncate">{draw.campaigns?.title}</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      draw.status === "winner_verified"
                        ? "success"
                        : draw.status === "rerolled"
                          ? "warning"
                          : "info"
                    }
                    className="capitalize"
                  >
                    {draw.status.replaceAll("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {verification ? (
                    <Badge
                      variant={
                        verification.status === "verified"
                          ? "success"
                          : verification.status === "failed"
                            ? "destructive"
                            : "warning"
                      }
                      className="capitalize"
                    >
                      {verification.status.replaceAll("_", " ")}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {draw.status === "selected" ? (
                    <div className="flex justify-end">
                      <WinnerControls drawId={draw.id} />
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground">
        Re-draws require a reason and TWO distinct admins; both are recorded in the audit log and
        the superseded draw remains public.
      </p>
    </div>
  );
}
