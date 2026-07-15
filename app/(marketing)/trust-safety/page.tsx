import { ProsePage, buildMetadata } from "@/components/marketing/prose-page";

export const metadata = buildMetadata(
  "Trust & Safety",
  "Verified sellers, human moderation, auditable draws and player protections.",
);

export default function TrustSafetyPage() {
  return (
    <ProsePage
      eyebrow="Trust & safety"
      title="How we keep the marketplace honest"
      intro="Trust is the product. These are the concrete mechanisms behind it — not slogans."
      sections={[
        {
          heading: "Verified sellers only",
          bullets: [
            "Identity (KYC) or business (KYB) verification before approval.",
            "Proof of prize ownership or authorisation reviewed at moderation.",
            "Manual approval by our team; publishing limits for new sellers.",
          ],
        },
        {
          heading: "Every campaign is moderated",
          bullets: [
            "Human review of photos, documents, pricing and official rules.",
            "Prohibited categories are blocked; sensitive ones get extra review.",
            "Anyone can report a listing — reports go straight to the queue.",
          ],
        },
        {
          heading: "Auditable draws",
          bullets: [
            "Eligible entries frozen and hashed before selection.",
            "Cryptographically secure server-side selection; public draw records.",
            "Re-draws only under a controlled procedure with two named admin approvers, publicly recorded.",
          ],
        },
        {
          heading: "Territory-aware by design",
          paragraphs: [
            "No campaign format is enabled anywhere by default. Formats, categories, prices, ages and free-route requirements are all controlled per territory in a versioned rule engine — and enforcement happens on the server and in the database, never just in the interface.",
          ],
        },
        {
          heading: "Your money",
          bullets: [
            "Payments processed by payment partners — we never see card numbers.",
            "Automatic full refunds if a campaign is cancelled before its draw.",
            "Seller funds held until the prize handover is confirmed.",
          ],
        },
      ]}
    />
  );
}
