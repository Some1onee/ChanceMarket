import type { Locale } from "@/lib/config/brand";

/**
 * All timestamps are stored in UTC (timestamptz) and rendered in the
 * viewer's timezone at display time.
 */

export function formatDate(
  iso: string | Date,
  locale: Locale = "en-GB",
  opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
  timeZone?: string,
): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(locale, { ...opts, timeZone }).format(date);
}

export function formatDateTime(
  iso: string | Date,
  locale: Locale = "en-GB",
  timeZone?: string,
): string {
  return formatDate(iso, locale, { dateStyle: "medium", timeStyle: "short" }, timeZone);
}

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isPast: boolean;
};

/** Honest countdown: derived from the real end date, never re-anchored. */
export function countdownTo(endIso: string | Date, now: Date = new Date()): CountdownParts {
  const end = typeof endIso === "string" ? new Date(endIso) : endIso;
  const totalMs = end.getTime() - now.getTime();
  const clamped = Math.max(totalMs, 0);
  return {
    days: Math.floor(clamped / 86_400_000),
    hours: Math.floor((clamped % 86_400_000) / 3_600_000),
    minutes: Math.floor((clamped % 3_600_000) / 60_000),
    seconds: Math.floor((clamped % 60_000) / 1000),
    totalMs,
    isPast: totalMs <= 0,
  };
}

export function formatRelativeEnd(endIso: string | Date, locale: Locale = "en-GB"): string {
  const { days, hours, minutes, isPast } = countdownTo(endIso);
  if (isPast) return locale === "en-US" ? "Ended" : "Ended";
  if (days > 1) return `Ends in ${days} days`;
  if (days === 1) return `Ends in 1 day ${hours}h`;
  if (hours >= 1) return `Ends in ${hours}h ${minutes}m`;
  return `Ends in ${minutes}m`;
}

export function isWithinWindow(startIso: string, endIso: string, now: Date = new Date()): boolean {
  const t = now.getTime();
  return t >= new Date(startIso).getTime() && t < new Date(endIso).getTime();
}

/** Age in whole years from a YYYY-MM-DD date of birth. */
export function ageFromDateOfBirth(dob: string, now: Date = new Date()): number {
  const birth = new Date(`${dob}T00:00:00Z`);
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return age;
}
