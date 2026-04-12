-- 22_seed_message_topups_capacity_planning_guide.sql
-- Seed guide for planning and purchasing message top-ups.
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
  'Message Top-Ups: When to Buy and How to Plan Capacity',
  'message-top-ups-when-to-buy-and-how-to-plan-capacity',
  'Plan chatbot message capacity, identify when top-ups are needed, and buy message blocks with reliable post-checkout validation.',
  $guide$
## What this guide covers

This guide explains how message capacity is calculated, when to buy message top-ups, and how to validate new limits after checkout. You will use Billing totals and chatbot usage behaviour to prevent service interruption.

## Before you start

- You can access **Settings > Billing**.
- Your account is eligible to purchase add-ons.
- You understand your expected visitor message demand for the period.

## 1) Understand how message limits are calculated

Message allowance is based on:

- Plan included messages
- +1,000 per extra space add-on
- +1,000 per message block add-on
- Optional effective limit override, if configured

Usage is counted from visitor messages (`message_type = visitor`) in tour chatbot conversations.

## 2) Check current capacity and add-on state

1. Open **Settings > Billing**.
2. Review:
   - **Base messages**
   - **Total messages**
3. In **Add-ons**, check current `message_block` value.

Use **Refresh** after any billing action to reload current totals.

## 3) Identify when to buy top-ups

Buy message blocks when:

- You are approaching your current total message limit.
- Upcoming campaigns or launches are expected to increase chatbot usage.
- You want headroom to avoid limit-triggered failures.

If message limits are reached, chatbot APIs return a billing limit response and block further visitor message handling until capacity is increased.

## 4) Purchase message top-ups

1. In **Add-ons**, locate **Message Top-up Block** (`message_block`).
2. Enter required quantity.
3. Click **Buy** to open checkout.
4. Complete payment and return to Settings.
5. Click **Refresh**.

Confirm both `message_block` current value and **Total messages** increased as expected.

## 5) Validate post-purchase behaviour

After purchase:

1. Confirm Billing totals are updated.
2. Run a chatbot test conversation.
3. Verify message handling proceeds normally.
4. Record updated capacity and review schedule for next check.

Use recurring checks to avoid capacity surprises during high-volume periods.

## Common issues

- **Top-up purchased but totals unchanged**: refresh after webhook processing.
- **Limit error still shown**: confirm purchase applied to the correct venue and that totals increased.
- **Unexpectedly fast usage growth**: review visitor message volume and campaign timing.
- **Wrong top-up quantity**: validate quantity field before checkout.
- **Intermittent blocked responses**: check whether usage is repeatedly hitting limit thresholds.

## Validation checklist

- Message limit formula is understood and documented.
- Current `message_block` and total messages are verified in Billing.
- Top-up purchase completed and refreshed successfully.
- Post-purchase chatbot message flow is confirmed.
- Capacity review cadence is defined for ongoing operations.

## Final note

Treat message top-ups as proactive capacity management, not emergency response. Plan ahead using expected demand, maintain headroom, and validate limits immediately after every purchase.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'Message Top-Ups: When to Buy and How to Plan Capacity | TourBots Guides',
  'Learn when to purchase message top-ups and how to plan chatbot capacity to avoid message-limit interruptions.',
  array[
    'Add-ons',
    'Billing',
    'Capacity Planning',
    'Chatbot Setup',
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
