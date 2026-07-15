"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { brand } from "@/lib/config/brand";
import { toActionResult, type ActionResult } from "@/lib/errors";
import { AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/features/auth/schema";
import { logInfo } from "@/lib/observability/logger";

function safeNextPath(next: unknown): string {
  // Prevent open redirects: only same-origin relative paths are allowed.
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export async function signUpAction(input: unknown): Promise<ActionResult<{ email: string }>> {
  return toActionResult(async () => {
    await checkRateLimit("auth:sign-up", 10);
    const data = signUpSchema.parse(input);
    const supabase = await getSupabaseServerClient();

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { display_name: data.displayName },
        emailRedirectTo: `${brand.url}/auth/confirm`,
      },
    });
    if (error) {
      throw new AppError("validation_failed", error.message);
    }

    logInfo("user_signed_up", { email_domain: data.email.split("@")[1] });
    return { email: data.email };
  });
}

export async function signInAction(
  input: unknown,
  next?: string,
): Promise<ActionResult<{ redirectTo: string }>> {
  return toActionResult(async () => {
    await checkRateLimit("auth:sign-in", 20);
    const data = signInSchema.parse(input);
    const supabase = await getSupabaseServerClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      throw new AppError("unauthorized", "Incorrect email or password.");
    }
    return { redirectTo: safeNextPath(next) };
  });
}

export async function signOutAction(): Promise<void> {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function forgotPasswordAction(input: unknown): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    await checkRateLimit("auth:forgot", 5);
    const data = forgotPasswordSchema.parse(input);
    const supabase = await getSupabaseServerClient();
    // Always succeed outwardly: do not reveal whether the email exists.
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${brand.url}/reset-password`,
    });
    return undefined;
  });
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult<undefined>> {
  return toActionResult(async () => {
    const data = resetPasswordSchema.parse(input);
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) {
      throw new AppError("validation_failed", error.message);
    }
    return undefined;
  });
}
