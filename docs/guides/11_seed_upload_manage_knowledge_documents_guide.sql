-- 11_seed_upload_manage_knowledge_documents_guide.sql
-- Seed guide for uploading and managing chatbot knowledge documents.
-- Run this after: production/sql/19_guides_initial.sql

insert into public.guides (
  title,
  slug,
  excerpt,
  content,
  cover_image,
  header_image,
  additional_images,
  meta_title,
  meta_description,
  tags,
  difficulty_level,
  is_published,
  published_at,
  view_count,
  reading_time_minutes
)
values (
  'Upload and Manage Knowledge Documents',
  'upload-and-manage-knowledge-documents',
  'Upload trusted source documents for your tour chatbot, maintain document quality, and manage replacements safely.',
  $guide$
## What this guide covers

This guide explains how to upload and manage knowledge documents for a tour chatbot. You will add source files, review uploaded items, remove outdated files, and maintain a clean document set for reliable responses.

## Before you start

- Select the correct tour location in **Chatbot**.
- Save chatbot configuration first for that location.
- Prepare source files in supported formats.

## 1) Open Training Documents

1. Go to **Chatbot > Settings**.
2. Find **Training Documents**.
3. Click **Expand**.

This opens the document upload and management panel for the selected location.

## 2) Prepare files correctly

Supported file types:

- PDF
- TXT
- DOC
- DOCX

File size:

- Maximum 20MB per file.

Use clean, accurate documents with clear operational wording.

## 3) Upload a document

1. Click **Upload Document**.
2. Select one supported file.
3. Wait for upload confirmation.
4. Verify the new file appears in the documents list.

Each uploaded file is attached to the selected tour chatbot context.

## 4) Review and maintain document quality

For each uploaded file, verify:

- Filename is clear and recognisable.
- Content is current and relevant.
- Duplicates are removed.
- Legacy versions are replaced promptly.

Keep one canonical source per topic to reduce conflicting answers.

## 5) Delete outdated or incorrect documents

1. In the document list, select the delete action for the file.
2. Confirm removal in the UI.
3. Re-upload the corrected version if needed.

Document hygiene is essential for stable chatbot outputs.

## Common issues

- **Upload rejected**: file type is unsupported or size exceeds 20MB.
- **Document not visible**: confirm correct tour location and saved chatbot configuration.
- **Answers still reference old information**: remove outdated files and upload refreshed versions.
- **Too many overlapping files**: consolidate to a smaller, cleaner source set.

## Validation checklist

- Correct tour location selected before upload.
- All files are in supported formats and under size limit.
- Document list contains only current, approved sources.
- Outdated files are removed.
- Chatbot responses reflect the latest uploaded content.

## Final note

Treat knowledge documents as governed data assets. Strong naming, version discipline, and regular clean-up will keep chatbot responses consistent and production-ready.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'Upload and Manage Knowledge Documents | TourBots Guides',
  'Learn how to upload, manage, and maintain chatbot training documents with clean source control and quality checks.',
  array[
    'Chatbot Setup',
    'Training Documents',
    'Knowledge Management',
    'Operations',
    'Tour Configuration'
  ]::text[],
  'beginner',
  true,
  now(),
  0,
  6
)
on conflict (slug) do update
set
  title = excluded.title,
  excerpt = excluded.excerpt,
  content = excluded.content,
  cover_image = excluded.cover_image,
  header_image = excluded.header_image,
  additional_images = excluded.additional_images,
  meta_title = excluded.meta_title,
  meta_description = excluded.meta_description,
  tags = excluded.tags,
  difficulty_level = excluded.difficulty_level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  reading_time_minutes = excluded.reading_time_minutes,
  updated_at = now();
