import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PrivateDetailsForm, ProfileForm } from "@/features/profiles/components/profile-form";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUser();
  const supabase = await getSupabaseServerClient();

  const [{ data: profile }, { data: details }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("user_private_details").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">Profile</h2>
        <Badge variant={profile?.identity_status === "verified" ? "success" : "neutral"}>
          Identity: {profile?.identity_status?.replaceAll("_", " ") ?? "not started"}
        </Badge>
        <Badge variant={details?.date_of_birth ? "success" : "warning"}>
          Age on file: {details?.date_of_birth ? "yes" : "required to enter"}
        </Badge>
      </div>

      <ProfileForm
        defaults={{
          displayName: profile?.display_name ?? "",
          bio: profile?.bio ?? "",
          countryCode: profile?.country_code ?? "",
          subdivisionCode: profile?.subdivision_code ?? "",
          city: profile?.city ?? "",
          locale: (profile?.locale as "en-GB" | "en-US") ?? "en-GB",
          currency: (profile?.currency as "GBP" | "USD") ?? "GBP",
          marketingOptIn: profile?.marketing_opt_in ?? false,
        }}
      />

      <PrivateDetailsForm
        defaults={{
          legalName: details?.legal_name ?? "",
          dateOfBirth: details?.date_of_birth ?? "",
          phone: details?.phone ?? "",
        }}
      />
    </div>
  );
}
