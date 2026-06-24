-- 40_make_venue_documents_private.sql
-- Lock down the venue-documents bucket: no public read.
--
-- Training documents uploaded for a chatbot may contain personal data and must
-- not be reachable by an unauthenticated URL. The chatbot answers questions from
-- OpenAI's vector store (openai_file_id / openai_vector_store_id), uploaded
-- directly from the file buffer at upload time, NOT from this bucket — so making
-- the bucket private does not affect chat answers. Owner "view" links are now
-- generated as short-lived signed URLs server-side.

-- 1. Flip the bucket to private (stops /storage/v1/object/public/... resolving).
update storage.buckets set public = false where id = 'venue-documents';

-- 2. Remove public read on the bucket. The service-role insert/update/delete
--    policies remain in place, and service_role also bypasses RLS for select and
--    for generating signed URLs, so server-side access is unaffected.
drop policy if exists "Public read venue-documents bucket" on storage.objects;

-- 3. file_url is now vestigial — signed URLs are generated on demand from
--    file_path. Relax the legacy NOT NULL / non-blank constraint so new rows do
--    not need to store a (now non-resolving) public URL.
alter table public.chatbot_documents
  drop constraint if exists chk_chatbot_documents_url_not_blank;

alter table public.chatbot_documents
  alter column file_url drop not null;
