import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import { closeDueCampaigns } from "@/features/draws/service";
import { logError } from "@/lib/observability/logger";

export const maxDuration = 60;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Scheduled close job (Vercel Cron / external scheduler). Closes due
 * campaigns, snapshots, selects winners and releases expired reservations.
 * Same logic is also available as a Supabase Edge Function.
 */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await closeDueCampaigns();
    return NextResponse.json(result);
  } catch (error) {
    logError("cron_close_failed", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
