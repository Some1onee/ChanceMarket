import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  Gift,
  Globe2,
  MapPin,
  ShieldCheck,
  Ticket,
  Truck,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CampaignGallery } from "@/features/campaigns/components/campaign-gallery";
import { CampaignCountdown } from "@/features/campaigns/components/campaign-countdown";
import { CampaignActionsBar } from "@/features/campaigns/components/campaign-actions-bar";
import { CampaignQA } from "@/features/campaigns/components/campaign-qa";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { campaignImageUrl } from "@/components/campaigns/campaign-image";
import {
  getCampaignDetail,
  getCampaignExtras,
  getSimilarCampaigns,
  getUserCampaignState,
} from "@/features/campaigns/detail-queries";
import { checkCampaignEligibility, eligibilityReasonMessage } from "@/features/compliance/service";
import { getSessionUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/localization/dictionaries";
import { getLocale } from "@/lib/localization/locale";
import { formatMoneyCompact, isCurrency, money } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { countryName } from "@/lib/localization/countries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaignDetail(slug);
  if (!campaign) return { title: "Campaign not found" };
  const ended = !["active", "paused", "sold_out", "closing"].includes(campaign.status);
  return {
    title: campaign.title,
    description: campaign.summary ?? undefined,
    robots: ended ? { index: false } : undefined,
    alternates: { canonical: `/campaigns/${campaign.slug}` },
    openGraph: {
      title: campaign.title,
      description: campaign.summary ?? undefined,
      type: "website",
    },
  };
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = getDictionary(locale);

  const campaign = await getCampaignDetail(slug);
  if (!campaign) notFound();

  const user = await getSessionUser();
  const [extras, similar, userState, eligibility] = await Promise.all([
    getCampaignExtras(campaign.id),
    getSimilarCampaigns(campaign.id, campaign.category_id),
    getUserCampaignState(campaign.id, user?.id ?? null),
    checkCampaignEligibility(campaign.id),
  ]);

  const currency = isCurrency(campaign.currency) ? campaign.currency : "GBP";
  const isFree = campaign.entry_price_minor === 0;
  const progress =
    campaign.max_entries_total > 0
      ? Math.min(Math.round((campaign.entries_confirmed / campaign.max_entries_total) * 100), 100)
      : 0;
  const isOpen =
    campaign.status === "active" &&
    (!campaign.ends_at || new Date(campaign.ends_at) > new Date()) &&
    (!campaign.starts_at || new Date(campaign.starts_at) <= new Date());
  const drawFinished = ["winner_pending", "winner_confirmed", "fulfilment", "completed"].includes(
    campaign.status,
  );

  const galleryImages = [...campaign.campaign_images]
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)
    .map((image) => ({
      url: campaignImageUrl(image.storage_path),
      alt: image.alt_text ?? campaign.title,
    }));

  const attributes = campaign.attributes ?? {};
  const allowRegions = extras.regions.filter((region) => region.mode === "allow");
  const denyRegions = extras.regions.filter((region) => region.mode === "deny");

  // Structured data: honest Event schema for the campaign (no misleading offers).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: campaign.title,
    description: campaign.summary ?? undefined,
    startDate: campaign.starts_at ?? undefined,
    endDate: campaign.ends_at ?? undefined,
    eventStatus: isOpen ? "https://schema.org/EventScheduled" : "https://schema.org/EventCancelled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: {
      "@type": "VirtualLocation",
      url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/campaigns/${campaign.slug}`,
    },
    organizer: campaign.seller_profiles
      ? { "@type": "Organization", name: campaign.seller_profiles.public_name }
      : undefined,
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/campaigns" className="hover:text-foreground hover:underline">
              Competitions
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link
              href={`/campaigns?category=${campaign.categories?.slug ?? ""}`}
              className="hover:text-foreground hover:underline"
            >
              {campaign.categories?.name}
            </Link>
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        {/* Left: gallery + content */}
        <div className="min-w-0 space-y-10">
          <CampaignGallery images={galleryImages} seed={campaign.id} title={campaign.title} />

          <section aria-labelledby="description-heading" className="space-y-4">
            <h2 id="description-heading" className="text-lg font-semibold">
              About this prize
            </h2>
            <div className="prose-sm max-w-none text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
              {campaign.description ?? campaign.summary}
            </div>
            {Object.keys(attributes).length > 0 ? (
              <dl className="grid grid-cols-1 gap-x-8 gap-y-2 rounded-lg border border-border bg-subtle p-4 sm:grid-cols-2">
                {Object.entries(attributes).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4 text-sm">
                    <dt className="text-muted-foreground">{key}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </section>

          {/* Delivery */}
          {campaign.delivery_policy ? (
            <section aria-labelledby="delivery-heading" className="space-y-2">
              <h2 id="delivery-heading" className="flex items-center gap-2 text-lg font-semibold">
                <Truck className="size-5 text-accent" aria-hidden /> Prize handover
              </h2>
              <p className="text-sm text-muted-foreground">{campaign.delivery_policy}</p>
            </section>
          ) : null}

          {/* Official rules */}
          <section aria-labelledby="rules-heading" className="space-y-3">
            <h2 id="rules-heading" className="text-lg font-semibold">
              {t.campaign.viewRules}
            </h2>
            {extras.rules ? (
              <details className="group rounded-lg border border-border bg-card">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium hover:text-primary">
                  Read the official rules (v{extras.rules.version}, {extras.rules.language})
                </summary>
                <div className="border-t border-border px-4 py-4 text-sm whitespace-pre-line text-muted-foreground">
                  {extras.rules.content_md}
                </div>
              </details>
            ) : (
              <p className="text-sm text-muted-foreground">
                Rules will be published before this campaign opens.
              </p>
            )}
            <p className="text-xs text-muted-foreground italic">{t.legal.templateNotice}</p>
          </section>

          {/* Q&A */}
          <CampaignQA campaignId={campaign.id} questions={extras.questions} signedIn={!!user} />
        </div>

        {/* Right: entry panel */}
        <div className="space-y-6">
          <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-md lg:sticky lg:top-24">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <CampaignStatusBadge status={campaign.status} dictionary={t} />
                  {isFree ? (
                    <Badge variant="accent">
                      <Gift aria-hidden /> Free to enter
                    </Badge>
                  ) : null}
                </div>
                <h1 className="font-display text-2xl leading-tight font-bold text-balance">
                  {campaign.title}
                </h1>
              </div>
              <CampaignActionsBar
                campaignId={campaign.id}
                isFavourite={userState.isFavourite}
                signedIn={!!user}
                title={campaign.title}
              />
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t.campaign.entryPrice}</p>
                <p className="text-2xl font-bold text-primary">
                  {isFree
                    ? "Free"
                    : formatMoneyCompact(money(campaign.entry_price_minor, currency), locale)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{t.campaign.prizeValue}</p>
                <p className="text-lg font-semibold">
                  {formatMoneyCompact(money(campaign.prize_value_minor, currency), locale)}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {campaign.entries_confirmed.toLocaleString(locale)} /{" "}
                  {campaign.max_entries_total.toLocaleString(locale)} {t.campaign.entries}
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} aria-label={`${progress}% of entries allocated`} />
            </div>

            {campaign.ends_at && isOpen ? (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">{t.campaign.endsIn}</p>
                <CampaignCountdown endsAt={campaign.ends_at} />
              </div>
            ) : null}

            {/* Eligibility + CTA */}
            {drawFinished ? (
              <Alert variant="info">
                <ShieldCheck aria-hidden />
                <AlertTitle>{t.campaign.winnerAnnounced}</AlertTitle>
                <AlertDescription>
                  {extras.draw ? (
                    <Link
                      href={`/draws/${extras.draw.public_id}`}
                      className="underline underline-offset-2"
                    >
                      View the public draw record ({extras.draw.public_id})
                    </Link>
                  ) : (
                    "The draw record will be published here."
                  )}
                </AlertDescription>
              </Alert>
            ) : !isOpen ? (
              <Alert>
                <AlertTitle>
                  {campaign.status === "sold_out" ? t.campaign.soldOut : "Entries are closed"}
                </AlertTitle>
                <AlertDescription>
                  {campaign.status === "sold_out"
                    ? "All entries have been allocated. The draw will run after close."
                    : "This campaign is not currently accepting entries."}
                </AlertDescription>
              </Alert>
            ) : eligibility.allowed ? (
              <div className="space-y-3">
                <Button size="lg" className="w-full" asChild>
                  <Link href={`/campaigns/${campaign.slug}/enter`}>
                    <Ticket aria-hidden /> {t.campaign.enterNow}
                  </Link>
                </Button>
                {campaign.free_route_enabled && !isFree ? (
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href={`/campaigns/${campaign.slug}/enter?route=free`}>
                      {t.campaign.freeEntry} — same chances, no purchase
                    </Link>
                  </Button>
                ) : null}
                {userState.confirmedEntries > 0 ? (
                  <p className="text-center text-xs text-muted-foreground">
                    You hold {userState.confirmedEntries} of max {campaign.max_entries_per_user}{" "}
                    entries in this campaign.
                  </p>
                ) : null}
              </div>
            ) : (
              <Alert variant="warning">
                <Globe2 aria-hidden />
                <AlertTitle>{t.campaign.notEligibleTitle}</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc space-y-1 pl-4">
                    {[...new Set(eligibility.reasons)].slice(0, 3).map((reason) => (
                      <li key={reason}>{eligibilityReasonMessage(reason)}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <UserRound className="size-3.5" aria-hidden />{" "}
                {t.campaign.ageRestricted.replace("{age}", String(campaign.min_age))}
              </li>
              <li className="flex items-center gap-2">
                <Ticket className="size-3.5" aria-hidden /> {t.campaign.maxPerUser}:{" "}
                {campaign.max_entries_per_user.toLocaleString(locale)}
              </li>
              {campaign.ends_at ? (
                <li className="flex items-center gap-2">
                  <CalendarDays className="size-3.5" aria-hidden /> Closes{" "}
                  {formatDate(campaign.ends_at, locale, { dateStyle: "long" })}
                </li>
              ) : null}
              <li className="flex items-center gap-2">
                <ShieldCheck className="size-3.5" aria-hidden /> Winner selected by auditable
                server-side draw
              </li>
            </ul>

            {allowRegions.length > 0 || denyRegions.length > 0 ? (
              <div className="rounded-lg bg-subtle p-3 text-xs text-muted-foreground">
                <p className="mb-1 font-medium text-foreground">Territory restrictions</p>
                {allowRegions.length > 0 ? (
                  <p>
                    Open only to:{" "}
                    {allowRegions
                      .map((region) =>
                        region.subdivision_code
                          ? `${countryName(region.country_code)} (${region.subdivision_code})`
                          : countryName(region.country_code),
                      )
                      .join(", ")}
                  </p>
                ) : null}
                {denyRegions.length > 0 ? (
                  <p>
                    Not available in:{" "}
                    {denyRegions
                      .map((region) =>
                        region.subdivision_code
                          ? `${countryName(region.country_code)} — ${region.subdivision_code}`
                          : countryName(region.country_code),
                      )
                      .join(", ")}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Seller card */}
          {campaign.seller_profiles ? (
            <div className="space-y-3 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Sold by</h2>
                {campaign.seller_profiles.kyb_status === "verified" ? (
                  <Badge variant="success">
                    <BadgeCheck aria-hidden /> {t.campaign.verifiedSeller}
                  </Badge>
                ) : (
                  <Badge variant="neutral">Verification pending</Badge>
                )}
              </div>
              <p className="font-medium">{campaign.seller_profiles.public_name}</p>
              {campaign.seller_profiles.public_bio ? (
                <p className="text-sm text-muted-foreground">
                  {campaign.seller_profiles.public_bio}
                </p>
              ) : null}
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5" aria-hidden />
                {campaign.location_region ? `${campaign.location_region}, ` : ""}
                {countryName(campaign.location_country)} · member since{" "}
                {formatDate(campaign.seller_profiles.created_at, locale, { year: "numeric" })}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {similar.length > 0 ? (
        <section aria-labelledby="similar-heading" className="mt-16 space-y-6">
          <h2 id="similar-heading" className="text-lg font-semibold">
            Similar competitions
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((item) => (
              <CampaignCard key={item.id} campaign={item} locale={locale} dictionary={t} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
