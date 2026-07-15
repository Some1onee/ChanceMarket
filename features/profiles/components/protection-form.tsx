"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { selfExcludeAction, updateProtectionAction } from "@/features/profiles/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ProtectionForm({
  currentLimitMajor,
  currentPeriod,
  pausedUntil,
}: {
  currentLimitMajor: number | null;
  currentPeriod: "daily" | "weekly" | "monthly";
  pausedUntil: string | null;
}) {
  const router = useRouter();
  const [limit, setLimit] = React.useState<string>(currentLimitMajor?.toString() ?? "");
  const [period, setPeriod] = React.useState<"daily" | "weekly" | "monthly">(currentPeriod);
  const [pauseDays, setPauseDays] = React.useState<string>("0");
  const [saving, setSaving] = React.useState(false);
  const [ack, setAck] = React.useState(false);

  async function save() {
    setSaving(true);
    const parsed = limit.trim() === "" ? null : Number.parseInt(limit, 10);
    if (parsed !== null && (!Number.isInteger(parsed) || parsed < 1)) {
      toast.error("Enter a whole amount of at least 1, or leave empty for no limit.");
      setSaving(false);
      return;
    }
    const result = await updateProtectionAction({
      spendLimitMajor: parsed,
      spendLimitPeriod: period,
      pauseDays: Number.parseInt(pauseDays, 10) || 0,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Safeguards updated");
    router.refresh();
  }

  async function selfExclude(months: 6 | 12 | 60) {
    const result = await selfExcludeAction({ months, acknowledge: true });
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Self-exclusion applied");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Spending limit</CardTitle>
          <CardDescription>
            A cap on paid entries per period, enforced server-side on every order. Lowering a limit
            applies immediately; raising or removing one has a 24-hour cooling-off period via
            support.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="spend-limit">Limit (whole £/$, empty = none)</Label>
            <Input
              id="spend-limit"
              inputMode="numeric"
              placeholder="e.g. 50"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Period</Label>
            <Select value={period} onValueChange={(value) => setPeriod(value as typeof period)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pause-days">Pause entries for (days)</Label>
            <Input
              id="pause-days"
              inputMode="numeric"
              value={pauseDays}
              onChange={(event) => setPauseDays(event.target.value)}
            />
            {pausedUntil && new Date(pausedUntil) > new Date() ? (
              <p className="text-xs text-warning">
                Paused until {new Date(pausedUntil).toLocaleDateString()}
              </p>
            ) : null}
          </div>
          <div className="sm:col-span-3">
            <Button onClick={save} loading={saving}>
              Save safeguards
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Self-exclusion</CardTitle>
          <CardDescription>
            Blocks all entries and marketing for the chosen period. This cannot be undone early. If
            participation stops feeling fun, free confidential help is listed on our{" "}
            <a href="/responsible-participation" className="underline underline-offset-2">
              responsible participation
            </a>{" "}
            page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="se-ack"
              checked={ack}
              onCheckedChange={(checked) => setAck(checked === true)}
            />
            <Label htmlFor="se-ack" className="leading-snug font-normal">
              I understand self-exclusion applies immediately, blocks all participation, and cannot
              be lifted before it ends.
            </Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {([6, 12, 60] as const).map((months) => (
              <AlertDialog key={months}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={!ack}>
                    {months === 60 ? "Indefinitely" : `${months} months`}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Self-exclude {months === 60 ? "indefinitely" : `for ${months} months`}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Your account will be blocked from entering any campaign
                      {months === 60 ? " until you contact support after at least 5 years" : ""}.
                      This takes effect immediately.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => void selfExclude(months)}
                    >
                      Confirm self-exclusion
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
