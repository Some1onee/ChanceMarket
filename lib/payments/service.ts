import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPaymentProvider, getMockProvider } from "@/lib/payments";
import type { WebhookEvent } from "@/lib/payments/types";
import { AppError } from "@/lib/errors";
import { isCurrency } from "@/lib/money";
import { logError, logInfo } from "@/lib/observability/logger";

/**
 * Payment orchestration. Everything here runs with the service key and is
 * idempotent: payment transactions key on idempotency_key, webhook events on
 * (provider, event_id), ledger rows on their own idempotency keys.
 */

const PLATFORM_FEE_FALLBACK_BP = 1000; // 10% — overridden by platform_fees rows

export async function startPaidOrderCheckout(params: {
  orderId: string;
}): Promise<{ transactionId: string; intentId: string }> {
  const admin = getSupabaseAdminClient();

  const { data: order } = await admin
    .from("entry_orders")
    .select("*")
    .eq("id", params.orderId)
    .single();
  if (!order) throw new AppError("not_found", "Order not found.");
  if (order.total_minor <= 0) throw new AppError("state_conflict", "Order is not payable.");
  if (order.status !== "awaiting_payment") {
    // Idempotency: an existing transaction for this order is reused.
    const { data: existing } = await admin
      .from("payment_transactions")
      .select("id, provider_intent_id")
      .eq("order_id", order.id)
      .maybeSingle();
    if (existing?.provider_intent_id) {
      return { transactionId: existing.id, intentId: existing.provider_intent_id };
    }
    throw new AppError("state_conflict", `Order is ${order.status}.`);
  }

  const currency = isCurrency(order.currency) ? order.currency : "GBP";
  const provider = getPaymentProvider();

  const idempotencyKey = `order:${order.id}`;
  const { data: existingTx } = await admin
    .from("payment_transactions")
    .select("id, provider_intent_id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existingTx?.provider_intent_id) {
    return { transactionId: existingTx.id, intentId: existingTx.provider_intent_id };
  }

  const intent = await provider.createPaymentIntent({
    customerId: null,
    amountMinor: order.total_minor,
    currency,
    idempotencyKey,
    metadata: { order_id: order.id, campaign_id: order.campaign_id },
  });

  const { data: transaction, error } = await admin
    .from("payment_transactions")
    .insert({
      user_id: order.user_id,
      order_id: order.id,
      provider: provider.name,
      provider_intent_id: intent.id,
      amount_minor: order.total_minor,
      currency,
      status: "created",
      idempotency_key: idempotencyKey,
    })
    .select("id")
    .single();
  if (error || !transaction) {
    logError("payment_tx_insert_failed", error);
    throw new AppError("internal", "Could not start the payment.");
  }

  await admin.from("entry_orders").update({ status: "processing" }).eq("id", order.id);
  await provider.confirmPayment({ intentId: intent.id });

  return { transactionId: transaction.id, intentId: intent.id };
}

/**
 * DEV/DEMO: ask the mock provider for the intent outcome and deliver it
 * through the SAME signed-webhook pipeline a real provider would use.
 */
export async function simulateMockOutcome(intentId: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { data: transaction } = await admin
    .from("payment_transactions")
    .select("provider_intent_id, amount_minor, currency, provider")
    .eq("provider_intent_id", intentId)
    .single();
  if (!transaction || transaction.provider !== "mock") return;

  const mock = getMockProvider();
  const { payload, signature } = mock.buildOutcomeWebhook({
    intentId,
    amountMinor: transaction.amount_minor,
    currency: transaction.currency,
  });
  await ingestPaymentWebhook({ payload, signature });
}

/** Signature-verified, replay-proof webhook ingestion. */
export async function ingestPaymentWebhook(params: {
  payload: string;
  signature: string;
}): Promise<{ status: "processed" | "duplicate" | "failed" }> {
  const provider = getPaymentProvider();
  provider.verifyWebhook({ payload: params.payload, signature: params.signature }); // throws when invalid

  const event = provider.parseWebhook({ payload: params.payload });
  const admin = getSupabaseAdminClient();

  const { error: insertError } = await admin.from("webhook_events").insert({
    provider: provider.name,
    event_id: event.id,
    event_type: event.type,
    payload: event.raw,
    status: "received",
  });
  if (insertError) {
    // unique violation ⇒ replay: acknowledge without reprocessing.
    logInfo("webhook_replay_ignored", { eventId: event.id });
    return { status: "duplicate" };
  }

  try {
    await processPaymentEvent(event);
    await admin
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("provider", provider.name)
      .eq("event_id", event.id);
    return { status: "processed" };
  } catch (error) {
    logError("webhook_processing_failed", error, { eventId: event.id, type: event.type });
    await admin
      .from("webhook_events")
      .update({ status: "failed", error: error instanceof Error ? error.message : "unknown" })
      .eq("provider", provider.name)
      .eq("event_id", event.id);
    return { status: "failed" };
  }
}

