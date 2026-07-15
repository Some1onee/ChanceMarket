"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Eye, Pause, PencilLine, Play, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createDraftCampaignAction,
  sellerTransitionAction,
} from "@/features/campaigns/wizard-actions";
import type { CampaignStatus } from "@/lib/supabase/database.types";

export function NewCampaignButton() {
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);

  async function create() {
    setCreating(true);
    const result = await createDraftCampaignAction();
    setCreating(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    router.push(`/seller/campaigns/${result.data.id}/edit`);
  }

  return (
    <Button onClick={() => void create()} loading={creating}>
      <Plus aria-hidden /> New campaign
    </Button>
  );
}

export function SellerCampaignActions({
  campaignId,
  slug,
  status,
}: {
  campaignId: string;
  slug: string;
  status: CampaignStatus;
}) {
  const router = useRouter();

  async function transition(next: "paused" | "active") {
    const result = await sellerTransitionAction(campaignId, next);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {["draft", "changes_requested"].includes(status) ? (
        <Button variant="outline" size="sm" asChild>
          <a href={`/seller/campaigns/${campaignId}/edit`}>
            <PencilLine aria-hidden /> Edit
          </a>
        </Button>
      ) : null}
      {status === "active" ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Pause campaign"
          onClick={() => void transition("paused")}
        >
          <Pause aria-hidden />
        </Button>
      ) : null}
      {status === "paused" ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Resume campaign"
          onClick={() => void transition("active")}
        >
          <Play aria-hidden />
        </Button>
      ) : null}
      {![
        "draft",
        "submitted",
        "under_review",
        "changes_requested",
        "rejected",
        "cancelled",
      ].includes(status) ? (
        <Button variant="ghost" size="icon-sm" aria-label="View public page" asChild>
          <a href={`/campaigns/${slug}`}>
            <Eye aria-hidden />
          </a>
        </Button>
      ) : null}
      {["draft", "changes_requested"].includes(status) ? (
        <Button variant="ghost" size="icon-sm" aria-label="Open to submit" asChild>
          <a href={`/seller/campaigns/${campaignId}/edit`}>
            <Send aria-hidden />
          </a>
        </Button>
      ) : null}
    </div>
  );
}
