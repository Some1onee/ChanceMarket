import type { Metadata } from "next";
import Link from "next/link";
import { FileSearch } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Section } from "@/components/marketing/section";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/dates";
import { getLocale } from "@/lib/localization/locale";

export const metadata: Metadata = {
  title: "Draw verification",
  description:
    "Public records of every draw: frozen snapshot hashes, selection seeds and winning positions.",
};

export default async function DrawsPage() {
  const locale = await getLocale();
  const supabase = await getSupabaseServerClient();

  const { data: draws } = await supabase
    .from("draws")
    .select("id, public_id, status, selected_at, created_at, campaigns(title, slug)")
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (draws ?? []) as unknown as Array<{
    id: string;
    public_id: string;
    status: string;
    selected_at: string | null;
    created_at: string;
    campaigns: { title: string; slug: string } | null;
  }>;

  return (
    <Section
      eyebrow="Transparency"
      title="Draw verification records"
      description="Before every selection, the eligible entry list is frozen and hashed. The record below lets anyone verify that the published winner matches the recorded seed and snapshot — personal data stays private."
    >
      {rows.length === 0 ? (
        <EmptyState
          icon={<FileSearch aria-hidden />}
          title="No draws yet"
          description="Draw records appear here as soon as campaigns close."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-subtle text-left text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3">Draw ID</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Selected</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((draw) => (
                <tr key={draw.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/draws/${draw.public_id}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {draw.public_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/campaigns/${draw.campaigns?.slug ?? ""}`}
                      className="hover:underline"
                    >
                      {draw.campaigns?.title ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        draw.status === "winner_verified"
                          ? "success"
                          : draw.status === "rerolled"
                            ? "warning"
                            : "info"
                      }
                      className="capitalize"
                    >
                      {draw.status.replaceAll("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {draw.selected_at ? formatDateTime(draw.selected_at, locale) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
