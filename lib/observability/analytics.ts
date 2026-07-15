import "server-only";

import { logInfo } from "@/lib/observability/logger";

/**
 * Consent-aware analytics abstraction. The default sink is structured logs;
 * a real vendor (privacy-friendly, e.g. Plausible/PostHog) plugs in behind
 * this interface. Events never contain card data, KYC payloads or raw IPs,
 * and nothing is emitted for users who declined analytics consent.
 */

export type AnalyticsEvent =
  | { name: "campaign_viewed"; campaignId: string }
  | { name: "search_performed"; queryLength: number }
  | { name: "filter_applied"; filter: string }
  | { name: "favourite_added"; campaignId: string }
  | { name: "entry_started"; campaignId: string; route: "paid" | "free" }
  | { name: "payment_initiated"; campaignId: string }
  | { name: "payment_confirmed"; campaignId: string }
  | { name: "free_route_viewed"; campaignId: string }
  | { name: "entry_confirmed"; campaignId: string; source: string }
  | { name: "campaign_draft_created" }
  | { name: "campaign_submitted"; campaignId: string }
  | { name: "seller_application_submitted" };

export interface AnalyticsSink {
  track(event: AnalyticsEvent, userId: string | null): Promise<void>;
}

class LogAnalyticsSink implements AnalyticsSink {
  async track(event: AnalyticsEvent, userId: string | null): Promise<void> {
    logInfo("analytics_event", { ...event, hasUser: userId !== null });
  }
}

const sink: AnalyticsSink = new LogAnalyticsSink();

export async function track(
  event: AnalyticsEvent,
  options: { userId: string | null; hasConsent: boolean },
): Promise<void> {
  if (!options.hasConsent) return;
  await sink.track(event, options.userId);
}
