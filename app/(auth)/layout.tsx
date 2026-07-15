import Link from "next/link";
import { Wordmark } from "@/components/layout/wordmark";
import { getDictionary } from "@/lib/localization/dictionaries";
import { getLocale } from "@/lib/localization/locale";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = getDictionary(locale).auth.disclaimer;
  return (
    <div className="prize-spotlight flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="mb-8">
        <Wordmark className="text-2xl" />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-md">
        {children}
      </div>
      <p className="mt-6 max-w-md text-center text-xs text-muted-foreground">
        {t.agePrefix}{" "}
        <Link href="/terms" className="underline underline-offset-2">
          {t.terms}
        </Link>{" "}
        {t.and}{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          {t.privacy}
        </Link>
        .
      </p>
    </div>
  );
}
