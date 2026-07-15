import { describe, expect, it } from "vitest";
import { wizardSubmitSchema, skillQuestionSchema } from "@/features/campaigns/wizard-schema";

const validDraft = {
  campaignType: "hybrid_paid_with_free_route" as const,
  categoryId: "60000000-0000-4000-8000-000000000001",
  title: "Aurora carbon gravel bike",
  summary: "A great bike",
  description: "A".repeat(60),
  prizeValueMajor: 4500,
  currency: "GBP" as const,
  entryPriceMinor: 250,
  minEntriesPerOrder: 1,
  maxEntriesPerOrder: 50,
  maxEntriesPerUser: 200,
  maxEntriesTotal: 4000,
  freeRouteEnabled: true,
  freeRouteInstructions: "Send a postcard to the address in the rules with your details.",
  skillQuestionRequired: true,
  minAge: 18,
  startsAt: "",
  endsAt: "2027-01-01T00:00",
  locationCountry: "GB",
  locationRegion: "Manchester",
  deliveryPolicy: "Insured courier within 14 days of verification.",
  rulesMd: "R".repeat(120),
};

describe("wizardSubmitSchema", () => {
  it("accepts a complete valid draft", () => {
    expect(wizardSubmitSchema.safeParse(validDraft).success).toBe(true);
  });

  it("rejects per-user cap above the total", () => {
    const result = wizardSubmitSchema.safeParse({
      ...validDraft,
      maxEntriesPerUser: 5000,
      maxEntriesTotal: 4000,
    });
    expect(result.success).toBe(false);
    expect(
      result.success ? [] : result.error.issues.map((issue) => issue.path.join(".")),
    ).toContain("maxEntriesPerUser");
  });

  it("rejects max per order below min per order", () => {
    const result = wizardSubmitSchema.safeParse({
      ...validDraft,
      minEntriesPerOrder: 10,
      maxEntriesPerOrder: 5,
    });
    expect(result.success).toBe(false);
  });

  it("forces free formats to price zero", () => {
    const result = wizardSubmitSchema.safeParse({
      ...validDraft,
      campaignType: "free_draw",
      entryPriceMinor: 100,
    });
    expect(result.success).toBe(false);
  });

  it("requires a price for paid formats", () => {
    const result = wizardSubmitSchema.safeParse({ ...validDraft, entryPriceMinor: 0 });
    expect(result.success).toBe(false);
  });

  it("requires meaningful free-route instructions when enabled", () => {
    const result = wizardSubmitSchema.safeParse({ ...validDraft, freeRouteInstructions: "short" });
    expect(result.success).toBe(false);
  });

  it("requires the close date to follow the start date", () => {
    const result = wizardSubmitSchema.safeParse({
      ...validDraft,
      startsAt: "2027-02-01T00:00",
      endsAt: "2027-01-01T00:00",
    });
    expect(result.success).toBe(false);
  });
});

describe("skillQuestionSchema", () => {
  it("requires at least 3 options", () => {
    const result = skillQuestionSchema.safeParse({
      question: "Which groupset is fitted to the bike?",
      options: [{ label: "A" }, { label: "B" }],
      correctIndex: 0,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a well-formed question", () => {
    const result = skillQuestionSchema.safeParse({
      question: "Which groupset is fitted to the bike?",
      options: [{ label: "Ultegra" }, { label: "Apex" }, { label: "Record" }],
      correctIndex: 0,
    });
    expect(result.success).toBe(true);
  });
});
