-- 17_seed_tour_analytics_explained_guide.sql
-- Seed guide for understanding and acting on Tour Analytics.
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
  'Tour Analytics Explained',
  'tour-analytics-explained',
  'Understand what Tour Analytics measures, how each metric is calculated, and how to use the results to improve embed performance.',
  $guide$
## What this guide covers

This guide explains the metrics and views available in **Tours > Analytics** for a selected tour location. You will learn what each KPI means, how charts are built, and how to turn the data into practical optimisation actions.

## Before you start

- Select the correct tour location in the **Tours** header selector.
- Ensure your tour is live on at least one external website.
- Generate fresh traffic before reviewing performance trends.

## 1) Open analytics in the correct location scope

1. Go to **Tours**.
2. Choose the target location from the header selector.
3. Open the **Analytics** tab.

All metrics in this view are scoped to the selected location, not only venue-level totals.

## 2) Understand the KPI cards

The top cards show:

- **Tour views**: total tracked tour embed views for the selected location.
- **Total conversations**: unique conversation threads (`conversation_id`) for that location.
- **Tour chat messages**: visitor messages only (user messages), excluding bot replies.
- **Unique domains**: number of distinct host domains where embeds were viewed.

Use these four metrics together to understand reach (views/domains) and engagement depth (conversations/messages).

## 3) Read chart trends correctly

The analytics view includes two charts:

- **Tour views per day**: daily tour view activity for the last 7 days.
- **Device types**: distribution of views by device category from visitor user-agent data.

Use the trend chart to spot campaign impact or distribution changes, and use device split to prioritise responsive QA where traffic is highest.

## 4) Use embed statistics for source-level diagnosis

1. Expand **Embed statistics**.
2. Review each tracked entry, including:
   - Embed type
   - Domain
   - View count
   - Last viewed timestamp
   - Page URL (where available)
3. Open listed URLs to verify live placement and context.

This panel helps identify which websites and pages actually drive usage.

## 5) Apply an optimisation loop

Run this cycle regularly:

1. Record a baseline for views, conversations, and visitor message volume.
2. Make one controlled change (placement, page position, or messaging context).
3. Monitor 7-day trend and source domains.
4. Keep changes that improve both reach and engagement quality.

Avoid batching multiple changes at once if you need clear attribution.

## Common issues

- **No analytics visible**: confirm a valid location is selected and external traffic exists.
- **Low conversation count despite views**: review chat visibility and call-to-action context on the host page.
- **Uneven device performance**: test embedded layout and interaction flow on the dominant device type.
- **Unexpected domain entries**: validate where embed code is published and remove obsolete placements.
- **Flat trend data**: check campaign distribution, embed position, and whether traffic is newly generated.

## Validation checklist

- Correct location selected before reading metrics.
- KPI card meanings understood and interpreted together.
- 7-day trend reviewed before making decisions.
- Device split used to prioritise QA and UX fixes.
- Source domains/pages verified in Embed statistics.

## Final note

Treat Tour Analytics as an operational decision tool, not only a reporting screen. The strongest outcomes come from consistent scope selection, weekly review cadence, and controlled optimisation changes tied to measurable KPI movement.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'Tour Analytics Explained | TourBots Guides',
  'Learn what each Tour Analytics metric means and how to use views, conversations, device mix, and domains to optimise performance.',
  array[
    'Analytics',
    'Tour Setup',
    'Share and Embed',
    'Performance',
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
