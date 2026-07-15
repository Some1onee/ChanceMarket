import "server-only";

import { cache } from "react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/database.types";
import { AppError } from "@/lib/errors";

export type SessionUser = {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  roles: UserRole[];
  accountStatus: string;
  countryCode: string | null;
  subdivisionCode: string | null;
  locale: string;
  currency: string;
};

/**
 * Resolve the authenticated user with profile + server-managed roles.
 * Cached per request. Returns null when unauthenticated.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  return {
    id: user.id,
    email: user.email ?? null,
    displayName: profile?.display_name ?? user.email?.split("@")[0] ?? "Member",
    avatarUrl: profile?.avatar_url ?? null,
    roles: (roleRows ?? []).map((r) => r.role),
    accountStatus: profile?.account_status ?? "active",
    countryCode: profile?.country_code ?? null,
    subdivisionCode: profile?.subdivision_code ?? null,
    locale: profile?.locale ?? "en-GB",
    currency: profile?.currency ?? "GBP",
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AppError("unauthorized", "Sign in to continue.");
  return user;
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  seller: 1,
  support: 2,
  moderator: 3,
  compliance: 3,
  finance: 3,
  admin: 4,
  super_admin: 5,
};

export function hasRole(user: SessionUser, role: UserRole): boolean {
  if (user.roles.includes(role)) return true;
  // admin/super_admin satisfy any staff-role requirement
  const required = ROLE_HIERARCHY[role];
  return user.roles.some((r) => ROLE_HIERARCHY[r] >= 4 && ROLE_HIERARCHY[r] >= required);
}

export async function requireRole(role: UserRole): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasRole(user, role)) {
    throw new AppError("forbidden", "You do not have permission to do this.");
  }
  return user;
}
