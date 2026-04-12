-- 13_seed_desktop_mobile_chatbot_customisation_guide.sql
-- Seed guide for desktop and mobile chatbot customisation.
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
  'Desktop and Mobile Chatbot Customisation',
  'desktop-and-mobile-chatbot-customisation',
  'Customise your chatbot independently for desktop and mobile, including style, layout, interaction behaviour, presets, and live preview validation.',
  $guide$
## What this guide covers

This guide explains how to customise your tour chatbot for desktop and mobile contexts. You will use presets, edit device-specific settings, validate in live preview, and save a consistent branded experience.

## Before you start

- Select the correct tour location in **Chatbot**.
- Open the **Customisation** tab.
- Confirm chatbot configuration already exists for the selected location.

## 1) Open the customisation workspace

1. Go to **Chatbot > Customisation**.
2. Confirm the customisation workspace loads.
3. Verify **Desktop** and **Mobile** mode controls are visible.

The workspace is location-specific, so confirm the selected location first.

## 2) Use presets and preview safely

1. Open **Quick Presets**.
2. Preview a preset to evaluate style direction.
3. Apply the preset only if it matches your brand and UX goals.
4. Exit preview when comparing with current settings.

Preset previews are temporary until you save changes.

## 3) Customise desktop and mobile separately

Switch between **Desktop** and **Mobile** modes and configure each independently:

- Chat button style and position
- Chat window dimensions and layout
- Colours and branding elements
- Typography and readability
- Message and avatar presentation
- Input/send button controls
- Animation and advanced behaviour settings

Avoid assuming desktop settings will automatically fit mobile contexts.

## 4) Validate with live preview

1. Keep **Show Preview** enabled.
2. Test both desktop and mobile modes.
3. Check visual hierarchy, spacing, contrast, and interaction clarity.
4. If custom branding is enabled, verify icon/logo rendering.

Preview validation should be done before every save.

## 5) Save, reset, and governance workflow

1. Click **Save Changes** to publish customisation updates.
2. Use **Reset** only when you need to return to default styling.
3. Re-validate both device modes after saving.

Treat customisation as controlled UX configuration, not ad-hoc styling.

## Common issues

- **Wrong location customised**: confirm location selector before editing.
- **Looks good on desktop but poor on mobile**: test and tune mobile-specific settings directly.
- **Preset looks right but should not be permanent**: preview first, then apply intentionally.
- **Branding assets not visible**: confirm branding entitlement and image selection.
- **Changes not reflected as expected**: ensure save completed, then refresh and re-test.

## Validation checklist

- Correct tour location selected before edits.
- Desktop and mobile settings reviewed independently.
- Live preview checked in both modes.
- Preset usage is intentional and documented.
- Changes saved successfully and behaviour remains consistent.

## Final note

Design chatbot customisation as a two-surface experience: desktop and mobile are separate operational channels. Optimise each context explicitly, keep branding disciplined, and validate before rollout.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'Desktop and Mobile Chatbot Customisation | TourBots Guides',
  'Learn how to customise chatbot UX for desktop and mobile with presets, live preview checks, and controlled save workflows.',
  array[
    'Chatbot Setup',
    'Customisation',
    'Desktop Experience',
    'Mobile Experience',
    'Operations'
  ]::text[],
  'intermediate',
  true,
  now(),
  0,
  7
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
