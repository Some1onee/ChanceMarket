# Territorial compliance engine

**Deny-by-default**: if no active, in-force rule explicitly allows an operation in a
territory, it is blocked. Feature flags can only disable further — they can never enable
a non-approved territory.

## Data model

- `jurisdictions` — GLOBAL / country / subdivision rows; `is_active`,
  `requires_legal_approval`, `legal_approved_at`, notes. Subdivision rows override their
  country (e.g. `US-NY` inactive under an active `US`).
- `jurisdiction_campaign_types` — per (jurisdiction, format): `is_allowed`,
  `free_route_mandatory`, `skill_required`, `min_age`, `max_entry_price_minor`,
  `max_prize_value_minor`, `kyc_required_above_minor`, effective windows.
- `jurisdiction_categories` — explicit category allow list (+extra review flag).
- `jurisdiction_rules` — versioned JSON for everything else (e.g.
  `allowed_payment_providers`, mandatory texts). Versions are immutable; changes = new
  version rows, audited.
- `compliance_decisions` + `geo_checks` — append-only audit of every allow/deny answer
  and the location evidence behind it.

## Where decisions are enforced

| Question | Where |
| --- | --- |
| What may this seller configure? | `getSellerWizardOptions()` — the wizard only offers formats/categories allowed in ≥1 active jurisdiction, with the strictest aggregated constraints (age, price caps, mandatory free route/skill). |
| May this campaign be published? | `checkCampaignPublishable()` at submission — blocked unless valid somewhere active. |
| May this user see/enter it? | `checkCampaignEligibility()` server-side on detail/enter pages **and** `check_entry_eligibility()` again inside `create_entry_order()` in SQL. |
| Which location counts? | Server-resolved: IP headers first, declared profile as fallback; **mismatch ⇒ deny + review flag**. The browser's own geolocation is never trusted. |
| Which payment provider? | `jurisdiction_rules.allowed_payment_providers` (adapter gate). |
| Which age? | max(campaign.min_age, jurisdiction minimum); DOB checked in SQL at order time. |

Reason codes returned by the engine (`jurisdiction_not_enabled`,
`campaign_type_not_allowed_in_jurisdiction`, `category_not_allowed_in_jurisdiction`,
`entry_price_exceeds_jurisdiction_cap`, `free_route_required_but_missing`,
`region_excluded_by_campaign`, `region_not_in_campaign_allow_list`,
`location_mismatch_requires_review`, …) map to user-readable messages in
`features/compliance/service.ts`.

## Administering rules

Admin → Jurisdictions lists territories with their allowed formats and legal-approval
flags; activation/deactivation requires a written justification and is audited. Rule
changes go through the service role (no client write policies) — in practice: reviewed
SQL/console changes plus the audit trail. **Never activate a territory whose rules have
not been signed off by counsel** (docs/LEGAL_REVIEW_CHECKLIST.md).

## Seeded placeholders (NOT legal determinations)

- `GB` active: paid/skill/hybrid formats with skill question required, price cap £100,
  free draws allowed, sweepstakes off. Property category off.
- `US` active: sweepstakes + free draws + hybrid (free route mandatory, $50 cap);
  paid/skill formats off. `US-NY`, `US-FL` inactive pending registration/bonding review.
- `GLOBAL` row inactive forever (deny root).

Every row is `requires_legal_approval = true`. They exist so the demo works — replace
them with counsel-approved values before any real launch.
