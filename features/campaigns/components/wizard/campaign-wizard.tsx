"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, CloudUpload, Send } from "lucide-react";
import {
  wizardDraftSchema,
  type WizardDraftInput,
} from "@/features/campaigns/wizard-schema";
import {
  saveDraftCampaignAction,
  submitCampaignAction,
} from "@/features/campaigns/wizard-actions";
import type { AllowedTypeOption } from "@/features/compliance/seller-options";
import type { CategoryRow } from "@/lib/supabase/database.types";
import { ImageUploader, type WizardImage } from "./image-uploader";
import { SkillEditor } from "./skill-editor";
import { RegionsEditor } from "./regions-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  paid_prize_competition: "Prize competition (paid)",
  free_draw: "Free draw",
  sweepstakes: "Sweepstakes (no purchase)",
  hybrid_paid_with_free_route: "Paid with free entry route",
  skill_based_competition: "Skill-based competition",
};

const STEPS = [
  { key: "basics", title: "Basics" },
  { key: "prize", title: "Prize & media" },
  { key: "mechanics", title: "Entries & pricing" },
  { key: "territory", title: "Territory" },
  { key: "schedule", title: "Dates & delivery" },
  { key: "rules", title: "Rules & submit" },
] as const;

export function CampaignWizard({
  campaignId,
  userId,
  defaults,
  images,
  regions,
  skillQuestion,
  allowedTypes,
  categories,
  activeJurisdictions,
}: {
  campaignId: string;
  userId: string;
  defaults: WizardDraftInput;
  images: WizardImage[];
  regions: { countryCode: string; subdivisionCode: string; mode: "allow" | "deny" }[];
  skillQuestion: { question: string; options: string[] } | null;
  allowedTypes: AllowedTypeOption[];
  categories: CategoryRow[];
  activeJurisdictions: { countryCode: string; name: string }[];
}) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<WizardDraftInput>({
    resolver: zodResolver(wizardDraftSchema),
    defaultValues: defaults,
    mode: "onChange",
  });

  const values = form.watch();
  const selectedType = allowedTypes.find((t) => t.campaignType === values.campaignType);
  const isFreeType = values.campaignType === "free_draw" || values.campaignType === "sweepstakes";

  // Autosave: debounce 1.5 s after any change.
  const valuesJson = JSON.stringify(values);
  const skipFirst = React.useRef(true);
  React.useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setSaving(true);
      void saveDraftCampaignAction(campaignId, JSON.parse(valuesJson) as WizardDraftInput).then(
        (result) => {
          setSaving(false);
          if (result.ok) setLastSaved(new Date());
          else toast.error(result.message);
        },
      );
    }, 1500);
    return () => clearTimeout(timer);
  }, [valuesJson, campaignId]);

  // Enforce jurisdiction-derived constraints in the form.
  React.useEffect(() => {
    if (!selectedType) return;
    if (selectedType.freeRouteMandatory && !isFreeType && !values.freeRouteEnabled) {
      form.setValue("freeRouteEnabled", true);
    }
    if (selectedType.skillRequired && !isFreeType && !values.skillQuestionRequired) {
      form.setValue("skillQuestionRequired", true);
    }
    if (values.minAge < selectedType.minAge) {
      form.setValue("minAge", selectedType.minAge);
    }
    if (isFreeType && values.entryPriceMinor !== 0) {
      form.setValue("entryPriceMinor", 0);
    }
  }, [selectedType, isFreeType, values.freeRouteEnabled, values.skillQuestionRequired, values.minAge, values.entryPriceMinor, form]);

  async function submit() {
    setSubmitting(true);
    // Flush any pending edits first.
    await saveDraftCampaignAction(campaignId, values);
    const result = await submitCampaignAction(campaignId);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Campaign submitted for review");
    router.push("/seller");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* Stepper */}
      <ol className="flex flex-wrap items-center gap-2" aria-label="Wizard steps">
        {STEPS.map((item, index) => (
          <li key={item.key}>
            <button
              type="button"
              onClick={() => setStep(index)}
              aria-current={index === step ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                index === step
                  ? "border-primary bg-primary-soft text-primary"
                  : index < step
                    ? "border-accent/40 bg-accent-soft text-accent"
                    : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {index < step ? <Check className="size-3" aria-hidden /> : <span>{index + 1}</span>}
              {item.title}
            </button>
          </li>
        ))}
        <li className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <CloudUpload className={cn("size-3.5", saving && "animate-pulse text-primary")} aria-hidden />
          {saving ? "Saving…" : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : "Autosave on"}
        </li>
      </ol>

      <Form {...form}>
        <form onSubmit={(event) => event.preventDefault()} className="space-y-6" noValidate>
          {/* STEP 1 — Basics */}
          <div className={cn(step !== 0 && "hidden")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="campaignType"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Campaign type</FormLabel>
                    <FormDescription>
                      Only formats permitted in at least one active territory are offered.
                    </FormDescription>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {allowedTypes.map((option) => (
                        <button
                          key={option.campaignType}
                          type="button"
                          onClick={() => field.onChange(option.campaignType)}
                          aria-pressed={field.value === option.campaignType}
                          className={cn(
                            "rounded-lg border p-3 text-left text-sm transition-colors",
                            field.value === option.campaignType
                              ? "border-primary bg-primary-soft"
                              : "border-border hover:border-primary/50",
                          )}
                        >
                          <span className="font-medium">{TYPE_LABELS[option.campaignType]}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            Allowed in: {option.jurisdictions.join(", ")}
                            {option.freeRouteMandatory ? " · free route required" : ""}
                            {option.skillRequired ? " · skill question required" : ""}
                            {option.maxEntryPriceMinor !== null
                              ? ` · max entry ${(option.maxEntryPriceMinor / 100).toFixed(2)}`
                              : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                            {category.requires_extra_review ? " (extra review)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Aurora carbon gravel bike — full Ultegra build" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Short summary</FormLabel>
                    <FormControl>
                      <Textarea rows={2} maxLength={240} placeholder="One or two sentences shown on cards and search results." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* STEP 2 — Prize & media */}
          <div className={cn(step !== 1 && "hidden")}>
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={8}
                        placeholder="Condition, specification, provenance, what's included…"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="prizeValueMajor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prize value (whole units)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Supported by your ownership/valuation documents.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="locationRegion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item location (region)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Greater Manchester" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Photos</p>
                <ImageUploader campaignId={campaignId} userId={userId} initialImages={images} />
              </div>
              <Alert>
                <AlertTitle>Proof of ownership</AlertTitle>
                <AlertDescription>
                  Upload ownership/valuation documents from your seller dashboard — they are
                  private, reviewed by moderation, and never shown publicly.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* STEP 3 — Mechanics */}
          <div className={cn(step !== 2 && "hidden")}>
            <div className="grid gap-4 sm:grid-cols-2">
              {!isFreeType ? (
                <FormField
                  control={form.control}
                  name="entryPriceMinor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry price (pence/cents)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={selectedType?.maxEntryPriceMinor ?? undefined}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        {selectedType?.maxEntryPriceMinor
                          ? `Territory cap: ${(selectedType.maxEntryPriceMinor / 100).toFixed(2)} max.`
                          : "In minor units: 250 = £2.50."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
              <FormField
                control={form.control}
                name="maxEntriesTotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total entries available</FormLabel>
                    <FormControl>
                      <Input type="number" min={10} value={field.value} onChange={(event) => field.onChange(Number(event.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minEntriesPerOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min entries per order</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} value={field.value} onChange={(event) => field.onChange(Number(event.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxEntriesPerOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max entries per order</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} value={field.value} onChange={(event) => field.onChange(Number(event.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxEntriesPerUser"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max entries per person</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} value={field.value} onChange={(event) => field.onChange(Number(event.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minAge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum age</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={selectedType?.minAge ?? 18}
                        max={25}
                        value={field.value}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Cannot be below the territory minimum ({selectedType?.minAge ?? 18}).
                    </FormDescription>
                  </FormItem>
                )}
              />

              {!isFreeType ? (
                <FormField
                  control={form.control}
                  name="freeRouteEnabled"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <div className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div>
                          <FormLabel>Free entry route</FormLabel>
                          <FormDescription>
                            {selectedType?.freeRouteMandatory
                              ? "Mandatory for this format in the active territories — cannot be disabled."
                              : "Optional here, but may widen where the campaign can run."}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={selectedType?.freeRouteMandatory}
                            aria-label="Enable free entry route"
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />
              ) : null}

              {values.freeRouteEnabled && !isFreeType ? (
                <FormField
                  control={form.control}
                  name="freeRouteInstructions"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Free route instructions</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Explain exactly how to enter for free (e.g. postal instructions). Free entries must have identical chances."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              <FormField
                control={form.control}
                name="skillQuestionRequired"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <FormLabel>Qualifying skill question</FormLabel>
                        <FormDescription>
                          {selectedType?.skillRequired
                            ? "Required for this format in the active territories."
                            : "A genuine question of skill, knowledge or judgement."}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={selectedType?.skillRequired && !isFreeType}
                          aria-label="Require skill question"
                        />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />

              {values.skillQuestionRequired ? (
                <div className="sm:col-span-2">
                  <SkillEditor
                    campaignId={campaignId}
                    initialQuestion={skillQuestion?.question ?? ""}
                    initialOptions={skillQuestion?.options ?? []}
                  />
                </div>
              ) : null}
            </div>
          </div>

          {/* STEP 4 — Territory */}
          <div className={cn(step !== 3 && "hidden")}>
            <RegionsEditor
              campaignId={campaignId}
              initialRegions={regions}
              activeJurisdictions={activeJurisdictions}
            />
          </div>

          {/* STEP 5 — Dates & delivery */}
          <div className={cn(step !== 4 && "hidden")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opens (optional — immediately on approval if empty)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closes</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryPolicy"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Prize handover policy</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Delivery method, insurance, timescale after winner verification, collection options…"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* STEP 6 — Rules & submit */}
          <div className={cn(step !== 5 && "hidden")}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="rulesMd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Official rules (Markdown)</FormLabel>
                    <FormDescription>
                      Start from the template — a legal review is required before any real launch.
                    </FormDescription>
                    <FormControl>
                      <Textarea rows={12} className="font-mono text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Alert variant="warning">
                <AlertTitle>Before you submit</AlertTitle>
                <AlertDescription>
                  Moderation checks your photos, ownership documents, pricing and rules. Campaigns
                  go live only after approval, and only in territories where this configuration is
                  permitted.
                </AlertDescription>
              </Alert>
              <Button size="lg" onClick={() => void submit()} loading={submitting}>
                <Send aria-hidden /> Submit for review
              </Button>
            </div>
          </div>

          {/* Nav */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ChevronLeft aria-hidden /> Back
            </Button>
            <Button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={step === STEPS.length - 1}
            >
              Continue <ChevronRight aria-hidden />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
