"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BellOff, Check } from "lucide-react";
import type { NotificationRow } from "@/lib/supabase/database.types";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
  updateNotificationPrefsAction,
} from "@/features/notifications/actions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function NotificationList({ notifications }: { notifications: NotificationRow[] }) {
  const router = useRouter();

  async function markRead(id: string) {
    const result = await markNotificationReadAction(id);
    if (!result.ok) toast.error(result.message);
    router.refresh();
  }

  async function markAll() {
    const result = await markAllNotificationsReadAction();
    if (!result.ok) toast.error(result.message);
    router.refresh();
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<BellOff aria-hidden />}
        title="No notifications"
        description="Entry confirmations, draw results and campaign updates will show up here."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => void markAll()}>
          <Check aria-hidden /> Mark all read
        </Button>
      </div>
      <ul className="space-y-2">
        {notifications.map((notification) => (
          <li
            key={notification.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border border-border p-4",
              notification.read_at ? "bg-card opacity-70" : "bg-primary-soft/40",
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{notification.title}</p>
              {notification.body ? (
                <p className="text-sm text-muted-foreground">{notification.body}</p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(notification.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {notification.href ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={notification.href}>View</Link>
                </Button>
              ) : null}
              {!notification.read_at ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Mark as read"
                  onClick={() => void markRead(notification.id)}
                >
                  <Check aria-hidden />
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NotificationPrefs({
  defaults,
}: {
  defaults: {
    emailMarketing: boolean;
    emailTransactional: boolean;
    inappCampaignUpdates: boolean;
    inappDrawResults: boolean;
  };
}) {
  async function toggle(key: keyof typeof defaults, value: boolean) {
    const result = await updateNotificationPrefsAction({ ...defaults, [key]: value });
    if (!result.ok) toast.error(result.message);
  }

  const rows: { key: keyof typeof defaults; label: string; hint: string }[] = [
    {
      key: "emailTransactional",
      label: "Transactional emails",
      hint: "Receipts, draw results, prize handover — recommended.",
    },
    { key: "emailMarketing", label: "Marketing emails", hint: "New and ending campaigns." },
    {
      key: "inappCampaignUpdates",
      label: "In-app campaign updates",
      hint: "Changes to campaigns you entered or follow.",
    },
    { key: "inappDrawResults", label: "In-app draw results", hint: "Winner announcements." },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor={`pref-${row.key}`}>{row.label}</Label>
              <p className="text-xs text-muted-foreground">{row.hint}</p>
            </div>
            <Switch
              id={`pref-${row.key}`}
              defaultChecked={defaults[row.key]}
              onCheckedChange={(checked) => void toggle(row.key, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
