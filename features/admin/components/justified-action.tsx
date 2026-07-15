"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/errors";

/**
 * Generic confirmation dialog for sensitive admin operations: forces a
 * written justification (logged to admin_actions) and optionally an extra
 * field (e.g. second approver email, refund amount).
 */
export function JustifiedAction({
  triggerLabel,
  triggerVariant = "outline",
  triggerSize = "sm",
  title,
  description,
  confirmLabel,
  destructive = false,
  extraField,
  onConfirm,
}: {
  triggerLabel: React.ReactNode;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
  title: string;
  description?: string;
  confirmLabel: string;
  destructive?: boolean;
  extraField?: { label: string; placeholder?: string; type?: string };
  onConfirm: (justification: string, extraValue: string) => Promise<ActionResult<unknown>>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [justification, setJustification] = React.useState("");
  const [extraValue, setExtraValue] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function confirm() {
    setBusy(true);
    const result = await onConfirm(justification, extraValue);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(`${title} — done`);
    setOpen(false);
    setJustification("");
    setExtraValue("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="space-y-4">
          {extraField ? (
            <div className="space-y-2">
              <Label htmlFor="ja-extra">{extraField.label}</Label>
              <Input
                id="ja-extra"
                type={extraField.type ?? "text"}
                placeholder={extraField.placeholder}
                value={extraValue}
                onChange={(event) => setExtraValue(event.target.value)}
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="ja-justification">Justification (recorded in the audit trail)</Label>
            <Textarea
              id="ja-justification"
              rows={3}
              placeholder="Why is this action being taken? Min 10 characters."
              value={justification}
              onChange={(event) => setJustification(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "primary"}
            onClick={() => void confirm()}
            loading={busy}
            disabled={justification.trim().length < 10 || (extraField ? extraValue.trim() === "" : false)}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
