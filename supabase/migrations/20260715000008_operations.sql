-- ============================================================================
-- ChanceMarket · 00008 · Operations: notifications, reports, disputes,
-- support, admin actions, immutable audit log
-- ============================================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  event text not null,
  subject_type text,
  subject_id uuid,
  data jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_event on public.audit_logs (event, created_at desc);
create index idx_audit_subject on public.audit_logs (subject_type, subject_id, created_at desc);

create trigger trg_audit_immutable before update or delete on public.audit_logs
  for each row execute function public.forbid_change();

create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users (id) on delete restrict,
  action text not null,
  subject_type text not null,
  subject_id uuid,
  justification text not null constraint aa_justification check (char_length(justification) >= 10),
  metadata jsonb,
  second_approver_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint aa_distinct_approver check (second_approver_id is null or second_approver_id <> actor_id)
);

create index idx_admin_actions on public.admin_actions (actor_id, created_at desc);

create trigger trg_aa_immutable before update or delete on public.admin_actions
  for each row execute function public.forbid_change();

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications (user_id, created_at desc);
create index idx_notifications_unread on public.notifications (user_id) where read_at is null;

create table public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email_marketing boolean not null default false,
  email_transactional boolean not null default true,
  inapp_campaign_updates boolean not null default true,
  inapp_draw_results boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger trg_np_updated before update on public.notification_preferences
  for each row execute function public.set_updated_at();

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users (id) on delete set null,
  subject_type text not null constraint rep_subject check (subject_type in ('campaign','user','seller','question')),
  subject_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'open' constraint rep_status check (status in ('open','reviewing','actioned','dismissed')),
  handled_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_reports_status on public.reports (status, created_at);

create trigger trg_reports_updated before update on public.reports
  for each row execute function public.set_updated_at();

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  campaign_id uuid references public.campaigns (id) on delete set null,
  order_id uuid references public.entry_orders (id) on delete set null,
  kind text not null constraint disp_kind check (kind in ('refund','prize','conduct','payment','other')),
  status text not null default 'open'
    constraint disp_status check (status in ('open','investigating','resolved','rejected','escalated')),
  summary text not null,
  resolution text,
  handled_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_disputes_status on public.disputes (status, created_at);

create trigger trg_disputes_updated before update on public.disputes
  for each row execute function public.set_updated_at();

create table public.support_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject text not null,
  status text not null default 'open'
    constraint st_status check (status in ('open','pending_user','pending_support','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_st_updated before update on public.support_threads
  for each row execute function public.set_updated_at();

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  is_staff boolean not null default false,
  body text not null constraint sm_len check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index idx_sm_thread on public.support_messages (thread_id, created_at);

-- Notification helper used by service code + outbox processing.
create or replace function public.enqueue_notification(
  p_user_id uuid,
  p_kind text,
  p_title text,
  p_body text default null,
  p_href text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.notifications (user_id, kind, title, body, href)
  values (p_user_id, p_kind, p_title, p_body, p_href)
  returning id into v_id;

  insert into public.outbox_events (topic, payload)
  values ('notification.created', jsonb_build_object('notification_id', v_id, 'user_id', p_user_id, 'kind', p_kind));

  return v_id;
end;
$$;

revoke all on function public.enqueue_notification(uuid, text, text, text, text) from public;
grant execute on function public.enqueue_notification(uuid, text, text, text, text) to service_role;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.audit_logs enable row level security;
alter table public.admin_actions enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.reports enable row level security;
alter table public.disputes enable row level security;
alter table public.support_threads enable row level security;
alter table public.support_messages enable row level security;

create policy audit_select_admin on public.audit_logs
  for select to authenticated using (public.is_admin((select auth.uid())));

-- audit rows are inserted by SECURITY DEFINER functions and service code; the
-- insert policy for authenticated exists so definer functions running as the
-- calling role can write.
create policy audit_insert on public.audit_logs
  for insert to authenticated with check (true);

create policy aa_select_admin on public.admin_actions
  for select to authenticated using (public.is_staff((select auth.uid())));

create policy aa_insert_admin on public.admin_actions
  for insert to authenticated
  with check (actor_id = (select auth.uid()) and public.is_staff((select auth.uid())));

create policy notif_select_own on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));

create policy notif_update_own on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy np_select_own on public.notification_preferences
  for select to authenticated using (user_id = (select auth.uid()));

create policy np_upsert_own on public.notification_preferences
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy np_update_own on public.notification_preferences
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy reports_insert on public.reports
  for insert to authenticated with check (reporter_id = (select auth.uid()));

create policy reports_select on public.reports
  for select to authenticated
  using (reporter_id = (select auth.uid()) or public.is_staff((select auth.uid())));

create policy reports_update_staff on public.reports
  for update to authenticated
  using (public.is_staff((select auth.uid())))
  with check (public.is_staff((select auth.uid())));

create policy disputes_insert_own on public.disputes
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy disputes_select on public.disputes
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff((select auth.uid())));

create policy disputes_update_staff on public.disputes
  for update to authenticated
  using (public.is_staff((select auth.uid())))
  with check (public.is_staff((select auth.uid())));

create policy st_select on public.support_threads
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff((select auth.uid())));

create policy st_insert_own on public.support_threads
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy st_update on public.support_threads
  for update to authenticated
  using (user_id = (select auth.uid()) or public.is_staff((select auth.uid())))
  with check (user_id = (select auth.uid()) or public.is_staff((select auth.uid())));

create policy sm_select on public.support_messages
  for select to authenticated
  using (
    exists (select 1 from public.support_threads t where t.id = support_messages.thread_id
            and (t.user_id = (select auth.uid()) or public.is_staff((select auth.uid()))))
  );

create policy sm_insert on public.support_messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (select 1 from public.support_threads t where t.id = support_messages.thread_id
                and (t.user_id = (select auth.uid()) or public.is_staff((select auth.uid()))))
  );

-- Realtime: notifications stream to their owner.
alter publication supabase_realtime add table public.notifications;
