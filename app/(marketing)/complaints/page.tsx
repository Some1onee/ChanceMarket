import { ProsePage, buildMetadata } from "@/components/marketing/prose-page";
import { brand } from "@/lib/config/brand";

export const metadata = buildMetadata("Complaints", "Our complaints procedure and timelines.");

export default function ComplaintsPage() {
  return (
    <ProsePage
      eyebrow="Support"
      title="Complaints procedure"
      intro="If something went wrong, this is the formal route — with real timelines."
      legalTemplate
      sections={[
        {
          heading: "1. Tell us",
          paragraphs: [
            `Email ${brand.complaintsEmail} with your account email, the campaign or order reference, what happened and the outcome you seek. You'll get an acknowledgement with a reference within 2 business days.`,
          ],
        },
        {
          heading: "2. Investigation",
          paragraphs: [
            "A team member not involved in the original decision investigates, with access to the audit trail (entries, payments, draw records, moderation history). We aim for a full response within 14 days; if we need longer we tell you why and when.",
          ],
        },
        {
          heading: "3. Escalation",
          paragraphs: [
            "Not satisfied? Reply to escalate to a senior reviewer, then use the Dispute Resolution options. Draw-integrity complaints can always be checked against the public verification records.",
          ],
        },
        {
          heading: "What we log",
          paragraphs: [
            "Every complaint, decision and justification is recorded. Patterns feed back into moderation and compliance rules.",
          ],
        },
      ]}
    />
  );
}
