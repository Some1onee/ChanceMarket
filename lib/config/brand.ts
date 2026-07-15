/**
 * Central brand configuration. The product name is provisional — everything
 * that mentions the brand (name, wordmark, metadata, colors, contact) must
 * read from here so a rebrand is a one-file change.
 */
export const brand = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "ChanceMarket",
  /** Text wordmark parts, rendered by <Wordmark />. */
  wordmark: { primary: "Chance", secondary: "Market" },
  tagline: "Win remarkable things. Fairly.",
  description:
    "An international marketplace for prize competitions, free draws and sweepstakes — with verified sellers, transparent server-side draws and a free entry route wherever one applies.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supportEmail: "support@example.com",
  legalEmail: "legal@example.com",
  complaintsEmail: "complaints@example.com",
  /** Brand hues, referenced by emails and OG images (UI uses CSS tokens). */
  colors: {
    primary: "#4338CA",
    accent: "#0F766E",
    ink: "#1F2328",
    paper: "#FAFAF7",
  },
  social: {
    x: "https://x.com/example",
    instagram: "https://instagram.com/example",
  },
  defaultLocale: "en-GB" as const,
  locales: ["en-GB", "en-US"] as const,
  defaultCurrency: "GBP" as const,
  currencies: ["GBP", "USD"] as const,
} as const;

export type Locale = (typeof brand.locales)[number];
export type Currency = (typeof brand.currencies)[number];
