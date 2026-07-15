import type { Metadata } from "next";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { getDictionary } from "@/lib/localization/dictionaries";
import { getLocale } from "@/lib/localization/locale";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const locale = await getLocale();
  const t = getDictionary(locale);
  return <SignInForm next={next} t={t.auth.signIn} />;
}
