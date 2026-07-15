import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ProtectionForm } from "@/features/profiles/components/protection-form";
import { formatMoney, isCurrency, money } from "@/lib/money";
import { getLocale } from "@/lib/localization/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Play safeguards" };

export default async function ProtectionPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const supabase = await getSupabaseServerClient();

  const [{ data: settings }, { data: spendRows }] = await Promise.all([
    supabase.from("user_protection_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("entry_orders")
      .select("total_minor, currency, created_at, status, source")
      .eq("user_id", user.id)
      .eq("source", "paid")
      .gte("created_at", new Date(Date.now() - 30 * 86_400_000).toISOString()),
  ]);

  const spent30d = (spendRows ?? [])
    .filter((row) => ["confirmed", "processing", "awaiting_payment"].includes(row.status ?? ""))
    .reduce((sum, row) => sum + (row.total_minor ?? 0), 0);
  const currency = isCurrency(user.currency) ? user.currency : "GBP";

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Play safeguards</h2>

      <Card>
        <CardHeader>
          <CardTitle>Your last 30 days</CardTitle>
          <CardDescription>
            Paid entries only. Free-route entries never cost anything.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{formatMoney(money(spent30d, currency), locale)}</p>
          <p className="text-sm text-muted-foreground">spent on entries in the last 30 days</p>
        </CardContent>
      </Card>

      <ProtectionForm
        currentLimitMajor={
          settings?.spend_limit_minor != null ? Math.floor(settings.spend_limit_minor / 100) : null
        }
        currentPeriod={
          (settings?.spend_limit_period as "daily" | "weekly" | "monthly") ?? "monthly"
        }
        pausedUntil={settings?.paused_until ?? null}
      />
    </div>
  );
}
