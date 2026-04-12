-- 33_storage_chatbots_bucket_lockdown.sql
-- Keep public read for chatbot assets, remove public write/update/delete.
-- Writes are handled via authenticated server routes using service_role.

drop policy if exists "Public read chatbots bucket" on storage.objects;
drop policy if exists "Public upload chatbots bucket" on storage.objects;
drop policy if exists "Public update chatbots bucket" on storage.objects;
drop policy if exists "Public delete chatbots bucket" on storage.objects;
drop policy if exists "Service role upload chatbots bucket" on storage.objects;
drop policy if exists "Service role update chatbots bucket" on storage.objects;
drop policy if exists "Service role delete chatbots bucket" on storage.objects;

create policy "Public read chatbots bucket"
  on storage.objects
  for select
  to public
  using (bucket_id = 'chatbots');

create policy "Service role upload chatbots bucket"
  on storage.objects
  for insert
  to service_role
  with check (bucket_id = 'chatbots');

create policy "Service role update chatbots bucket"
  on storage.objects
  for update
  to service_role
  using (bucket_id = 'chatbots')
  with check (bucket_id = 'chatbots');

create policy "Service role delete chatbots bucket"
  on storage.objects
  for delete
  to service_role
  using (bucket_id = 'chatbots');
