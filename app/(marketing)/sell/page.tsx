import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Banknote, ScrollText, ShieldCheck } from "lucide-react";
import { Section } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { SellerOnboardingForm } from "@/features/sellers/components/onboarding-form";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Sell with us",
  description:
    "List a remarkable item as a prize campaign. We run entries, payments, compliance and the draw — you get a transparent settlement.",
};

const PILLARS = [
  {
    icon: <BadgeCheck className="size-5" aria-hidden />,
    title: "Verified sellers only",
    body: "KYC/KYB and proof of ownership before anything goes live — buyers trust the marketplace, so campaigns fill faster.",
  },
  {
    icon: <ShieldCheck className="size-5" aria-hidden />,
    title: "Compliance handled",
    body: "The campaign builder only offers formats permitted in active territories; free routes and skill questions are enforced where required.",
  },
  {
    icon: <Banknote className="size-5" aria-hidden />,
    title: "Transparent settlement",
    body: "Gross, provider fees, platform commission, reserves and refunds — every line itemised before payout.",
  },
  {
    icon: <ScrollText className="size-5" aria-hidden />,
    title: "Auditable draws",
    body: "Server-side, hashed, publicly verifiable draws protect you from disputes as much as they protect entrants.",
  },
];

export default async function SellPage() {
  const user = await getSessionUser();
  let sellerStatus: string | null = null;
  if (user) {
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase
      .from("seller_profiles")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();
    sellerStatus = data?.status ?? null;
  }

  return (
    <>
      <Section
        eyebrow="For sellers"
        title="Turn one remarkable item into a campaign thousands can join"
        description="You list the prize; we run entries, payments, territorial compliance, moderation and the draw."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-xl border border-border bg-card p-5 shadow-xs"
            >
              <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                {pillar.icon}
              </div>
              <h2 className="mb-1.5 text-sm font-semibold">{pillar.title}</h2>
              <p className="text-sm text-muted-foreground">{pillar.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="border-t border-border bg-subtle">
        <Section eyebrow="Apply" title="Seller application" className="max-w-3xl">
          {!user ? (
            <Alert>
              <AlertTitle>Create an account first</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center gap-3">
                Selling requires a verified member account.
                <Button size="sm" asChild>
                  <Link href="/sign-up">Create account</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/sign-in?next=/sell">Sign in</Link>
                </Button>
              </AlertDescription>
            </Alert>
          ) : sellerStatus === "approved" ? (
            <Alert variant="success">
              <AlertTitle>You are an approved seller</AlertTitle>
              <AlertDescription>
                <Button size="sm" asChild className="mt-2">
                  <Link href="/seller">Go to your seller dashboard</Link>
                </Button>
              </AlertDescription>
            </Alert>
          ) : sellerStatus ? (
            <Alert variant="info">
              <AlertTitle>Application {sellerStatus.replaceAll("_", " ")}</AlertTitle>
              <AlertDescription>
                Our team reviews applications manually. You&apos;ll be notified as soon as a
                decision is made —{" "}
                <Link href="/seller" className="underline underline-offset-2">
                  check your status
                </Link>
                .
              </AlertDescription>
            </Alert>
          ) : (
            <SellerOnboardingForm />
          )}
        </Section>
      </div>
    </>
  );
}
