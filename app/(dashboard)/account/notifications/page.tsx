import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  NotificationList,
  NotificationPrefs,
} from "@/features/notifications/components/notification-list";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const supabase = await getSupabaseServerClient();

  const [{ data: notifications }, { data: prefs }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Notifications</h2>
      <NotificationList notifications={notifications ?? []} />
      <NotificationPrefs
        defaults={{
          emailMarketing: prefs?.email_marketing ?? false,
          emailTransactional: prefs?.email_transactional ?? true,
          inappCampaignUpdates: prefs?.inapp_campaign_updates ?? true,
          inappDrawResults: prefs?.inapp_draw_results ?? true,
        }}
      />
    </div>
  );
}
