import "server-only";

import { headers } from "next/headers";
import { createHash } from "crypto";
import { AppError } from "@/lib/errors";

/**
 * Fixed-window in-memory rate limiter keyed by (bucket, hashed client ip).
 * Suitable for a single server instance; swap the store for Redis/Upstash in
 * multi-instance deployments (interface kept deliberately small).
 * Raw IPs are hashed with a server salt and never stored.
 */

type WindowRecord = { count: number; resetAt: number };

const store = new Map<string, WindowRecord>();
const WINDOW_MS = 60_000;
const MAX_STORE = 50_000;

function hashIp(ip: string): string {
  const salt = process.env.APP_ENCRYPTION_KEY ?? "dev-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 24);
}

export async function getClientIpHash(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown";
  return hashIp(ip);
}

export async function checkRateLimit(bucket: string, maxPerMinute: number): Promise<void> {
  const ipHash = await getClientIpHash();
  const key = `${bucket}:${ipHash}`;
  const now = Date.now();

  if (store.size > MAX_STORE) {
    for (const [k, v] of store) {
      if (v.resetAt < now) store.delete(k);
    }
  }

  const record = store.get(key);
  if (!record || record.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  record.count += 1;
  if (record.count > maxPerMinute) {
    throw new AppError("rate_limited", "Too many requests. Please wait a minute and try again.");
  }
}
