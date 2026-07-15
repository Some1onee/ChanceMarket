"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import { AppError, toActionResult, type ActionResult } from "@/lib/errors";
import {
  regionRuleSchema,
  skillQuestionSchema,
  wizardDraftSchema,
  wizardSubmitSchema,
  type WizardDraftInput,
} from "@/features/campaigns/wizard-schema";
import { checkCampaignPublishable } from "@/features/compliance/seller-options";
import { logError, logInfo, logWarn } from "@/lib/observability/logger";

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "campaign"}-${Math.random().toString(36).slice(2, 8)}`;
}

async function requireOwnedDraft(campaignId: string) {
  const user = await requireUser();
  const supabase = await getSupabaseServerClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*, seller_profiles!inner(id, user_id, status)")
    .eq("id", campaignId)
    .maybeSingle();

  const row = campaign as unknown as
    | (NonNullable<typeof campaign> & { seller_profiles: { id: string; user_id: string; status: string } })
    | null;

  if (!row || row.seller_profiles.user_id !== user.id) {
    throw new AppError("not_found", "Campaign not found.");
  }
  if (!["draft", "changes_requested"].includes(row.status)) {
    throw new AppError("state_conflict", "Only drafts can be edited.");
  }
  return { user, supabase, campaign: row };
}

export async function createDraftCampaignAction(): Promise<ActionResult<{ id: string }>> {
  return toActionResult(async () => {
    const user = await requireUser();
    const supabase = await getSupabaseServerClient();

    const { data: seller } = await supabase
      .from("seller_profiles")
      .select("id, status, max_active_campaigns")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!seller || seller.status !== "approved") {
      throw new AppError("forbidden", "Your seller account must be approved before creating campaigns.");
    }

    const { count } = await supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", seller.id)
      .in("status", ["draft", "submitted", "under_review", "approved", "scheduled", "active"]);
    if ((count ?? 0) >= seller.max_active_campaigns + 5) {
      throw new AppError("limit_reached", "You have reached your campaign limit.");
    }

    const { data: firstCategory } = await supabase
      .from("categories")
      .select("id")
      .eq("is_active", true)
      .order("sort_order")
      .limit(1)
      .single();

    const { data: created, error } = await supabase
      .from("campaigns")
      .insert({
        seller_id: seller.id,
        category_id: firstCategory?.id,
        slug: slugify("draft"),
        title: "Untitled campaign",
        campaign_type: "hybrid_paid_with_free_route",
        status: "draft",
        prize_value_minor: 100,
        currency: "GBP",
        entry_price_minor: 100,
        max_entries_total: 1000,
      })
      .select("id")
      .single();
    if (error || !created) {
      logError("draft_create_failed", error);
      throw new AppError("internal", "Could not create a draft.");
    }
    return { id: created.id };
  });
}

export async function saveDraftCampaignAction(
  campaignId: string,
  input: Partial<WizardDraftInput>,
): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const id = z.string().uuid().parse(campaignId);
    const data = wizardDraftSchema.partial().parse(input);
    const { supabase, campaign } = await requireOwnedDraft(id);

    const update: Partial<import("@/lib/supabase/database.types").CampaignRow> = {};
    if (data.campaignType !== undefined) update.campaign_type = data.campaignType;
    if (data.categoryId !== undefined) update.category_id = data.categoryId;
    if (data.title !== undefined) {
      update.title = data.title;
      if (campaign.title === "Untitled campaign" || !campaign.slug.startsWith(slugifyBase(data.title))) {
        update.slug = slugify(data.title);
      }
    }
    if (data.summary !== undefined) update.summary = data.summary || null;
    if (data.description !== undefined) update.description = data.description || null;
    if (data.prizeValueMajor !== undefined) update.prize_value_minor = data.prizeValueMajor * 100;
    if (data.currency !== undefined) update.currency = data.currency;
    if (data.entryPriceMinor !== undefined) update.entry_price_minor = data.entryPriceMinor;
    if (data.minEntriesPerOrder !== undefined) update.min_entries_per_order = data.minEntriesPerOrder;
    if (data.maxEntriesPerOrder !== undefined) update.max_entries_per_order = data.maxEntriesPerOrder;
    if (data.maxEntriesPerUser !== undefined) update.max_entries_per_user = data.maxEntriesPerUser;
    if (data.maxEntriesTotal !== undefined) update.max_entries_total = data.maxEntriesTotal;
    if (data.freeRouteEnabled !== undefined) update.free_route_enabled = data.freeRouteEnabled;
    if (data.freeRouteInstructions !== undefined)
      update.free_route_instructions = data.freeRouteInstructions || null;
    if (data.skillQuestionRequired !== undefined)
      update.skill_question_required = data.skillQuestionRequired;
    if (data.minAge !== undefined) update.min_age = data.minAge;
    if (data.startsAt !== undefined) update.starts_at = data.startsAt || null;
    if (data.endsAt !== undefined) update.ends_at = data.endsAt || null;
    if (data.locationCountry !== undefined) update.location_country = data.locationCountry || null;
    if (data.locationRegion !== undefined) update.location_region = data.locationRegion || null;
    if (data.deliveryPolicy !== undefined) update.delivery_policy = data.deliveryPolicy || null;

    if (Object.keys(update).length > 0) {
      const { error } = await supabase.from("campaigns").update(update).eq("id", id);
      if (error) {
        logError("draft_save_failed", error, { campaignId: id });
        throw new AppError("validation_failed", "Could not save the draft.");
      }
    }

    // Rules text lives in campaign_rules_versions.
    if (data.rulesMd !== undefined && data.rulesMd.trim() !== "") {
      const { data: current } = await supabase
        .from("campaign_rules_versions")
        .select("id, version, content_md")
        .eq("campaign_id", id)
        .eq("is_current", true)
        .maybeSingle();
      if (!current) {
        await supabase.from("campaign_rules_versions").insert({
          campaign_id: id,
          version: 1,
          language: "en-GB",
          content_md: data.rulesMd,
          is_current: true,
        });
      } else if (current.content_md !== data.rulesMd) {
        // Drafts overwrite v1 in place; post-approval edits would version up.
        await supabase
          .from("campaign_rules_versions")
          .update({ content_md: data.rulesMd })
          .eq("id", current.id);
      }
    }
    return undefined;
  });
}

function slugifyBase(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function registerCampaignImageAction(
  campaignId: string,
  input: { storagePath: string; altText: string; isCover: boolean; sortOrder: number },
): Promise<ActionResult<{ id: string }>> {
  return toActionResult(async () => {
    const id = z.string().uuid().parse(campaignId);
    const data = z
      .object({
        storagePath: z.string().min(3).max(300),
        altText: z.string().trim().max(200),
        isCover: z.boolean(),
        sortOrder: z.number().int().min(0).max(50),
      })
      .parse(input);
    const { user, supabase } = await requireOwnedDraft(id);

    if (!data.storagePath.startsWith(`${user.id}/${id}/`)) {
      throw new AppError("validation_failed", "Invalid image path.");
    }

    const { data: created, error } = await supabase
      .from("campaign_images")
      .insert({
        campaign_id: id,
        storage_path: data.storagePath,
        alt_text: data.altText || null,
        is_cover: data.isCover,
        sort_order: data.sortOrder,
      })
      .select("id")
      .single();
    if (error || !created) throw new AppError("internal", "Could not save the image.");
    return { id: created.id };
  });
}

export async function deleteCampaignImageAction(
  campaignId: string,
  imageId: string,
): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const id = z.string().uuid().parse(campaignId);
    const imgId = z.string().uuid().parse(imageId);
    const { supabase } = await requireOwnedDraft(id);
    const { data: image } = await supabase
      .from("campaign_images")
      .select("id, storage_path")
      .eq("id", imgId)
      .eq("campaign_id", id)
      .maybeSingle();
    if (!image) throw new AppError("not_found", "Image not found.");
    await supabase.from("campaign_images").delete().eq("id", imgId);
    await supabase.storage.from("campaign-images").remove([image.storage_path]);
    return undefined;
  });
}

export async function updateCampaignImagesAction(
  campaignId: string,
  images: unknown,
): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const id = z.string().uuid().parse(campaignId);
    const rows = z
      .array(
        z.object({
          id: z.string().uuid(),
          sortOrder: z.number().int().min(0).max(50),
          isCover: z.boolean(),
          altText: z.string().trim().max(200),
        }),
      )
      .max(20)
      .parse(images);
    const { supabase } = await requireOwnedDraft(id);

    for (const row of rows) {
      await supabase
        .from("campaign_images")
        .update({
          sort_order: row.sortOrder,
          is_cover: row.isCover,
          alt_text: row.altText || null,
        })
        .eq("id", row.id)
        .eq("campaign_id", id);
    }
    return undefined;
  });
}

export async function saveRegionsAction(
  campaignId: string,
  regions: unknown,
): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const id = z.string().uuid().parse(campaignId);
    const rows = z.array(regionRuleSchema).max(60).parse(regions);
    const { supabase } = await requireOwnedDraft(id);

    await supabase.from("campaign_eligibility_regions").delete().eq("campaign_id", id);
    if (rows.length > 0) {
      const { error } = await supabase.from("campaign_eligibility_regions").insert(
        rows.map((row) => ({
          campaign_id: id,
          country_code: row.countryCode,
          subdivision_code: row.subdivisionCode || null,
          mode: row.mode,
        })),
      );
      if (error) throw new AppError("internal", "Could not save territory rules.");
    }
    return undefined;
  });
}

/**
 * Save the skill question. The correct answer is written to a service-only
 * table via the admin client — it never has a client-readable policy.
 */
export async function saveSkillQuestionAction(
  campaignId: string,
  input: unknown,
): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const id = z.string().uuid().parse(campaignId);
    const data = skillQuestionSchema.parse(input);
    if (data.correctIndex >= data.options.length) {
      throw new AppError("validation_failed", "Mark which option is correct.");
    }
    await requireOwnedDraft(id);

    let admin;
    try {
      admin = getSupabaseAdminClient();
    } catch {
      throw new AppError(
        "internal",
        "Server is missing SUPABASE_SECRET_KEY — skill questions require the server key to store the answer securely.",
      );
    }

    // Replace the current version wholesale while in draft.
    const { data: existing } = await admin
      .from("skill_questions")
      .select("id")
      .eq("campaign_id", id)
      .eq("is_current", true)
      .maybeSingle();
    if (existing) {
      await admin.from("skill_questions").delete().eq("id", existing.id);
    }

    const { data: question, error: qError } = await admin
      .from("skill_questions")
      .insert({ campaign_id: id, version: 1, question: data.question, is_current: true })
      .select("id")
      .single();
    if (qError || !question) throw new AppError("internal", "Could not save the question.");

    const { data: options, error: oError } = await admin
      .from("skill_question_options")
      .insert(
        data.options.map((option, index) => ({
          question_id: question.id,
          label: option.label,
          sort_order: index,
        })),
      )
      .select("id, sort_order");
    if (oError || !options) throw new AppError("internal", "Could not save the options.");

    const correct = options.find((option) => option.sort_order === data.correctIndex);
    if (!correct) throw new AppError("internal", "Could not identify the correct option.");

    const { error: aError } = await admin
      .from("skill_question_answers")
      .upsert({ question_id: question.id, correct_option_id: correct.id });
    if (aError) throw new AppError("internal", "Could not store the answer.");

    return undefined;
  });
}

export async function submitCampaignAction(campaignId: string): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const id = z.string().uuid().parse(campaignId);
    const { user, supabase, campaign } = await requireOwnedDraft(id);

    // Full validation of the assembled draft.
    const { data: rules } = await supabase
      .from("campaign_rules_versions")
      .select("content_md")
      .eq("campaign_id", id)
      .eq("is_current", true)
      .maybeSingle();

    const parsed = wizardSubmitSchema.safeParse({
      campaignType: campaign.campaign_type,
      categoryId: campaign.category_id,
      title: campaign.title,
      summary: campaign.summary ?? "",
      description: campaign.description ?? "",
      prizeValueMajor: Math.round(campaign.prize_value_minor / 100),
      currency: campaign.currency,
      entryPriceMinor: campaign.entry_price_minor,
      minEntriesPerOrder: campaign.min_entries_per_order,
      maxEntriesPerOrder: campaign.max_entries_per_order,
      maxEntriesPerUser: campaign.max_entries_per_user,
      maxEntriesTotal: campaign.max_entries_total,
      freeRouteEnabled: campaign.free_route_enabled,
      freeRouteInstructions: campaign.free_route_instructions ?? "",
      skillQuestionRequired: campaign.skill_question_required,
      minAge: campaign.min_age,
      startsAt: campaign.starts_at ?? "",
      endsAt: campaign.ends_at ?? "",
      locationCountry: campaign.location_country ?? "",
      locationRegion: campaign.location_region ?? "",
      deliveryPolicy: campaign.delivery_policy ?? "",
      rulesMd: rules?.content_md ?? "",
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      throw new AppError(
        "validation_failed",
        `The draft is incomplete: ${first?.path.join(".")} — ${first?.message}`,
      );
    }

    // Images are mandatory.
    const { count: imageCount } = await supabase
      .from("campaign_images")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", id);
    if ((imageCount ?? 0) < 1) {
      throw new AppError("validation_failed", "Add at least one photo of the prize.");
    }

    // Skill question present when required.
    if (campaign.skill_question_required) {
      const { data: question } = await supabase
        .from("skill_questions")
        .select("id")
        .eq("campaign_id", id)
        .eq("is_current", true)
        .maybeSingle();
      if (!question) {
        throw new AppError("validation_failed", "Add the qualifying skill question.");
      }
    }

    // Compliance: must be publishable in ≥1 active jurisdiction.
    const publishable = await checkCampaignPublishable({
      campaignType: campaign.campaign_type,
      categoryId: campaign.category_id,
      entryPriceMinor: campaign.entry_price_minor,
      freeRouteEnabled: campaign.free_route_enabled,
      skillQuestionRequired: campaign.skill_question_required,
    });
    if (!publishable.publishable) {
      throw new AppError(
        "jurisdiction_blocked",
        `This configuration is not permitted in any active territory (${publishable.reasons.join(", ")}). Adjust the campaign type, price or free route.`,
      );
    }

    const { error } = await supabase.rpc("transition_campaign_status", {
      p_campaign_id: id,
      p_new_status: "submitted",
      p_reason: null,
    });
    if (error) {
      logError("campaign_submit_failed", error, { campaignId: id });
      throw new AppError("state_conflict", "Could not submit the campaign.");
    }

    // Open a moderation case + audit the compliance decision (service key).
    try {
      const admin = getSupabaseAdminClient();
      await admin.from("moderation_cases").insert({ campaign_id: id, status: "pending" });
      await admin.from("compliance_decisions").insert({
        subject_type: "campaign_publish",
        subject_id: id,
        user_id: user.id,
        campaign_id: id,
        decision: "allow",
        reasons: [`allowed_in: ${publishable.matchedJurisdictions.join(", ")}`],
      });
    } catch (adminError) {
      logWarn("moderation_case_deferred", {
        reason: adminError instanceof Error ? adminError.message : "no service key",
      });
    }

    logInfo("campaign_submitted", { campaignId: id });
    revalidatePath("/seller");
    return undefined;
  });
}

export async function sellerTransitionAction(
  campaignId: string,
  newStatus: "submitted" | "cancelled" | "paused" | "active",
): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const id = z.string().uuid().parse(campaignId);
    await requireUser();
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.rpc("transition_campaign_status", {
      p_campaign_id: id,
      p_new_status: newStatus,
      p_reason: null,
    });
    if (error) throw new AppError("state_conflict", error.message);
    revalidatePath("/seller");
    return undefined;
  });
}
