-- ============================================================================
-- ChanceMarket · 00004 · Catalogue: categories, campaigns, media, rules,
-- eligibility regions, Q&A, favourites, moderation + campaign state machine
-- ============================================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique constraint cat_slug check (slug ~ '^[a-z0-9-]{2,50}$'),
  name text not null,
  description text,
  icon text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  requires_extra_review boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.jurisdiction_categories
  add constraint jc_category_fk foreign key (category_id)
  references public.categories (id) on delete cascade;

-- ── campaigns ───────────────────────────────────────────────────────────────
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_profiles (id) on delete restrict,
  category_id uuid not null references public.categories (id) on delete restrict,
  slug text not null unique constraint c_slug check (slug ~ '^[a-z0-9-]{3,80}$'),
  title text not null constraint c_title_len check (char_length(title) between 5 and 120),
  summary text constraint c_summary_len check (summary is null or char_length(summary) <= 240),
  description text,
  campaign_type public.campaign_type not null,
  status public.campaign_status not null default 'draft',
  prize_value_minor bigint not null constraint c_prize_value check (prize_value_minor > 0),
  currency text not null default 'GBP' constraint c_currency check (currency in ('GBP','USD')),
  entry_price_minor bigint not null default 0 constraint c_entry_price check (entry_price_minor >= 0),
  min_entries_per_order integer not null default 1 constraint c_min_order check (min_entries_per_order >= 1),
  max_entries_per_order integer not null default 25,
  max_entries_per_user integer not null default 100,
  max_entries_total integer not null constraint c_max_total check (max_entries_total >= 1),
  entries_confirmed integer not null default 0 constraint c_confirmed_nonneg check (entries_confirmed >= 0),
  free_route_enabled boolean not null default false,
  free_route_instructions text,
  skill_question_required boolean not null default false,
  min_age integer not null default 18 constraint c_min_age check (min_age between 13 and 25),
  starts_at timestamptz,
  ends_at timestamptz,
  location_country text,
  location_region text,
  delivery_policy text,
  cover_image_path text,
  attributes jsonb,
  published_at timestamptz,
  closed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint c_order_bounds check (max_entries_per_order >= min_entries_per_order),
  constraint c_user_cap check (max_entries_per_user >= 1),
  constraint c_total_cap check (max_entries_total >= max_entries_per_user or max_entries_per_user <= max_entries_total),
  constraint c_confirmed_cap check (entries_confirmed <= max_entries_total),
  constraint c_window check (ends_at is null or starts_at is null or ends_at > starts_at),
  -- paid formats need a price; free formats must be free
  constraint c_price_type check (
    (campaign_type in ('free_draw','sweepstakes') and entry_price_minor = 0)
    or (campaign_type not in ('free_draw','sweepstakes'))
  )
);

create index idx_campaigns_status on public.campaigns (status);
create index idx_campaigns_public on public.campaigns (status, ends_at)
  where status in ('active','sold_out','closing');
create index idx_campaigns_seller on public.campaigns (seller_id, status);
create index idx_campaigns_category on public.campaigns (category_id);

create trigger trg_campaigns_updated before update on public.campaigns
  for each row execute function public.set_updated_at();

-- ── campaign_images ─────────────────────────────────────────────────────────
create table public.campaign_images (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_campaign_images on public.campaign_images (campaign_id, sort_order);

-- ── campaign_documents (private: ownership proof, valuations) ───────────────
create table public.campaign_documents (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  storage_path text not null,
  document_type text not null default 'proof_of_ownership'
    constraint cdoc_type check (document_type in ('proof_of_ownership','valuation','insurance','other')),
  status text not null default 'pending' constraint cdoc_status check (status in ('pending','accepted','rejected')),
  notes text,
  created_at timestamptz not null default now()
);

create index idx_campaign_documents on public.campaign_documents (campaign_id);

-- ── campaign_rules_versions (official rules, versioned per language) ────────
create table public.campaign_rules_versions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  version integer not null default 1,
  language text not null default 'en-GB',
  content_md text not null,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  unique (campaign_id, language, version)
);

