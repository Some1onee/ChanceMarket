import { NextResponse, type NextRequest } from "next/server";
import { ingestPaymentWebhook } from "@/lib/payments/service";
import { logError } from "@/lib/observability/logger";

/**
 * Payment provider webhook endpoint.
 * - signature verified (HMAC / provider scheme) before anything else
 * - events stored with a unique (provider, event_id) ⇒ replays are no-ops
 * - processing is idempotent end-to-end
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-webhook-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const payload = await request.text();
  if (payload.length > 100_000) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  try {
    const result = await ingestPaymentWebhook({ payload, signature });
    if (result.status === "failed") {
      // 500 so the provider retries.
      return NextResponse.json({ status: "failed" }, { status: 500 });
    }
    return NextResponse.json({ status: result.status });
  } catch (error) {
    logError("webhook_rejected", error);
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
}
