import { ProsePage, buildMetadata } from "@/components/marketing/prose-page";

export const metadata = buildMetadata(
  "How it works",
  "From browsing to the draw: how entries, free routes and verification work.",
);

export default function HowItWorksPage() {
  return (
    <ProsePage
      eyebrow="Guide"
      title="How it works"
      intro="From browsing to the draw, here is exactly what happens — including the parts most platforms keep vague."
      sections={[
        {
          heading: "1. Sellers list a prize",
          paragraphs: [
            "Approved sellers list one specific item with photos, a declared value backed by documents, and a handover policy. Every campaign is checked by human moderation before it can go live, and only in territories where its format is permitted.",
          ],
        },
        {
          heading: "2. You get entries",
          bullets: [
            "Paid entries: a fixed price per entry, with per-order and per-person caps shown up front.",
            "Free entry route: where one applies, free entries carry identical winning chances — no purchase necessary.",
            "Skill questions: some formats require answering a genuine question correctly before your entry qualifies. Answers are checked on our servers.",
            "Everything is confirmed server-side: eligibility, age, caps and payment are re-checked in the database before an entry exists.",
          ],
        },
        {
          heading: "3. The campaign closes",
          paragraphs: [
            "At the closing time (or when sold out), entries stop. In-flight payments settle, unpaid orders are cancelled, and the final list of eligible entries is frozen into a snapshot whose SHA-256 hash is recorded. After the draw, the snapshot can never change.",
          ],
        },
        {
          heading: "4. A verifiable draw",
          paragraphs: [
            "A cryptographically secure random source selects the winning position — never in a browser, never with Math.random(). The draw record (snapshot hash, revealed seed, winning position) is published on a public verification page so anyone can recompute the result.",
          ],
        },
        {
          heading: "5. Winner verification and handover",
          paragraphs: [
            "The provisional winner is checked for eligibility. Once verified, the handover starts per the campaign's policy — delivery, collection or a documented transfer for vehicles. You confirm receipt in your account, which releases the seller's settlement.",
          ],
        },
      ]}
    />
  );
}
