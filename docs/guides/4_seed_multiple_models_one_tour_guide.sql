-- 4_seed_multiple_models_one_tour_guide.sql
-- Seed guide for configuring multiple models within one tour location.
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
  'How to Set Up Multiple Models in One Tour',
  'how-to-set-up-multiple-models-in-one-tour',
  'Add secondary Matterport models under one tour location so visitors can move between spaces using one shared embed and one shared chatbot.',
  $guide$
## What this guide covers

This guide explains how to add multiple Matterport models under one tour location. You will keep one shared embed and one shared chatbot while allowing visitors to move between linked models.

## Before you start

- Your primary tour location is already set up in **Tours > Tour Setup**.
- You have valid Matterport URLs for the additional models.
- You can open the Tours page without errors.

## 1) Open model management for the current tour location

1. Go to **Tours**.
2. Confirm the correct tour location is selected in the location selector.
3. In the tour action bar, click the models button (for example, `1 model` or `2 models`).

This opens **Manage Models in This Tour**.

## 2) Confirm the primary model first

In the modal, review the **Primary Model** section:

- Confirm title and description are correct.
- Confirm the Matterport model ID is correct.
- Use **Edit** if the primary model details need correction.

This is important because additional models are linked to this primary location.

## 3) Add an additional model

1. In **Additional Models**, click **Add Model**.
2. Complete:
   - **Full Matterport URL**
   - **Matterport ID**
   - **Model Name**
   - **Description** (optional)
   - **AI Navigation Keywords** (optional, comma-separated)
3. Click **Add Model** to save.

Repeat this for each model you want inside the same tour location.

## 4) Use navigation keywords correctly

Add practical keywords visitors are likely to use, such as:

- `spa`
- `suite`
- `restaurant`
- `conference room`

These keywords help AI-guided navigation switch visitors to the correct model when relevant prompts are used.

## 5) Validate model switching in the location manager

1. Open **Manage Tour Locations** from the tour location selector.
2. Expand the current location.
3. Confirm each model appears as either:
   - **Primary model**, or
   - **Additional model**
4. Click each model to verify it becomes the active model.

If switching works, the model link setup is correct.

## 6) Test chatbot and menu behaviour after adding models

After model setup:

1. Open **Tour Setup** and confirm the scene changes when selecting different models.
2. Open **Chatbot** and test prompts that should trigger model navigation.
3. Open **Tour Menu** and confirm buttons can target the right model/position flow.

This ensures your multi-model setup is operational end-to-end.

## Common issues

- **Model added to wrong location**: Re-open the correct location first, then add the model there.
- **Matterport ID not extracted**: Paste the model ID manually.
- **AI does not switch models**: Refine navigation keywords and test clearer prompt phrasing.
- **Wrong model appears active**: Re-open **Manage Tour Locations** and reselect the intended model.

## Validation checklist

- Primary model is correct and saved.
- At least one additional model is added successfully.
- Additional models appear in the same location grouping.
- Model switching works from location manager.
- Chatbot and menu flows operate correctly with the new model setup.

## Final note

Use multiple models in one tour when all spaces belong to one location experience. If spaces should be managed as separate locations with separate operational ownership, use separate tours instead.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'How to Set Up Multiple Models in One Tour | TourBots Guides',
  'Learn how to add secondary Matterport models inside one tour location while keeping one shared embed and one shared chatbot experience.',
  array[
    'Tour Setup',
    'Matterport',
    'Multiple Models',
    'AI Navigation',
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
