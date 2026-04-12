-- 16_seed_website_embed_troubleshooting_guide.sql
-- Seed guide for diagnosing and fixing common website embed issues.
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
  'Website Embed Troubleshooting',
  'website-embed-troubleshooting',
  'Diagnose and resolve common tour embed failures covering location scope, loading issues, layout clipping, and tracking verification.',
  $guide$
## What this guide covers

This guide explains how to troubleshoot TourBots tour embeds on external websites. You will validate embed configuration, confirm location scope, isolate page-level issues, and verify tracking behaviour.

## Before you start

- You can access **Tours > Share & Embed** for the relevant account.
- You have the exact embed code that is currently published.
- You can test on the target page in browser developer tools.

## 1) Confirm the embed source and settings

1. Open **Tours > Share & Embed**.
2. Select the correct tour location in the header selector.
3. Regenerate code using your intended settings:
   - **Width**
   - **Height**
   - **Show chat widget**
4. Compare the newly generated code with the code currently published.

If the published code is outdated, replace it first before deeper debugging.

## 2) Check location scope problems

If the wrong location appears:

1. Reconfirm the selected location before copying code.
2. For **IFrame Embed**, confirm the URL contains `tourId`.
3. For **Advanced Script Embed**, confirm initialisation includes the latest options from Share & Embed.
4. Reload the page after publishing updates.

The embed resolves location context from the selected tour and URL/query options. Stale code is the most common reason for scope mismatch.

## 3) Fix loading failures

If the embed is blank, stuck, or not visible:

1. Confirm `venueId` and `embedId` values are present in the published code.
2. Open the embed URL directly in a browser tab and confirm it loads:
   - `/embed/tour/{venueId}?id={embedId}`
3. Check browser console and network for blocked script or iframe requests.
4. Confirm the target page allows third-party scripts/iframes where needed.

If direct embed URL loading fails, fix source data or tour activation before checking website layout.

## 4) Resolve layout clipping and responsive issues

1. Test with safe defaults (`width: 100%`, `height: 600px`).
2. Remove conflicting parent container CSS (`overflow: hidden`, fixed heights, or restrictive positioning).
3. Test mobile and desktop breakpoints separately.
4. Reapply custom dimensions only after baseline rendering is stable.

Layout issues are usually caused by host page container constraints rather than embed service failures.

## 5) Verify tracking and analytics capture

1. Load the published page and confirm calls to:
   - `POST /api/public/embed/track`
   - `GET /api/public/embed/track-pixel` (fallback only when primary tracking fails)
2. Confirm request payload/query includes `embedId`, `venueId`, and `type=tour`.
3. Confirm domain/page URL values represent the host page.
4. Recheck **Tours > Analytics** after new visits are generated.

Tracking writes to embed analytics and is filtered by tour scope when tour context is provided.

## Common issues

- **No tour available to share**: complete Tour Setup first, then return to Share & Embed.
- **Wrong location is shown**: regenerate code after selecting the correct location.
- **Embed does not render**: verify `venueId`, `embedId`, and tour activation state.
- **Page shows clipping or hidden widget**: remove restrictive container styling and retest baseline dimensions.
- **Analytics does not update**: verify network calls to tracking endpoints and generate a fresh external page view.

## Validation checklist

- Embed code was regenerated from the correct location scope.
- Published code matches current Share & Embed output.
- Baseline render works with standard width/height.
- Tracking request succeeds on a live external page view.
- Tour Analytics reflects new test traffic.

## Final note

Use a structured troubleshooting sequence: source code validity, scope checks, render checks, then tracking validation. This avoids unnecessary rework and isolates root cause faster for engineering and operations teams.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'Website Embed Troubleshooting | TourBots Guides',
  'Troubleshoot tour embed issues for loading, location scope, layout, and tracking across external websites.',
  array[
    'Share and Embed',
    'Website Embed',
    'Troubleshooting',
    'Tour Setup',
    'Analytics'
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
