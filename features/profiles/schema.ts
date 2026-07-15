import { z } from "zod";

export const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(60),
  bio: z.string().trim().max(500).optional().or(z.literal("")),
  countryCode: z
    .string()
    .regex(/^[A-Z]{2}$/, "Select a country")
    .optional()
    .or(z.literal("")),
  subdivisionCode: z
    .string()
    .regex(/^[A-Z0-9-]{1,10}$/)
    .optional()
    .or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  locale: z.enum(["en-GB", "en-US"]),
  currency: z.enum(["GBP", "USD"]),
  marketingOptIn: z.boolean(),
});

export const privateDetailsSchema = z.object({
  legalName: z.string().trim().max(120).optional().or(z.literal("")),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00Z`);
      return date > new Date("1900-01-01") && date < new Date();
    }, "Enter a valid date of birth"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{6,20}$/)
    .optional()
    .or(z.literal("")),
});

export const protectionSchema = z.object({
  spendLimitMajor: z.number().int().min(1).max(1_000_000).nullable(),
  spendLimitPeriod: z.enum(["daily", "weekly", "monthly"]),
  pauseDays: z.number().int().min(0).max(365).optional(),
});

export const selfExclusionSchema = z.object({
  months: z.union([z.literal(6), z.literal(12), z.literal(60)]),
  acknowledge: z.literal(true, { message: "You must confirm you understand" }),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type PrivateDetailsInput = z.infer<typeof privateDetailsSchema>;
export type ProtectionInput = z.infer<typeof protectionSchema>;
export type SelfExclusionInput = z.infer<typeof selfExclusionSchema>;