create index idx_crv_current on public.campaign_rules_versions (campaign_id) where is_current;

-- ── campaign_eligibility_regions (allow/deny list per campaign) ─────────────
create table public.campaign_eligibility_regions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  country_code text not null constraint cer_country check (country_code ~ '^[A-Z]{2}$'),
  subdivision_code text,
  mode text not null default 'allow' constraint cer_mode check (mode in ('allow','deny')),
  created_at timestamptz not null default now(),
  unique (campaign_id, country_code, subdivision_code, mode)
);

create index idx_cer_campaign on public.campaign_eligibility_regions (campaign_id);

-- ── campaign Q&A ────────────────────────────────────────────────────────────
create table public.campaign_questions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  question text not null constraint cq_len check (char_length(question) between 5 and 500),
  answer text,
  answered_at timestamptz,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_cq_campaign on public.campaign_questions (campaign_id, is_public);

-- ── favourites ──────────────────────────────────────────────────────────────
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, campaign_id)
);

create index idx_favorites_user on public.favorites (user_id, created_at desc);

-- ── moderation_cases ────────────────────────────────────────────────────────
create table public.moderation_cases (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  status text not null default 'pending'
    constraint mc_status check (status in ('pending','approved','changes_requested','rejected','escalated')),
  risk_score integer not null default 0 constraint mc_risk check (risk_score between 0 and 100),
  assigned_to uuid references auth.users (id) on delete set null,
  internal_notes text,
  decision_reason text,
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_mc_status on public.moderation_cases (status, created_at);

create trigger trg_mc_updated before update on public.moderation_cases
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Campaign state machine — the ONLY sanctioned way to change campaign.status.
-- ============================================================================
create or replace function public.allowed_campaign_transitions(p_from public.campaign_status)
returns public.campaign_status[]
language sql
immutable
set search_path = ''
as $$
  select case p_from
    when 'draft' then array['submitted','cancelled']::public.campaign_status[]
    when 'submitted' then array['under_review','cancelled']::public.campaign_status[]
    when 'under_review' then array['approved','changes_requested','rejected','cancelled']::public.campaign_status[]
    when 'changes_requested' then array['submitted','cancelled']::public.campaign_status[]
    when 'approved' then array['scheduled','active','cancelled']::public.campaign_status[]
    when 'scheduled' then array['active','cancelled']::public.campaign_status[]
    when 'active' then array['paused','sold_out','closing','cancelled','disputed']::public.campaign_status[]
    when 'paused' then array['active','closing','cancelled','disputed']::public.campaign_status[]
    when 'sold_out' then array['closing','disputed']::public.campaign_status[]
    when 'closing' then array['drawing','cancelled','disputed']::public.campaign_status[]
    when 'drawing' then array['winner_pending','disputed']::public.campaign_status[]
    when 'winner_pending' then array['winner_confirmed','drawing','disputed']::public.campaign_status[]
    when 'winner_confirmed' then array['fulfilment','disputed']::public.campaign_status[]
    when 'fulfilment' then array['completed','disputed']::public.campaign_status[]
    when 'disputed' then array['active','closing','drawing','winner_pending','fulfilment','completed','cancelled']::public.campaign_status[]
    else array[]::public.campaign_status[]
  end;
$$;

create or replace function public.transition_campaign_status(
  p_campaign_id uuid,
  p_new_status public.campaign_status,
  p_reason text default null
)
returns public.campaigns
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign public.campaigns;
  v_uid uuid := auth.uid();
  v_is_seller boolean;
  v_is_staff boolean;
begin
  select * into v_campaign from public.campaigns where id = p_campaign_id for update;
  if not found then
    raise exception 'campaign_not_found' using errcode = 'P0002';
  end if;

  v_is_staff := public.is_staff(v_uid) or auth.role() = 'service_role';
  select exists (
    select 1 from public.seller_profiles sp
    where sp.id = v_campaign.seller_id and sp.user_id = v_uid
  ) into v_is_seller;

  if not (v_is_staff or v_is_seller) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- Sellers may only submit, cancel their own drafts, or pause/resume.
  if v_is_seller and not v_is_staff then
    if not (
      (v_campaign.status = 'draft' and p_new_status in ('submitted','cancelled')) or
      (v_campaign.status = 'changes_requested' and p_new_status in ('submitted','cancelled')) or
      (v_campaign.status = 'active' and p_new_status = 'paused') or
      (v_campaign.status = 'paused' and p_new_status = 'active')
    ) then
      raise exception 'transition_not_allowed_for_seller' using errcode = '42501';
    end if;
  end if;

  if not (p_new_status = any (public.allowed_campaign_transitions(v_campaign.status))) then
    raise exception 'invalid_transition from % to %', v_campaign.status, p_new_status
      using errcode = 'P0001';
  end if;

  update public.campaigns
  set status = p_new_status,
      published_at = case when p_new_status = 'active' and published_at is null then now() else published_at end,
      closed_at = case when p_new_status in ('closing','cancelled') and closed_at is null then now() else closed_at end,
      rejection_reason = case when p_new_status in ('rejected','changes_requested') then p_reason else rejection_reason end
  where id = p_campaign_id
  returning * into v_campaign;

  insert into public.audit_logs (actor_id, event, subject_type, subject_id, data)
  values (v_uid, 'campaign_status_changed', 'campaign', p_campaign_id,
          jsonb_build_object('to', p_new_status, 'reason', p_reason));

  return v_campaign;
end;
$$;

-- audit_logs is created in 00008; defer grant of execute until then is not
-- necessary — function compiles at call time in plpgsql.
revoke all on function public.transition_campaign_status(uuid, public.campaign_status, text) from public;
grant execute on function public.transition_campaign_status(uuid, public.campaign_status, text) to authenticated, service_role;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.categories enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_images enable row level security;
alter table public.campaign_documents enable row level security;
alter table public.campaign_rules_versions enable row level security;
alter table public.campaign_eligibility_regions enable row level security;
alter table public.campaign_questions enable row level security;
alter table public.favorites enable row level security;
alter table public.moderation_cases enable row level security;

create policy categories_select on public.categories
  for select to anon, authenticated using (is_active or public.is_staff((select auth.uid())));

-- campaigns: public sees published lifecycle states; sellers see their own;
-- staff see everything. Writes only via seller-owned drafts + functions.
create policy campaigns_select_public on public.campaigns
  for select to anon, authenticated
  using (
    status in ('active','paused','sold_out','closing','drawing','winner_pending',
               'winner_confirmed','fulfilment','completed')
    or exists (
      select 1 from public.seller_profiles sp
      where sp.id = campaigns.seller_id and sp.user_id = (select auth.uid())
    )
    or public.is_staff((select auth.uid()))
  );

create policy campaigns_insert_seller on public.campaigns
  for insert to authenticated
  with check (
    status = 'draft'
    and exists (
      select 1 from public.seller_profiles sp
      where sp.id = campaigns.seller_id
        and sp.user_id = (select auth.uid())
        and sp.status = 'approved'
    )
  );

create policy campaigns_update_seller_draft on public.campaigns
  for update to authenticated
  using (
    status in ('draft','changes_requested')
    and exists (
      select 1 from public.seller_profiles sp
      where sp.id = campaigns.seller_id and sp.user_id = (select auth.uid())
    )
  )
  with check (
    -- status may not be changed by direct update (use the transition function)
    status in ('draft','changes_requested')
    and exists (
      select 1 from public.seller_profiles sp
      where sp.id = campaigns.seller_id and sp.user_id = (select auth.uid())
    )
  );

create policy campaigns_delete_seller_draft on public.campaigns
  for delete to authenticated
  using (
    status = 'draft'
    and exists (
      select 1 from public.seller_profiles sp
      where sp.id = campaigns.seller_id and sp.user_id = (select auth.uid())
    )
  );

-- helper: does the current user own the campaign's seller profile?
create or replace function public.owns_campaign(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.campaigns c
    join public.seller_profiles sp on sp.id = c.seller_id
    where c.id = p_campaign_id and sp.user_id = auth.uid()
  );
$$;
grant execute on function public.owns_campaign(uuid) to authenticated;

create or replace function public.campaign_is_public(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.campaigns c
    where c.id = p_campaign_id
      and c.status in ('active','paused','sold_out','closing','drawing','winner_pending',
                       'winner_confirmed','fulfilment','completed')
  );
$$;
grant execute on function public.campaign_is_public(uuid) to anon, authenticated;

create policy ci_select on public.campaign_images
  for select to anon, authenticated
  using (
    public.campaign_is_public(campaign_id)
    or public.owns_campaign(campaign_id)
    or public.is_staff((select auth.uid()))
  );

create policy ci_write_seller on public.campaign_images
  for insert to authenticated
  with check (public.owns_campaign(campaign_id));

create policy ci_update_seller on public.campaign_images
  for update to authenticated
  using (public.owns_campaign(campaign_id))
  with check (public.owns_campaign(campaign_id));

create policy ci_delete_seller on public.campaign_images
  for delete to authenticated
  using (public.owns_campaign(campaign_id));

-- documents: seller + staff only (never public)
create policy cdoc_select on public.campaign_documents
  for select to authenticated
  using (public.owns_campaign(campaign_id) or public.is_staff((select auth.uid())));

create policy cdoc_insert on public.campaign_documents
  for insert to authenticated
  with check (public.owns_campaign(campaign_id));

create policy crv_select on public.campaign_rules_versions
  for select to anon, authenticated
  using (
    public.campaign_is_public(campaign_id)
    or public.owns_campaign(campaign_id)
    or public.is_staff((select auth.uid()))
  );

create policy crv_insert_seller on public.campaign_rules_versions
  for insert to authenticated
  with check (public.owns_campaign(campaign_id));

create policy cer_select on public.campaign_eligibility_regions
  for select to anon, authenticated
  using (
    public.campaign_is_public(campaign_id)
    or public.owns_campaign(campaign_id)
    or public.is_staff((select auth.uid()))
  );

create policy cer_write_seller on public.campaign_eligibility_regions
  for insert to authenticated
  with check (public.owns_campaign(campaign_id));

create policy cer_delete_seller on public.campaign_eligibility_regions
  for delete to authenticated
  using (public.owns_campaign(campaign_id));

-- Q&A: public sees published answers; asker sees own; seller/staff see all for the campaign
create policy cq_select on public.campaign_questions
  for select to anon, authenticated
  using (
    (is_public and public.campaign_is_public(campaign_id))
    or user_id = (select auth.uid())
    or public.owns_campaign(campaign_id)
    or public.is_staff((select auth.uid()))
  );

create policy cq_insert on public.campaign_questions
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.campaign_is_public(campaign_id));

create policy cq_answer_seller on public.campaign_questions
  for update to authenticated
  using (public.owns_campaign(campaign_id) or public.is_staff((select auth.uid())))
  with check (public.owns_campaign(campaign_id) or public.is_staff((select auth.uid())));

-- favourites: strictly own
create policy fav_select_own on public.favorites
  for select to authenticated using (user_id = (select auth.uid()));

create policy fav_insert_own on public.favorites
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy fav_delete_own on public.favorites
  for delete to authenticated using (user_id = (select auth.uid()));

-- moderation: staff read/write; sellers see decision status of their own case
create policy mc_select on public.moderation_cases
  for select to authenticated
  using (public.is_staff((select auth.uid())) or public.owns_campaign(campaign_id));

create policy mc_update_staff on public.moderation_cases
  for update to authenticated
  using (public.is_staff((select auth.uid())))
  with check (public.is_staff((select auth.uid())));

create policy mc_insert_staff on public.moderation_cases
  for insert to authenticated
  with check (public.is_staff((select auth.uid())));
