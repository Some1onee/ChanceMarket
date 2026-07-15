"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import { AppError, toActionResult, type ActionResult } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  checkCampaignEligibility,
  recordEntryComplianceDecision,
} from "@/features/compliance/service";
import { startPaidOrderCheckout, simulateMockOutcome } from "@/lib/payments/service";
import { logInfo, logWarn } from "@/lib/observability/logger";

const skillAnswerSchema = z.object({
  questionId: z.string().uuid(),
  optionId: z.string().uuid(),
});

export async function answerSkillQuestionAction(
  input: unknown,
): Promise<ActionResult<{ responseId: string; correct: boolean }>> {
  return toActionResult(async () => {
    await requireUser();
    await checkRateLimit("entry:skill", 10);
    const data = skillAnswerSchema.parse(input);
    const supabase = await getSupabaseServerClient();

    const { data: response, error } = await supabase.rpc("submit_skill_response", {
      p_question_id: data.questionId,
      p_option_id: data.optionId,
    });
    if (error) {
      if (error.message.includes("too_many_attempts")) {
        throw new AppError("limit_reached", "Too many attempts on this question.");
      }
      throw new AppError("validation_failed", "Could not record your answer.");
    }
    return { responseId: response.id, correct: response.is_correct };
  });
}

const enterSchema = z.object({
  campaignId: z.string().uuid(),
  quantity: z.number().int().min(1).max(1000),
  source: z.enum(["paid", "promotional"]),
  skillResponseId: z.string().uuid().nullable(),
  idempotencyKey: z.string().min(10).max(80),
  confirmations: z.object({
    ageAndEligibility: z.literal(true),
    rulesAndRefunds: z.literal(true),
  }),
});

export type EntryOutcome =
  | { status: "confirmed"; orderId: string; quantity: number; totalMinor: number; currency: string }
  | { status: "payment_failed"; orderId: string; reason: string };

export async function enterCampaignAction(input: unknown): Promise<ActionResult<EntryOutcome>> {
  return toActionResult(async () => {
    const user = await requireUser();
    await checkRateLimit("entry:order", 15);
    const data = enterSchema.parse(input);

    // Server-side eligibility (the SQL function re-checks under lock again).
    const eligibility = await checkCampaignEligibility(data.campaignId, data.quantity);
    await recordEntryComplianceDecision({
      campaignId: data.campaignId,
      userId: user.id,
      result: eligibility,
    });
    if (!eligibility.allowed) {
      throw new AppError("not_eligible", "You are not eligible to enter this campaign.");
    }

    if (data.source === "paid" && process.env.ENABLE_PAID_ENTRIES === "false") {
      throw new AppError("forbidden", "Paid entries are currently disabled.");
    }

    const supabase = await getSupabaseServerClient();
    const { data: order, error } = await supabase.rpc("create_entry_order", {
      p_campaign_id: data.campaignId,
      p_quantity: data.quantity,
      p_source: data.source,
      p_idempotency_key: data.idempotencyKey,
      p_declared_country: eligibility.countryCode,
      p_skill_response_id: data.skillResponseId,
    });
    if (error) {
      throw mapOrderError(error.message);
    }

    // Free entry (free draw / sweepstakes): confirm immediately (total = 0).
    if (order.total_minor === 0) {
      const { data: confirmed, error: confirmError } = await supabase.rpc("confirm_entry_order", {
        p_order_id: order.id,
        p_payment_transaction_id: null,
      });
      if (confirmError) throw mapOrderError(confirmError.message);
      logInfo("free_entry_confirmed", { orderId: order.id });
      revalidatePath("/account/entries");
      return {
        status: "confirmed",
        orderId: confirmed.id,
        quantity: confirmed.quantity,
        totalMinor: 0,
        currency: confirmed.currency,
      };
    }

    // Paid entry: provider checkout + webhook-driven settlement.
    let intentId: string;
    try {
      const checkout = await startPaidOrderCheckout({ orderId: order.id });
      intentId = checkout.intentId;
    } catch (checkoutError) {
      if (checkoutError instanceof Error && checkoutError.message.includes("SUPABASE_SECRET_KEY")) {
        throw new AppError(
          "internal",
          "Paid checkout requires the server key (SUPABASE_SECRET_KEY) to be configured.",
        );
      }
      throw checkoutError;
    }

    // Mock provider resolves synchronously through the signed-webhook path.
    if ((process.env.PAYMENT_PROVIDER ?? "mock") === "mock") {
      await simulateMockOutcome(intentId);
    }

    // Read the settled order state.
    const admin = getSupabaseAdminClient();
    const { data: settled } = await admin
      .from("entry_orders")
      .select("id, status, quantity, total_minor, currency")
      .eq("id", order.id)
      .single();

    revalidatePath("/account/entries");

    if (settled?.status === "confirmed") {
      return {
        status: "confirmed",
        orderId: settled.id,
        quantity: settled.quantity,
        totalMinor: settled.total_minor,
        currency: settled.currency,
      };
    }
    return {
      status: "payment_failed",
      orderId: order.id,
      reason:
        settled?.status === "cancelled"
          ? "Your payment was declined. No entries were issued and nothing was charged."
          : "The payment is still processing — check My Entries shortly.",
    };
  });
}

