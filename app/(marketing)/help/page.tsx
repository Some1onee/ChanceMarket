import Link from "next/link";
import { buildMetadata } from "@/components/marketing/prose-page";
import { Section } from "@/components/marketing/section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export const metadata = buildMetadata(
  "Help Centre",
  "Answers to common questions, and how to reach support.",
);

const FAQS: { q: string; a: string }[] = [
  {
    q: "Where are my entries and receipts?",
    a: "Account → My entries lists every order with its status, amount and campaign. Each confirmed order shows the number of entries it issued.",
  },
  {
    q: "How do I verify a draw?",
    a: "Open the draw record linked from the campaign page (or /draws). It shows the frozen snapshot hash, the revealed seed and the winning position, plus the exact formula to recompute it.",
  },
  {
    q: "When do I get a refund?",
    a: "Automatically and in full if a campaign is cancelled before its draw. Other cases follow the campaign's official rules — raise a dispute from the Help Centre if something looks wrong.",
  },
  {
    q: "Why can't I enter a campaign?",
    a: "The most common reasons: your territory isn't covered by the campaign's rules, your date of birth isn't on file, a spending limit or pause is active, or the campaign hit its cap. The entry page always tells you which one applies.",
  },
  {
    q: "How do I change or delete my account?",
    a: "Profile settings cover most changes. Account → Data & privacy has a full data export and account closure. Records we must keep by law (payments, draw results) are retained for the statutory period.",
  },
  {
    q: "How do payouts work for sellers?",
    a: "Funds are held during the campaign, itemised in your ledger-backed statement, and released after the winner confirms receipt of the prize.",
  },
];

export default function HelpPage() {
  return (
    <Section
      eyebrow="Support"
      title="Help centre"
      description="Quick answers first — humans right behind."
    >
      <Accordion type="single" collapsible className="w-full">
        {FAQS.map((faq, index) => (
          <AccordionItem key={index} value={`faq-${index}`}>
            <AccordionTrigger>{faq.q}</AccordionTrigger>
            <AccordionContent>{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/contact">Contact support</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/complaints">Make a complaint</Link>
        </Button>
      </div>
    </Section>
  );
}
