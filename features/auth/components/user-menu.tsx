"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Heart,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Store,
  Ticket,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Dictionary } from "@/lib/localization/dictionaries";

type UserMenuProps = {
  email: string;
  displayName: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  isSeller: boolean;
  t: Dictionary["auth"]["userMenu"];
};

export function UserMenu({ email, displayName, avatarUrl, isAdmin, isSeller, t }: UserMenuProps) {
  const router = useRouter();

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t.menuLabel}
        className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Avatar className="size-8">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback>{initials || "?"}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="block truncate font-medium text-foreground">{displayName}</span>
          <span className="block truncate text-xs font-normal">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <Settings aria-hidden /> {t.settings}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/entries">
            <Ticket aria-hidden /> {t.entries}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/favourites">
            <Heart aria-hidden /> {t.favourites}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/notifications">
            <Bell aria-hidden /> {t.notifications}
          </Link>
        </DropdownMenuItem>
        {isSeller ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/seller">
                <Store aria-hidden /> {t.sellerDashboard}
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem asChild>
            <Link href="/sell">
              <LayoutDashboard aria-hidden /> {t.becomeSeller}
            </Link>
          </DropdownMenuItem>
        )}
        {isAdmin ? (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <ShieldCheck aria-hidden /> {t.admin}
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut aria-hidden /> {t.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
