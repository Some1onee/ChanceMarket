import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, hasRole } from "@/lib/auth/session";
import { Wordmark } from "@/components/layout/wordmark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AdminNav } from "@/features/admin/components/admin-nav";
import { Badge } from "@/components/ui/badge";

/**
 * Admin shell. Access requires a staff role — enforced here (server), in
 * every admin action (requireRole) and again by RLS. Never UI-only.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in?next=/admin");
  const isStaff = (
    ["moderator", "compliance", "support", "finance", "admin", "super_admin"] as const
  ).some((role) => user.roles.includes(role));
  if (!isStaff) redirect("/");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4">
          <Wordmark />
          <Badge variant="warning">Back office</Badge>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:block">
              {user.email} · {user.roles.filter((role) => role !== "user").join(", ") || "staff"}
            </span>
            <ThemeToggle />
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              Exit
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-[1400px] flex-1 gap-8 px-4 py-8 lg:grid-cols-[210px_1fr]">
        <aside>
          <AdminNav
            canAdmin={hasRole(user, "admin")}
            canSuper={user.roles.includes("super_admin")}
          />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
