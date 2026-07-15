import type { Locale } from "@/lib/config/brand";
import { enGB, type Dictionary, type DeepPartial } from "@/lib/localization/locales/en-gb";
import { enUS } from "@/lib/localization/locales/en-us";
import { frFR } from "@/lib/localization/locales/fr-fr";
import { deDE } from "@/lib/localization/locales/de-de";

/**
 * Centralized UI strings. en-GB is the source of truth; fr-FR and de-DE are
 * full translations (typed as Dictionary so missing keys fail the build),
 * while en-US overrides only what differs. Marketing terminology adapts per
 * market (e.g. "prize draw" vs "sweepstakes").
 */

export type { Dictionary };

function deepMerge<T extends Record<string, unknown>>(base: T, override: DeepPartial<T>): T {
  const out = { ...base };
  for (const key of Object.keys(override) as (keyof T)[]) {
    const value = override[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = deepMerge(
        base[key] as Record<string, unknown>,
        value as DeepPartial<Record<string, unknown>>,
      ) as T[keyof T];
    } else if (value !== undefined) {
      out[key] = value as T[keyof T];
    }
  }
  return out;
}

const dictionaries: Record<Locale, Dictionary> = {
  "en-GB": enGB,
  "en-US": deepMerge(enGB, enUS),
  "fr-FR": frFR,
  "de-DE": deDE,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries["en-GB"];
}
