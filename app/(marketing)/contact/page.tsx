import { ProsePage, buildMetadata } from "@/components/marketing/prose-page";
import { brand } from "@/lib/config/brand";

export const metadata = buildMetadata("Contact", "How to reach the right team.");

export default function ContactPage() {
  return (
    <ProsePage
      eyebrow="Support"
      title="Contact us"
      intro="Route your message to the right inbox and it gets answered faster."
      sections={[
        {
          heading: "Support",
          paragraphs: [
            `Account, entries, payments and prizes: ${brand.supportEmail}. Signed-in members can also open a support thread from the Help Centre — replies appear in your notifications.`,
          ],
        },
        {
          heading: "Complaints",
          paragraphs: [
            `Formal complaints: ${brand.complaintsEmail} — see the Complaints page for the procedure and timelines.`,
          ],
        },
        {
          heading: "Legal & privacy",
          paragraphs: [`Data requests and legal notices: ${brand.legalEmail}.`],
        },
        {
          heading: "Sellers",
          paragraphs: [
            "Questions about applications, moderation decisions or settlements: use your seller dashboard's contact link so your case is attached to your account.",
          ],
        },
      ]}
    />
  );
}
