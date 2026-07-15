-- ============================================================================
-- ChanceMarket · 00006 · Finance: payments, refunds, append-only ledger,
-- seller balances, payouts, platform fees, webhook & outbox events
-- ============================================================================

create table public.payment_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  provider_customer_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  order_id uuid references public.entry_orders (id) on delete set null,
  provider text not null,
  provider_intent_id text,
  amount_minor bigint not null constraint pt_amount check (amount_minor > 0),
  currency text not null,
  status public.payment_status not null default 'created',
  failure_reason text,
  idempotency_key text not null unique,
  refunded_minor bigint not null default 0 constraint pt_refunded check (refunded_minor >= 0 and refunded_minor <= amount_minor),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_pt_user on public.payment_transactions (user_id, created_at desc);
create index idx_pt_order on public.payment_transactions (order_id);
create index idx_pt_provider_intent on public.payment_transactions (provider, provider_intent_id);

create trigger trg_pt_updated before update on public.payment_transactions
  for each row execute function public.set_updated_at();

-- Payment status transitions guard.
create or replace function public.guard_payment_transition()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  ok boolean;
begin
  if old.status = new.status then return new; end if;
  ok := case old.status
    when 'created' then new.status in ('requires_action','processing','succeeded','failed','cancelled')
    when 'requires_action' then new.status in ('processing','succeeded','failed','cancelled')
    when 'processing' then new.status in ('succeeded','failed','cancelled')
    when 'succeeded' then new.status in ('partially_refunded','refunded','disputed')
    when 'partially_refunded' then new.status in ('partially_refunded','refunded','disputed')
    when 'disputed' then new.status in ('refunded','partially_refunded','succeeded')
    else false
  end;
  if not ok then
    raise exception 'invalid_payment_transition from % to %', old.status, new.status;
  end if;
  return new;
end;
$$;

create trigger trg_pt_transition before update on public.payment_transactions
  for each row execute function public.guard_payment_transition();

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_transaction_id uuid not null references public.payment_transactions (id) on delete restrict,
  amount_minor bigint not null constraint r_amount check (amount_minor > 0),
  currency text not null,
  reason text not null,
  status text not null default 'pending' constraint r_status check (status in ('pending','succeeded','failed')),
  provider_refund_id text,
  requested_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_refunds_pt on public.refunds (payment_transaction_id);

create trigger trg_refunds_updated before update on public.refunds
  for each row execute function public.set_updated_at();

-- ── financial_ledger: APPEND-ONLY double-entry style records ────────────────
create table public.financial_ledger (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null constraint fl_type check (entry_type in (
    'entry_payment','platform_fee','provider_fee','refund','chargeback',
    'reserve_hold','reserve_release','seller_payout','payout_reversal','adjustment'
  )),
  account text not null constraint fl_account check (account in ('platform','seller','user','provider','reserve')),
  account_ref uuid,
  campaign_id uuid references public.campaigns (id) on delete restrict,
  payment_transaction_id uuid references public.payment_transactions (id) on delete restrict,
  payout_id uuid,
  amount_minor bigint not null constraint fl_amount check (amount_minor <> 0),
  currency text not null,
  memo text,
  idempotency_key text unique,
  created_at timestamptz not null default now()
);

create index idx_fl_account on public.financial_ledger (account, account_ref, created_at desc);
create index idx_fl_campaign on public.financial_ledger (campaign_id);

create trigger trg_fl_immutable before update or delete on public.financial_ledger
  for each row execute function public.forbid_change();

-- ── seller_balances: derived cache, refreshed from the ledger ───────────────
create table public.seller_balances (
  seller_id uuid not null references public.seller_profiles (id) on delete cascade,
  currency text not null,
  available_minor bigint not null default 0,
  reserved_minor bigint not null default 0,
  pending_minor bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (seller_id, currency)
);

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_profiles (id) on delete restrict,
  campaign_id uuid references public.campaigns (id) on delete set null,
  amount_minor bigint not null constraint po_amount check (amount_minor > 0),
  currency text not null,
  status public.payout_status not null default 'pending',
  provider_payout_id text,
  approved_by uuid references auth.users (id) on delete set null,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payouts_seller on public.payouts (seller_id, status);

create trigger trg_payouts_updated before update on public.payouts
  for each row execute function public.set_updated_at();

alter table public.financial_ledger
  add constraint fl_payout_fk foreign key (payout_id) references public.payouts (id) on delete restrict;

create table public.platform_fees (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null unique references public.campaigns (id) on delete cascade,
  basis_points integer not null default 1000 constraint pf_bp check (basis_points between 0 and 10000),
  fixed_minor bigint not null default 0 constraint pf_fixed check (fixed_minor >= 0),
  currency text not null default 'GBP',
  created_at timestamptz not null default now()
);

