import { ProsePage, buildMetadata } from "@/components/marketing/prose-page";
import { brand } from "@/lib/config/brand";

export const metadata = buildMetadata("Privacy Policy", "What we collect, why, and your rights.");

export default function PrivacyPage() {
  return (
    <ProsePage
      eyebrow="Legal"
      title="Privacy policy"
      intro="We collect the minimum needed to run fair competitions, and we say precisely what that is."
      legalTemplate
      sections={[
        {
          heading: "What we collect",
          bullets: [
            "Account: email, display name, password hash (never the password).",
            "Profile you provide: country, region, city (optional), date of birth (age checks), legal name and phone (optional).",
            "Participation: entries, orders, payments (via our payment partner — we never store card numbers), free-route requests.",
            "Compliance: territory checks with hashed IP identifiers (raw IPs are not kept in ordinary logs), verification statuses from our KYC partner (who holds any documents).",
            "Consents and safeguard settings, with their history.",
          ],
        },
        {
          heading: "Why (legal bases)",
          bullets: [
            "Running the service and the draws you enter (contract).",
            "Age, territory and fraud checks (legal obligation / legitimate interest).",
            "Marketing only with your opt-in, revocable at any time (consent).",
          ],
        },
        {
          heading: "Retention",
          paragraphs: [
            "Financial and draw records are kept for statutory retention periods even after account closure; everything else is erased or anonymised when no longer needed.",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            `Access, rectification, erasure, portability and objection — a self-service export lives in Account → Data & privacy, and requests can go to ${brand.legalEmail}. You can complain to your supervisory authority.`,
          ],
        },
        {
          heading: "Processors",
          paragraphs: [
            "Hosting (Vercel), database/auth/storage (Supabase), payment and KYC partners as configured. Each processes data under contract and only for the purposes above.",
          ],
        },
      ]}
    />
  );
}
