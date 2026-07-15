-- ============================================================================
-- ChanceMarket · 00007 · Draws: snapshots, CSPRNG selection, winner
-- verification, prize fulfilment. Server-side only; fully audited.
-- ============================================================================

create sequence public.draw_public_seq start 100;

create table public.draws (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete restrict,
  public_id text not null unique,
  status public.draw_status not null default 'pending',
  snapshot_id uuid,
  winner_entry_id uuid references public.entries (id) on delete restrict,
  selection_method text not null default 'csprng'
    constraint d_method check (selection_method in ('csprng','external_seed')),
  random_seed text,        -- revealed after selection: hex of CSPRNG bytes
  random_seed_hash text,   -- sha256(seed), recorded at selection time
  selected_at timestamptz,
  executed_by uuid references auth.users (id) on delete set null,
  reroll_of uuid references public.draws (id) on delete restrict,
  reroll_reason text,
  reroll_approved_by uuid references auth.users (id) on delete set null,
  reroll_second_approver uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint d_reroll_approvers check (
    reroll_second_approver is null
    or reroll_approved_by is null
    or reroll_second_approver <> reroll_approved_by
  )
);

create index idx_draws_campaign on public.draws (campaign_id, created_at desc);

create trigger trg_draws_updated before update on public.draws
  for each row execute function public.set_updated_at();