-- ── webhook_events: replay-proof inbox ──────────────────────────────────────
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  status text not null default 'received'
    constraint we_status check (status in ('received','processed','failed','skipped')),
  error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, event_id)
);

create index idx_we_status on public.webhook_events (status, received_at);

-- ── outbox_events: reliable side-effect dispatch ────────────────────────────
create table public.outbox_events (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  payload jsonb not null,
  status text not null default 'pending'
    constraint oe_status check (status in ('pending','processing','delivered','failed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index idx_oe_pending on public.outbox_events (next_attempt_at) where status in ('pending','failed');

-- ── ledger append helper (service only) ─────────────────────────────────────
create or replace function public.record_ledger_entry(
  p_entry_type text,
  p_account text,
  p_account_ref uuid,
  p_campaign_id uuid,
  p_payment_transaction_id uuid,
  p_amount_minor bigint,
  p_currency text,
  p_memo text default null,
  p_idempotency_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_idempotency_key is not null then
    select id into v_id from public.financial_ledger where idempotency_key = p_idempotency_key;
    if found then return v_id; end if;
  end if;

  insert into public.financial_ledger (
    entry_type, account, account_ref, campaign_id, payment_transaction_id,
    amount_minor, currency, memo, idempotency_key
  ) values (
    p_entry_type, p_account, p_account_ref, p_campaign_id, p_payment_transaction_id,
    p_amount_minor, p_currency, p_memo, p_idempotency_key
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.record_ledger_entry(text, text, uuid, uuid, uuid, bigint, text, text, text) from public;
grant execute on function public.record_ledger_entry(text, text, uuid, uuid, uuid, bigint, text, text, text) to service_role;

-- Refresh a seller's cached balance from the ledger (source of truth).
create or replace function public.refresh_seller_balance(p_seller_id uuid, p_currency text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.seller_balances (seller_id, currency, available_minor, reserved_minor, pending_minor, updated_at)
  select
    p_seller_id,
    p_currency,
    coalesce(sum(amount_minor) filter (where entry_type in ('entry_payment','platform_fee','provider_fee','refund','chargeback','seller_payout','payout_reversal','adjustment')), 0),
    coalesce(sum(amount_minor) filter (where entry_type in ('reserve_hold','reserve_release')), 0),
    0,
    now()
  from public.financial_ledger
  where account = 'seller' and account_ref = p_seller_id and currency = p_currency
  on conflict (seller_id, currency) do update
    set available_minor = excluded.available_minor,
        reserved_minor = excluded.reserved_minor,
        updated_at = now();
end;
$$;

revoke all on function public.refresh_seller_balance(uuid, text) from public;
grant execute on function public.refresh_seller_balance(uuid, text) to service_role;

-- ============================================================================
-- RLS — financial tables are user-readable for their own records only;
-- ALL writes flow through service-role server code.
-- ============================================================================
alter table public.payment_customers enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.refunds enable row level security;
alter table public.financial_ledger enable row level security;
alter table public.seller_balances enable row level security;
alter table public.payouts enable row level security;
alter table public.platform_fees enable row level security;
alter table public.webhook_events enable row level security;  -- no policies: service only
alter table public.outbox_events enable row level security;   -- no policies: service only

create policy pc_select_own on public.payment_customers
  for select to authenticated using (user_id = (select auth.uid()));

create policy pt_select_own on public.payment_transactions
  for select to authenticated
  using (user_id = (select auth.uid()) or public.has_role((select auth.uid()), 'finance') or public.is_admin((select auth.uid())));

create policy refunds_select_own on public.refunds
  for select to authenticated
  using (
    exists (
      select 1 from public.payment_transactions pt
      where pt.id = refunds.payment_transaction_id and pt.user_id = (select auth.uid())
    )
    or public.has_role((select auth.uid()), 'finance')
    or public.is_admin((select auth.uid()))
  );

create policy fl_select_staff on public.financial_ledger
  for select to authenticated
  using (public.has_role((select auth.uid()), 'finance') or public.is_admin((select auth.uid())));

create policy sb_select_own on public.seller_balances
  for select to authenticated
  using (
    exists (select 1 from public.seller_profiles sp where sp.id = seller_balances.seller_id and sp.user_id = (select auth.uid()))
    or public.has_role((select auth.uid()), 'finance')
    or public.is_admin((select auth.uid()))
  );

create policy payouts_select_own on public.payouts
  for select to authenticated
  using (
    exists (select 1 from public.seller_profiles sp where sp.id = payouts.seller_id and sp.user_id = (select auth.uid()))
    or public.has_role((select auth.uid()), 'finance')
    or public.is_admin((select auth.uid()))
  );

create policy pf_select on public.platform_fees
  for select to authenticated
  using (public.owns_campaign(campaign_id) or public.is_staff((select auth.uid())));
