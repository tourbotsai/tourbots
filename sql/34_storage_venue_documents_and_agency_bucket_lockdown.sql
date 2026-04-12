-- 34_storage_venue_documents_and_agency_bucket_lockdown.sql
-- Keep public read for these buckets, but remove public write/update/delete.
-- Buckets covered:
-- - venue-documents
-- - Agency
-- - agency
-- Writes are handled through authenticated server routes using service_role.

DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        COALESCE(qual, '') ILIKE '%bucket_id = ''venue-documents''%'
        OR COALESCE(with_check, '') ILIKE '%bucket_id = ''venue-documents''%'
        OR COALESCE(qual, '') ILIKE '%bucket_id = ''Agency''%'
        OR COALESCE(with_check, '') ILIKE '%bucket_id = ''Agency''%'
        OR COALESCE(qual, '') ILIKE '%bucket_id = ''agency''%'
        OR COALESCE(with_check, '') ILIKE '%bucket_id = ''agency''%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

create policy "Public read venue-documents bucket"
  on storage.objects
  for select
  to public
  using (bucket_id = 'venue-documents');

create policy "Service role upload venue-documents bucket"
  on storage.objects
  for insert
  to service_role
  with check (bucket_id = 'venue-documents');

create policy "Service role update venue-documents bucket"
  on storage.objects
  for update
  to service_role
  using (bucket_id = 'venue-documents')
  with check (bucket_id = 'venue-documents');

create policy "Service role delete venue-documents bucket"
  on storage.objects
  for delete
  to service_role
  using (bucket_id = 'venue-documents');

create policy "Public read Agency bucket"
  on storage.objects
  for select
  to public
  using (bucket_id = 'Agency');

create policy "Service role upload Agency bucket"
  on storage.objects
  for insert
  to service_role
  with check (bucket_id = 'Agency');

create policy "Service role update Agency bucket"
  on storage.objects
  for update
  to service_role
  using (bucket_id = 'Agency')
  with check (bucket_id = 'Agency');

create policy "Service role delete Agency bucket"
  on storage.objects
  for delete
  to service_role
  using (bucket_id = 'Agency');

create policy "Public read agency bucket"
  on storage.objects
  for select
  to public
  using (bucket_id = 'agency');

create policy "Service role upload agency bucket"
  on storage.objects
  for insert
  to service_role
  with check (bucket_id = 'agency');

create policy "Service role update agency bucket"
  on storage.objects
  for update
  to service_role
  using (bucket_id = 'agency')
  with check (bucket_id = 'agency');

create policy "Service role delete agency bucket"
  on storage.objects
  for delete
  to service_role
  using (bucket_id = 'agency');
