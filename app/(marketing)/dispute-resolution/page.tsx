import { ProsePage, buildMetadata } from "@/components/marketing/prose-page";

export const metadata = buildMetadata(
  "Dispute Resolution",
  "Options when the complaints procedure isn't enough.",
);

export default function DisputeResolutionPage() {
  return (
    <ProsePage
      eyebrow="Legal"
      title="Dispute resolution"
      intro="Most issues end at the complaints stage. When they don't, these are the routes."
      legalTemplate
      sections={[
        {
          heading: "Internal disputes",
          paragraphs: [
            "Raise a dispute from your account (refund, prize, payment, conduct). Disputes are tracked with statuses, handled by the support and compliance teams, and their resolutions are recorded with named handlers.",
          ],
        },
        {
          heading: "Payment disputes",
          paragraphs: [
            "You always keep your card-scheme chargeback rights. We respond to chargebacks with the transaction and entry evidence from the audit trail. Chargebacks on legitimately delivered prizes may lead to account restriction.",
          ],
        },
        {
          heading: "Independent resolution",
          paragraphs: [
            "Where required by the launch territory, we will name an independent ADR body and consumer-protection contacts here — to be completed by counsel per territory. Nothing in this policy limits your statutory rights or your right to go to court.",
          ],
        },
      ]}
    />
  );
}
