-- 18_seed_chatbot_analytics_explained_guide.sql
-- Seed guide for understanding and using chatbot analytics.
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
  'Chatbot Analytics Explained',
  'chatbot-analytics-explained',
  'Learn how to read chatbot conversation analytics, interpret response quality signals, and use trends to improve performance.',
  $guide$
## What this guide covers

This guide explains the chatbot analytics view for a selected tour in **Chatbots > Analytics**. You will learn how key metrics are calculated, how to inspect full conversation threads, and how to run an improvement loop based on real visitor behaviour.

## Before you start

- Select the correct tour in the **Chatbots** header selector.
- Ensure a chatbot configuration exists for that tour.
- Generate fresh conversations before analysing trends.

## 1) Open analytics in the correct tour scope

1. Go to **Chatbots**.
2. Select the target tour location from the top selector.
3. Open the **Analytics** tab.

All analytics in this view are filtered to the currently selected tour location.

## 2) Understand the KPI cards

The top cards show:

- **Conversations**: total unique conversation threads in the selected tour scope.
- **Visitor messages**: user-originated messages only.
- **Avg response**: average bot response time in milliseconds from tracked conversation rows.
- **Active domains**: distinct domains where these conversations originated.

Use these together to track engagement volume, speed, and source spread.

## 3) Review full conversation sessions

1. Expand **Conversation sessions**.
2. Review each thread summary:
   - Conversation identifier
   - First message time
   - Domain
   - Device type
   - Total message count
   - Average response time (when available)
3. Expand individual conversations to inspect full visitor and bot message flow.

This is the fastest way to evaluate response quality and detect weak or repetitive answers.

## 4) Use trend and device charts

The analytics view includes:

- **Messages per day**: total chatbot message activity over the last 7 days.
- **Device types**: conversation distribution by desktop, mobile, and tablet.

Use this to spot demand shifts and prioritise UX testing on the highest-traffic device segment.

## 5) Run a practical quality improvement loop

1. Record a baseline for conversation count, visitor messages, and average response time.
2. Inspect poor-performing threads in **Conversation sessions**.
3. Update chatbot setup where needed (information, documents, triggers, and prompts).
4. Re-test in Playground, then compare a fresh 7-day window.

Track one major change at a time to keep attribution clear.

## Common issues

- **No analytics data**: confirm the selected tour has a configured chatbot and recent conversations.
- **Low conversation volume**: review chatbot visibility and call-to-action placement in your embed flow.
- **Slow response averages**: inspect long threads and review prompt/documents complexity.
- **Domain data appears limited**: confirm conversations are generated from external usage, not only internal testing.
- **Unclear trend movement**: compare equivalent periods and avoid mixing multiple configuration changes at once.

## Validation checklist

- Correct tour selected before analysis.
- KPI meanings interpreted correctly (scope and calculation).
- Conversation sessions reviewed for quality, not only counts.
- Device split used to inform testing priorities.
- Improvement actions linked to measurable metric movement.

## Final note

Chatbot analytics is most valuable when used as an operational feedback system. Review thread quality regularly, optimise in controlled iterations, and validate changes with fresh live conversation data.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'Chatbot Analytics Explained | TourBots Guides',
  'Understand chatbot conversation metrics, response performance, and quality signals to improve visitor outcomes.',
  array[
    'Analytics',
    'Chatbot Setup',
    'Performance',
    'Operations',
    'Optimisation'
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
