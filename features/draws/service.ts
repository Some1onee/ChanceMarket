import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { AppError } from "@/lib/errors";
import { logError, logInfo } from "@/lib/observability/logger";

/**
 * Draw pipeline orchestration (service key only — invoked from admin actions
 * and the scheduled close job). Each SQL step is idempotent; re-running a
 * step is safe and can NEVER silently re-select a winner.
 */

export async function runCampaignClosePipeline(campaignId: string): Promise<{
  drawId: string;
  publicId: string;
}> {
  const admin = getSupabaseAdminClient();

  // 1. Close entries + cancel unpaid orders (idempotent).
  const { error: closeError } = await admin.rpc("close_campaign_entries", {
    p_campaign_id: campaignId,
  });
  if (closeError) {
    throw new AppError("state_conflict", `Close failed: ${closeError.message}`);
  }

  // 2. Wait for in-flight payments: any 'processing' transactions block the
  //    snapshot (the scheduler retries on the next run).
  const { count: inflight } = await admin
    .from("payment_transactions")
    .select("id", { count: "exact", head: true })
    .in("status", ["created", "requires_action", "processing"])
    .in(
      "order_id",
      (
        await admin.from("entry_orders").select("id").eq("campaign_id", campaignId)
      ).data?.map((order) => order.id) ?? [],
    );
  if ((inflight ?? 0) > 0) {
    throw new AppError(
      "state_conflict",
      `${inflight} payment(s) still settling — snapshot deferred.`,
    );
  }

  // 3-7. Freeze eligible entries into a hashed snapshot (idempotent).
  const { data: draw, error: snapshotError } = await admin.rpc("create_draw_snapshot", {
    p_campaign_id: campaignId,
  });
  if (snapshotError || !draw) {
    throw new AppError("state_conflict", `Snapshot failed: ${snapshotError?.message}`);
  }

  // 8-9. CSPRNG selection inside the database (idempotent — a selected draw
  //      returns unchanged).
  const { data: selected, error: selectError } = await admin.rpc("select_draw_winner", {
    p_draw_id: draw.id,
  });
  if (selectError || !selected) {
    throw new AppError("state_conflict", `Selection failed: ${selectError?.message}`);
  }

  // 12. Notify the provisional winner + seller.
  if (selected.winner_entry_id) {
    const { data: entry } = await admin
      .from("entries")
      .select("user_id, campaign_id")
      .eq("id", selected.winner_entry_id)
      .single();
    if (entry) {
      await admin.rpc("enqueue_notification", {
        p_user_id: entry.user_id,
        p_kind: "winner_provisional",
        p_title: "You are the provisional winner!",
        p_body: "Subject to eligibility verification. We'll guide you through the next steps.",
        p_href: "/account/entries",
      });
    }
    const { data: campaign } = await admin
      .from("campaigns")
      .select("seller_id, title")
      .eq("id", campaignId)
      .single();
    if (campaign) {
      const { data: seller } = await admin
        .from("seller_profiles")
        .select("user_id")
        .eq("id", campaign.seller_id)
        .single();
      if (seller) {
        await admin.rpc("enqueue_notification", {
          p_user_id: seller.user_id,
          p_kind: "campaign_drawn",
          p_title: "Draw completed",
          p_body: `A provisional winner has been selected for "${campaign.title}".`,
          p_href: "/seller",
        });
      }
    }
  }

  logInfo("draw_pipeline_completed", { campaignId, drawId: selected.id });
  return { drawId: selected.id, publicId: selected.public_id };
}

/** Find campaigns past their end date and run the pipeline on each. */
export async function closeDueCampaigns(): Promise<{ closed: string[]; errors: string[] }> {
  const admin = getSupabaseAdminClient();
  const closed: string[] = [];
  const errors: string[] = [];

  const { data: due } = await admin
    .from("campaigns")
    .select("id, slug")
    .in("status", ["active", "sold_out", "paused", "closing"])
    .not("ends_at", "is", null)
    .lte("ends_at", new Date().toISOString())
    .limit(20);

  for (const campaign of due ?? []) {
    try {
      await runCampaignClosePipeline(campaign.id);
      closed.push(campaign.slug);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      // "no_eligible_entries" campaigns stay in closing for manual handling.
      errors.push(`${campaign.slug}: ${message}`);
      logError("campaign_close_failed", error, { campaignId: campaign.id });
    }
  }

  // Housekeeping: release expired stock reservations.
  await admin.rpc("release_expired_reservations");

  return { closed, errors };
}
