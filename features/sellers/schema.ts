import { z } from "zod";

export const sellerOnboardingSchema = z.object({
  publicName: z.string().trim().min(2, "Enter a public seller name").max(80),
  publicBio: z.string().trim().max(500).optional().or(z.literal("")),
  entityType: z.enum(["individual", "company"]),
  businessName: z.string().trim().max(120).optional().or(z.literal("")),
  countryCode: z.string().regex(/^[A-Z]{2}$/, "Select a country"),
  acceptSellerTerms: z.literal(true, {
    message: "You must accept the seller terms",
  }),
});

export type SellerOnboardingInput = z.infer<typeof sellerOnboardingSchema>;
