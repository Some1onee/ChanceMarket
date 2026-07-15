import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getEmailProvider } from "@/lib/email/provider";
import { renderEmail, type TemplateKey } from "@/emails/templates";
import { logError } from "@/lib/observability/logger";

export const maxDuration = 60;

const KIND_TO_TEMPLATE: Record<string, TemplateKey> = {
  entry_confirmed: "entry_confirmed",
  payment_failed: "payment_failed",
  refund: "refund",
  campaign_approved: "campaign_approved",
  campaign_changes_requested: "campaign_changes_requested",
  campaign_rejected: "campaign_rejected",
  campaign_drawn: "campaign_closed",
  winner_provisional: "winner_provisional",
  winner_confirmed: "winner_confirmed",
  seller_approved: "seller_approved",
  seller_suspended: "dispute_update",
  seller_rejected: "dispute_update",
};

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return header.length === expected.length && timingSafeEqual(header, expected);
}

/**
 * Outbox dispatcher: turns `notification.created` events into transactional
 * emails via the EmailProvider, honouring per-user preferences. At-least-once
 * with exponential backoff; safe to run every minute.
 */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  const provider = getEmailProvider();

  const { data: events } = await admin
    .from("outbox_events")
    .select("*")
    .in("status", ["pending", "failed"])
    .lte("next_attempt_at", new Date().toISOString())
    .lt("attempts", 8)
    .order("created_at")
    .limit(50);

  let delivered = 0;
  let skipped = 0;

  for (const event of events ?? []) {
    await admin
      .from("outbox_events")
      .update({ status: "processing", attempts: event.attempts + 1 })
      .eq("id", event.id);

    try {
      if (event.topic === "notification.created") {
        const payload = event.payload as { notification_id?: string; user_id?: string; kind?: string };
        const templateKey = payload.kind ? KIND_TO_TEMPLATE[payload.kind] : undefined;

        if (templateKey && payload.user_id && payload.notification_id) {
          const [{ data: prefs }, { data: notification }, { data: userData }, { data: profile }] =
            await Promise.all([
              admin
                .from("notification_preferences")
                .select("email_transactional")
                .eq("user_id", payload.user_id)
                .maybeSingle(),
              admin
                .from("notifications")
                .select("title, body, href")
                .eq("id", payload.notification_id)
                .maybeSingle(),
              admin.auth.admin.getUserById(payload.user_id),
              admin.from("profiles").select("display_name").eq("id", payload.user_id).maybeSingle(),
            ]);

          const emailAllowed = prefs?.email_transactional !== false;
          const email = userData.user?.email;

          if (emailAllowed && email && notification) {
            const rendered = renderEmail(templateKey, {
              displayName: profile?.display_name ?? "there",
              body: notification.body ?? undefined,
              href: notification.href ?? undefined,
            });
            await provider.send({ to: email, ...rendered });
            delivered += 1;
          } else {
            skipped += 1;
          }
        } else {
          skipped += 1;
        }
      }

      await admin
        .from("outbox_events")
        .update({ status: "delivered", processed_at: new Date().toISOString() })
        .eq("id", event.id);
    } catch (error) {
      logError("outbox_event_failed", error, { eventId: event.id });
      const backoffMinutes = Math.min(2 ** event.attempts, 60);
      await admin
        .from("outbox_events")
        .update({
          status: "failed",
          last_error: error instanceof Error ? error.message : "unknown",
          next_attempt_at: new Date(Date.now() + backoffMinutes * 60_000).toISOString(),
        })
        .eq("id", event.id);
    }
  }

  return NextResponse.json({ delivered, skipped });
}
