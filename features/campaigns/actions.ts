"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { AppError, toActionResult, type ActionResult } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";

export async function toggleFavoriteAction(
  campaignId: string,
): Promise<ActionResult<{ isFavourite: boolean }>> {
  return toActionResult(async () => {
    const user = await requireUser();
    const id = z.string().uuid().parse(campaignId);
    const supabase = await getSupabaseServerClient();

    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("campaign_id", id)
      .maybeSingle();

    if (existing) {
      await supabase.from("favorites").delete().eq("id", existing.id);
      revalidatePath("/account/favourites");
      return { isFavourite: false };
    }

    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: user.id, campaign_id: id });
    if (error) throw new AppError("internal", "Could not save the favourite.");
    revalidatePath("/account/favourites");
    return { isFavourite: true };
  });
}

const questionSchema = z.object({
  campaignId: z.string().uuid(),
  question: z.string().trim().min(5, "Ask a fuller question").max(500),
});

export async function askQuestionAction(input: unknown): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const user = await requireUser();
    await checkRateLimit("campaign:question", 5);
    const data = questionSchema.parse(input);
    const supabase = await getSupabaseServerClient();

    const { error } = await supabase.from("campaign_questions").insert({
      campaign_id: data.campaignId,
      user_id: user.id,
      question: data.question,
    });
    if (error) throw new AppError("internal", "Could not submit your question.");
    return undefined;
  });
}

const reportSchema = z.object({
  campaignId: z.string().uuid(),
  reason: z.enum(["prohibited_item", "misleading", "counterfeit", "ownership_doubt", "other"]),
  details: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function reportCampaignAction(input: unknown): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const user = await requireUser();
    await checkRateLimit("campaign:report", 5);
    const data = reportSchema.parse(input);
    const supabase = await getSupabaseServerClient();

    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      subject_type: "campaign",
      subject_id: data.campaignId,
      reason: data.reason,
      details: data.details || null,
    });
    if (error) throw new AppError("internal", "Could not submit the report.");
    return undefined;
  });
}