async function processPaymentEvent(event: WebhookEvent): Promise<void> {
  const admin = getSupabaseAdminClient();
  if (!event.paymentIntentId) return;

  const { data: transaction } = await admin
    .from("payment_transactions")
    .select("*")
    .eq("provider_intent_id", event.paymentIntentId)
    .single();
  if (!transaction) throw new Error(`unknown payment intent ${event.paymentIntentId}`);

  switch (event.type) {
    case "payment.succeeded": {
      if (transaction.status === "succeeded") return; // idempotent
      await admin
        .from("payment_transactions")
        .update({ status: "succeeded" })
        .eq("id", transaction.id);

      if (transaction.order_id) {
        const { data: order, error } = await admin.rpc("confirm_entry_order", {
          p_order_id: transaction.order_id,
          p_payment_transaction_id: transaction.id,
        });
        if (error) throw new Error(`confirm_entry_order failed: ${error.message}`);

        await recordEntryPaymentLedger(transaction.id, order.campaign_id, transaction);

        await admin.rpc("enqueue_notification", {
          p_user_id: transaction.user_id,
          p_kind: "entry_confirmed",
          p_title: "Entry confirmed",
          p_body: "Your entries are confirmed. Good luck!",
          p_href: "/account/entries",
        });
      }
      break;
    }
    case "payment.failed": {
      await admin
        .from("payment_transactions")
        .update({
          status: "failed",
          failure_reason: String(event.raw.failure_reason ?? "declined"),
        })
        .eq("id", transaction.id);
      if (transaction.order_id) {
        await admin.rpc("cancel_entry_order", {
          p_order_id: transaction.order_id,
          p_reason: "payment_failed",
        });
        await admin.rpc("enqueue_notification", {
          p_user_id: transaction.user_id,
          p_kind: "payment_failed",
          p_title: "Payment failed",
          p_body: "Your entry payment did not go through. No entries were issued.",
          p_href: "/account/entries",
        });
      }
      break;
    }
    case "payment.cancelled": {
      await admin
        .from("payment_transactions")
        .update({ status: "cancelled" })
        .eq("id", transaction.id);
      if (transaction.order_id) {
        await admin.rpc("cancel_entry_order", {
          p_order_id: transaction.order_id,
          p_reason: "payment_cancelled",
        });
      }
      break;
    }
    case "refund.succeeded": {
      const amount = event.amountMinor ?? 0;
      const refundedTotal = transaction.refunded_minor + amount;
      await admin
        .from("payment_transactions")
        .update({
          refunded_minor: refundedTotal,
          status: refundedTotal >= transaction.amount_minor ? "refunded" : "partially_refunded",
        })
        .eq("id", transaction.id);
      break;
    }
    case "dispute.created": {
      await admin
        .from("payment_transactions")
        .update({ status: "disputed" })
        .eq("id", transaction.id);
      break;
    }
    default:
      logInfo("webhook_event_unhandled", { type: event.type });
  }
}

