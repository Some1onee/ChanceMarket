-- ============================================================================
-- ChanceMarket · 00005 · Entries: skill questions, orders, entries,
-- free entry requests, reservations + transactional entry pipeline
-- ============================================================================

-- ── skill questions (the correct answer lives in a service-only table) ──────
create table public.skill_questions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  version integer not null default 1,
  question text not null,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  unique (campaign_id, version)
);

create table public.skill_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.skill_questions (id) on delete cascade,
  label text not null,
  sort_order integer not null default 0
);

-- NO RLS policies will be granted on this table: service-role only.
create table public.skill_question_answers (
  question_id uuid primary key references public.skill_questions (id) on delete cascade,
  correct_option_id uuid not null references public.skill_question_options (id) on delete cascade
);

create table public.skill_responses (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.skill_questions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  option_id uuid not null references public.skill_question_options (id) on delete cascade,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

create index idx_skill_responses_user on public.skill_responses (user_id, question_id, created_at desc);

-- ── entry_orders ────────────────────────────────────────────────────────────
create table public.entry_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  campaign_id uuid not null references public.campaigns (id) on delete restrict,
  quantity integer not null constraint eo_qty check (quantity between 1 and 1000),
  unit_price_minor bigint not null constraint eo_unit check (unit_price_minor >= 0),
  total_minor bigint not null constraint eo_total check (total_minor >= 0),
  currency text not null,
  status public.order_status not null default 'pending',
  source public.entry_source not null default 'paid',
  idempotency_key text not null,
  payment_transaction_id uuid,
  declared_country text,
  geo_check_id uuid references public.geo_checks (id) on delete set null,
  skill_response_id uuid references public.skill_responses (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index idx_eo_user on public.entry_orders (user_id, created_at desc);
create index idx_eo_campaign on public.entry_orders (campaign_id, status);

create trigger trg_eo_updated before update on public.entry_orders
  for each row execute function public.set_updated_at();

-- ── entry_reservations (hold stock while payment settles) ───────────────────
create table public.entry_reservations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  order_id uuid not null unique references public.entry_orders (id) on delete cascade,
  quantity integer not null constraint er_qty check (quantity >= 1),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index idx_er_campaign on public.entry_reservations (campaign_id, expires_at);

-- ── entries (issued tickets) ────────────────────────────────────────────────
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  order_id uuid references public.entry_orders (id) on delete set null,
  entry_number integer not null,
  source public.entry_source not null,
  status public.entry_status not null default 'confirmed',
  created_at timestamptz not null default now(),
  unique (campaign_id, entry_number)
);

create index idx_entries_campaign on public.entries (campaign_id, status);
create index idx_entries_user on public.entries (user_id, campaign_id);

-- ── free_entry_requests ─────────────────────────────────────────────────────
create table public.free_entry_requests (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  method text not null default 'online_form' constraint fer_method check (method in ('online_form','postal')),
  status text not null default 'received'
    constraint fer_status check (status in ('received','accepted','rejected','duplicate')),
  details jsonb,
  processed_by uuid references auth.users (id) on delete set null,
  processed_at timestamptz,
  order_id uuid references public.entry_orders (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_fer_campaign on public.free_entry_requests (campaign_id, status);
create index idx_fer_user on public.free_entry_requests (user_id, campaign_id);

-- ============================================================================
-- Eligibility + entry pipeline functions
-- ============================================================================

-- Territorial + campaign-level eligibility. Deny-by-default.
create or replace function public.check_entry_eligibility(
  p_campaign_id uuid,
  p_country_code text,
  p_subdivision_code text default null,
  p_quantity integer default 1
)
returns table (allowed boolean, reasons text[])
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_campaign public.campaigns;
  v_reasons text[] := '{}';
  v_jurisdiction public.jurisdictions;
  v_jct public.jurisdiction_campaign_types;
  v_has_allow_rows boolean;
begin
  select * into v_campaign from public.campaigns where id = p_campaign_id;
  if not found then
    return query select false, array['campaign_not_found']; return;
  end if;

  if v_campaign.status <> 'active' then
    v_reasons := v_reasons || 'campaign_not_active';
  end if;

  if v_campaign.starts_at is not null and now() < v_campaign.starts_at then
    v_reasons := v_reasons || 'campaign_not_started';
  end if;
  if v_campaign.ends_at is not null and now() >= v_campaign.ends_at then
    v_reasons := v_reasons || 'campaign_ended';
  end if;

  if p_country_code is null or p_country_code !~ '^[A-Z]{2}$' then
    v_reasons := v_reasons || 'location_unknown';
    return query select false, v_reasons; return;
  end if;

  -- 1. Jurisdiction must exist and be active (subdivision row wins over country row).
  select * into v_jurisdiction from public.jurisdictions
  where country_code = p_country_code
    and (subdivision_code = p_subdivision_code or subdivision_code is null)
  order by subdivision_code nulls last
  limit 1;

  if not found or not v_jurisdiction.is_active then
    v_reasons := v_reasons || 'jurisdiction_not_enabled';
    return query select false, v_reasons; return;
  end if;

  -- 2. Campaign type must be explicitly allowed in that jurisdiction (in force now).
  select * into v_jct from public.jurisdiction_campaign_types
  where jurisdiction_id = v_jurisdiction.id
    and campaign_type = v_campaign.campaign_type
    and is_allowed
    and effective_from <= now()
    and (effective_until is null or effective_until > now())
  order by effective_from desc
  limit 1;

  if not found then
    v_reasons := v_reasons || 'campaign_type_not_allowed_in_jurisdiction';
  else
    if v_jct.max_entry_price_minor is not null and v_campaign.entry_price_minor > v_jct.max_entry_price_minor then
      v_reasons := v_reasons || 'entry_price_exceeds_jurisdiction_cap';
    end if;
    if v_jct.free_route_mandatory
       and v_campaign.entry_price_minor > 0
       and not v_campaign.free_route_enabled then
      v_reasons := v_reasons || 'free_route_required_but_missing';
    end if;
  end if;

  -- 3. Category must be allowed in that jurisdiction (explicit allow required).
  if not exists (
    select 1 from public.jurisdiction_categories jc
    where jc.jurisdiction_id = v_jurisdiction.id
      and jc.category_id = v_campaign.category_id
      and jc.is_allowed
  ) then
    v_reasons := v_reasons || 'category_not_allowed_in_jurisdiction';
  end if;

  -- 4. Campaign-level allow/deny regions.
  if exists (
    select 1 from public.campaign_eligibility_regions cer
    where cer.campaign_id = p_campaign_id and cer.mode = 'deny'
      and cer.country_code = p_country_code
      and (cer.subdivision_code is null or cer.subdivision_code = p_subdivision_code)
  ) then
    v_reasons := v_reasons || 'region_excluded_by_campaign';
  end if;

  select exists (
    select 1 from public.campaign_eligibility_regions cer
    where cer.campaign_id = p_campaign_id and cer.mode = 'allow'
  ) into v_has_allow_rows;

  if v_has_allow_rows and not exists (
    select 1 from public.campaign_eligibility_regions cer
    where cer.campaign_id = p_campaign_id and cer.mode = 'allow'
      and cer.country_code = p_country_code
      and (cer.subdivision_code is null or cer.subdivision_code = p_subdivision_code)
  ) then
    v_reasons := v_reasons || 'region_not_in_campaign_allow_list';
  end if;

  -- 5. Stock sanity (advisory here; enforced under lock at confirmation).
  if p_quantity < 1 then
    v_reasons := v_reasons || 'invalid_quantity';
  end if;

  return query select (cardinality(v_reasons) = 0), v_reasons;
end;
$$;

grant execute on function public.check_entry_eligibility(uuid, text, text, integer) to anon, authenticated, service_role;

-- Answer a skill question. Correctness is checked server-side against the
-- service-only answers table; the correct option NEVER reaches the client.
create or replace function public.submit_skill_response(
  p_question_id uuid,
  p_option_id uuid
)
returns public.skill_responses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_correct uuid;
  v_attempts integer;
  v_response public.skill_responses;
begin
  if v_uid is null then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.skill_question_options o
    where o.id = p_option_id and o.question_id = p_question_id
  ) then
    raise exception 'invalid_option' using errcode = 'P0001';
  end if;

  select count(*) into v_attempts
  from public.skill_responses
  where question_id = p_question_id and user_id = v_uid;

  if v_attempts >= 5 then
    raise exception 'too_many_attempts' using errcode = 'P0001';
  end if;

  select correct_option_id into v_correct
  from public.skill_question_answers where question_id = p_question_id;

  if v_correct is null then
    raise exception 'question_not_configured' using errcode = 'P0001';
  end if;

  insert into public.skill_responses (question_id, user_id, option_id, is_correct)
  values (p_question_id, v_uid, p_option_id, p_option_id = v_correct)
  returning * into v_response;

  return v_response;
end;
$$;

revoke all on function public.submit_skill_response(uuid, uuid) from public;
grant execute on function public.submit_skill_response(uuid, uuid) to authenticated;

-- Spend within the user's protection window (paid confirmed orders).
create or replace function public.user_spend_in_period(
  p_user_id uuid,
  p_period text
)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(total_minor), 0)
  from public.entry_orders
  where user_id = p_user_id
    and status in ('confirmed','processing','awaiting_payment')
    and source = 'paid'
    and created_at >= case p_period
      when 'daily' then now() - interval '1 day'
      when 'weekly' then now() - interval '7 days'
      else now() - interval '30 days'
    end;
$$;

-- Create an order. Transactional; idempotent per (user, idempotency_key).
create or replace function public.create_entry_order(
  p_campaign_id uuid,
  p_quantity integer,
  p_source public.entry_source,
  p_idempotency_key text,
  p_declared_country text default null,
  p_skill_response_id uuid default null
)
returns public.entry_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_campaign public.campaigns;
  v_order public.entry_orders;
  v_profile public.profiles;
  v_protection public.user_protection_settings;
  v_dob date;
  v_eligible record;
  v_confirmed_by_user integer;
  v_reserved integer;
  v_spend bigint;
  v_total bigint;
begin
  if v_uid is null then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  -- Idempotency: return the existing order for this key.
  select * into v_order from public.entry_orders
  where user_id = v_uid and idempotency_key = p_idempotency_key;
  if found then
    return v_order;
  end if;

  -- Lock the campaign row: caps and counters are checked under this lock.
  select * into v_campaign from public.campaigns where id = p_campaign_id for update;
  if not found then
    raise exception 'campaign_not_found' using errcode = 'P0002';
  end if;

  select * into v_profile from public.profiles where id = v_uid;
  if v_profile.account_status <> 'active' then
    raise exception 'account_not_active:%', v_profile.account_status using errcode = 'P0001';
  end if;

  -- Protection settings: self-exclusion and pause block everything;
  -- spending limits block paid entries.
  select * into v_protection from public.user_protection_settings where user_id = v_uid;
  if v_protection.self_excluded_at is not null
     and (v_protection.self_exclusion_ends_at is null or v_protection.self_exclusion_ends_at > now()) then
    raise exception 'self_excluded' using errcode = 'P0001';
  end if;
  if v_protection.paused_until is not null and v_protection.paused_until > now() then
    raise exception 'account_paused' using errcode = 'P0001';
  end if;

  -- Territorial eligibility (deny-by-default).
  select * into v_eligible from public.check_entry_eligibility(
    p_campaign_id, coalesce(p_declared_country, v_profile.country_code),
    v_profile.subdivision_code, p_quantity
  );
  if not v_eligible.allowed then
    raise exception 'not_eligible:%', array_to_string(v_eligible.reasons, ',') using errcode = 'P0001';
  end if;

  -- Age: date of birth must be on file and satisfy the campaign minimum.
  select date_of_birth into v_dob from public.user_private_details where user_id = v_uid;
  if v_dob is null then
    raise exception 'age_unverified' using errcode = 'P0001';
  end if;
  if date_part('year', age(now(), v_dob)) < v_campaign.min_age then
    raise exception 'age_restricted' using errcode = 'P0001';
  end if;

  -- Quantity bounds.
  if p_quantity < v_campaign.min_entries_per_order or p_quantity > v_campaign.max_entries_per_order then
    raise exception 'quantity_out_of_bounds' using errcode = 'P0001';
  end if;

  -- Per-user cap (confirmed entries + my open reservations).
  select count(*) into v_confirmed_by_user
  from public.entries
  where campaign_id = p_campaign_id and user_id = v_uid and status = 'confirmed';

  select coalesce(sum(r.quantity), 0) into v_reserved
  from public.entry_reservations r
  join public.entry_orders o on o.id = r.order_id
  where r.campaign_id = p_campaign_id and o.user_id = v_uid and r.expires_at > now();

  if v_confirmed_by_user + v_reserved + p_quantity > v_campaign.max_entries_per_user then
    raise exception 'per_user_limit_reached' using errcode = 'P0001';
  end if;

  -- Total cap (confirmed + all live reservations).
  select coalesce(sum(quantity), 0) into v_reserved
  from public.entry_reservations
  where campaign_id = p_campaign_id and expires_at > now();

  if v_campaign.entries_confirmed + v_reserved + p_quantity > v_campaign.max_entries_total then
    raise exception 'sold_out' using errcode = 'P0001';
  end if;

  -- Skill requirement: a correct response is mandatory when configured.
  if v_campaign.skill_question_required and p_source in ('paid','free_route') then
    if p_skill_response_id is null then
      raise exception 'skill_response_required' using errcode = 'P0001';
    end if;
    if not exists (
      select 1
      from public.skill_responses sr
      join public.skill_questions sq on sq.id = sr.question_id
      where sr.id = p_skill_response_id
        and sr.user_id = v_uid
        and sr.is_correct
        and sq.campaign_id = p_campaign_id
        and sq.is_current
    ) then
      raise exception 'skill_response_incorrect' using errcode = 'P0001';
    end if;
  end if;

  v_total := v_campaign.entry_price_minor * p_quantity;
  if p_source <> 'paid' then
    v_total := 0;
  end if;

  -- Spending limit for paid orders.
  if v_total > 0 and v_protection.spend_limit_minor is not null then
    v_spend := public.user_spend_in_period(v_uid, v_protection.spend_limit_period);
    if v_spend + v_total > v_protection.spend_limit_minor then
      raise exception 'spending_limit_reached' using errcode = 'P0001';
    end if;
  end if;

  insert into public.entry_orders (
    user_id, campaign_id, quantity, unit_price_minor, total_minor, currency,
    status, source, idempotency_key, declared_country, skill_response_id
  ) values (
    v_uid, p_campaign_id, p_quantity,
    case when p_source = 'paid' then v_campaign.entry_price_minor else 0 end,
    v_total, v_campaign.currency,
    case when v_total > 0 then 'awaiting_payment'::public.order_status else 'pending'::public.order_status end,
    p_source, p_idempotency_key, p_declared_country
  ) returning * into v_order;

  -- Reserve stock for 15 minutes while payment settles (free orders confirm
  -- immediately afterwards and consume the reservation in the same request).
  insert into public.entry_reservations (campaign_id, order_id, quantity, expires_at)
  values (p_campaign_id, v_order.id, p_quantity, now() + interval '15 minutes');

  return v_order;
end;
$$;

revoke all on function public.create_entry_order(uuid, integer, public.entry_source, text, text, uuid) from public;
grant execute on function public.create_entry_order(uuid, integer, public.entry_source, text, text, uuid) to authenticated, service_role;

-- Confirm an order and issue entries. Idempotent. Callable by:
--  · the order owner, only when total_minor = 0 (free/free-route orders)
--  · service_role (payment webhook / draw pipeline)
create or replace function public.confirm_entry_order(
  p_order_id uuid,
  p_payment_transaction_id uuid default null
)
returns public.entry_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.entry_orders;
  v_campaign public.campaigns;
  v_uid uuid := auth.uid();
  v_is_service boolean := (auth.role() = 'service_role') or (auth.jwt() is null);
  v_next integer;
  i integer;
begin
  select * into v_order from public.entry_orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;

  -- Idempotency.
  if v_order.status = 'confirmed' then
    return v_order;
  end if;

  if not v_is_service then
    if v_order.user_id <> v_uid or v_order.total_minor > 0 then
      raise exception 'forbidden' using errcode = '42501';
    end if;
  end if;

  if v_order.status not in ('pending','awaiting_payment','processing') then
    raise exception 'order_not_confirmable:%', v_order.status using errcode = 'P0001';
  end if;

  if v_order.total_minor > 0 and p_payment_transaction_id is null then
    raise exception 'payment_required' using errcode = 'P0001';
  end if;

  select * into v_campaign from public.campaigns where id = v_order.campaign_id for update;

  if v_campaign.status not in ('active','sold_out','closing') then
    raise exception 'campaign_closed' using errcode = 'P0001';
  end if;

  -- Final cap check under lock (excluding this order's own reservation).
  if v_campaign.entries_confirmed + v_order.quantity > v_campaign.max_entries_total then
    raise exception 'sold_out' using errcode = 'P0001';
  end if;

  v_next := v_campaign.entries_confirmed;
  for i in 1 .. v_order.quantity loop
    insert into public.entries (campaign_id, user_id, order_id, entry_number, source, status)
    values (v_order.campaign_id, v_order.user_id, v_order.id, v_next + i, v_order.source, 'confirmed');
  end loop;

  update public.campaigns
  set entries_confirmed = entries_confirmed + v_order.quantity,
      status = case
        when entries_confirmed + v_order.quantity >= max_entries_total and status = 'active'
          then 'sold_out'::public.campaign_status
        else status
      end
  where id = v_campaign.id;

  update public.entry_orders
  set status = 'confirmed', payment_transaction_id = coalesce(p_payment_transaction_id, payment_transaction_id)
  where id = p_order_id
  returning * into v_order;

  delete from public.entry_reservations where order_id = p_order_id;

  return v_order;
end;
$$;

revoke all on function public.confirm_entry_order(uuid, uuid) from public;
grant execute on function public.confirm_entry_order(uuid, uuid) to authenticated, service_role;

-- Cancel an order (owner while unpaid; service anytime pre-confirmation).
create or replace function public.cancel_entry_order(
  p_order_id uuid,
  p_reason text default null
)
returns public.entry_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.entry_orders;
  v_uid uuid := auth.uid();
  v_is_service boolean := (auth.role() = 'service_role') or (auth.jwt() is null);
begin
  select * into v_order from public.entry_orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;

  if v_order.status in ('cancelled','refunded') then
    return v_order;
  end if;

  if not v_is_service and v_order.user_id <> v_uid then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_order.status = 'confirmed' and not v_is_service then
    raise exception 'confirmed_orders_require_refund_flow' using errcode = 'P0001';
  end if;

  update public.entry_orders set status = 'cancelled' where id = p_order_id
  returning * into v_order;

  delete from public.entry_reservations where order_id = p_order_id;

  return v_order;
end;
$$;

revoke all on function public.cancel_entry_order(uuid, text) from public;
grant execute on function public.cancel_entry_order(uuid, text) to authenticated, service_role;

-- Housekeeping: release expired reservations (called by cron/edge function).
create or replace function public.release_expired_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with expired as (
    delete from public.entry_reservations
    where expires_at <= now()
    returning order_id
  )
  update public.entry_orders o
  set status = 'cancelled'
  from expired e
  where o.id = e.order_id and o.status in ('pending','awaiting_payment');
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.release_expired_reservations() from public;
grant execute on function public.release_expired_reservations() to service_role;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.skill_questions enable row level security;
alter table public.skill_question_options enable row level security;
alter table public.skill_question_answers enable row level security; -- NO policies: service only
alter table public.skill_responses enable row level security;
alter table public.entry_orders enable row level security;
alter table public.entry_reservations enable row level security;    -- NO policies: service/function only
alter table public.entries enable row level security;
alter table public.free_entry_requests enable row level security;

create policy sq_select on public.skill_questions
  for select to anon, authenticated
  using (public.campaign_is_public(campaign_id) or public.owns_campaign(campaign_id) or public.is_staff((select auth.uid())));

create policy sqo_select on public.skill_question_options
  for select to anon, authenticated
  using (exists (
    select 1 from public.skill_questions sq
    where sq.id = skill_question_options.question_id
      and (public.campaign_is_public(sq.campaign_id) or public.owns_campaign(sq.campaign_id) or public.is_staff((select auth.uid())))
  ));

create policy sr_select_own on public.skill_responses
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff((select auth.uid())));

create policy eo_select_own on public.entry_orders
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.owns_campaign(campaign_id)
    or public.is_staff((select auth.uid()))
  );

create policy entries_select_own on public.entries
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.owns_campaign(campaign_id)
    or public.is_staff((select auth.uid()))
  );

create policy fer_select_own on public.free_entry_requests
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.owns_campaign(campaign_id)
    or public.is_staff((select auth.uid()))
  );

create policy fer_insert_own on public.free_entry_requests
  for insert to authenticated
  with check (user_id = (select auth.uid()));
