"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, Gift, Minus, Plus, ShieldCheck, Ticket, XCircle } from "lucide-react";
import {
  answerSkillQuestionAction,
  enterCampaignAction,
  requestFreeRouteEntryAction,
  type EntryOutcome,
} from "@/features/entries/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney, isCurrency, money, type Money } from "@/lib/money";
import { cn } from "@/lib/utils";

type SkillQuestionData = {
  id: string;
  question: string;
  options: { id: string; label: string }[];
} | null;

type EntryFlowProps = {
  campaign: {
    id: string;
    slug: string;
    title: string;
    entryPriceMinor: number;
    currency: string;
    minPerOrder: number;
    maxPerOrder: number;
    maxPerUser: number;
    remainingTotal: number;
    userConfirmed: number;
    freeRouteEnabled: boolean;
    freeRouteInstructions: string | null;
    skillRequired: boolean;
    minAge: number;
    campaignType: string;
  };
  skillQuestion: SkillQuestionData;
  initialRoute: "paid" | "free";
  hasDateOfBirth: boolean;
};

export function EntryFlow({
  campaign,
  skillQuestion,
  initialRoute,
  hasDateOfBirth,
}: EntryFlowProps) {
  const currency = isCurrency(campaign.currency) ? campaign.currency : "GBP";
  const isFreeType = campaign.entryPriceMinor === 0;
  const personalRemaining = Math.max(campaign.maxPerUser - campaign.userConfirmed, 0);
  const maxQuantity = Math.min(campaign.maxPerOrder, personalRemaining, campaign.remainingTotal);

  const [quantity, setQuantity] = React.useState(
    Math.min(campaign.minPerOrder, Math.max(maxQuantity, 1)),
  );
  const [skillOption, setSkillOption] = React.useState<string>("");
  const [skillResponseId, setSkillResponseId] = React.useState<string | null>(null);
  const [skillState, setSkillState] = React.useState<"unanswered" | "correct" | "incorrect">(
    "unanswered",
  );
  const [checkingSkill, setCheckingSkill] = React.useState(false);
  const [ageConfirm, setAgeConfirm] = React.useState(false);
  const [rulesConfirm, setRulesConfirm] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [outcome, setOutcome] = React.useState<
    EntryOutcome | { status: "free_route_accepted" } | null
  >(null);
  const idempotencyKey = React.useRef<string>(crypto.randomUUID());

  const total: Money = money(campaign.entryPriceMinor * quantity, currency);
  const needsSkill = campaign.skillRequired && skillQuestion !== null;
  const skillSatisfied = !needsSkill || skillState === "correct";
  const canSubmit =
    skillSatisfied && ageConfirm && rulesConfirm && maxQuantity > 0 && hasDateOfBirth;

  async function checkSkillAnswer() {
    if (!skillQuestion || !skillOption) return;
    setCheckingSkill(true);
    const result = await answerSkillQuestionAction({
      questionId: skillQuestion.id,
      optionId: skillOption,
    });
    setCheckingSkill(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setSkillResponseId(result.data.responseId);
    setSkillState(result.data.correct ? "correct" : "incorrect");
  }

  async function submitEntry(source: "paid" | "promotional") {
    setSubmitting(true);
    const result = await enterCampaignAction({
      campaignId: campaign.id,
      quantity: source === "promotional" ? Math.min(quantity, 1) || 1 : quantity,
      source,
      skillResponseId,
      idempotencyKey: idempotencyKey.current,
      confirmations: { ageAndEligibility: true, rulesAndRefunds: true },
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setOutcome(result.data);
  }

  async function submitFreeRoute() {
    setSubmitting(true);
    const result = await requestFreeRouteEntryAction({
      campaignId: campaign.id,
      skillResponseId,
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setOutcome({ status: "free_route_accepted" });
  }

  // ── Receipt states ─────────────────────────────────────────────────────────
  if (outcome) {
    if (outcome.status === "confirmed" || outcome.status === "free_route_accepted") {
      const paid = outcome.status === "confirmed" && outcome.totalMinor > 0;
      return (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <CheckCircle2 className="size-14 text-success" aria-hidden />
          <h2 className="font-display text-2xl font-bold">Entry confirmed</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {outcome.status === "free_route_accepted"
              ? "Your free entry has been recorded with identical chances to paid entries."
              : `${outcome.quantity} ${outcome.quantity === 1 ? "entry" : "entries"} confirmed${
                  paid
                    ? ` — ${formatMoney(money(outcome.totalMinor, isCurrency(outcome.currency) ? outcome.currency : "GBP"))} paid`
                    : ""
                }.`}{" "}
            A receipt is in your account and the draw record will be public after close.
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/account/entries">View my entries</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/campaigns/${campaign.slug}`}>Back to campaign</Link>
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <XCircle className="size-14 text-destructive" aria-hidden />
        <h2 className="font-display text-2xl font-bold">Payment failed</h2>
        <p className="max-w-md text-sm text-muted-foreground">{outcome.reason}</p>
        <Button
          onClick={() => {
            idempotencyKey.current = crypto.randomUUID();
            setOutcome(null);
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  const skillBlock = needsSkill ? (
    <section
      aria-labelledby="skill-heading"
      className="space-y-3 rounded-lg border border-border p-4"
    >
      <h3 id="skill-heading" className="flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck className="size-4 text-primary" aria-hidden /> Qualifying question
      </h3>
      <p className="text-sm">{skillQuestion?.question}</p>
      <RadioGroup value={skillOption} onValueChange={setSkillOption} aria-label="Answer options">
        {skillQuestion?.options.map((option) => (
          <div key={option.id} className="flex items-center gap-2.5">
            <RadioGroupItem
              id={`skill-${option.id}`}
              value={option.id}
              disabled={skillState === "correct"}
            />
            <Label htmlFor={`skill-${option.id}`} className="font-normal">
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {skillState === "correct" ? (
        <p className="flex items-center gap-1.5 text-sm font-medium text-success">
          <CheckCircle2 className="size-4" aria-hidden /> Correct — you qualify to enter.
        </p>
      ) : skillState === "incorrect" ? (
        <p className="text-sm font-medium text-destructive">
          Not quite — you can try again (attempts are limited).
        </p>
      ) : null}
      {skillState !== "correct" ? (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void checkSkillAnswer()}
          loading={checkingSkill}
          disabled={!skillOption}
        >
          Check answer
        </Button>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Answers are checked on our servers; you must answer correctly for your entry to qualify.
      </p>
    </section>
  ) : null;

  const confirmations = (
    <div className="space-y-3">
      {!hasDateOfBirth ? (
        <Alert variant="warning">
          <AlertTitle>Date of birth required</AlertTitle>
          <AlertDescription>
            Add your date of birth in{" "}
            <Link href="/account" className="underline underline-offset-2">
              Account → Profile
            </Link>{" "}
            so we can verify you meet the {campaign.minAge}+ requirement.
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="flex items-start gap-2.5">
        <Checkbox
          id="confirm-age"
          checked={ageConfirm}
          onCheckedChange={(checked) => setAgeConfirm(checked === true)}
        />
        <Label htmlFor="confirm-age" className="leading-snug font-normal">
          I confirm I am {campaign.minAge} or older and meet the residency requirements in the
          official rules.
        </Label>
      </div>
      <div className="flex items-start gap-2.5">
        <Checkbox
          id="confirm-rules"
          checked={rulesConfirm}
          onCheckedChange={(checked) => setRulesConfirm(checked === true)}
        />
        <Label htmlFor="confirm-rules" className="leading-snug font-normal">
          I have read the{" "}
          <Link
            href={`/campaigns/${campaign.slug}#rules-heading`}
            className="underline underline-offset-2"
            target="_blank"
          >
            official rules
          </Link>{" "}
          and the refund policy.
        </Label>
      </div>
    </div>
  );

  // ── Free-format campaigns (free draw / sweepstakes) ────────────────────────
  if (isFreeType) {
    return (
      <div className="space-y-6">
        {skillBlock}
        <div className="rounded-lg border border-border bg-subtle p-4 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <Gift className="size-4 text-accent" aria-hidden /> Free entry — one per person
          </p>
          <p className="mt-1 text-muted-foreground">
            No purchase necessary. Odds depend on the total number of entries received.
          </p>
        </div>
        {confirmations}
        <Button
          size="lg"
          className="w-full"
          disabled={!canSubmit}
          loading={submitting}
          onClick={() => void submitEntry("promotional")}
        >
          Confirm my free entry
        </Button>
      </div>
    );
  }

  // ── Paid campaigns (with optional free route) ──────────────────────────────
  return (
    <Tabs defaultValue={initialRoute === "free" && campaign.freeRouteEnabled ? "free" : "paid"}>
      {campaign.freeRouteEnabled ? (
        <TabsList className="w-full">
          <TabsTrigger value="paid" className="flex-1">
            <Ticket className="mr-1.5 size-4" aria-hidden /> Paid entry
          </TabsTrigger>
          <TabsTrigger value="free" className="flex-1">
            <Gift className="mr-1.5 size-4" aria-hidden /> Free entry route
          </TabsTrigger>
        </TabsList>
      ) : null}

      <TabsContent value="paid" className="space-y-6">
        {skillBlock}

        <section aria-labelledby="quantity-heading" className="space-y-3">
          <h3 id="quantity-heading" className="text-sm font-semibold">
            Number of entries
          </h3>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label="Fewer entries"
              onClick={() => setQuantity((current) => Math.max(campaign.minPerOrder, current - 1))}
              disabled={quantity <= campaign.minPerOrder}
            >
              <Minus aria-hidden />
            </Button>
            <span
              className="min-w-16 text-center font-mono text-2xl font-bold tabular-nums"
              aria-live="polite"
            >
              {quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="More entries"
              onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
              disabled={quantity >= maxQuantity}
            >
              <Plus aria-hidden />
            </Button>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-primary">{formatMoney(total)}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatMoney(money(campaign.entryPriceMinor, currency))} per entry · max{" "}
            {campaign.maxPerOrder} per order · you can hold {personalRemaining} more in this
            campaign · {campaign.remainingTotal.toLocaleString()} remain overall.
          </p>
        </section>

        <Separator />
        {confirmations}

        <div
          className={cn(
            "rounded-lg border border-border bg-subtle p-3 text-xs text-muted-foreground",
          )}
        >
          Payments are processed by our payment partner in test (mock) mode — no real card is
          charged in this environment. Refunds are automatic if the campaign is cancelled before the
          draw.
        </div>

        <Button
          size="lg"
          className="w-full"
          disabled={!canSubmit || quantity < 1}
          loading={submitting}
          onClick={() => void submitEntry("paid")}
        >
          Pay {formatMoney(total)} and enter
        </Button>
      </TabsContent>

      {campaign.freeRouteEnabled ? (
        <TabsContent value="free" className="space-y-6">
          {skillBlock}
          <section className="space-y-3 rounded-lg border border-border p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Gift className="size-4 text-accent" aria-hidden /> How the free route works
            </h3>
            <p className="text-sm whitespace-pre-line text-muted-foreground">
              {campaign.freeRouteInstructions ??
                "This campaign accepts free entries with identical chances to paid entries."}
            </p>
            <p className="text-xs text-muted-foreground">
              Free entries carry exactly the same chances as paid entries. One online free entry per
              person per campaign; postal requests are processed on receipt.
            </p>
          </section>
          {confirmations}
          <Button
            size="lg"
            variant="accent"
            className="w-full"
            disabled={!canSubmit}
            loading={submitting}
            onClick={() => void submitFreeRoute()}
          >
            Request my free entry
          </Button>
        </TabsContent>
      ) : null}
    </Tabs>
  );
}
