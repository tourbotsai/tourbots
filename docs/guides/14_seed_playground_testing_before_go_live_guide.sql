-- 14_seed_playground_testing_before_go_live_guide.sql
-- Seed guide for validating chatbot behaviour in the playground before launch.
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
  'Playground Testing Before Go-Live',
  'playground-testing-before-go-live',
  'Run structured pre-launch chatbot tests in the playground to validate responses, UI behaviour, and readiness before publishing.',
  $guide$
## What this guide covers

This guide explains how to use the chatbot playground to test quality before go-live. You will run prompt scenarios, verify desktop/mobile behaviour, clear and retest conversations, and complete a release-ready sign-off check.

## Before you start

- Select the correct tour location in **Chatbot**.
- Ensure chatbot configuration exists and is **Active**.
- Complete baseline setup (information, documents, triggers, and customisation) before final testing.

## 1) Open playground and prepare the test context

1. Go to **Chatbot > Playground**.
2. Confirm the selected tour location is correct.
3. Verify the playground loads without configuration errors.
4. Keep a simple test log for pass/fail notes.

The playground uses live API behaviour, so test results are operationally meaningful.

## 2) Run scenario prompts

Use the built-in prompt categories to test common visitor intent:

- Tour overview
- Model navigation
- Bookings and availability
- Opening hours
- Amenities
- Directions and support

Also add your own edge-case prompts for ambiguous or incomplete user questions.

## 3) Validate desktop and mobile behaviour

1. Test in **Desktop** mode.
2. Switch to **Mobile** mode and rerun key prompts.
3. Compare response clarity, readability, and interaction flow in both contexts.
4. Confirm widget open/close behaviour is stable.

Do not assume desktop outcomes will match mobile outcomes.

## 4) Reset and retest cleanly

1. Use **Clear Chat** between test sets.
2. Re-run priority prompts after each major config change.
3. Confirm responses are consistent across repeated runs.

This isolates test sessions and avoids false confidence from prior context.

## 5) Final go-live sign-off

Before publishing, confirm:

- High-priority prompts produce correct responses.
- Triggered behaviours operate as expected.
- Message quality is clear, concise, and on-brand.
- No critical failures remain in desktop or mobile mode.
- Test log is complete and approved for launch.

## Common issues

- **Playground not available**: select a tour and activate chatbot configuration first.
- **Responses are generic or weak**: revisit instructions, information sections, and documents.
- **Different behaviour between desktop and mobile**: review customisation and rerun both modes.
- **Inconsistent outputs between runs**: clear chat and re-test with controlled prompts.
- **Configuration error state**: resolve setup issues in Settings, then return to playground.

## Validation checklist

- Correct tour location selected.
- Chatbot is active.
- Prompt scenarios tested across key user intents.
- Desktop and mobile checks both passed.
- Final release sign-off recorded.

## Final note

Use playground testing as a formal pre-release gate, not a quick visual check. Consistent scenario testing and clear sign-off criteria reduce launch risk and improve chatbot quality in production.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'Playground Testing Before Go-Live | TourBots Guides',
  'Learn how to run structured chatbot playground testing and sign off quality before going live.',
  array[
    'Chatbot Setup',
    'Playground',
    'QA',
    'Go Live',
    'Operations'
  ]::text[],
  'intermediate',
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
