-- ============================================================================
-- ChanceMarket · 00001 · Extensions, enum types, shared helper functions
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ── Enum types ──────────────────────────────────────────────────────────────
create type public.user_role as enum (
  'user', 'seller', 'moderator', 'compliance', 'support', 'finance', 'admin', 'super_admin'
);

create type public.campaign_type as enum (
  'paid_prize_competition', 'free_draw', 'sweepstakes',
  'hybrid_paid_with_free_route', 'skill_based_competition'
);

create type public.campaign_status as enum (
  'draft', 'submitted', 'under_review', 'changes_requested', 'approved',
  'scheduled', 'active', 'paused', 'sold_out', 'closing', 'drawing',
  'winner_pending', 'winner_confirmed', 'fulfilment', 'completed',
  'cancelled', 'rejected', 'disputed'
);

create type public.verification_status as enum (
  'not_started', 'pending', 'verified', 'failed', 'manual_review', 'expired'
);

create type public.entry_status as enum ('pending', 'confirmed', 'cancelled', 'excluded');

create type public.entry_source as enum ('paid', 'free_route', 'promotional');

create type public.order_status as enum (
  'pending', 'awaiting_payment', 'processing', 'confirmed', 'cancelled', 'failed', 'refunded'
);

create type public.payment_status as enum (
  'created', 'requires_action', 'processing', 'succeeded', 'failed',
  'cancelled', 'partially_refunded', 'refunded', 'disputed'
);

create type public.payout_status as enum (
  'pending', 'held', 'approved', 'processing', 'paid', 'failed', 'reversed'
);

create type public.draw_status as enum (
  'pending', 'snapshot_created', 'selected', 'winner_verified',
  'void', 'reroll_requested', 'rerolled'
);

create type public.fulfilment_status as enum (
  'provisional_winner', 'verifying', 'accepted', 'collecting_details',
  'shipping', 'delivered', 'ownership_transferred', 'received_confirmed',
  'declined', 'expired', 'disputed', 'replaced'
);

-- ── updated_at trigger helper ───────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ── Role helpers (SECURITY DEFINER: read user_roles regardless of RLS) ──────
-- user_roles is created in 00002; functions are created there to keep
-- dependency order. Declared here as forward documentation only.

-- ── Immutability guard for append-only tables ───────────────────────────────
create or replace function public.forbid_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'table % is append-only', tg_table_name
    using errcode = 'raise_exception';
end;
$$;
