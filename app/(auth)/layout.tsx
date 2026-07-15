import Link from "next/link";
import { Wordmark } from "@/components/layout/wordmark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="prize-spotlight flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="mb-8">
        <Wordmark className="text-2xl" />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-md">
        {children}
      </div>
      <p className="mt-6 max-w-md text-center text-xs text-muted-foreground">
        18+ or the minimum age in your territory. By continuing you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
