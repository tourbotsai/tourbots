-- 8_seed_multiple_models_vs_separate_tours_guide.sql
-- Seed guide for choosing between multiple models and separate tours.
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
  'Multiple Models vs Separate Tours Which to Choose',
  'multiple-models-vs-separate-tours-which-to-choose',
  'Use this decision guide to choose whether your setup should be one location with multiple models or separate tour locations with independent management.',
  $guide$
## What this guide covers

This guide helps you choose the correct TourBots structure for multi-space deployments. It compares one location with multiple models against separate tour locations, and explains the operational impact on chatbot setup, sharing, and capacity planning.

## 1) Understand the two setup patterns

### Multiple models in one location

Use one primary location and attach additional models inside it via **Manage Models in This Tour**.

- One shared location context.
- One shared embed flow for that location.
- One shared chatbot configuration for that location.
- Visitors can switch between linked models from menu actions or AI-driven model switching.

### Separate tour locations

Use **Manage Tour Locations** and create additional locations with **Add New Tour Location**.

- Each location is managed independently.
- Each location appears in location selectors across Tours and Chatbots.
- Chatbot configuration is managed per location.
- Capacity is controlled by available spaces (plan/add-on dependent).

## 2) Use this decision framework

Choose **multiple models in one location** when:

- The spaces are part of one continuous visitor journey.
- You want one chatbot setup across those connected spaces.
- You want a single location context with model switching inside that context.

Choose **separate tour locations** when:

- Locations operate as independent spaces.
- Teams need separate operational control per location.
- You need clear location-level management and capacity governance.

## 3) Evaluate chatbot and navigation impact

If you choose **multiple models in one location**:

- Keep one chatbot setup for the location.
- Add model-specific keywords to support AI model switching.
- Keep navigation points and menu actions aligned to the same location structure.

If you choose **separate tour locations**:

- Configure chatbot settings per location from the Chatbots location selector.
- Keep information, triggers, and documents scoped to each location.
- Validate location selection before making chatbot changes.

## 4) Evaluate sharing and reporting impact

- Sharing and analytics in Tours are selected by location context.
- With multiple models inside one location, behaviour remains grouped under that location context.
- With separate locations, operations are managed location-by-location in selectors and workflows.

Use this to match your commercial and reporting structure.

## 5) Run a final pre-go-live check

1. Confirm whether the business model is one connected experience or separate locations.
2. Confirm whether one shared chatbot is sufficient, or per-location chatbot control is required.
3. Confirm available spaces in **Manage Tour Locations** before creating new locations.
4. Confirm menu actions and AI navigation work with your selected structure.
5. Confirm team handover notes clearly state the chosen model and why.

## Common mistakes

- **Using separate locations for one continuous experience**: This adds unnecessary management overhead.
- **Using one location for truly independent spaces**: This can reduce operational clarity.
- **Ignoring space limits**: New locations fail when available spaces are exhausted.
- **Changing chatbot settings in the wrong location**: Always verify the selected location first.

## Validation checklist

- Deployment model is explicitly documented: multiple models or separate locations.
- Chatbot ownership model matches the selected structure.
- Navigation and menu behaviour are tested for the selected structure.
- Capacity implications are confirmed before rollout.
- Internal team understands why this structure was chosen.

## Final note

Choose structure based on operating model first, then implementation convenience. If the user journey is unified, keep one location with multiple models. If delivery, ownership, or governance is separate, create separate tour locations.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'Multiple Models vs Separate Tours Which to Choose | TourBots Guides',
  'Choose the right TourBots structure by comparing one location with multiple models against separate tour locations.',
  array[
    'Tour Setup',
    'Multiple Models',
    'Multiple Locations',
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
