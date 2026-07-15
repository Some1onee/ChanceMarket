-- ============================================================================
-- ChanceMarket · 00003 · Territorial compliance engine (data model)
-- Deny-by-default: absence of an approved allowing row blocks the operation.
-- ============================================================================

-- ── jurisdictions: global → country → subdivision hierarchy ─────────────────
create table public.jurisdictions (
  id uuid primary key default gen_random_uuid(),
  country_code text not null constraint j_country check (country_code ~ '^[A-Z]{2}$' or country_code = 'GLOBAL'),
  subdivision_code text constraint j_subdivision check (subdivision_code is null or subdivision_code ~ '^[A-Z0-9-]{1,10}$'),
  name text not null,
  is_active boolean not null default false,
  requires_legal_approval boolean not null default true,
  legal_approved_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_code, subdivision_code)
);

create trigger trg_jurisdictions_updated before update on public.jurisdictions
  for each row execute function public.set_updated_at();

-- ── jurisdiction_campaign_types: which formats are allowed where ────────────
create table public.jurisdiction_campaign_types (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references public.jurisdictions (id) on delete cascade,
  campaign_type public.campaign_type not null,
  is_allowed boolean not null default false,
  free_route_mandatory boolean not null default true,
  skill_required boolean not null default false,
  min_age integer not null default 18 constraint jct_age check (min_age between 13 and 25),
  kyc_required_above_minor bigint,
  max_entry_price_minor bigint,
  max_prize_value_minor bigint,
  requires_legal_approval boolean not null default true,
  effective_from timestamptz not null default now(),
  effective_until timestamptz,
  created_at timestamptz not null default now(),
  unique (jurisdiction_id, campaign_type, effective_from)
);

create index idx_jct_lookup on public.jurisdiction_campaign_types (jurisdiction_id, campaign_type)
  where is_allowed;

-- ── jurisdiction_categories: category allow/deny per territory ──────────────
create table public.jurisdiction_categories (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references public.jurisdictions (id) on delete cascade,
  category_id uuid not null, -- FK added in 00004 after categories exists
  is_allowed boolean not null default false,
  requires_extra_review boolean not null default false,
  created_at timestamptz not null default now(),
  unique (jurisdiction_id, category_id)
);

-- ── jurisdiction_rules: free-form versioned rule values ─────────────────────
create table public.jurisdiction_rules (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references public.jurisdictions (id) on delete cascade,
  rule_key text not null,
  rule_value jsonb not null,
  version integer not null default 1,
  effective_from timestamptz not null default now(),
  effective_until timestamptz,
  requires_legal_approval boolean not null default true,
  approved_by uuid references auth.users (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (jurisdiction_id, rule_key, version)
);

create index idx_jr_lookup on public.jurisdiction_rules (jurisdiction_id, rule_key, effective_from desc);

-- Rules are versioned, never edited: block UPDATE, allow INSERT of new versions.
create trigger trg_jr_immutable before update on public.jurisdiction_rules
  for each row execute function public.forbid_change();

-- ── legal_rule_versions: reviewed/approved snapshots of regulatory text ─────
create table public.legal_rule_versions (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid references public.jurisdictions (id) on delete cascade,
  title text not null,
  content_md text not null,
  language text not null default 'en-GB',
  version integer not null default 1,
  status text not null default 'draft'
    constraint lrv_status check (status in ('draft','in_review','approved','superseded','rejected')),
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── compliance_decisions: audit of every allow/deny answer ──────────────────
create table public.compliance_decisions (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null
    constraint cd_subject check (subject_type in ('campaign_publish','entry','seller_onboarding','visibility')),
  subject_id uuid not null,
  user_id uuid references auth.users (id) on delete set null,
  campaign_id uuid,
  jurisdiction_id uuid references public.jurisdictions (id) on delete set null,
  decision text not null constraint cd_decision check (decision in ('allow','deny','review')),
  reasons text[] not null default '{}',
  rule_snapshot jsonb,
  created_at timestamptz not null default now()
);

create index idx_cd_subject on public.compliance_decisions (subject_type, subject_id, created_at desc);

create trigger trg_cd_immutable before update or delete on public.compliance_decisions
  for each row execute function public.forbid_change();

-- ── geo_checks: minimal, privacy-preserving geolocation records ─────────────
create table public.geo_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  country_code text,
  subdivision_code text,
  ip_hash text, -- salted SHA-256; raw IPs are never stored
  method text not null default 'ip_headers'
    constraint gc_method check (method in ('ip_headers','provider','declared')),
  is_consistent boolean,
  flagged_reason text,
  created_at timestamptz not null default now()
);

create index idx_geo_checks_user on public.geo_checks (user_id, created_at desc);

-- ── risk_flags ──────────────────────────────────────────────────────────────
create table public.risk_flags (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null constraint rf_subject check (subject_type in ('user','seller','campaign','order','payment')),
  subject_id uuid not null,
  flag text not null,
  severity text not null default 'low' constraint rf_severity check (severity in ('low','medium','high','critical')),
  details jsonb,
  status text not null default 'open' constraint rf_status check (status in ('open','reviewing','resolved','dismissed')),
  raised_by uuid references auth.users (id) on delete set null,
  resolved_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_risk_flags_subject on public.risk_flags (subject_type, subject_id) where status = 'open';

create trigger trg_rf_updated before update on public.risk_flags
  for each row execute function public.set_updated_at();

-- ── feature_flags: coarse kill-switches (never override jurisdiction rules) ─
create table public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create trigger trg_ff_updated before update on public.feature_flags
  for each row execute function public.set_updated_at();

-- ============================================================================
-- RLS — compliance data is readable where needed for UX (active jurisdiction
-- names, minimum ages); rule administration is service_role only.
-- ============================================================================
alter table public.jurisdictions enable row level security;
alter table public.jurisdiction_campaign_types enable row level security;
alter table public.jurisdiction_categories enable row level security;
alter table public.jurisdiction_rules enable row level security;
alter table public.legal_rule_versions enable row level security;
alter table public.compliance_decisions enable row level security;
alter table public.geo_checks enable row level security;
alter table public.risk_flags enable row level security;
alter table public.feature_flags enable row level security;

-- Everyone may read active jurisdictions (needed to render eligibility UI).
create policy j_select_public on public.jurisdictions
  for select to anon, authenticated using (is_active or public.is_staff((select auth.uid())));

create policy jct_select_public on public.jurisdiction_campaign_types
  for select to anon, authenticated using (true);

create policy jc_select_public on public.jurisdiction_categories
  for select to anon, authenticated using (true);

-- Raw rules and legal texts: staff only.
create policy jr_select_staff on public.jurisdiction_rules
  for select to authenticated using (public.is_staff((select auth.uid())));

create policy lrv_select_staff on public.legal_rule_versions
  for select to authenticated using (public.is_staff((select auth.uid())));

-- Decisions: subject user + staff read.
create policy cd_select on public.compliance_decisions
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff((select auth.uid())));

-- geo_checks: owner + compliance staff read; inserts via server only.
create policy gc_select on public.geo_checks
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.has_role((select auth.uid()), 'compliance')
    or public.is_admin((select auth.uid()))
  );

-- risk flags: staff only.
create policy rf_select_staff on public.risk_flags
  for select to authenticated using (public.is_staff((select auth.uid())));

-- feature flags: readable by all (values are non-secret), writable by nobody
-- except service_role.
create policy ff_select_public on public.feature_flags
  for select to anon, authenticated using (true);
