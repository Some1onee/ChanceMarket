# Legal review checklist — per launch territory

Complete ONE copy of this checklist, signed by qualified local counsel, for EVERY
territory (country and, where relevant, subdivision) before setting
`jurisdictions.is_active = true`. Attach the signed record to the jurisdiction row
(`legal_approved_at`, notes) and store the opinion with compliance.

Territory: ______________  Counsel: ______________  Date: ______________

## Promotion mechanics
- [ ] Qualification of each enabled format (paid prize competition, free draw,
      sweepstakes, hybrid, skill-based) under local gambling/lottery/promotions law.
- [ ] Whether the platform and/or the seller is the legal "promoter", and licensing or
      registration duties for either.
- [ ] **Free entry route**: legally sufficient form (online/postal), required prominence,
      equal-chances wording, postal handling obligations.
- [ ] **Skill requirement**: the level of skill/judgement legally required for the
      question to remove "chance" qualification — review the actual questions, not just
      the mechanism.
- [ ] Paid-entry price caps, total-stake caps, per-person caps.
- [ ] Official rules template + campaign-specific rules: mandatory content, language,
      accessibility, deposit/filing duties.

## Participants
- [ ] Minimum age (and per-format differences); acceptable verification level.
- [ ] Residency/eligibility restrictions and required disclosures.
- [ ] Registration/bonding duties for prize values above thresholds (e.g. NY/FL style
      sweepstakes registration), surety bonds, winner lists publication duties.
- [ ] Consumer protection: cancellation/refund rights, unfair-terms review of Terms,
      complaint/ADR requirements.
- [ ] Responsible-play obligations: limits, self-exclusion registers, mandatory
      helplines/wording.

## Money & data
- [ ] Tax: prize taxation, withholding duties, platform/seller reporting (incl. DAC7 or
      local marketplace reporting), VAT/sales-tax treatment of entry fees & commissions.
- [ ] KYC/AML: whether the activity triggers AML obligations; thresholds configured in
      `jurisdiction_campaign_types.kyc_required_above_minor`.
- [ ] Data protection: lawful bases, DOB processing, cross-border transfers, retention
      schedule, DPO/representative needs, cookie/consent rules.
- [ ] Advertising/marketing rules for prize promotions (claims, social, influencer).

## Prizes & fulfilment
- [ ] Prize delivery obligations, substitution rules, insurance duties.
- [ ] **Vehicles**: title transfer, registration, taxes, roadworthiness — confirm the
      documented workflow satisfies local process.
- [ ] **Real estate**: whether it may be raffled AT ALL; notary/escrow requirements,
      transfer taxes, mandatory disclosures. Keep category disabled unless fully cleared.
- [ ] Postal restrictions affecting entry or prize shipment.
- [ ] Payment provider's territory-specific conditions (cross-check
      PROVIDER_APPROVAL_CHECKLIST).

## Sign-off
- [ ] The seeded/configured rows in `jurisdictions`, `jurisdiction_campaign_types`,
      `jurisdiction_categories`, `jurisdiction_rules` match this advice exactly.
- [ ] Counsel signature + date recorded; `requires_legal_approval` cleared and
      `legal_approved_at` set only after this checklist is complete.
