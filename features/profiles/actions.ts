"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { AppError, toActionResult, type ActionResult } from "@/lib/errors";
import {
  privateDetailsSchema,
  profileSchema,
  protectionSchema,
  selfExclusionSchema,
} from "@/features/profiles/schema";
import { logInfo } from "@/lib/observability/logger";

export async function updateProfileAction(input: unknown): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const user = await requireUser();
    const data = profileSchema.parse(input);
    const supabase = await getSupabaseServerClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: data.displayName,
        bio: data.bio || null,
        country_code: data.countryCode || null,
        subdivision_code: data.subdivisionCode || null,
        city: data.city || null,
        locale: data.locale,
        currency: data.currency,
        marketing_opt_in: data.marketingOptIn,
      })
      .eq("id", user.id);
    if (error) throw new AppError("validation_failed", "Could not save your profile.");

    revalidatePath("/account");
    return undefined;
  });
}

export async function updatePrivateDetailsAction(input: unknown): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const user = await requireUser();
    const data = privateDetailsSchema.parse(input);
    const supabase = await getSupabaseServerClient();

    const { error } = await supabase.from("user_private_details").upsert({
      user_id: user.id,
      legal_name: data.legalName || null,
      date_of_birth: data.dateOfBirth,
      phone: data.phone || null,
    });
    if (error) throw new AppError("validation_failed", "Could not save your details.");

    revalidatePath("/account");
    return undefined;
  });
}

/**
 * Protection settings. Tightening applies immediately; LOOSENING a spend limit
 * is deliberately delayed: the new (higher/removed) limit is refused here and
 * must go through support after a 24h cooling-off period.
 */
export async function updateProtectionAction(input: unknown): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const user = await requireUser();
    const data = protectionSchema.parse(input);
    const supabase = await getSupabaseServerClient();

    const { data: current } = await supabase
      .from("user_protection_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const newLimitMinor = data.spendLimitMajor === null ? null : data.spendLimitMajor * 100;
    const currentLimit = current?.spend_limit_minor ?? null;

    const isLoosening =
      currentLimit !== null && (newLimitMinor === null || newLimitMinor > currentLimit);
    if (isLoosening) {
      throw new AppError(
        "forbidden",
        "Raising or removing a spending limit has a 24-hour cooling-off period — contact support to confirm the change.",
      );
    }

    const { error } = await supabase.from("user_protection_settings").upsert({
      user_id: user.id,
      spend_limit_minor: newLimitMinor,
      spend_limit_period: data.spendLimitPeriod,
      paused_until:
        data.pauseDays && data.pauseDays > 0
          ? new Date(Date.now() + data.pauseDays * 86_400_000).toISOString()
          : (current?.paused_until ?? null),
    });
    if (error) throw new AppError("validation_failed", "Could not save protection settings.");

    logInfo("protection_settings_updated", { userId: user.id });
    revalidatePath("/account/protection");
    return undefined;
  });
}

export async function selfExcludeAction(input: unknown): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const user = await requireUser();
    const data = selfExclusionSchema.parse(input);
    const supabase = await getSupabaseServerClient();

    const endsAt =
      data.months === 60
        ? null // indefinite
        : new Date(Date.now() + data.months * 30 * 86_400_000).toISOString();

    const { error: settingsError } = await supabase.from("user_protection_settings").upsert({
      user_id: user.id,
      self_excluded_at: new Date().toISOString(),
      self_exclusion_ends_at: endsAt,
      marketing_blocked: true,
    });
    if (settingsError) throw new AppError("internal", "Could not apply self-exclusion.");

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ account_status: "self_excluded", marketing_opt_in: false })
      .eq("id", user.id);
    if (profileError) throw new AppError("internal", "Could not apply self-exclusion.");

    logInfo("self_exclusion_applied", { userId: user.id, months: data.months });
    revalidatePath("/account");
    return undefined;
  });
}

/** GDPR-style export of the user's own data (RLS-scoped reads). */
export async function exportMyDataAction(): Promise<ActionResult<Record<string, unknown>>> {
  return toActionResult(async () => {
    const user = await requireUser();
    const supabase = await getSupabaseServerClient();

    const [profile, details, consents, orders, entries, favorites, notifications, protection] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_private_details").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_consents").select("*").eq("user_id", user.id),
        supabase.from("entry_orders").select("*").eq("user_id", user.id),
        supabase.from("entries").select("*").eq("user_id", user.id),
        supabase.from("favorites").select("*").eq("user_id", user.id),
        supabase.from("notifications").select("*").eq("user_id", user.id),
        supabase.from("user_protection_settings").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

    return {
      exported_at: new Date().toISOString(),
      profile: profile.data,
      private_details: details.data,
      consents: consents.data,
      orders: orders.data,
      entries: entries.data,
      favourites: favorites.data,
      notifications: notifications.data,
      protection_settings: protection.data,
    };
  });
}

/**
 * Account closure: marks the account closed and revokes sessions. Hard
 * deletion of auth records is completed by an operator job (service key)
 * respecting financial record retention duties.
 */
export async function closeAccountAction(): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const user = await requireUser();
    const supabase = await getSupabaseServerClient();

    const { error } = await supabase
      .from("profiles")
      .update({ account_status: "closed", marketing_opt_in: false })
      .eq("id", user.id);
    if (error) throw new AppError("internal", "Could not close the account.");

    await supabase.auth.signOut({ scope: "global" });
    logInfo("account_closed", { userId: user.id });
    return undefined;
  });
}

export async function signOutAllSessionsAction(): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    await requireUser();
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.signOut({ scope: "others" });
    if (error) throw new AppError("internal", "Could not revoke other sessions.");
    return undefined;
  });
}
