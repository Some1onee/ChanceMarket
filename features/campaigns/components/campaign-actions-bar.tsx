"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Flag, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reportCampaignAction, toggleFavoriteAction } from "@/features/campaigns/actions";
import { cn } from "@/lib/utils";

const REPORT_REASONS = [
  { value: "prohibited_item", label: "Prohibited or restricted item" },
  { value: "misleading", label: "Misleading listing" },
  { value: "counterfeit", label: "Possible counterfeit" },
  { value: "ownership_doubt", label: "Ownership in doubt" },
  { value: "other", label: "Something else" },
] as const;

export function CampaignActionsBar({
  campaignId,
  isFavourite,
  signedIn,
  title,
}: {
  campaignId: string;
  isFavourite: boolean;
  signedIn: boolean;
  title: string;
}) {
  const router = useRouter();
  const [favourite, setFavourite] = React.useState(isFavourite);
  const [reportReason, setReportReason] = React.useState<string>("misleading");
  const [reportDetails, setReportDetails] = React.useState("");
  const [reportOpen, setReportOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  async function toggleFavourite() {
    if (!signedIn) {
      router.push("/sign-in");
      return;
    }
    const previous = favourite;
    setFavourite(!previous);
    const result = await toggleFavoriteAction(campaignId);
    if (!result.ok) {
      setFavourite(previous);
      toast.error(result.message);
    }
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  }

  async function submitReport() {
    setSending(true);
    const result = await reportCampaignAction({
      campaignId,
      reason: reportReason,
      details: reportDetails,
    });
    setSending(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setReportOpen(false);
    setReportDetails("");
    toast.success("Report sent — our moderation team will review it.");
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="icon-sm"
        aria-pressed={favourite}
        aria-label={favourite ? "Remove from favourites" : "Add to favourites"}
        onClick={() => void toggleFavourite()}
      >
        <Heart className={cn(favourite && "fill-destructive text-destructive")} aria-hidden />
      </Button>
      <Button variant="outline" size="icon-sm" aria-label="Share" onClick={() => void share()}>
        <Share2 aria-hidden />
      </Button>
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon-sm" aria-label="Report this campaign">
            <Flag aria-hidden />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this campaign</DialogTitle>
            <DialogDescription>
              Reports go straight to the moderation queue. The seller is not told who reported.
            </DialogDescription>
          </DialogHeader>
          {signedIn ? (
            <>
              <RadioGroup value={reportReason} onValueChange={setReportReason}>
                {REPORT_REASONS.map((reason) => (
                  <div key={reason.value} className="flex items-center gap-2.5">
                    <RadioGroupItem id={`reason-${reason.value}`} value={reason.value} />
                    <Label htmlFor={`reason-${reason.value}`} className="font-normal">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <Textarea
                aria-label="Details (optional)"
                placeholder="Anything that helps us review faster (optional)"
                value={reportDetails}
                onChange={(event) => setReportDetails(event.target.value)}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setReportOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => void submitReport()} loading={sending}>
                  Send report
                </Button>
              </DialogFooter>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sign in to report a campaign — it keeps the queue free of spam.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
