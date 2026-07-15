"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, type SessionUser } from "@/lib/auth/session";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { AppError, toActionResult, type ActionResult } from "@/lib/errors";
import { runCampaignClosePipeline } from "@/features/draws/service";
import { refundTransaction } from "@/lib/payments/service";
import { logInfo } from "@/lib/observability/logger";
import type { UserRole } from "@/lib/supabase/database.types";

const justificationSchema = z.string().trim().min(10, "A justification (min 10 chars) is required");

/** Every sensitive operation writes an admin_actions row with justification. */
async function logAdminAction(
  actor: SessionUser,
  action: string,
  subjectType: string,
  subjectId: string | null,
  justification: string,
  metadata?: Record<string, unknown>,
  secondApproverId?: string,
): Promise<void> {
  const admin = getSupabaseAdminClient();
  await admin.from("admin_actions").insert({
    actor_id: actor.id,
    action,
    subject_type: subjectType,
    subject_id: subjectId,
    justification,
    metadata: metadata ?? null,
    second_approver_id: secondApproverId ?? null,
  });
}

// ── Moderation ────────────────────────────────────────────────────────────────

const moderationSchema = z.object({
  caseId: z.string().uuid(),
  campaignId: z.string().uuid(),
  decision: z.enum(["approved", "changes_requested", "rejected"]),
  reason: justificationSchema,
});

export async function moderateCampaignAction(input: unknown): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const actor = await requireRole("moderator");
    const data = moderationSchema.parse(input);
    const admin = getSupabaseAdminClient();

    // Move to under_review first when arriving from submitted (idempotent).
    const { data: campaign } = await admin
      .from("campaigns")
      .select("status, seller_id, title")
      .eq("id", data.campaignId)
      .single();
    if (!campaign) throw new AppError("not_found", "Campaign not found.");

    if (campaign.status === "submitted") {
      await admin.rpc("transition_campaign_status", {
        p_campaign_id: data.campaignId,
        p_new_status: "under_review",
        p_reason: null,
      });
    }

    const targetStatus =
      data.decision === "approved"
        ? ("approved" as const)
        : data.decision === "changes_requested"
          ? ("changes_requested" as const)
          : ("rejected" as const);

    const { error } = await admin.rpc("transition_campaign_status", {
      p_campaign_id: data.campaignId,
      p_new_status: targetStatus,
      p_reason: data.reason,
    });
    if (error) throw new AppError("state_conflict", error.message);

    // Approved campaigns without a future start go live immediately.
    if (data.decision === "approved") {
      const { data: fresh } = await admin
        .from("campaigns")
        .select("starts_at")
        .eq("id", data.campaignId)
        .single();
      const startsInFuture = fresh?.starts_at && new Date(fresh.starts_at) > new Date();
      await admin.rpc("transition_campaign_status", {
        p_campaign_id: data.campaignId,
        p_new_status: startsInFuture ? "scheduled" : "active",
        p_reason: null,
      });
    }

    await admin
      .from("moderation_cases")
      .update({
        status: data.decision,
        decision_reason: data.reason,
        decided_by: actor.id,
        decided_at: new Date().toISOString(),
      })
      .eq("id", data.caseId);

    // Notify the seller.
    const { data: seller } = await admin
      .from("seller_profiles")
      .select("user_id")
      .eq("id", campaign.seller_id)
      .single();
    if (seller) {
      const titles: Record<typeof data.decision, string> = {
        approved: "Campaign approved",
        changes_requested: "Changes requested",
        rejected: "Campaign rejected",
      };
      await admin.rpc("enqueue_notification", {
        p_user_id: seller.user_id,
        p_kind: `campaign_${data.decision}`,
        p_title: titles[data.decision],
        p_body: `"${campaign.title}": ${data.reason}`,
        p_href: "/seller",
      });
    }

    await logAdminAction(actor, `moderation_${data.decision}`, "campaign", data.campaignId, data.reason);
    revalidatePath("/admin/moderation");
    return undefined;
  });
}

// ── Sellers ──────────────────────────────────────────────────────────────────

const sellerDecisionSchema = z.object({
  sellerId: z.string().uuid(),
  decision: z.enum(["approved", "rejected", "suspended"]),
  reason: justificationSchema,
});

