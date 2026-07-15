import { ProsePage, buildMetadata } from "@/components/marketing/prose-page";
import { brand } from "@/lib/config/brand";

export const metadata = buildMetadata("Terms of Service", "The agreement governing your use of the marketplace.");

export default function TermsPage() {
  return (
    <ProsePage
      eyebrow="Legal"
      title="Terms of service"
      intro={`These terms govern your use of ${brand.name}.`}
      legalTemplate
      sections={[
        {
          heading: "1. The service",
          paragraphs: [
            `${brand.name} is a marketplace where approved sellers run prize campaigns and members obtain entries under each campaign's official rules. The platform operates entries, payments, compliance checks, draws and verification; sellers remain the promoters of their campaigns.`,
          ],
        },
        {
          heading: "2. Accounts",
          bullets: [
            "One account per person; accurate information; you are responsible for your credentials.",
            "Minimum age: 18 or higher where a campaign or territory requires it.",
            "We may restrict accounts for fraud, abuse, or legal reasons — with reasons given and an appeal route.",
          ],
        },
        {
          heading: "3. Entries and payments",
          bullets: [
            "An entry exists only once confirmed server-side; receipts appear in your account.",
            "Prices, caps and closing dates are those on the campaign page at the time of entry.",
            "Payments are processed by payment partners; refunds follow the refund policy in the official rules.",
            "Safeguard settings (limits, pauses, self-exclusion) are enforced and cannot be bypassed by re-entry.",
          ],
        },
        {
          heading: "4. Draws",
          paragraphs: [
            "Winners are selected by the auditable server-side process described in the official rules, with public verification records. Controlled re-draws require documented dual approval.",
          ],
        },
        {
          heading: "5. Acceptable use",
          bullets: [
            "No multiple accounts, automation, location misrepresentation or entry manipulation.",
            "No abuse of the free entry route beyond what the rules permit.",
            "No interference with other members, sellers or the service.",
          ],
        },
        {
          heading: "6. Liability & disputes",
          paragraphs: [
            "Nothing excludes liability that cannot lawfully be excluded. Complaints follow the Complaints procedure, then the Dispute Resolution policy. Governing law and forum: to be fixed per launch territory by counsel.",
          ],
        },
      ]}
    />
  );
}
