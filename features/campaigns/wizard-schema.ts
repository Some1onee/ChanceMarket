import { z } from "zod";

/** Draft saves are lenient (partial), submission is strict (full schema). */

export const CAMPAIGN_TYPES = [
  "paid_prize_competition",
  "free_draw",
  "sweepstakes",
  "hybrid_paid_with_free_route",
  "skill_based_competition",
] as const;

export const wizardDraftSchema = z.object({
  campaignType: z.enum(CAMPAIGN_TYPES),
  categoryId: z.string().uuid(),
  title: z.string().trim().min(5).max(120),
  summary: z.string().trim().max(240).optional().or(z.literal("")),
  description: z.string().trim().max(8000).optional().or(z.literal("")),
  prizeValueMajor: z.number().int().min(1).max(10_000_000),
  currency: z.enum(["GBP", "USD"]),
  entryPriceMinor: z.number().int().min(0).max(1_000_000),
  minEntriesPerOrder: z.number().int().min(1).max(100),
  maxEntriesPerOrder: z.number().int().min(1).max(1000),
  maxEntriesPerUser: z.number().int().min(1).max(100_000),
  maxEntriesTotal: z.number().int().min(10).max(1_000_000),
  freeRouteEnabled: z.boolean(),
  freeRouteInstructions: z.string().trim().max(2000).optional().or(z.literal("")),
  skillQuestionRequired: z.boolean(),
  minAge: z.number().int().min(13).max(25),
  startsAt: z.string().optional().or(z.literal("")),
  endsAt: z.string().optional().or(z.literal("")),
  locationCountry: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional()
    .or(z.literal("")),
  locationRegion: z.string().trim().max(120).optional().or(z.literal("")),
  deliveryPolicy: z.string().trim().max(2000).optional().or(z.literal("")),
  rulesMd: z.string().trim().max(20_000).optional().or(z.literal("")),
});

export type WizardDraftInput = z.infer<typeof wizardDraftSchema>;

/** Extra invariants checked at submission time (server-side). */
export const wizardSubmitSchema = wizardDraftSchema
  .extend({
    description: z.string().trim().min(50, "Describe the prize in at least 50 characters"),
    deliveryPolicy: z.string().trim().min(20, "Explain how the winner receives the prize"),
    rulesMd: z.string().trim().min(100, "Official rules are required"),
    endsAt: z.string().min(1, "Set a closing date"),
  })
  .superRefine((data, ctx) => {
    if (data.maxEntriesPerOrder < data.minEntriesPerOrder) {
      ctx.addIssue({
        code: "custom",
        path: ["maxEntriesPerOrder"],
        message: "Max per order must be ≥ min per order",
      });
    }
    if (data.maxEntriesPerUser > data.maxEntriesTotal) {
      ctx.addIssue({
        code: "custom",
        path: ["maxEntriesPerUser"],
        message: "Per-user cap cannot exceed the total",
      });
    }
    const isFreeType = data.campaignType === "free_draw" || data.campaignType === "sweepstakes";
    if (isFreeType && data.entryPriceMinor !== 0) {
      ctx.addIssue({
        code: "custom",
        path: ["entryPriceMinor"],
        message: "Free draws and sweepstakes cannot have a paid entry price",
      });
    }
    if (!isFreeType && data.entryPriceMinor <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["entryPriceMinor"],
        message: "Set an entry price for paid formats",
      });
    }
    if (data.freeRouteEnabled && (data.freeRouteInstructions ?? "").trim().length < 20) {
      ctx.addIssue({
        code: "custom",
        path: ["freeRouteInstructions"],
        message: "Explain the free entry route clearly (min 20 characters)",
      });
    }
    if (data.endsAt && data.startsAt && new Date(data.endsAt) <= new Date(data.startsAt)) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "Closing date must be after the start date",
      });
    }
  });

export const skillQuestionSchema = z.object({
  question: z.string().trim().min(10, "Write the qualifying question").max(500),
  options: z
    .array(z.object({ label: z.string().trim().min(1).max(200) }))
    .min(3, "Provide at least 3 answer options")
    .max(6),
  correctIndex: z.number().int().min(0),
});

export type SkillQuestionInput = z.infer<typeof skillQuestionSchema>;

export const regionRuleSchema = z.object({
  countryCode: z.string().regex(/^[A-Z]{2}$/),
  subdivisionCode: z
    .string()
    .regex(/^[A-Z0-9-]{1,10}$/)
    .optional()
    .or(z.literal("")),
  mode: z.enum(["allow", "deny"]),
});
