"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  Dice5,
  FileWarning,
  Gavel,
  Globe2,
  LayoutDashboard,
  ScrollText,
  ShieldQuestion,
  Store,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminNav({ canAdmin, canSuper }: { canAdmin: boolean; canSuper: boolean }) {
  const pathname = usePathname();
  const items = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/admin/moderation", label: "Moderation", icon: Gavel },
    { href: "/admin/sellers", label: "Sellers", icon: Store },
    { href: "/admin/campaigns", label: "Campaigns", icon: ScrollText },
    { href: "/admin/draws", label: "Draws & winners", icon: Dice5 },
    { href: "/admin/payments", label: "Payments", icon: Banknote },
    { href: "/admin/jurisdictions", label: "Jurisdictions", icon: Globe2 },
    { href: "/admin/reports", label: "Reports", icon: FileWarning },
    { href: "/admin/disputes", label: "Disputes", icon: ShieldQuestion },
    ...(canAdmin ? [{ href: "/admin/users", label: "Users & roles", icon: Users }] : []),
    ...(canSuper || canAdmin
      ? [{ href: "/admin/audit", label: "Audit log", icon: ScrollText }]
      : []),
  ];

  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
