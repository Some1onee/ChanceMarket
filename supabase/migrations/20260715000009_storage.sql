-- ============================================================================
-- ChanceMarket · 00009 · Storage buckets and policies
--  · avatars            public read, owner-scoped write
--  · campaign-images    public read (published campaigns' media), seller write
--  · campaign-documents PRIVATE — seller upload, staff read, signed URLs only
--  · fulfilment-proofs  PRIVATE — winner/seller upload, staff read
-- Paths are namespaced by owner id so policies can bind on the first folder.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp','image/avif']),
  ('campaign-images', 'campaign-images', true, 8388608, array['image/jpeg','image/png','image/webp','image/avif']),
  ('campaign-documents', 'campaign-documents', false, 10485760, array['application/pdf','image/jpeg','image/png','image/webp']),
  ('fulfilment-proofs', 'fulfilment-proofs', false, 10485760, array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- avatars/<user_id>/<random>.<ext>
create policy "avatars_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'avatars');

create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

-- campaign-images/<seller_user_id>/<campaign_id>/<random>.<ext>
create policy "campaign_images_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'campaign-images');

create policy "campaign_images_insert_seller" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'campaign-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and exists (
      select 1 from public.seller_profiles sp
      where sp.user_id = (select auth.uid()) and sp.status = 'approved'
    )
  );

create policy "campaign_images_delete_seller" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'campaign-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- campaign-documents/<seller_user_id>/<campaign_id>/<random>.<ext>
create policy "campaign_documents_insert_seller" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'campaign-documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "campaign_documents_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'campaign-documents'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or public.is_staff((select auth.uid()))
    )
  );

-- fulfilment-proofs/<user_id>/<draw_id>/<random>.<ext>
create policy "fulfilment_proofs_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fulfilment-proofs'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "fulfilment_proofs_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'fulfilment-proofs'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or public.is_staff((select auth.uid()))
    )
  );
