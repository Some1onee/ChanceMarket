-- ============================================================================
-- ChanceMarket · 00010 · Harden SECURITY DEFINER function grants.
-- Supabase default privileges grant EXECUTE to anon/authenticated on new
-- functions; explicit revokes are required (revoke from PUBLIC is not enough).
-- anon keeps ONLY what anon-facing RLS policies evaluate.
-- ============================================================================

-- Service-only pipeline & internals: no anon, no authenticated.
revoke execute on function public.close_campaign_entries(uuid) from anon, authenticated;
revoke execute on function public.create_draw_snapshot(uuid) from anon, authenticated;
revoke execute on function public.select_draw_winner(uuid) from anon, authenticated;
revoke execute on function public.confirm_draw_winner(uuid) from anon, authenticated;
revoke execute on function public.reroll_draw(uuid, text, uuid, uuid) from anon, authenticated;
revoke execute on function public.record_ledger_entry(text, text, uuid, uuid, uuid, bigint, text, text, text) from anon, authenticated;
revoke execute on function public.refresh_seller_balance(uuid, text) from anon, authenticated;
revoke execute on function public.release_expired_reservations() from anon, authenticated;
revoke execute on function public.enqueue_notification(uuid, text, text, text, text) from anon, authenticated;
revoke execute on function public.user_spend_in_period(uuid, text) from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;

-- Authenticated-only actions: strip anon.
revoke execute on function public.create_entry_order(uuid, integer, public.entry_source, text, text, uuid) from anon;
revoke execute on function public.confirm_entry_order(uuid, uuid) from anon;
revoke execute on function public.cancel_entry_order(uuid, text) from anon;
revoke execute on function public.submit_skill_response(uuid, uuid) from anon;
revoke execute on function public.transition_campaign_status(uuid, public.campaign_status, text) from anon;
revoke execute on function public.get_my_roles() from anon;
revoke execute on function public.has_role(uuid, text) from anon;
revoke execute on function public.is_admin(uuid) from anon;

-- Kept for anon on purpose (evaluated inside anon-facing RLS policies):
--   is_staff, owns_campaign, campaign_is_public, check_entry_eligibility

-- audit_logs: the permissive always-true INSERT policy is unnecessary —
-- SECURITY DEFINER functions run as the table owner, which bypasses RLS.
drop policy if exists audit_insert on public.audit_logs;