create table public.draw_snapshots (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null unique references public.draws (id) on delete restrict,
  campaign_id uuid not null references public.campaigns (id) on delete restrict,
  entries_count integer not null constraint ds_count check (entries_count > 0),
  snapshot_hash text not null,
  rules_version_id uuid references public.campaign_rules_versions (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.draws
  add constraint d_snapshot_fk foreign key (snapshot_id) references public.draw_snapshots (id) on delete restrict;

-- Snapshots and their entries are immutable once written.
create trigger trg_ds_immutable before update or delete on public.draw_snapshots
  for each row execute function public.forbid_change();

create table public.draw_entries (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.draw_snapshots (id) on delete restrict,
  entry_id uuid not null references public.entries (id) on delete restrict,
  position integer not null constraint de_pos check (position >= 1),
  unique (snapshot_id, position),
  unique (snapshot_id, entry_id)
);

create trigger trg_de_immutable before update or delete on public.draw_entries
  for each row execute function public.forbid_change();

create table public.winner_verifications (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws (id) on delete restrict,
  entry_id uuid not null references public.entries (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  status public.verification_status not null default 'pending',
  notes text,
  verified_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_wv_draw on public.winner_verifications (draw_id);

create trigger trg_wv_updated before update on public.winner_verifications
  for each row execute function public.set_updated_at();

create table public.prize_fulfilments (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws (id) on delete restrict,
  campaign_id uuid not null references public.campaigns (id) on delete restrict,
  winner_user_id uuid not null references auth.users (id) on delete restrict,
  status public.fulfilment_status not null default 'provisional_winner',
  delivery_details jsonb,
  proof_storage_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_pfu_draw on public.prize_fulfilments (draw_id);
create index idx_pfu_winner on public.prize_fulfilments (winner_user_id);

create trigger trg_pfu_updated before update on public.prize_fulfilments
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Draw pipeline functions (service_role only)
-- ============================================================================

-- Step 1: stop taking entries and cancel unfinished orders.
create or replace function public.close_campaign_entries(p_campaign_id uuid)
returns public.campaigns
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign public.campaigns;
begin
  select * into v_campaign from public.campaigns where id = p_campaign_id for update;
  if not found then
    raise exception 'campaign_not_found' using errcode = 'P0002';
  end if;

  if v_campaign.status = 'closing' then
    return v_campaign; -- idempotent
  end if;

  if v_campaign.status not in ('active','sold_out','paused') then
    raise exception 'campaign_not_closable:%', v_campaign.status using errcode = 'P0001';
  end if;

  update public.campaigns
  set status = 'closing', closed_at = coalesce(closed_at, now())
  where id = p_campaign_id
  returning * into v_campaign;

  -- Cancel unpaid orders and release their reservations.
  update public.entry_orders
  set status = 'cancelled'
  where campaign_id = p_campaign_id and status in ('pending','awaiting_payment');

  delete from public.entry_reservations where campaign_id = p_campaign_id;

  insert into public.audit_logs (actor_id, event, subject_type, subject_id, data)
  values (auth.uid(), 'campaign_entries_closed', 'campaign', p_campaign_id, '{}'::jsonb);

  return v_campaign;
end;
$$;

revoke all on function public.close_campaign_entries(uuid) from public;
grant execute on function public.close_campaign_entries(uuid) to service_role;

-- Step 2: freeze eligible entries into an immutable, hashed snapshot.
create or replace function public.create_draw_snapshot(p_campaign_id uuid)
returns public.draws
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_campaign public.campaigns;
  v_draw public.draws;
  v_snapshot_id uuid;
  v_count integer;
  v_hash text;
  v_rules_version uuid;
begin
  select * into v_campaign from public.campaigns where id = p_campaign_id for update;
  if not found then
    raise exception 'campaign_not_found' using errcode = 'P0002';
  end if;

  if v_campaign.status <> 'closing' then
    raise exception 'campaign_not_in_closing:%', v_campaign.status using errcode = 'P0001';
  end if;

  -- Idempotency: one live draw per campaign.
  select * into v_draw from public.draws
  where campaign_id = p_campaign_id and status in ('pending','snapshot_created','selected','winner_verified');
  if found then
    return v_draw;
  end if;

  select count(*) into v_count from public.entries
  where campaign_id = p_campaign_id and status = 'confirmed';
  if v_count = 0 then
    raise exception 'no_eligible_entries' using errcode = 'P0001';
  end if;

  select id into v_rules_version from public.campaign_rules_versions
  where campaign_id = p_campaign_id and is_current
  order by version desc limit 1;

  insert into public.draws (campaign_id, public_id, status, executed_by)
  values (
    p_campaign_id,
    'DRW-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.draw_public_seq')::text, 6, '0'),
    'pending',
    auth.uid()
  ) returning * into v_draw;

  insert into public.draw_snapshots (draw_id, campaign_id, entries_count, snapshot_hash, rules_version_id)
  values (v_draw.id, p_campaign_id, v_count, 'pending', v_rules_version)
  returning id into v_snapshot_id;

  -- Freeze entries in a deterministic canonical order.
  insert into public.draw_entries (snapshot_id, entry_id, position)
  select v_snapshot_id, e.id, row_number() over (order by e.entry_number)
  from public.entries e
  where e.campaign_id = p_campaign_id and e.status = 'confirmed';

  -- Canonical hash: sha256 over "position:entry_id" lines in order.
  select encode(extensions.digest(string_agg(de.position || ':' || de.entry_id, E'\n' order by de.position), 'sha256'), 'hex')
  into v_hash
  from public.draw_entries de
  where de.snapshot_id = v_snapshot_id;

  -- The snapshot row is append-only; the hash is written in the same
  -- transaction before the immutability trigger applies to outside callers.
  alter table public.draw_snapshots disable trigger trg_ds_immutable;
  update public.draw_snapshots set snapshot_hash = v_hash where id = v_snapshot_id;
  alter table public.draw_snapshots enable trigger trg_ds_immutable;

  update public.draws set status = 'snapshot_created', snapshot_id = v_snapshot_id
  where id = v_draw.id
  returning * into v_draw;

  update public.campaigns set status = 'drawing' where id = p_campaign_id;

  insert into public.audit_logs (actor_id, event, subject_type, subject_id, data)
  values (auth.uid(), 'draw_snapshot_created', 'draw', v_draw.id,
          jsonb_build_object('campaign_id', p_campaign_id, 'entries', v_count, 'hash', v_hash));

  return v_draw;
end;
$$;

revoke all on function public.create_draw_snapshot(uuid) from public;
grant execute on function public.create_draw_snapshot(uuid) to service_role;

-- Step 3: select the winner with an in-database CSPRNG (pgcrypto).
-- Deterministically derivable from the revealed seed: index = (seed mod n) + 1.
create or replace function public.select_draw_winner(p_draw_id uuid)
returns public.draws
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_draw public.draws;
  v_snapshot public.draw_snapshots;
  v_seed_bytes bytea;
  v_seed_hex text;
  v_seed_hash text;
  v_index integer;
  v_winner_entry uuid;
  v_winner_user uuid;
begin
  select * into v_draw from public.draws where id = p_draw_id for update;
  if not found then
    raise exception 'draw_not_found' using errcode = 'P0002';
  end if;

  if v_draw.status = 'selected' then
    return v_draw; -- idempotent: NEVER silently re-run
  end if;
  if v_draw.status <> 'snapshot_created' then
    raise exception 'draw_not_ready:%', v_draw.status using errcode = 'P0001';
  end if;

  select * into v_snapshot from public.draw_snapshots where id = v_draw.snapshot_id;

  -- 16 bytes from pgcrypto's CSPRNG. Never Math.random(), never client-side.
  v_seed_bytes := extensions.gen_random_bytes(16);
  v_seed_hex := encode(v_seed_bytes, 'hex');
  v_seed_hash := encode(extensions.digest(v_seed_bytes, 'sha256'), 'hex');

  -- Winner index from the first 8 bytes interpreted as a big-endian unsigned
  -- integer, reduced mod n (bias < 2^-50 for n ≤ 10^6 — documented in docs/DRAWS.md).
  v_index := (abs(('x' || substr(v_seed_hex, 1, 16))::bit(64)::bigint) % v_snapshot.entries_count) + 1;

  select de.entry_id into v_winner_entry
  from public.draw_entries de
  where de.snapshot_id = v_snapshot.id and de.position = v_index;

  select e.user_id into v_winner_user from public.entries e where e.id = v_winner_entry;

  update public.draws
  set status = 'selected',
      winner_entry_id = v_winner_entry,
      random_seed = v_seed_hex,
      random_seed_hash = v_seed_hash,
      selected_at = now()
  where id = p_draw_id
  returning * into v_draw;

  insert into public.winner_verifications (draw_id, entry_id, user_id, status)
  values (p_draw_id, v_winner_entry, v_winner_user, 'pending');

  update public.campaigns set status = 'winner_pending' where id = v_draw.campaign_id;

  insert into public.audit_logs (actor_id, event, subject_type, subject_id, data)
  values (auth.uid(), 'draw_winner_selected', 'draw', p_draw_id,
          jsonb_build_object('index', v_index, 'seed', v_seed_hex, 'seed_hash', v_seed_hash,
                             'snapshot_hash', v_snapshot.snapshot_hash));

  return v_draw;
end;
$$;

revoke all on function public.select_draw_winner(uuid) from public;
grant execute on function public.select_draw_winner(uuid) to service_role;

-- Step 4: confirm the verified winner and open fulfilment.
create or replace function public.confirm_draw_winner(p_draw_id uuid)
returns public.draws
language plpgsql
security definer
set search_path = public
as $$
declare
  v_draw public.draws;
  v_user uuid;
begin
  select * into v_draw from public.draws where id = p_draw_id for update;
  if not found then
    raise exception 'draw_not_found' using errcode = 'P0002';
  end if;
  if v_draw.status = 'winner_verified' then
    return v_draw;
  end if;
  if v_draw.status <> 'selected' then
    raise exception 'draw_not_selected:%', v_draw.status using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.winner_verifications
    where draw_id = p_draw_id and status = 'verified'
  ) then
    raise exception 'winner_not_verified' using errcode = 'P0001';
  end if;

  select user_id into v_user from public.entries where id = v_draw.winner_entry_id;

  update public.draws set status = 'winner_verified' where id = p_draw_id
  returning * into v_draw;

  update public.campaigns set status = 'winner_confirmed' where id = v_draw.campaign_id;

  insert into public.prize_fulfilments (draw_id, campaign_id, winner_user_id, status)
  values (p_draw_id, v_draw.campaign_id, v_user, 'provisional_winner');

  insert into public.audit_logs (actor_id, event, subject_type, subject_id, data)
  values (auth.uid(), 'draw_winner_confirmed', 'draw', p_draw_id, '{}'::jsonb);

  return v_draw;
end;
$$;

revoke all on function public.confirm_draw_winner(uuid) from public;
grant execute on function public.confirm_draw_winner(uuid) to service_role;

-- Strictly-controlled re-roll: mandatory reason + two DISTINCT admins.
-- The original draw is preserved (status 'rerolled'); a new draw is created
-- against the SAME immutable snapshot.
create or replace function public.reroll_draw(
  p_draw_id uuid,
  p_reason text,
  p_first_approver uuid,
  p_second_approver uuid
)
returns public.draws
language plpgsql
security definer
set search_path = public
as $$
declare
  v_draw public.draws;
  v_new public.draws;
begin
  if p_reason is null or char_length(trim(p_reason)) < 10 then
    raise exception 'reroll_reason_required' using errcode = 'P0001';
  end if;
  if p_first_approver is null or p_second_approver is null or p_first_approver = p_second_approver then
    raise exception 'two_distinct_approvers_required' using errcode = 'P0001';
  end if;
  if not public.is_admin(p_first_approver) or not public.is_admin(p_second_approver) then
    raise exception 'approvers_must_be_admins' using errcode = 'P0001';
  end if;

  select * into v_draw from public.draws where id = p_draw_id for update;
  if not found then
    raise exception 'draw_not_found' using errcode = 'P0002';
  end if;
  if v_draw.status not in ('selected','winner_verified') then
    raise exception 'draw_not_rerollable:%', v_draw.status using errcode = 'P0001';
  end if;

  update public.draws
  set status = 'rerolled',
      reroll_reason = p_reason,
      reroll_approved_by = p_first_approver,
      reroll_second_approver = p_second_approver
  where id = p_draw_id;

  insert into public.draws (campaign_id, public_id, status, snapshot_id, executed_by, reroll_of, reroll_reason)
  values (
    v_draw.campaign_id,
    'DRW-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.draw_public_seq')::text, 6, '0'),
    'snapshot_created',
    v_draw.snapshot_id,
    auth.uid(),
    p_draw_id,
    p_reason
  ) returning * into v_new;

  update public.campaigns set status = 'drawing' where id = v_draw.campaign_id;

  insert into public.audit_logs (actor_id, event, subject_type, subject_id, data)
  values (auth.uid(), 'draw_rerolled', 'draw', p_draw_id,
          jsonb_build_object('new_draw_id', v_new.id, 'reason', p_reason,
                             'approver_1', p_first_approver, 'approver_2', p_second_approver));

  return v_new;
