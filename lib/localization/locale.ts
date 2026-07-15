import { cookies, headers } from "next/headers";
import { brand, type Locale } from "@/lib/config/brand";

export const LOCALE_COOKIE = "cm-locale";

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
  if (/en[-_]US/i.test(accept)) return "en-US";
  return brand.defaultLocale;
}
