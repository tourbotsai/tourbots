-- 10_seed_chatbot_information_guide.sql
-- Seed guide for configuring chatbot information sections and fields.
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
  'Chatbot Information',
  'chatbot-information',
  'Set up structured information sections and fields that your chatbot uses as trusted context for tour-specific answers.',
  $guide$
## What this guide covers

This guide explains how to configure **Chatbot Information** for a tour location. You will work with sections and fields, update values, and save structured context the chatbot can use in responses.

## Before you start

- You have selected the correct tour location in **Chatbot**.
- You have already saved the chatbot configuration for that location.
- You are in **Chatbot > Settings**.

## 1) Open Chatbot Information

1. In **Settings**, locate **Chatbot Information Sections**.
2. Click **Expand**.
3. Confirm existing sections load.

If this is your first setup, a default **General Information** section is created automatically.

## 2) Review the default section and fields

The default section includes common baseline fields, such as:

- Company Name
- Website
- Address
- General Description
- Phone
- Email

Use this as your initial foundation, then tailor for your tour and operations.

## 3) Add and structure custom sections

1. Click **Add New Section**.
2. Set a clear **Section Title** (for example, `Opening Hours`, `Facilities`, or `Membership Policies`).
3. Keep section names practical and internally consistent.
4. Remove sections that are not needed.

Each section can be expanded or collapsed for cleaner editing.

## 4) Add and maintain fields in each section

1. Click **Add Field** inside the section.
2. Enter a clear field label.
3. Enter a complete, accurate value.
4. Remove outdated fields when content changes.

Field keys are normalised automatically on save, so keep labels readable and business-friendly.

## 5) Save and validate

1. Click **Save Sections**.
2. Confirm the success message.
3. Refresh and verify section order and values persist.
4. Check chatbot responses in testing flows to confirm the new information is reflected.

## Common issues

- **Cannot edit information yet**: save chatbot configuration first.
- **Section names are inconsistent**: standardise naming before scaling content.
- **Outdated details still appear in responses**: review saved field values and update source content.
- **Too much duplicate information**: keep one canonical source per topic.

## Validation checklist

- Correct tour location selected before editing.
- Default section exists (or intentional custom structure replaces it).
- Section titles are clear and operationally meaningful.
- Field values are accurate, current, and non-duplicative.
- Save succeeds and data persists after refresh.

## Final note

Treat Chatbot Information as controlled operational data, not free-form notes. Keep structure disciplined, values current, and ownership clear so answers remain consistent across teams and deployments.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'Chatbot Information | TourBots Guides',
  'Learn how to structure chatbot information sections and fields for accurate, location-specific virtual tour responses.',
  array[
    'Chatbot Setup',
    'Chatbot Information',
    'Knowledge Structure',
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
