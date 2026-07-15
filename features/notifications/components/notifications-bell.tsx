"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { NotificationRow } from "@/lib/supabase/database.types";

/**
 * Realtime notification bell: subscribes to the user's notifications via
 * Supabase Realtime (RLS-scoped) and shows an unread badge + toast.
 */
export function NotificationsBell({
  userId,
  initialUnread,
}: {
  userId: string;
  initialUnread: number;
}) {
  const [unread, setUnread] = React.useState(initialUnread);

  React.useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as NotificationRow;
          setUnread((current) => current + 1);
          toast(notification.title, {
            description: notification.body ?? undefined,
            action: notification.href
              ? { label: "View", onClick: () => (window.location.href = notification.href!) }
              : undefined,
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <Button variant="ghost" size="icon-sm" asChild className="relative">
      <Link href="/account/notifications" aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}>
        <Bell aria-hidden />
        {unread > 0 ? (
          <span
            aria-hidden
            className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
