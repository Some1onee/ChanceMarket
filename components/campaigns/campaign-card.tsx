import Link from "next/link";
import { Clock, Gift, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CampaignImage } from "@/components/campaigns/campaign-image";
import type { PublicCampaign } from "@/features/campaigns/queries";
import { formatMoneyCompact, isCurrency, money } from "@/lib/money";
import { formatRelativeEnd } from "@/lib/dates";
import type { Locale } from "@/lib/config/brand";
import type { Dictionary } from "@/lib/localization/dictionaries";

export function CampaignCard({
  campaign,
  locale,
  dictionary,
  priority = false,
}: {
  campaign: PublicCampaign;
  locale: Locale;
  dictionary: Dictionary;
  priority?: boolean;
}) {
  const cover =
    campaign.campaign_images.find((image) => image.is_cover) ??
    [...campaign.campaign_images].sort((a, b) => a.sort_order - b.sort_order)[0];
  const currency = isCurrency(campaign.currency) ? campaign.currency : "GBP";
  const progress =
    campaign.max_entries_total > 0
      ? Math.min(Math.round((campaign.entries_confirmed / campaign.max_entries_total) * 100), 100)
      : 0;
  const isFree = campaign.entry_price_minor === 0;
  const ended =
    campaign.status !== "active" ||
    (campaign.ends_at !== null && new Date(campaign.ends_at) <= new Date());

  return (
    <Link
      href={`/campaigns/${campaign.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <CampaignImage
          storagePath={cover?.storage_path ?? campaign.cover_image_path}
          alt={cover?.alt_text ?? campaign.title}
          seed={campaign.id}
          priority={priority}
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {isFree ? (
            <Badge variant="accent">
              <Gift aria-hidden /> Free draw
            </Badge>
          ) : campaign.free_route_enabled ? (
            <Badge variant="neutral" className="bg-card/85 backdrop-blur-sm">
              {dictionary.campaign.freeEntry}
            </Badge>
          ) : null}
          {campaign.status === "sold_out" ? (
            <Badge variant="warning">{dictionary.campaign.soldOut}</Badge>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {campaign.categories?.name ?? ""}
          </p>
          <h3 className="line-clamp-2 leading-snug font-semibold text-balance group-hover:text-primary">
            {campaign.title}
          </h3>
        </div>

        <div className="mt-auto space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {campaign.entries_confirmed.toLocaleString(locale)} {dictionary.campaign.of}{" "}
                {campaign.max_entries_total.toLocaleString(locale)} {dictionary.campaign.entries}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" aria-hidden />
                {ended ? dictionary.campaign.ended : formatRelativeEnd(campaign.ends_at ?? new Date(), locale)}
              </span>
            </div>
            <Progress value={progress} aria-label={`${progress}% of entries allocated`} />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="text-sm">
              <span className="text-xs text-muted-foreground">{dictionary.campaign.prizeValue} </span>
              <span className="font-semibold">
                {formatMoneyCompact(money(campaign.prize_value_minor, currency), locale)}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">
              <Ticket className="size-3.5" aria-hidden />
              {isFree
                ? "Free"
                : formatMoneyCompact(money(campaign.entry_price_minor, currency), locale)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