export async function decideSellerAction(input: unknown): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const actor = await requireRole("compliance");
    const data = sellerDecisionSchema.parse(input);
    const admin = getSupabaseAdminClient();

    const { data: seller } = await admin
      .from("seller_profiles")
      .select("user_id, public_name")
      .eq("id", data.sellerId)
      .single();
    if (!seller) throw new AppError("not_found", "Seller not found.");

    const { error } = await admin
      .from("seller_profiles")
      .update({ status: data.decision })
      .eq("id", data.sellerId);
    if (error) throw new AppError("internal", "Could not update the seller.");

    if (data.decision === "approved") {
      await admin
        .from("user_roles")
        .upsert({ user_id: seller.user_id, role: "seller", granted_by: actor.id }, { onConflict: "user_id,role" });
    }

    await admin.rpc("enqueue_notification", {
      p_user_id: seller.user_id,
      p_kind: `seller_${data.decision}`,
      p_title:
        data.decision === "approved"
          ? "Seller application approved"
          : data.decision === "suspended"
            ? "Seller account suspended"
            : "Seller application declined",
      p_body: data.reason,
      p_href: "/seller",
    });

    await logAdminAction(actor, `seller_${data.decision}`, "seller", data.sellerId, data.reason);
    revalidatePath("/admin/sellers");
    return undefined;
  });
}

// ── Draw operations ──────────────────────────────────────────────────────────

const closeNowSchema = z.object({
  campaignId: z.string().uuid(),
  reason: justificationSchema,
});

export async function closeCampaignNowAction(input: unknown): Promise<ActionResult<{ publicId: string }>> {
  return toActionResult(async () => {
    const actor = await requireRole("admin");
    const data = closeNowSchema.parse(input);
    const result = await runCampaignClosePipeline(data.campaignId);
    await logAdminAction(actor, "campaign_closed_manually", "campaign", data.campaignId, data.reason, {
      drawId: result.drawId,
    });
    revalidatePath("/admin/draws");
    return { publicId: result.publicId };
  });
}

const verifyWinnerSchema = z.object({
  drawId: z.string().uuid(),
  outcome: z.enum(["verified", "failed"]),
  notes: justificationSchema,
});

export async function verifyWinnerAction(input: unknown): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const actor = await requireRole("compliance");
    const data = verifyWinnerSchema.parse(input);
    const admin = getSupabaseAdminClient();

    const { error } = await admin
      .from("winner_verifications")
      .update({ status: data.outcome, notes: data.notes, verified_by: actor.id })
      .eq("draw_id", data.drawId)
      .eq("status", "pending");
    if (error) throw new AppError("internal", "Could not update the verification.");

    if (data.outcome === "verified") {
      const { error: confirmError } = await admin.rpc("confirm_draw_winner", {
        p_draw_id: data.drawId,
      });
      if (confirmError) throw new AppError("state_conflict", confirmError.message);

      const { data: draw } = await admin
        .from("draws")
        .select("winner_entry_id")
        .eq("id", data.drawId)
        .single();
      if (draw?.winner_entry_id) {
        const { data: entry } = await admin
          .from("entries")
          .select("user_id")
          .eq("id", draw.winner_entry_id)
          .single();
        if (entry) {
          await admin.rpc("enqueue_notification", {
            p_user_id: entry.user_id,
            p_kind: "winner_confirmed",
            p_title: "You are the confirmed winner!",
            p_body: "Eligibility verified. Prize handover starts now — check your entries page.",
            p_href: "/account/entries",
          });
        }
      }
    }

    await logAdminAction(actor, `winner_${data.outcome}`, "draw", data.drawId, data.notes);
    revalidatePath("/admin/draws");
    return undefined;
  });
}

const rerollSchema = z.object({
  drawId: z.string().uuid(),
  reason: justificationSchema,
  secondApproverEmail: z.string().email(),
});

/**
 * Controlled re-draw: mandatory reason + a SECOND admin (distinct from the
 * actor) named by email. The SQL function re-validates both approvers.
 */
export async function rerollDrawAction(input: unknown): Promise<ActionResult<{ publicId: string }>> {
  return toActionResult(async () => {
    const actor = await requireRole("admin");
    const data = rerollSchema.parse(input);
    const admin = getSupabaseAdminClient();

    const { data: approver } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const second = approver.users.find(
      (candidate) => candidate.email?.toLowerCase() === data.secondApproverEmail.toLowerCase(),
    );
    if (!second) throw new AppError("validation_failed", "Second approver not found.");
    if (second.id === actor.id) {
      throw new AppError("validation_failed", "The second approver must be a different admin.");
    }

    const { data: newDraw, error } = await admin.rpc("reroll_draw", {
      p_draw_id: data.drawId,
      p_reason: data.reason,
      p_first_approver: actor.id,
      p_second_approver: second.id,
    });
    if (error) throw new AppError("state_conflict", error.message);

    const { error: selectError } = await admin.rpc("select_draw_winner", {
      p_draw_id: newDraw.id,
    });
    if (selectError) throw new AppError("state_conflict", selectError.message);

    await logAdminAction(actor, "draw_rerolled", "draw", data.drawId, data.reason, {
      newDrawId: newDraw.id,
    }, second.id);
    revalidatePath("/admin/draws");
    return { publicId: newDraw.public_id };
  });
}

