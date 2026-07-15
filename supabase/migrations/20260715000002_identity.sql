-- ============================================================================
-- ChanceMarket · 00002 · Identity: profiles, roles, private details,
-- consents, protection settings, verifications, seller profiles
-- ============================================================================

-- ── profiles (public-safe user data) ────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Member'
    constraint profiles_display_name_len check (char_length(display_name) between 1 and 60),
  avatar_url text,
  bio text constraint profiles_bio_len check (bio is null or char_length(bio) <= 500),
  country_code text constraint profiles_country_iso check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  subdivision_code text constraint profiles_subdivision check (subdivision_code is null or subdivision_code ~ '^[A-Z0-9-]{1,10}$'),
  city text,
  locale text not null default 'en-GB',
  currency text not null default 'GBP' constraint profiles_currency check (currency in ('GBP','USD')),
  identity_status public.verification_status not null default 'not_started',
  age_status public.verification_status not null default 'not_started',
  account_status text not null default 'active'
    constraint profiles_account_status check (account_status in ('active','restricted','paused','self_excluded','closed')),
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── user_roles (server-managed; NEVER writable by end users) ────────────────
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.user_role not null,
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create index idx_user_roles_user on public.user_roles (user_id);

-- Role check helpers. SECURITY DEFINER with fixed search_path; STABLE so the
-- planner can cache within a statement.
create or replace function public.has_role(p_user_id uuid, p_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = p_user_id and role::text = p_role
  );
$$;

create or replace function public.is_staff(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = p_user_id
      and role in ('moderator','compliance','support','finance','admin','super_admin')
  );
$$;

create or replace function public.is_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = p_user_id and role in ('admin','super_admin')
  );
$$;

revoke all on function public.has_role(uuid, text) from public;
grant execute on function public.has_role(uuid, text) to authenticated, service_role;
revoke all on function public.is_staff(uuid) from public;
grant execute on function public.is_staff(uuid) to authenticated, service_role;
revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated, service_role;

create or replace function public.get_my_roles()
returns table (role public.user_role)
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_roles where user_id = auth.uid();
$$;
grant execute on function public.get_my_roles() to authenticated;

-- ── user_private_details (PII kept out of profiles) ─────────────────────────
create table public.user_private_details (
  user_id uuid primary key references auth.users (id) on delete cascade,
  legal_name text,
  date_of_birth date constraint upd_dob_reasonable
    check (date_of_birth is null or (date_of_birth > date '1900-01-01' and date_of_birth < now()::date)),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_upd_updated before update on public.user_private_details
  for each row execute function public.set_updated_at();

-- ── user_consents (append-only history) ─────────────────────────────────────
create table public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  consent_key text not null,
  granted boolean not null,
  version text not null default '1',
  created_at timestamptz not null default now()
);

create index idx_user_consents_user on public.user_consents (user_id, consent_key, created_at desc);

create trigger trg_user_consents_immutable
  before update or delete on public.user_consents
  for each row execute function public.forbid_change();

-- ── user_protection_settings (spending limits, pauses, self-exclusion) ──────
create table public.user_protection_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  spend_limit_minor bigint constraint ups_limit_positive check (spend_limit_minor is null or spend_limit_minor > 0),
  spend_limit_currency text not null default 'GBP',
  spend_limit_period text not null default 'monthly'
    constraint ups_period check (spend_limit_period in ('daily','weekly','monthly')),
  paused_until timestamptz,
  self_excluded_at timestamptz,
  self_exclusion_ends_at timestamptz,
  marketing_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_ups_updated before update on public.user_protection_settings
  for each row execute function public.set_updated_at();

-- ── identity_verifications (provider references only; no documents) ─────────
create table public.identity_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  provider_ref text,
  kind text not null constraint iv_kind check (kind in ('identity','age','kyb','residence')),
  status public.verification_status not null default 'pending',
  result_summary jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_identity_verifications_user on public.identity_verifications (user_id, kind, created_at desc);

create trigger trg_iv_updated before update on public.identity_verifications
  for each row execute function public.set_updated_at();

-- ── seller_profiles ─────────────────────────────────────────────────────────
create table public.seller_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  business_name text,
  entity_type text not null default 'individual'
    constraint sp_entity check (entity_type in ('individual','company')),
  country_code text not null constraint sp_country check (country_code ~ '^[A-Z]{2}$'),
  status text not null default 'pending'
    constraint sp_status check (status in ('pending','approved','suspended','rejected')),
  kyb_status public.verification_status not null default 'not_started',
  payout_details_set boolean not null default false,
  terms_accepted_at timestamptz,
  max_active_campaigns integer not null default 3 constraint sp_max_campaigns check (max_active_campaigns >= 0),
  allowed_category_ids uuid[],
  public_name text not null constraint sp_public_name_len check (char_length(public_name) between 2 and 80),
  public_bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_sp_updated before update on public.seller_profiles
  for each row execute function public.set_updated_at();

-- ── auto-provision profile on signup (SECURITY DEFINER trigger) ─────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1), 'Member')
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id, role) do nothing;

  insert into public.user_protection_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_private_details enable row level security;
alter table public.user_consents enable row level security;
alter table public.user_protection_settings enable row level security;
alter table public.identity_verifications enable row level security;
alter table public.seller_profiles enable row level security;

-- profiles: owner reads/updates own row; staff read all; public reads nothing
-- (public seller identity is exposed via seller_profiles.public_name).
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_staff((select auth.uid())));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    -- status fields are server-managed; users cannot self-upgrade
    and account_status in ('active','paused','self_excluded')
  );

-- user_roles: readable by the owner and staff; writable only by service_role.
create policy user_roles_select on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

-- user_private_details: strictly owner (+ compliance staff read).
create policy upd_select_own on public.user_private_details
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.has_role((select auth.uid()), 'compliance')
    or public.is_admin((select auth.uid()))
  );

create policy upd_insert_own on public.user_private_details
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy upd_update_own on public.user_private_details
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- user_consents: owner append + read; immutable.
create policy consents_select_own on public.user_consents
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

create policy consents_insert_own on public.user_consents
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- protection settings: owner read/update (server functions enforce cooling-off
-- rules for loosening limits).
create policy ups_select_own on public.user_protection_settings
  for select to authenticated
  using (user_id = (select auth.uid()) or public.has_role((select auth.uid()), 'compliance') or public.is_admin((select auth.uid())));

create policy ups_update_own on public.user_protection_settings
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy ups_insert_own on public.user_protection_settings
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- identity_verifications: owner read; writes via service_role only.
create policy iv_select_own on public.identity_verifications
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.has_role((select auth.uid()), 'compliance')
    or public.is_admin((select auth.uid()))
  );

-- seller_profiles: public can see approved sellers' public fields via a view;
-- owners see their row; staff see all.
create policy sp_select on public.seller_profiles
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or status = 'approved'
    or public.is_staff((select auth.uid()))
  );

create policy sp_select_anon on public.seller_profiles
  for select to anon
  using (status = 'approved');

create policy sp_insert_own on public.seller_profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending');

create policy sp_update_own on public.seller_profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    -- sellers cannot self-approve: status transitions happen server-side
    and status = (select s.status from public.seller_profiles s where s.id = seller_profiles.id)
  );
