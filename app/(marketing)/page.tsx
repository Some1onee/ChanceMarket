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

const stepIcons = [
  <ScanSearch key="pick" className="size-6" aria-hidden />,
  <Ticket key="enter" className="size-6" aria-hidden />,
  <Trophy key="draw" className="size-6" aria-hidden />,
];

const transparencyIcons = [
  <Fingerprint key="hash" aria-hidden />,
  <Lock key="random" aria-hidden />,
  <Landmark key="audit" aria-hidden />,
];

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
            <ShieldCheck aria-hidden /> {t.home.heroBadge}
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
              <BadgeCheck className="size-4 text-accent" aria-hidden /> {t.home.verifiedSellers}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Gift className="size-4 text-accent" aria-hidden /> {t.legal.noPurchaseNecessary}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="size-4 text-accent" aria-hidden /> {t.home.playResponsibly}
            </span>
          </div>
        </div>
      </div>

      {/* Featured campaigns */}
      <Section
        eyebrow={t.home.liveNow}
        title={t.home.featured}
        description={t.home.featuredDescription}
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
        <Section eyebrow={t.home.explore} title={t.home.categories} className="pt-0">
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
        <Section eyebrow={t.home.lastChance} title={t.home.endingSoon} className="pt-0">
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
          eyebrow={t.hiw.eyebrow}
          title={t.hiw.title}
          align="center"
          description={t.hiw.description}
        >
          <div className="grid gap-6 md:grid-cols-3">
            {t.hiw.steps.map((item, index) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-card p-6 shadow-xs"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    {stepIcons[index]}
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {t.hiw.stepLabel} {index + 1}/3
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
        eyebrow={t.transparency.eyebrow}
        title={t.transparency.title}
        description={t.transparency.description}
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <ul className="space-y-4">
            {t.transparency.items.map((item, index) => (
              <li key={item.title} className="flex gap-4">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent [&_svg]:size-4.5">
                  {transparencyIcons[index]}
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
              {t.transparency.exampleLabel}
            </p>
            <div className="verification-strip">draw_id: DRW-2026-000318</div>
            <div className="verification-strip">
              snapshot_sha256: 7f9c2ba4e88f827d616045507605853ed73b8093f6efbc88eb1a6eacfa66ef26
            </div>
            <div className="verification-strip">
              entries: 4,812 · selected: #2,041 · method: csprng
            </div>
            <p className="pt-1 text-xs text-muted-foreground">
              {t.transparency.exampleNote}{" "}
              <Link href="/draws" className="underline underline-offset-2">
                {t.transparency.browseDraws}
              </Link>
            </p>
          </div>
        </div>
      </Section>

      {/* Free route */}
      <div className="border-y border-border bg-subtle">
        <Section
          eyebrow={t.campaign.freeEntry}
          title={t.home.freeRouteTitle}
          description={t.home.freeRouteBody}
        >
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Button variant="accent" asChild>
              <Link href="/free-entry-route">
                {t.freeRoute.cta} <ArrowRight aria-hidden />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">{t.freeRoute.note}</p>
          </div>
        </Section>
      </div>

      {/* Trust & safety strip */}
      <Section eyebrow={t.trust.eyebrow} title={t.trust.title}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.trust.items.map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card p-5 shadow-xs">
              <Sparkles className="mb-3 size-5 text-accent" aria-hidden />
              <h3 className="mb-1.5 text-sm font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Testimonials (clearly labelled demo) */}
      <Section eyebrow={t.testimonials.eyebrow} title={t.testimonials.title} className="pt-0">
        <p className="-mt-6 mb-8 text-xs text-muted-foreground italic">{t.legal.demoNotice}</p>
        <div className="grid gap-6 md:grid-cols-3">
          {t.testimonials.items.map((item) => (
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
        <Section eyebrow={t.faq.eyebrow} title={t.faq.title} align="center" className="max-w-3xl">
          <Accordion type="single" collapsible className="w-full text-left">
            {t.faq.items.map((item, index) => (
              <AccordionItem key={item.question} value={`faq-${index}`}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Section>
      </div>

      {/* Seller CTA */}
      <Section className="pb-20">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary to-[#312E81] p-8 text-white shadow-lg sm:p-12 dark:from-[#2A2A72] dark:to-[#1E1B4B]">
          <div className="max-w-xl space-y-4">
            <p className="text-xs font-semibold tracking-widest text-white/70 uppercase">
              {t.sellerCta.eyebrow}
            </p>
            <h2 className="font-display text-3xl font-bold text-balance sm:text-4xl">
              {t.sellerCta.title}
            </h2>
            <p className="text-white/80">{t.sellerCta.body.replace("{brand}", brand.name)}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="secondary" size="lg" asChild className="border-0">
                <Link href="/sell">
                  {t.sellerCta.start} <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                asChild
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/seller-standards">{t.sellerCta.standards}</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
