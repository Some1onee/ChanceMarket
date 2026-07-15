"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Database,
  Heart,
  ShieldAlert,
  Ticket,
  User,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/account", label: "Profile", icon: User, exact: true },
  { href: "/account/entries", label: "My entries", icon: Ticket },
  { href: "/account/favourites", label: "Favourites", icon: Heart },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/protection", label: "Play safeguards", icon: ShieldAlert },
  { href: "/account/security", label: "Security", icon: KeyRound },
  { href: "/account/data", label: "Data & privacy", icon: Database },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="flex gap-1 overflow-x-auto lg:flex-col">
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
