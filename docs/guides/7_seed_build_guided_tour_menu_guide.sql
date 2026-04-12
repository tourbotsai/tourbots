-- 7_seed_build_guided_tour_menu_guide.sql
-- Seed guide for building and publishing a guided tour menu.
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
  'Build a Guided Tour Menu',
  'build-a-guided-tour-menu',
  'Create and publish a guided menu overlay with structured content blocks and action buttons for navigation, model switching, links, and chat.',
  $guide$
## What this guide covers

This guide explains how to build and publish a guided tour menu in TourBots. You will enable the menu, configure global behaviour, add content blocks, and test interactive button actions before go-live.

## Before you start

- At least one tour location is set up and selectable in **Tours**.
- Navigation points are saved if you plan to use **Navigate to Tour Point** buttons.
- Additional models are configured if you plan to use **Switch to Other Tour** buttons.

## 1) Select the correct location and open Tour Menu

1. Open **Tours**.
2. Use the header selector to choose the target location.
3. Open the **Tour Menu** tab.
4. Confirm the builder loads for that location.

The menu is location-specific, so always confirm the selected location first.

## 2) Enable the menu and configure global settings

1. In **Menu Settings**, turn on **Enable Tour Menu**.
2. Set layout controls:
   - **Position** (`Centre`, `Top`, or `Bottom`)
   - **Max Width**
   - **Padding**
   - **Border Radius**
3. Set visual behaviour:
   - **Menu Background Colour**
   - **Backdrop Blur**
   - **Entrance Animation**
4. Configure **Reopen Widget** if required:
   - Show/hide widget
   - Widget position, size, icon, and colours
   - Tooltip and offsets

These settings control how the overlay appears and how visitors reopen it after closing.

## 3) Build content blocks

1. Open **Content Builder**.
2. Add blocks as needed:
   - **Text**
   - **Buttons**
   - **Logo**
   - **Spacer**
3. Edit each block and set alignment and spacing.
4. Reorder blocks using up/down controls to define your visitor journey order.

Use short labels and clear sequencing so users can act quickly.

## 4) Configure button actions

For each button in a **Buttons** block, set:

- **Label**
- **Action**
- **Target** (when required)
- **Button/Text Colour**

Available actions:

- **Navigate to Tour Point**: uses a saved position.
- **Switch to Other Tour**: switches to another Matterport model.
- **External Link**: opens a URL in a new tab.
- **Open AI Chat**: opens the tour chat widget.
- **Close Tour Menu**: closes the overlay.

If action targets are missing, visitors will not complete the intended journey.

## 5) Validate in preview and publish

1. Use **Desktop** and **Mobile** editing modes.
2. Keep **Show Preview** enabled and verify layout, spacing, and readability.
3. Test every button action in preview assumptions, then in the live tour context.
4. Click **Save & Publish**.
5. Reload the tour and confirm:
   - The menu opens on first load when enabled.
   - Closing the menu shows the reopen widget (if enabled).
   - Reopen widget restores the menu correctly.

## Common issues

- **No tour selected**: Select a location in Tours first, then reopen the Tour Menu tab.
- **Menu does not appear in live tour**: Confirm **Enable Tour Menu** is on and save again.
- **Button does nothing**: Validate action type and target mapping.
- **Wrong model opens**: Recheck selected target tour model for that button.
- **Navigation button fails**: Confirm the target tour point exists and is still valid.

## Validation checklist

- Menu is enabled for the intended location.
- Global layout and animation settings are confirmed on desktop and mobile previews.
- Block order supports a clear visitor path.
- Every button has a valid action and target.
- Save and reload confirms overlay and reopen widget behaviour.

## Final note

Treat the guided menu as the operational entry point for the visitor experience. Keep it concise, action-led, and location-specific, and review button mappings whenever tours, points, or models are changed.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'Build a Guided Tour Menu | TourBots Guides',
  'Learn how to build and publish a guided tour menu with content blocks, button actions, and reopen widget behaviour.',
  array[
    'Tour Setup',
    'Tour Menu',
    'Navigation',
    'User Experience',
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
