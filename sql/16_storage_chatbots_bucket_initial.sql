insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chatbots',
  'chatbots',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read chatbots bucket" on storage.objects;
drop policy if exists "Public upload chatbots bucket" on storage.objects;
drop policy if exists "Public update chatbots bucket" on storage.objects;
drop policy if exists "Public delete chatbots bucket" on storage.objects;

create policy "Public read chatbots bucket"
  on storage.objects
  for select
  to public
  using (bucket_id = 'chatbots');

create policy "Public upload chatbots bucket"
  on storage.objects
  for insert
  to public
  with check (bucket_id = 'chatbots');

create policy "Public update chatbots bucket"
  on storage.objects
  for update
  to public
  using (bucket_id = 'chatbots')
  with check (bucket_id = 'chatbots');

create policy "Public delete chatbots bucket"
  on storage.objects
  for delete
  to public
  using (bucket_id = 'chatbots');
