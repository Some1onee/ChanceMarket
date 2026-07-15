import { ProsePage, buildMetadata } from "@/components/marketing/prose-page";

export const metadata = buildMetadata(
  "Official Rules",
  "The template governing every campaign, plus campaign-specific rules.",
);

export default function OfficialRulesPage() {
  return (
    <ProsePage
      eyebrow="Legal"
      title="Official rules — platform template"
      intro="Every campaign publishes its own official rules, versioned per language, based on this template. The campaign page's rules always take precedence for that campaign."
      legalTemplate
      sections={[
        {
          heading: "1. Promoter",
          paragraphs: [
            "The promoter of each campaign is the seller named on the campaign page, offering the prize through the platform. The platform operates the entry, draw and verification infrastructure.",
          ],
        },
        {
          heading: "2. Eligibility",
          paragraphs: [
            "Entrants must meet the minimum age shown on the campaign page and reside in a territory where the campaign is available. Employees of the platform, the seller and their households may not enter. Eligibility is verified before entry and again before any prize is awarded.",
          ],
        },
        {
          heading: "3. Entry",
          paragraphs: [
            "Entry routes, pricing, caps and the closing date appear on the campaign page. Where a free entry route applies, free entries carry chances identical to paid entries. Where a skill question applies, only correct answers qualify.",
          ],
        },
        {
          heading: "4. Winner selection",
          paragraphs: [
            "After close, eligible entries are frozen into a hashed snapshot and a winner is selected by a cryptographically secure server-side process. The draw record is publicly verifiable. If the provisional winner is ineligible or unresponsive for 14 days, a replacement selection from the same snapshot may be made under a controlled, dual-approved procedure.",
          ],
        },
        {
          heading: "5. Prize and handover",
          paragraphs: [
            "The prize is as described on the campaign page; no cash alternative unless stated. Handover follows the campaign's policy and is tracked until the winner confirms receipt.",
          ],
        },
        {
          heading: "6. Cancellation and refunds",
          paragraphs: [
            "If a campaign is cancelled before its draw, all paid entries are refunded in full to the original payment method.",
          ],
        },
        {
          heading: "7. Data and publicity",
          paragraphs: [
            "Winner announcements are privacy-preserving (masked identifiers) unless the winner expressly agrees otherwise. Personal data is processed per the Privacy Policy.",
          ],
        },
      ]}
    />
  );
}
