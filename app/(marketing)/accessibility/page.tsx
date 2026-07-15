import { ProsePage, buildMetadata } from "@/components/marketing/prose-page";
import { brand } from "@/lib/config/brand";

export const metadata = buildMetadata(
  "Accessibility",
  "Our accessibility commitment and how to reach us.",
);

export default function AccessibilityPage() {
  return (
    <ProsePage
      eyebrow="Accessibility"
      title="Accessibility statement"
      intro="Everyone should be able to browse, enter and verify draws. We target WCAG 2.2 AA."
      sections={[
        {
          heading: "What we build for",
          bullets: [
            "Full keyboard navigation with visible focus everywhere.",
            "Screen-reader labels on all controls, live regions for timers and toasts.",
            "WCAG AA contrast in both light and dark themes.",
            "Respect for prefers-reduced-motion; no flashing or slot-machine effects.",
            "Touch targets of at least 44px on interactive elements.",
            "Text alternatives on prize imagery, required at upload time.",
          ],
        },
        {
          heading: "Known limitations",
          paragraphs: [
            "Provider-hosted payment or verification flows may not fully meet our standards; we raise issues with vendors and provide assisted alternatives via support.",
          ],
        },
        {
          heading: "Feedback",
          paragraphs: [
            `If anything is hard to use with assistive technology, contact ${brand.supportEmail} — accessibility reports are triaged with priority.`,
          ],
        },
      ]}
    />
  );
}
