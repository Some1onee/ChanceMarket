"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { saveRegionsAction } from "@/features/campaigns/wizard-actions";
import { COUNTRIES, US_STATES } from "@/lib/localization/countries";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

type RegionRule = { countryCode: string; subdivisionCode: string; mode: "allow" | "deny" };

const NONE = "__none__";

export function RegionsEditor({
  campaignId,
  initialRegions,
  activeJurisdictions,
}: {
  campaignId: string;
  initialRegions: RegionRule[];
  activeJurisdictions: { countryCode: string; name: string }[];
}) {
  const [regions, setRegions] = React.useState<RegionRule[]>(initialRegions);
  const [country, setCountry] = React.useState("GB");
  const [subdivision, setSubdivision] = React.useState(NONE);
  const [mode, setMode] = React.useState<"allow" | "deny">("allow");
  const [saving, setSaving] = React.useState(false);

  function add() {
    const next: RegionRule = {
      countryCode: country,
      subdivisionCode: subdivision === NONE ? "" : subdivision,
      mode,
    };
    if (
      regions.some(
        (rule) =>
          rule.countryCode === next.countryCode &&
          rule.subdivisionCode === next.subdivisionCode &&
          rule.mode === next.mode,
      )
    ) {
      return;
    }
    setRegions((current) => [...current, next]);
  }

  async function save() {
    setSaving(true);
    const result = await saveRegionsAction(campaignId, regions);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Territory rules saved");
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Platform-level jurisdiction rules always apply first — currently active:{" "}
          {activeJurisdictions.map((jurisdiction) => jurisdiction.name).join(", ") || "none"}. Rules
          here can only narrow availability further (e.g. exclude a state). With no rules, the
          campaign is available wherever the platform allows it.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium" htmlFor="region-country">
            Country
          </label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger id="region-country" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((item) => (
                <SelectItem key={item.code} value={item.code}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {country === "US" ? (
          <div className="space-y-1">
            <label className="text-xs font-medium" htmlFor="region-state">
              State (optional)
            </label>
            <Select value={subdivision} onValueChange={setSubdivision}>
              <SelectTrigger id="region-state" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Whole country</SelectItem>
                {US_STATES.map((state) => (
                  <SelectItem key={state.code} value={state.code}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="space-y-1">
          <label className="text-xs font-medium" htmlFor="region-mode">
            Rule
          </label>
          <Select value={mode} onValueChange={(value) => setMode(value as "allow" | "deny")}>
            <SelectTrigger id="region-mode" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="allow">Allow only</SelectItem>
              <SelectItem value="deny">Exclude</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={add}>
          <Plus aria-hidden /> Add rule
        </Button>
      </div>

      {regions.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {regions.map((rule, index) => (
            <li key={index}>
              <Badge variant={rule.mode === "allow" ? "success" : "destructive"} className="gap-1.5 py-1 pr-1">
                {rule.mode === "allow" ? "Allow" : "Exclude"}: {rule.countryCode}
                {rule.subdivisionCode ? `-${rule.subdivisionCode}` : ""}
                <button
                  type="button"
                  aria-label="Remove rule"
                  className="rounded-full p-0.5 hover:bg-black/10"
                  onClick={() =>
                    setRegions((current) => current.filter((_, itemIndex) => itemIndex !== index))
                  }
                >
                  <Trash2 className="size-3" aria-hidden />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No campaign-specific territory rules.</p>
      )}

      <Button size="sm" onClick={() => void save()} loading={saving}>
        Save territory rules
      </Button>
    </div>
  );
}
