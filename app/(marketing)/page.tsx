import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Fingerprint,
  Gift,
  Landmark,
  Lock,
  ScanSearch,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section } from "@/components/marketing/section";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import {
  getEndingSoonCampaigns,
  getFeaturedCampaigns,
  listActiveCategories,
} from "@/features/campaigns/queries";
import { getDictionary } from "@/lib/localization/dictionaries";
import { getLocale } from "@/lib/localization/locale";
import { brand } from "@/lib/config/brand";

export default async function HomePage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const [featured, endingSoon, categories] = await Promise.all([
    getFeaturedCampaigns(6),
    getEndingSoonCampaigns(4),
    listActiveCategories(),
  ]);

  return (
    <>
      {/* Hero */}
      <div className="prize-spotlight relative overflow-hidden border-b border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28 sm:pb-24">
          <Badge variant="accent" className="px-3 py-1">
            <ShieldCheck aria-hidden /> Every draw is server-side, hashed and verifiable
          </Badge>
          <h1 className="max-w-3xl font-display text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            {t.home.heroTitle}
          </h1>
          <p className="max-w-2xl text-lg text-balance text-muted-foreground">
            {t.home.heroSubtitle}
          </p>

          <form action="/campaigns" method="GET" role="search" className="w-full max-w-xl">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-md">
              <Search className="ml-2 size-5 shrink-0 text-muted-foreground" aria-hidden />
              <label htmlFor="home-search" className="sr-only">
                {t.common.search}
              </label>
              <input
                id="home-search"
                name="q"
                type="search"
                placeholder={t.home.searchPlaceholder}
                className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button type="submit" size="md" className="shrink-0">
                {t.common.search}
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="size-4 text-accent" aria-hidden /> Verified sellers only
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Gift className="size-4 text-accent" aria-hidden /> {t.legal.noPurchaseNecessary}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="size-4 text-accent" aria-hidden /> 18+ · play responsibly
            </span>
          </div>
        </div>
      </div>

      {/* Featured campaigns */}
      <Section
        eyebrow="Live now"
        title={t.home.featured}
        description="Hand-checked listings from approved sellers. Availability depends on your region."
      >
        {featured.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((campaign, index) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                locale={locale}
                dictionary={t}
                priority={index < 3}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-subtle p-10 text-center text-sm text-muted-foreground">
            Competitions will appear here once the database is seeded — run{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">pnpm db:reset</code>{" "}
            against your Supabase stack.
          </div>
        )}
        <div className="mt-8 text-center">
          <Button variant="outline" asChild>
            <Link href="/campaigns">
              {t.home.browseAll} <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </Section>

      {/* Categories */}
      {categories.length > 0 ? (
        <Section eyebrow="Explore" title={t.home.categories} className="pt-0">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/campaigns?category=${category.slug}`}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:border-primary hover:text-primary"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Ending soon */}
      {endingSoon.length > 0 ? (
        <Section eyebrow="Last chance" title={t.home.endingSoon} className="pt-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {endingSoon.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} locale={locale} dictionary={t} />
            ))}
          </div>
        </Section>
      ) : null}

      {/* How it works */}
      <div className="border-y border-border bg-subtle">
        <Section
          eyebrow="How it works"
          title="Three steps, no tricks"
          align="center"
          description="The mechanics are simple by design — and the important parts happen on our servers, not in your browser."
        >
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <ScanSearch className="size-6" aria-hidden />,
                step: "1",
                title: "Pick a prize",
                body: "Browse campaigns from verified sellers. Every listing shows its odds inputs: total entries, price, closing date and official rules.",
              },
              {
                icon: <Ticket className="size-6" aria-hidden />,
                step: "2",
                title: "Get your entries",
                body: "Enter with a paid ticket, the free entry route where one applies, or by answering a qualifying skill question — depending on the campaign and your region.",
              },
              {
                icon: <Trophy className="size-6" aria-hidden />,
                step: "3",
                title: "Verifiable draw",
                body: "At close, the eligible entry list is frozen and hashed, then a cryptographically secure draw selects the winner. You can audit the result on the draw's public page.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-border bg-card p-6 shadow-xs"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    {item.icon}
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    step {item.step}/3
                  </span>
                </div>
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Transparency */}
      <Section
        eyebrow="Transparency"
        title="A draw you can check, not just trust"
        description="Every completed draw publishes a verification record. No draw ever runs in a browser, and no one — including us — can silently re-run one."
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <ul className="space-y-4">
            {[
              {
                icon: <Fingerprint aria-hidden />,
                title: "Frozen, hashed entry list",
                body: "Before selection, the eligible entries are snapshotted and hashed (SHA-256). The snapshot can never change after the draw.",
              },
              {
                icon: <Lock aria-hidden />,
                title: "Cryptographic randomness",
                body: "Winners are selected server-side with a cryptographically secure random source — never Math.random(), never client code.",
              },
              {
                icon: <Landmark aria-hidden />,
                title: "Immutable audit trail",
                body: "Draw execution, verification and any strictly-controlled re-draw are recorded in an append-only audit log with named approvers.",
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-4">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent [&_svg]:size-4.5">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="space-y-3 rounded-xl border border-border bg-card p-6 shadow-xs">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Example verification record
            </p>
            <div className="verification-strip">draw_id: DRW-2026-000318</div>
            <div className="verification-strip">
              snapshot_sha256: 7f9c2ba4e88f827d616045507605853ed73b8093f6efbc88eb1a6eacfa66ef26
            </div>
            <div className="verification-strip">
              entries: 4,812 · selected: #2,041 · method: csprng
            </div>
            <p className="pt-1 text-xs text-muted-foreground">
              Every completed campaign links to a public page like this one, with personal data
              masked.{" "}
              <Link href="/draws" className="underline underline-offset-2">
                Browse draw records
              </Link>
            </p>
          </div>
        </div>
      </Section>

      {/* Free route */}
      <div className="border-y border-border bg-subtle">
        <Section
          eyebrow="Free entry route"
          title={t.home.freeRouteTitle}
          description={t.home.freeRouteBody}
        >
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Button variant="accent" asChild>
              <Link href="/free-entry-route">
                How the free route works <ArrowRight aria-hidden />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Free-route entries carry the same chances as paid entries in the same campaign.
            </p>
          </div>
        </Section>
      </div>

      {/* Trust & safety strip */}
      <Section eyebrow="Trust & safety" title="Built like a marketplace, regulated like it matters">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Verified sellers",
              body: "Identity and business checks before a single listing goes live, plus proof of prize ownership.",
            },
            {
              title: "Territory aware",
              body: "Campaign formats are only offered where the rules of that territory allow them. No global defaults.",
            },
            {
              title: "Player protections",
              body: "Spending limits, pause periods and self-exclusion are built into your account settings.",
            },
            {
              title: "Human moderation",
              body: "Every campaign passes review; prohibited categories are blocked and appeals are handled by people.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card p-5 shadow-xs">
              <Sparkles className="mb-3 size-5 text-accent" aria-hidden />
              <h3 className="mb-1.5 text-sm font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Testimonials (clearly labelled demo) */}
      <Section eyebrow="What members say" title="Demonstration testimonials" className="pt-0">
        <p className="-mt-6 mb-8 text-xs text-muted-foreground italic">{t.legal.demoNotice}</p>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              quote:
                "I checked the draw hash against the published snapshot. It matched. That's why I keep entering here.",
              name: "A. Carter — demo persona",
            },
            {
              quote:
                "Used the free postal route for a watch competition and won. Same odds, no purchase — exactly as described.",
              name: "M. Osei — demo persona",
            },
            {
              quote:
                "As a seller, the payout statement shows every fee line by line. No surprises at settlement.",
              name: "J. Laurent — demo persona",
            },
          ].map((item) => (
            <figure
              key={item.name}
              className="rounded-xl border border-border bg-card p-6 shadow-xs"
            >
              <blockquote className="text-sm leading-relaxed">“{item.quote}”</blockquote>
              <figcaption className="mt-4 text-xs font-medium text-muted-foreground">
                {item.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <div className="border-t border-border bg-subtle">
        <Section eyebrow="FAQ" title="Common questions" align="center" className="max-w-3xl">
          <Accordion type="single" collapsible className="w-full text-left">
            <AccordionItem value="odds">
              <AccordionTrigger>How are winners chosen?</AccordionTrigger>
              <AccordionContent>
                When a campaign closes, the list of eligible entries is frozen and hashed, then a
                winner is selected server-side using a cryptographically secure random source. The
                draw record — including the snapshot hash — is published on a public verification
                page.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="free">
              <AccordionTrigger>Do I have to pay to enter?</AccordionTrigger>
              <AccordionContent>
                Not where a free entry route applies. Campaigns that offer one accept free entries
                with the same chances as paid entries. Some campaigns are entirely free draws.
                Availability of each format depends on your territory&apos;s rules.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="regions">
              <AccordionTrigger>Why can&apos;t I see or enter some campaigns?</AccordionTrigger>
              <AccordionContent>
                Prize competitions are regulated differently in every country and region. A campaign
                is only shown as available where its configuration has been approved for that
                territory. If you&apos;re not eligible, we tell you clearly instead of letting you
                pay and disqualifying you later.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="prize">
              <AccordionTrigger>How do winners receive their prize?</AccordionTrigger>
              <AccordionContent>
                After the draw, the provisional winner is verified for eligibility, then chooses
                delivery or collection as set out in the campaign&apos;s handover policy. High-value
                items such as vehicles follow a documented transfer workflow. Everything is tracked
                until you confirm receipt.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="refunds">
              <AccordionTrigger>What happens if a campaign is cancelled?</AccordionTrigger>
              <AccordionContent>
                If a campaign is cancelled before its draw, paid entries are refunded in full to the
                original payment method. Refund status is visible in your account, and our support
                team handles exceptions under the dispute resolution policy.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Section>
      </div>

      {/* Seller CTA */}
      <Section className="pb-20">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary to-[#312E81] p-8 text-white shadow-lg sm:p-12 dark:from-[#2A2A72] dark:to-[#1E1B4B]">
          <div className="max-w-xl space-y-4">
            <p className="text-xs font-semibold tracking-widest text-white/70 uppercase">
              For sellers
            </p>
            <h2 className="font-display text-3xl font-bold text-balance sm:text-4xl">
              Turn one remarkable item into a campaign thousands can join
            </h2>
            <p className="text-white/80">
              {brand.name} handles entries, payments, compliance checks and the draw. You list the
              prize, we run the machinery — and you receive a transparent, line-by-line settlement.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="secondary" size="lg" asChild className="border-0">
                <Link href="/sell">
                  Start selling <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                asChild
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/seller-standards">Read the seller standards</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
