-- 3_seed_initial_tour_setup_guide.sql
-- Seed guide for initial tour setup and first live embed.
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
  'Initial Tour Setup',
  'initial-tour-setup',
  'Set up your first Matterport tour, validate key controls, and generate your first live embed from the Tours page.',
  $guide$
## What this guide covers

This guide walks through the full first-tour setup workflow in the Tours page. You will add your first Matterport tour, validate that core controls work, and generate a live embed code for deployment.

## Before you start

- You can sign in to the TourBots app.
- Your account is linked to a venue.
- You have a valid Matterport tour URL.

## 1) Open Tours and start first-time setup

1. In the sidebar, select **Tours**.
2. Confirm you are on the **Tour Setup** tab.
3. In the empty state, click **Upload Matterport Tour**.

This opens the tour setup form for your first primary tour location.

## 2) Complete the Matterport tour form

In the modal, complete these fields:

1. **Full Matterport URL**
2. **Matterport ID** (auto-extracts from the URL when possible)
3. **Tour Name**
4. **Tour Description** (optional)

Click **Add Tour** to save.

If the save succeeds, the tour becomes active and the 3D viewer loads in the Tours page.

## 3) Validate your tour loads correctly

After saving, confirm the following in **Tour Setup**:

- The tour title appears in the tour information card.
- The Matterport scene loads in the viewer.
- The top action bar appears with controls such as model count and chatbot shortcut.

If the viewer does not load, use **Try Again** on the error panel and re-check your Matterport URL and ID.

## 4) Validate baseline tour controls

Before sharing, test the core controls:

1. Open the models button and confirm model management opens correctly.
2. Click **Chatbot** to confirm the chatbot page opens.
3. Confirm **Save Position** and **Manage Positions** are visible for navigation setup work.

This confirms your base tour setup is ready for chatbot and navigation configuration.

## 5) Generate your first live embed code

1. In Tours, open the **Share & Embed** tab.
2. Confirm the selected tour location is correct.
3. Set width, height, and chat visibility as required.
4. Copy either:
   - **Simple IFrame Embed**, or
   - **Advanced Script Embed**
5. Use **Preview Tour** to validate before publishing on your website.

## Common issues

- **Invalid Matterport URL**: Use the full URL format, including the `m=` parameter.
- **Matterport ID missing**: Paste the ID manually if auto-extraction does not populate the field.
- **No tour in Share & Embed**: Return to **Tour Setup** and confirm the tour was saved successfully.

## Validation checklist

- A primary tour is saved and visible in Tours.
- The Matterport viewer loads without errors.
- Core controls are available in the tour action bar.
- Share & Embed generates usable code.
- Preview opens correctly before external deployment.

## Final note

Treat this first setup as your baseline configuration. Once it is stable, continue with chatbot setup, navigation points, and analytics optimisation in a controlled sequence.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'Initial Tour Setup (From Zero to Live Tour) | TourBots Guides',
  'Learn how to set up your first Matterport tour in TourBots and generate live embed code from the Tours page.',
  array[
    'Tour Setup',
    'Matterport',
    'First Tour',
    'Share and Embed',
    'Onboarding'
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
