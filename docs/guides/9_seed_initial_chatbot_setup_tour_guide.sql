-- 9_seed_initial_chatbot_setup_tour_guide.sql
-- Seed guide for initial chatbot setup per tour location.
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
  'Initial Chatbot Setup for a Tour',
  'initial-chatbot-setup-for-a-tour',
  'Set up the first virtual tour chatbot for a selected location, including naming, welcome message, instruction prompts, guardrails, and activation state.',
  $guide$
## What this guide covers

This guide explains how to configure your first virtual tour chatbot for a selected location. You will select the correct tour, complete core chatbot settings, save configuration, and validate activation behaviour.

## Before you start

- At least one tour location exists in **Tours**.
- You can access the **Chatbot** page.
- You know which location this chatbot should serve.

## 1) Select the correct tour location

1. Open **Chatbot** from the sidebar.
2. Use the location selector in the page header.
3. Choose the target tour location.

Chatbot configuration is location-specific, so the selected tour must match your intended deployment.

## 2) Open chatbot settings and expand configuration

1. Stay in the **Settings** tab.
2. In **Virtual Tour Chatbot Configuration**, click **Expand**.
3. Confirm the status badge and editable fields are visible.

If no config exists yet, the editor opens with defaults for this location.

## 3) Complete core configuration fields

Update the baseline settings:

- **Name**: internal/public chatbot name.
- **Status**: set **Active** on or off.
- **Welcome Message**: first message shown to visitors.
- **Personality**: tone and style guidance.
- **Instructions**: operational response guidance for this location.
- **Enable Guardrails**: on/off control.
- **Guardrail Instructions**: boundaries for out-of-scope requests.

Keep prompts concise, location-specific, and operationally clear.

## 4) Save configuration

1. Click **Save Configuration**.
2. Wait for the success confirmation.
3. Recheck the selected location and confirm values persisted.

Saving creates or updates the location’s chatbot config and enables dependent setup blocks.

## 5) Validate post-save state

After saving, verify:

- The selected location still matches your intended target.
- Status reflects your activation decision.
- Core text fields persist after refresh.
- Information sections and triggers are now manageable for this config.

This confirms the chatbot is ready for deeper setup steps.

## Common issues

- **No tour selected**: choose a tour in the header selector first.
- **Fields do not save**: retry after confirming session/auth state and selected location.
- **Wrong chatbot changed**: location selector was set to a different tour.
- **Sections unavailable**: save configuration first, then continue to information/triggers.

## Validation checklist

- Correct location selected before editing.
- Name, welcome message, personality, and instructions are completed.
- Guardrails are configured appropriately.
- Activation status is intentional and confirmed.
- Configuration saves successfully and persists after reload.

## Final note

Treat initial chatbot setup as the control layer for each tour location. Confirm location context first, keep prompts operational and precise, and only then proceed to information, documents, and trigger configuration.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'Initial Chatbot Setup for a Tour | TourBots Guides',
  'Learn how to configure the first chatbot setup for a tour location, including prompts, guardrails, and activation settings.',
  array[
    'Chatbot Setup',
    'Tour Chatbot',
    'Configuration',
    'Guardrails',
    'Operations'
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
