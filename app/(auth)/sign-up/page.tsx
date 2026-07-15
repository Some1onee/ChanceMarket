import type { Metadata } from "next";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { getDictionary } from "@/lib/localization/dictionaries";
import { getLocale } from "@/lib/localization/locale";

export const metadata: Metadata = { title: "Create account" };

export default async function SignUpPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  return <SignUpForm t={t.auth.signUp} />;
}
