"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { AppError, toActionResult, type ActionResult } from "@/lib/errors";

export async function markNotificationReadAction(id: string): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const user = await requireUser();
    const parsedId = z.string().uuid().parse(id);
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", parsedId)
      .eq("user_id", user.id);
    if (error) throw new AppError("internal", "Could not update the notification.");
    revalidatePath("/account/notifications");
    return undefined;
  });
}

export async function markAllNotificationsReadAction(): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const user = await requireUser();
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    if (error) throw new AppError("internal", "Could not update notifications.");
    revalidatePath("/account/notifications");
    return undefined;
  });
}

const prefsSchema = z.object({
  emailMarketing: z.boolean(),
  emailTransactional: z.boolean(),
  inappCampaignUpdates: z.boolean(),
  inappDrawResults: z.boolean(),
});

export async function updateNotificationPrefsAction(
  input: unknown,
): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const user = await requireUser();
    const data = prefsSchema.parse(input);
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.from("notification_preferences").upsert({
      user_id: user.id,
      email_marketing: data.emailMarketing,
      email_transactional: data.emailTransactional,
      inapp_campaign_updates: data.inappCampaignUpdates,
      inapp_draw_results: data.inappDrawResults,
    });
    if (error) throw new AppError("internal", "Could not save preferences.");
    revalidatePath("/account/notifications");
    return undefined;
  });
}
