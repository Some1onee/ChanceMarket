import Link from "next/link";
import { ProsePage, buildMetadata } from "@/components/marketing/prose-page";
import { Button } from "@/components/ui/button";

export const metadata = buildMetadata(
  "Responsible Participation",
  "Spending limits, pauses, self-exclusion and where to find help.",
);

export default function ResponsibleParticipationPage() {
  return (
    <ProsePage
      eyebrow="Play safeguards"
      title="Responsible participation"
      intro="Competitions should stay fun. These tools are built into every account — and they are enforced on our servers, not just in the interface."
      sections={[
        {
          heading: "Set a spending limit",
          paragraphs: [
            "Cap what you can spend on paid entries per day, week or month. Lowering a limit applies immediately. Raising or removing one has a 24-hour cooling-off period — a pause between the impulse and the change.",
          ],
        },
        {
          heading: "Take a break",
          paragraphs: [
            "Pause all participation for a period you choose. While paused, you cannot obtain entries of any kind.",
          ],
        },
        {
          heading: "Self-exclusion",
          paragraphs: [
            "Block your account from all participation for 6 months, 12 months or indefinitely. Self-exclusion applies immediately, blocks marketing too, and cannot be lifted early.",
          ],
        },
        {
          heading: "Honest mechanics",
          bullets: [
            "Countdowns reflect real closing times and never reset.",
            "Progress bars show real allocation figures.",
            "No 'near-miss' effects, no pressure animations, no dark patterns.",
          ],
        },
        {
          heading: "If it stops feeling fun",
          paragraphs: [
            "Free, confidential support is available. In the UK: GamCare (gamcare.org.uk, 0808 8020 133) and GambleAware (begambleaware.org). In the US: the National Problem Gambling Helpline (1-800-GAMBLER). These organisations are independent from us.",
          ],
        },
      ]}
    >
      <div className="mt-10">
        <Button asChild>
          <Link href="/account/protection">Set my safeguards</Link>
        </Button>
      </div>
    </ProsePage>
  );
}
