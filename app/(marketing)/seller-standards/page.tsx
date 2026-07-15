import { ProsePage, buildMetadata } from "@/components/marketing/prose-page";

export const metadata = buildMetadata(
  "Seller Standards",
  "What we require from every seller, before and after approval.",
);

export default function SellerStandardsPage() {
  return (
    <ProsePage
      eyebrow="For sellers"
      title="Seller standards"
      intro="Selling here is a privilege that rests on verifiable honesty. These standards are contractual."
      legalTemplate
      sections={[
        {
          heading: "Before approval",
          bullets: [
            "Complete identity (KYC) or business (KYB) verification.",
            "Accept these standards and the seller terms.",
            "Pass a manual review by our team.",
          ],
        },
        {
          heading: "Every listing must",
          bullets: [
            "Describe one specific item you own or are authorised to offer, with proof available.",
            "Use your own genuine photographs of the actual item.",
            "Declare a value supported by documentation (valuation, invoice, market evidence).",
            "State a realistic handover policy with timescales and insurance where relevant.",
            "Include official rules based on the platform template, adapted to the campaign.",
          ],
        },
        {
          heading: "Never",
          bullets: [
            "List prohibited items or categories requiring licences you do not hold.",
            "Enter your own campaigns, directly or through associates.",
            "Contact winners outside the platform's fulfilment flow.",
            "Manipulate progress, reviews or Q&A.",
          ],
        },
        {
          heading: "Money and settlement",
          paragraphs: [
            "Entry revenue is held by the platform's payment partner. Settlement is released after winner verification and confirmed prize handover, itemising gross, provider fees, platform commission, taxes, reserves and refunds. Chargebacks and disputes may create reserves per the seller terms.",
          ],
        },
        {
          heading: "Enforcement",
          paragraphs: [
            "Breaches lead to listing removal, campaign cancellation with refunds at your cost, suspension or termination, and where legally required, reports to authorities. Appeals are reviewed by a person, not an algorithm.",
          ],
        },
      ]}
    />
  );
}
