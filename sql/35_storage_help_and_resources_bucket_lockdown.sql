-- 35_storage_help_and_resources_bucket_lockdown.sql
-- Keep public read for these buckets, remove public write/update/delete.
-- Buckets covered:
-- - help
-- - resources
-- Writes are handled via authenticated server routes using service_role.

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
        COALESCE(qual, '') ILIKE '%bucket_id = ''help''%'
        OR COALESCE(with_check, '') ILIKE '%bucket_id = ''help''%'
        OR COALESCE(qual, '') ILIKE '%bucket_id = ''resources''%'
        OR COALESCE(with_check, '') ILIKE '%bucket_id = ''resources''%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

create policy "Public read help bucket"
  on storage.objects
  for select
  to public
  using (bucket_id = 'help');

create policy "Service role upload help bucket"
  on storage.objects
  for insert
  to service_role
  with check (bucket_id = 'help');

create policy "Service role update help bucket"
  on storage.objects
  for update
  to service_role
  using (bucket_id = 'help')
  with check (bucket_id = 'help');

create policy "Service role delete help bucket"
  on storage.objects
  for delete
  to service_role
  using (bucket_id = 'help');

create policy "Public read resources bucket"
  on storage.objects
  for select
  to public
  using (bucket_id = 'resources');

create policy "Service role upload resources bucket"
  on storage.objects
  for insert
  to service_role
  with check (bucket_id = 'resources');

create policy "Service role update resources bucket"
  on storage.objects
  for update
  to service_role
  using (bucket_id = 'resources')
  with check (bucket_id = 'resources');

create policy "Service role delete resources bucket"
  on storage.objects
  for delete
  to service_role
  using (bucket_id = 'resources');