async function recordEntryPaymentLedger(
  transactionId: string,
  campaignId: string,
  transaction: { amount_minor: number; currency: string },
): Promise<void> {
  const admin = getSupabaseAdminClient();

  const { data: campaign } = await admin
    .from("campaigns")
    .select("seller_id")
    .eq("id", campaignId)
    .single();
  if (!campaign) return;

  const { data: fee } = await admin
    .from("platform_fees")
    .select("basis_points, fixed_minor")
    .eq("campaign_id", campaignId)
    .maybeSingle();
  const basisPoints = fee?.basis_points ?? PLATFORM_FEE_FALLBACK_BP;
  const feeMinor =
    Math.round((transaction.amount_minor * basisPoints) / 10_000) + (fee?.fixed_minor ?? 0);

  const entries: Array<{
    entry_type: string;
    account: string;
    account_ref: string | null;
    amount_minor: number;
    memo: string;
    suffix: string;
  }> = [
    {
      entry_type: "entry_payment",
      account: "seller",
      account_ref: campaign.seller_id,
      amount_minor: transaction.amount_minor,
      memo: "Entry payment (gross)",
      suffix: "gross",
    },
    {
      entry_type: "platform_fee",
      account: "seller",
      account_ref: campaign.seller_id,
      amount_minor: -feeMinor,
      memo: `Platform fee ${basisPoints} bp`,
      suffix: "fee-seller",
    },
    {
      entry_type: "platform_fee",
      account: "platform",
      account_ref: null,
      amount_minor: feeMinor,
      memo: `Platform fee ${basisPoints} bp`,
      suffix: "fee-platform",
    },
  ];

  for (const entry of entries) {
    const { error } = await admin.rpc("record_ledger_entry", {
      p_entry_type: entry.entry_type,
      p_account: entry.account,
      p_account_ref: entry.account_ref,
      p_campaign_id: campaignId,
      p_payment_transaction_id: transactionId,
      p_amount_minor: entry.amount_minor,
      p_currency: transaction.currency,
      p_memo: entry.memo,
      p_idempotency_key: `tx:${transactionId}:${entry.suffix}`,
    });
    if (error) logError("ledger_entry_failed", error, { transactionId, suffix: entry.suffix });
  }

  await admin.rpc("refresh_seller_balance", {
    p_seller_id: campaign.seller_id,
    p_currency: transaction.currency,
  });
}

/** Full or partial refund, provider-backed, ledger-recorded. */
export async function refundTransaction(params: {
  transactionId: string;
  amountMinor: number;
  reason: string;
  requestedBy: string | null;
}): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { data: transaction } = await admin
    .from("payment_transactions")
    .select("*")
    .eq("id", params.transactionId)
    .single();
  if (!transaction) throw new AppError("not_found", "Payment not found.");
  if (!["succeeded", "partially_refunded", "disputed"].includes(transaction.status)) {
    throw new AppError("state_conflict", "This payment cannot be refunded.");
  }
  const remaining = transaction.amount_minor - transaction.refunded_minor;
  if (params.amountMinor <= 0 || params.amountMinor > remaining) {
    throw new AppError("validation_failed", "Refund amount exceeds the refundable balance.");
  }

  const idempotencyKey = `refund:${params.transactionId}:${transaction.refunded_minor + params.amountMinor}`;
  const provider = getPaymentProvider();
  const result = await provider.refundPayment({
    intentId: transaction.provider_intent_id ?? "",
    amountMinor: params.amountMinor,
    reason: params.reason,
    idempotencyKey,
  });

  await admin.from("refunds").insert({
    payment_transaction_id: params.transactionId,
    amount_minor: params.amountMinor,
    currency: transaction.currency,
    reason: params.reason,
    status: result.status,
    provider_refund_id: result.id,
    requested_by: params.requestedBy,
  });

  if (result.status === "succeeded") {
    const refundedTotal = transaction.refunded_minor + params.amountMinor;
    await admin
      .from("payment_transactions")
      .update({
        refunded_minor: refundedTotal,
        status: refundedTotal >= transaction.amount_minor ? "refunded" : "partially_refunded",
      })
      .eq("id", params.transactionId);

    // Reverse ledger proportionally.
    if (transaction.order_id) {
      const { data: order } = await admin
        .from("entry_orders")
        .select("campaign_id")
        .eq("id", transaction.order_id)
        .single();
      if (order) {
        const { data: campaign } = await admin
          .from("campaigns")
          .select("seller_id")
          .eq("id", order.campaign_id)
          .single();
        if (campaign) {
          await admin.rpc("record_ledger_entry", {
            p_entry_type: "refund",
            p_account: "seller",
            p_account_ref: campaign.seller_id,
            p_campaign_id: order.campaign_id,
            p_payment_transaction_id: params.transactionId,
            p_amount_minor: -params.amountMinor,
            p_currency: transaction.currency,
            p_memo: `Refund: ${params.reason}`,
            p_idempotency_key: `${idempotencyKey}:ledger`,
          });
          await admin.rpc("refresh_seller_balance", {
            p_seller_id: campaign.seller_id,
            p_currency: transaction.currency,
          });
        }
      }
    }

    await admin.rpc("enqueue_notification", {
      p_user_id: transaction.user_id,
      p_kind: "refund",
      p_title: "Refund issued",
      p_body: "A refund has been issued to your original payment method.",
      p_href: "/account/entries",
    });
  }
}
