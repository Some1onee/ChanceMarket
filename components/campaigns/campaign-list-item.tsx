import Link from "next/link";
import { Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CampaignImage } from "@/components/campaigns/campaign-image";
import type { PublicCampaign } from "@/features/campaigns/queries";
import { formatMoneyCompact, isCurrency, money } from "@/lib/money";
import { formatRelativeEnd } from "@/lib/dates";
import type { Locale } from "@/lib/config/brand";
import type { Dictionary } from "@/lib/localization/dictionaries";

export function CampaignListItem({
  campaign,
  locale,
  dictionary,
}: {
  campaign: PublicCampaign;
  locale: Locale;
  dictionary: Dictionary;
}) {
  const cover =
    campaign.campaign_images.find((image) => image.is_cover) ?? campaign.campaign_images[0];
  const currency = isCurrency(campaign.currency) ? campaign.currency : "GBP";
  const progress =
    campaign.max_entries_total > 0
      ? Math.min(Math.round((campaign.entries_confirmed / campaign.max_entries_total) * 100), 100)
      : 0;
  const isFree = campaign.entry_price_minor === 0;

  return (
    <Link
      href={`/campaigns/${campaign.slug}`}
      className="group flex gap-4 rounded-xl border border-border bg-card p-3 shadow-xs transition-all hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="relative aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-44">
        <CampaignImage
          storagePath={cover?.storage_path ?? campaign.cover_image_path}
          alt={cover?.alt_text ?? campaign.title}
          seed={campaign.id}
          sizes="176px"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 py-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {campaign.categories?.name}
          </span>
          {isFree ? <Badge variant="accent">Free</Badge> : null}
          {campaign.free_route_enabled && !isFree ? (
            <Badge variant="neutral">{dictionary.campaign.freeEntry}</Badge>
          ) : null}
        </div>
        <h3 className="line-clamp-1 font-semibold group-hover:text-primary">{campaign.title}</h3>
        <p className="line-clamp-1 hidden text-sm text-muted-foreground sm:block">
          {campaign.summary}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="font-semibold text-primary">
            {isFree ? "Free" : formatMoneyCompact(money(campaign.entry_price_minor, currency), locale)}
          </span>
          <span className="text-muted-foreground">
            {dictionary.campaign.prizeValue}{" "}
            {formatMoneyCompact(money(campaign.prize_value_minor, currency), locale)}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="size-3.5" aria-hidden />
            {formatRelativeEnd(campaign.ends_at ?? new Date(), locale)}
          </span>
          <div className="w-32">
            <Progress value={progress} aria-label={`${progress}% of entries allocated`} />
          </div>
        </div>
      </div>
    </Link>
  );
}
