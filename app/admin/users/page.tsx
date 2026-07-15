import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { AccountStatusControl, UserRoleControl } from "@/features/admin/components/controls";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Users & roles", robots: { index: false } };

const GRANTABLE = ["moderator", "compliance", "support", "finance", "admin"] as const;

export default async function AdminUsersPage() {
  const actor = await requireRole("admin");
  const isSuper = actor.roles.includes("super_admin");

  let rows: Array<{
    id: string;
    display_name: string;
    account_status: string;
    country_code: string | null;
    roles: string[];
  }> = [];

  try {
    const admin = getSupabaseAdminClient();
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      admin
        .from("profiles")
        .select("id, display_name, account_status, country_code")
        .order("created_at", { ascending: false })
        .limit(100),
      admin.from("user_roles").select("user_id, role"),
    ]);
    rows = (profiles ?? []).map((profile) => ({
      ...profile,
      roles: (roles ?? [])
        .filter((role) => role.user_id === profile.id)
        .map((role) => role.role as string),
    }));
  } catch {
    return (
      <Alert variant="warning">
        <AlertDescription>
          User administration requires SUPABASE_SECRET_KEY on the server.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Users &amp; roles</h1>
      {!isSuper ? (
        <Alert>
          <AlertDescription>
            Read-only for admins — granting or revoking roles requires super_admin.
          </AlertDescription>
        </Alert>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <span className="font-medium">{user.display_name}</span>
                <span className="block font-mono text-[10px] text-muted-foreground">{user.id}</span>
              </TableCell>
              <TableCell>{user.country_code ?? "—"}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    user.account_status === "active"
                      ? "success"
                      : user.account_status === "closed"
                        ? "destructive"
                        : "warning"
                  }
                  className="capitalize"
                >
                  {user.account_status.replaceAll("_", " ")}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.roles
                    .filter((role) => role !== "user")
                    .map((role) => (
                      <Badge key={role} variant="info">
                        {role}
                      </Badge>
                    ))}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-wrap justify-end gap-1.5">
                  {isSuper
                    ? GRANTABLE.map((role) => (
                        <UserRoleControl
                          key={role}
                          userId={user.id}
                          role={role}
                          has={user.roles.includes(role)}
                        />
                      ))
                    : null}
                  <AccountStatusControl userId={user.id} status={user.account_status} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