const freeRouteSchema = z.object({
  campaignId: z.string().uuid(),
  skillResponseId: z.string().uuid().nullable(),
});

export async function requestFreeRouteEntryAction(
  input: unknown,
): Promise<ActionResult<{ status: "accepted" | "received" }>> {
  return toActionResult(async () => {
    const user = await requireUser();
    await checkRateLimit("entry:free-route", 5);
    const data = freeRouteSchema.parse(input);

    if (process.env.ENABLE_FREE_ENTRIES === "false") {
      throw new AppError("forbidden", "Free entries are currently disabled.");
    }

    const eligibility = await checkCampaignEligibility(data.campaignId, 1);
    await recordEntryComplianceDecision({
      campaignId: data.campaignId,
      userId: user.id,
      result: eligibility,
    });
    if (!eligibility.allowed) {
      throw new AppError("not_eligible", "You are not eligible to enter this campaign.");
    }

    const supabase = await getSupabaseServerClient();

    // One online free-route request per user per campaign.
    const { data: existing } = await supabase
      .from("free_entry_requests")
      .select("id, status")
      .eq("campaign_id", data.campaignId)
      .eq("user_id", user.id)
      .eq("method", "online_form")
      .maybeSingle();
    if (existing) {
      throw new AppError(
        "limit_reached",
        "You have already used the online free entry route for this campaign.",
      );
    }

    const { data: request, error } = await supabase
      .from("free_entry_requests")
      .insert({
        campaign_id: data.campaignId,
        user_id: user.id,
        method: "online_form",
        status: "received",
        details: { channel: "online_form" },
      })
      .select("id")
      .single();
    if (error || !request)
      throw new AppError("internal", "Could not record your free entry request.");

    // Issue the entry with IDENTICAL chances: one confirmed free-route entry.
    const idempotencyKey = `free-route:${data.campaignId}`;
    const { data: order, error: orderError } = await supabase.rpc("create_entry_order", {
      p_campaign_id: data.campaignId,
      p_quantity: 1,
      p_source: "free_route",
      p_idempotency_key: idempotencyKey,
      p_declared_country: eligibility.countryCode,
      p_skill_response_id: data.skillResponseId,
    });
    if (orderError) throw mapOrderError(orderError.message);

    const { error: confirmError } = await supabase.rpc("confirm_entry_order", {
      p_order_id: order.id,
      p_payment_transaction_id: null,
    });
    if (confirmError) throw mapOrderError(confirmError.message);

    // Mark the request processed (service credential; falls back to 'received').
    try {
      const admin = getSupabaseAdminClient();
      await admin
        .from("free_entry_requests")
        .update({
          status: "accepted",
          processed_at: new Date().toISOString(),
          order_id: order.id,
        })
        .eq("id", request.id);
    } catch {
      logWarn("free_entry_request_mark_skipped", { requestId: request.id });
      revalidatePath("/account/entries");
      return { status: "received" };
    }

    revalidatePath("/account/entries");
    return { status: "accepted" };
  });
}

function mapOrderError(message: string): AppError {
  if (message.includes("sold_out")) return new AppError("sold_out", "This campaign has sold out.");
  if (message.includes("per_user_limit_reached"))
    return new AppError("limit_reached", "You have reached the entry limit for this campaign.");
  if (message.includes("quantity_out_of_bounds"))
    return new AppError("validation_failed", "That quantity is not allowed for this campaign.");
  if (message.includes("spending_limit_reached"))
    return new AppError(
      "spending_limit_reached",
      "This purchase would exceed your spending limit. You can review your safeguards in your account.",
    );
  if (message.includes("self_excluded"))
    return new AppError("self_excluded", "Your account is self-excluded from entering.");
  if (message.includes("account_paused"))
    return new AppError("self_excluded", "Your account is paused from entering.");
  if (message.includes("age_unverified"))
    return new AppError(
      "verification_required",
      "Add your date of birth in Account → Profile before entering.",
    );
  if (message.includes("age_restricted"))
    return new AppError("age_restricted", "You do not meet the minimum age for this campaign.");
  if (message.includes("skill_response_required") || message.includes("skill_response_incorrect"))
    return new AppError(
      "validation_failed",
      "A correct answer to the qualifying question is required.",
    );
  if (message.includes("not_eligible"))
    return new AppError("not_eligible", "You are not eligible to enter this campaign.");
  if (message.includes("campaign_closed") || message.includes("campaign_not_active"))
    return new AppError("campaign_closed", "This campaign is not open for entries.");
  return new AppError("internal", "Could not process the entry. Please try again.");
}
