import { cookies, headers } from "next/headers";
import { brand, type Locale } from "@/lib/config/brand";
import { LOCALE_COOKIE } from "@/lib/localization/constants";

export { LOCALE_COOKIE };

export function isLocale(value: string): value is Locale {
  return (brand.locales as readonly string[]).includes(value);
}

/** Resolve the request locale: cookie first, then Accept-Language, then default. */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (fromCookie && isLocale(fromCookie)) return fromCookie;

  const headerStore = await headers();
  const accept = headerStore.get("accept-language") ?? "";
  for (const part of accept.split(",")) {
    const tag = part.split(";")[0]!.trim();
    if (/^en[-_]US/i.test(tag)) return "en-US";
    if (/^fr/i.test(tag)) return "fr-FR";
    if (/^de/i.test(tag)) return "de-DE";
    if (/^en/i.test(tag)) return "en-GB";
  }
  return brand.defaultLocale;
}
