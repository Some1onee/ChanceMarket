import { Badge } from "@/components/ui/badge";
import type { CampaignStatus } from "@/lib/supabase/database.types";
import type { Dictionary } from "@/lib/localization/dictionaries";

const STATUS_VARIANT: Record<
  CampaignStatus,
  "default" | "accent" | "neutral" | "success" | "warning" | "destructive" | "info"
> = {
  draft: "neutral",
  submitted: "info",
  under_review: "info",
  changes_requested: "warning",
  approved: "success",
  scheduled: "info",
  active: "accent",
  paused: "warning",
  sold_out: "warning",
  closing: "warning",
  drawing: "info",
  winner_pending: "info",
  winner_confirmed: "success",
  fulfilment: "info",
  completed: "neutral",
  cancelled: "destructive",
  rejected: "destructive",
  disputed: "destructive",
};

export function CampaignStatusBadge({
  status,
  dictionary,
}: {
  status: CampaignStatus;
  dictionary: Dictionary;
}) {
  return <Badge variant={STATUS_VARIANT[status]}>{dictionary.status[status]}</Badge>;
}
