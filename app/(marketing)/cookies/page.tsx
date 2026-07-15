import { ProsePage, buildMetadata } from "@/components/marketing/prose-page";

export const metadata = buildMetadata("Cookies", "The cookies we set and why.");

export default function CookiesPage() {
  return (
    <ProsePage
      eyebrow="Legal"
      title="Cookie policy"
      intro="We use a deliberately small set of cookies."
      legalTemplate
      sections={[
        {
          heading: "Strictly necessary",
          bullets: [
            "Authentication session cookies (Supabase) — keep you signed in securely.",
            "Locale preference (cm-locale) — remembers your language/format choice.",
            "Theme preference — stored in localStorage, not sent to servers.",
          ],
        },
        {
          heading: "Analytics",
          paragraphs: [
            "Analytics run only behind a consent-aware abstraction. No analytics identifiers are set without consent, and events never include card data, KYC results or precise location.",
          ],
        },
        {
          heading: "Third parties",
          paragraphs: [
            "Payment and verification partners may set their own cookies within their hosted flows, governed by their policies.",
          ],
        },
      ]}
    />
  );
}