// ── Payments ─────────────────────────────────────────────────────────────────

const refundSchema = z.object({
  transactionId: z.string().uuid(),
  amountMinor: z.number().int().min(1),
  reason: justificationSchema,
});

export async function refundPaymentAction(input: unknown): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const actor = await requireRole("finance");
    const data = refundSchema.parse(input);
    await refundTransaction({
      transactionId: data.transactionId,
      amountMinor: data.amountMinor,
      reason: data.reason,
      requestedBy: actor.id,
    });
    await logAdminAction(actor, "refund_issued", "payment", data.transactionId, data.reason, {
      amountMinor: data.amountMinor,
    });
    revalidatePath("/admin/payments");
    return undefined;
  });
}

// ── Users & roles ────────────────────────────────────────────────────────────

const roleGrantSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["seller", "moderator", "compliance", "support", "finance", "admin"]),
  grant: z.boolean(),
  reason: justificationSchema,
});

export async function setUserRoleAction(input: unknown): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const actor = await requireRole("super_admin");
    const data = roleGrantSchema.parse(input);
    const admin = getSupabaseAdminClient();

    if (data.grant) {
      await admin
        .from("user_roles")
        .upsert(
          { user_id: data.userId, role: data.role as UserRole, granted_by: actor.id },
          { onConflict: "user_id,role" },
        );
    } else {
      await admin.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role);
    }
    await logAdminAction(actor, data.grant ? "role_granted" : "role_revoked", "user", data.userId, data.reason, {
      role: data.role,
    });
    revalidatePath("/admin/users");
    return undefined;
  });
}

const accountStatusSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["active", "restricted", "closed"]),
  reason: justificationSchema,
});

export async function setAccountStatusAction(input: unknown): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const actor = await requireRole("admin");
    const data = accountStatusSchema.parse(input);
    const admin = getSupabaseAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ account_status: data.status })
      .eq("id", data.userId);
    if (error) throw new AppError("internal", "Could not update the account.");
    await logAdminAction(actor, "account_status_changed", "user", data.userId, data.reason, {
      status: data.status,
    });
    revalidatePath("/admin/users");
    return undefined;
  });
}

// ── Jurisdictions ────────────────────────────────────────────────────────────

const jurisdictionToggleSchema = z.object({
  jurisdictionId: z.string().uuid(),
  isActive: z.boolean(),
  reason: justificationSchema,
});

export async function toggleJurisdictionAction(input: unknown): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const actor = await requireRole("compliance");
    const data = jurisdictionToggleSchema.parse(input);
    const admin = getSupabaseAdminClient();
    const { error } = await admin
      .from("jurisdictions")
      .update({ is_active: data.isActive })
      .eq("id", data.jurisdictionId);
    if (error) throw new AppError("internal", "Could not update the jurisdiction.");
    await logAdminAction(
      actor,
      data.isActive ? "jurisdiction_activated" : "jurisdiction_deactivated",
      "jurisdiction",
      data.jurisdictionId,
      data.reason,
    );
    logInfo("jurisdiction_toggled", { id: data.jurisdictionId, active: data.isActive });
    revalidatePath("/admin/jurisdictions");
    return undefined;
  });
}

// ── Reports & disputes ───────────────────────────────────────────────────────

const reportResolveSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(["reviewing", "actioned", "dismissed"]),
  reason: justificationSchema,
});

export async function resolveReportAction(input: unknown): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const actor = await requireRole("moderator");
    const data = reportResolveSchema.parse(input);
    const admin = getSupabaseAdminClient();
    await admin
      .from("reports")
      .update({ status: data.status, handled_by: actor.id })
      .eq("id", data.reportId);
    await logAdminAction(actor, `report_${data.status}`, "report", data.reportId, data.reason);
    revalidatePath("/admin/reports");
    return undefined;
  });
}

const disputeResolveSchema = z.object({
  disputeId: z.string().uuid(),
  status: z.enum(["investigating", "resolved", "rejected", "escalated"]),
  resolution: justificationSchema,
});

export async function resolveDisputeAction(input: unknown): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const actor = await requireRole("support");
    const data = disputeResolveSchema.parse(input);
    const admin = getSupabaseAdminClient();
    await admin
      .from("disputes")
      .update({ status: data.status, resolution: data.resolution, handled_by: actor.id })
      .eq("id", data.disputeId);
    await logAdminAction(actor, `dispute_${data.status}`, "dispute", data.disputeId, data.resolution);
    revalidatePath("/admin/disputes");
    return undefined;
  });
}
