import { ProsePage, buildMetadata } from "@/components/marketing/prose-page";

export const metadata = buildMetadata(
  "Prohibited Items",
  "Categories that can never be listed, and categories requiring enhanced review.",
);

export default function ProhibitedItemsPage() {
  return (
    <ProsePage
      eyebrow="Policy"
      title="Prohibited items"
      intro="This policy is configurable per territory and enforced at listing time, at moderation, and by ongoing monitoring. When in doubt, we refuse."
      legalTemplate
      sections={[
        {
          heading: "Never allowed",
          bullets: [
            "Weapons, ammunition and weapon parts",
            "Drugs, drug paraphernalia and regulated medicines",
            "Counterfeit or replica branded goods",
            "Stolen goods or items with unverifiable provenance",
            "Protected wildlife and products from protected species",
            "Hazardous or recalled products",
            "Illegal services of any kind",
            "Financial instruments, securities, crypto-assets and cash-equivalents",
            "Items requiring a licence to transfer that the seller does not hold",
            "Any prize without acceptable proof of ownership",
          ],
        },
        {
          heading: "Enhanced review",
          bullets: [
            "Vehicles — documented transfer workflow, registration and tax checks",
            "Property — only where the jurisdiction, payment provider, insurance and operational workflow explicitly permit; never enabled by default",
            "High-value collectibles — authentication evidence required",
            "Age-restricted products — only where lawful with reinforced age verification",
          ],
        },
        {
          heading: "How enforcement works",
          paragraphs: [
            "Category rules live in the compliance engine per territory: a category not explicitly allowed in an active jurisdiction cannot be listed there. Moderators can block, request documents, escalate, or remove live listings; users can report any campaign in two taps.",
          ],
        },
      ]}
    />
  );
}