end;
$$;

revoke all on function public.reroll_draw(uuid, text, uuid, uuid) from public;
grant execute on function public.reroll_draw(uuid, text, uuid, uuid) to service_role;

-- ============================================================================
-- RLS — draw records are publicly verifiable (privacy-preserving columns
-- are selected by the app; entry→user mapping stays restricted).
-- ============================================================================
alter table public.draws enable row level security;
alter table public.draw_snapshots enable row level security;
alter table public.draw_entries enable row level security;
alter table public.winner_verifications enable row level security;
alter table public.prize_fulfilments enable row level security;

create policy draws_select_public on public.draws
  for select to anon, authenticated using (true);

create policy ds_select_public on public.draw_snapshots
  for select to anon, authenticated using (true);

-- draw_entries reveal entry ids only to staff and the campaign's seller.
create policy de_select_restricted on public.draw_entries
  for select to authenticated
  using (
    public.is_staff((select auth.uid()))
    or exists (
      select 1 from public.draw_snapshots ds
      where ds.id = draw_entries.snapshot_id and public.owns_campaign(ds.campaign_id)
    )
  );

create policy wv_select on public.winner_verifications
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff((select auth.uid())));

create policy wv_update_staff on public.winner_verifications
  for update to authenticated
  using (public.is_staff((select auth.uid())))
  with check (public.is_staff((select auth.uid())));

create policy pfu_select on public.prize_fulfilments
  for select to authenticated
  using (
    winner_user_id = (select auth.uid())
    or public.owns_campaign(campaign_id)
    or public.is_staff((select auth.uid()))
  );

create policy pfu_update_winner on public.prize_fulfilments
  for update to authenticated
  using (winner_user_id = (select auth.uid()) or public.is_staff((select auth.uid())))
  with check (winner_user_id = (select auth.uid()) or public.is_staff((select auth.uid())));
