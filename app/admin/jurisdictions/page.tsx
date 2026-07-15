import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { JurisdictionToggle } from "@/features/admin/components/controls";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Jurisdictions", robots: { index: false } };

const TYPE_SHORT: Record<string, string> = {
  paid_prize_competition: "Paid comp",
  free_draw: "Free draw",
  sweepstakes: "Sweepstakes",
  hybrid_paid_with_free_route: "Hybrid",
  skill_based_competition: "Skill",
};

export default async function AdminJurisdictionsPage() {
  const supabase = await getSupabaseServerClient();

  const [{ data: jurisdictions }, { data: types }] = await Promise.all([
    supabase.from("jurisdictions").select("*").order("country_code"),
    supabase.from("jurisdiction_campaign_types").select("*"),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Jurisdictions</h1>

      <Alert variant="warning">
        <AlertTitle>Deny-by-default</AlertTitle>
        <AlertDescription>
          A campaign format only works where an active jurisdiction explicitly allows it. Every
          seeded rule is flagged <code className="font-mono text-xs">requires_legal_approval</code>{" "}
          — activate a territory only after counsel sign-off (docs/LEGAL_REVIEW_CHECKLIST.md). Rules
          are versioned; changes are audited.
        </AlertDescription>
      </Alert>

      <ul className="space-y-4">
        {(jurisdictions ?? []).map((jurisdiction) => {
          const allowed = (types ?? []).filter(
            (type) => type.jurisdiction_id === jurisdiction.id && type.is_allowed,
          );
          return (
            <li key={jurisdiction.id} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">
                  {jurisdiction.name}{" "}
                  <span className="font-mono text-xs text-muted-foreground">
                    {jurisdiction.country_code}
                    {jurisdiction.subdivision_code ? `-${jurisdiction.subdivision_code}` : ""}
                  </span>
                </h2>
                <Badge variant={jurisdiction.is_active ? "success" : "neutral"}>
                  {jurisdiction.is_active ? "Active" : "Inactive"}
                </Badge>
                {jurisdiction.requires_legal_approval ? (
                  <Badge variant="warning">Requires legal approval</Badge>
                ) : null}
              </div>
              {jurisdiction.notes ? (
                <p className="mb-2 text-xs text-muted-foreground">{jurisdiction.notes}</p>
              ) : null}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {allowed.length > 0 ? (
                  allowed.map((type) => (
                    <Badge key={type.id} variant="info">
                      {TYPE_SHORT[type.campaign_type] ?? type.campaign_type}
                      {type.free_route_mandatory ? " +free route" : ""}
                      {type.skill_required ? " +skill" : ""} · {type.min_age}+
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No formats allowed</span>
                )}
              </div>
              <JurisdictionToggle
                jurisdictionId={jurisdiction.id}
                isActive={jurisdiction.is_active}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
