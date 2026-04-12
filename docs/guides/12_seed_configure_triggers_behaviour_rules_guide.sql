-- 12_seed_configure_triggers_behaviour_rules_guide.sql
-- Seed guide for configuring chatbot triggers and behaviour rules.
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
  'Configure Triggers and Behaviour Rules',
  'configure-triggers-and-behaviour-rules',
  'Define trigger conditions and actions so your chatbot responds consistently and can run guided actions such as URL prompts or navigation to saved tour points.',
  $guide$
## What this guide covers

This guide explains how to configure chatbot triggers for a tour location. You will define trigger conditions, assign actions, save rules, and validate behaviour in testing.

## Before you start

- Select the correct tour location in **Chatbot**.
- Save chatbot configuration first.
- Save tour navigation points first if you plan to use navigation actions.

## 1) Open Chatbot Triggers

1. Go to **Chatbot > Settings**.
2. Find **Chatbot Triggers**.
3. Click **Expand**.
4. Confirm existing triggers load for the selected location.

Triggers are location-scoped and tied to the selected chatbot configuration.

## 2) Create a trigger condition

1. Click **Add Trigger**.
2. Set **Trigger Name**.
3. Choose **Condition**:
   - `Keywords`
   - `Number of messages`
4. Configure the condition value:
   - For keywords, enter comma-separated terms.
   - For message count, enter a positive number.

Use precise, operational phrases for keyword conditions.

## 3) Choose action behaviour

Set **Action** for each trigger:

- **Send AI message**
- **Send message + URL**
- **Move to tour point**

Then complete required action inputs:

- **Response message** (required for every trigger)
- **URL** (required for URL action)
- **Tour point** (required for navigation action)

If action inputs are incomplete, trigger behaviour will fail or be ignored.

## 4) Manage trigger lifecycle

For each trigger, you can:

- Toggle **Active** on/off
- Edit condition and action values
- Delete unused triggers
- Reorder by save sequence (display order follows current list)

Keep trigger scope narrow to avoid unintentional matches.

## 5) Save and validate end-to-end

1. Click **Save Triggers**.
2. Confirm success notification.
3. Test in **Tour Setup** or **Playground**:
   - Send prompts that should match and should not match.
   - Confirm response message output.
   - Confirm URL action opens correctly when configured.
   - Confirm tour-point action navigates to the intended saved point.

Validation should include both positive and negative trigger tests.

## Common issues

- **No triggers available to edit**: save chatbot configuration first.
- **Keyword trigger never fires**: simplify keywords and remove ambiguous terms.
- **Message-count trigger inconsistent**: verify message threshold logic with repeat tests.
- **Navigate action does not move tour**: confirm selected tour point still exists and is valid.
- **Wrong behaviour fires**: reduce overlapping keyword sets between triggers.

## Validation checklist

- Triggers are configured for the correct tour location.
- Every trigger has a clear condition and complete action inputs.
- Active/inactive status is intentional.
- URL and navigation actions work during testing.
- Trigger set is clean, non-duplicative, and operationally maintainable.

## Final note

Treat triggers as controlled automation rules. Keep conditions explicit, minimise overlap, and revalidate after any changes to prompts, tour points, or conversation flow.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'Configure Triggers and Behaviour Rules | TourBots Guides',
  'Learn how to configure trigger conditions and actions for reliable chatbot responses and guided tour behaviour.',
  array[
    'Chatbot Setup',
    'Chatbot Triggers',
    'Automation Rules',
    'Tour Navigation',
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
