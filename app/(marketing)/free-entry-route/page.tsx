import { ProsePage, buildMetadata } from "@/components/marketing/prose-page";

export const metadata = buildMetadata(
  "Free Entry Route",
  "How to enter without paying — identical chances, clearly explained.",
);

export default function FreeEntryRoutePage() {
  return (
    <ProsePage
      eyebrow="Free entry route"
      title="Enter without paying"
      intro="Where a free entry route applies, it is a real route with identical chances — not a buried footnote."
      sections={[
        {
          heading: "The principle",
          paragraphs: [
            "Campaigns that offer (or are required to offer) a free entry route accept entries at no cost with exactly the same winning chances as paid entries. Free entries go into the same frozen snapshot and the same draw. We never weight, delay or hide them.",
          ],
        },
        {
          heading: "Online free entry",
          bullets: [
            "Open the campaign page and choose “Free entry route”.",
            "Answer the qualifying skill question if the campaign has one — the same requirement applies to paid entries.",
            "One online free entry per person per campaign, recorded instantly with a receipt in your account.",
          ],
        },
        {
          heading: "Postal free entry",
          bullets: [
            "Where the campaign's rules provide a postal route, send an unenclosed card with your name, the email on your account and the campaign reference to the address in the official rules.",
            "One request per card, received before the closing date. Requests are logged on receipt and processed with proof of handling.",
            "Illegible or incomplete requests cannot be processed — the rules state exactly what is required.",
          ],
        },
        {
          heading: "What we log",
          paragraphs: [
            "Every free-route request is recorded (received, accepted, rejected or duplicate) with its processing history, so the equal-chances promise is auditable — by regulators and by you.",
          ],
        },
      ]}
    />
  );
}
