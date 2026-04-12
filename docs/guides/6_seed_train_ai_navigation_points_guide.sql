-- 6_seed_train_ai_navigation_points_guide.sql
-- Seed guide for training AI navigation with saved tour points and triggers.
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
  'How to Train AI on Navigation Points',
  'how-to-train-ai-on-navigation-points',
  'Save named tour positions and connect them to chatbot triggers so visitors can be guided to specific areas during conversations.',
  $guide$
## What this guide covers

This guide explains how to train your tour chatbot to navigate visitors to specific areas. You will save navigation points in Tours, then connect those points to chatbot triggers in Chatbot Settings.

## Before you start

- Your tour is already set up and loading in **Tours > Tour Setup**.
- You can move around the Matterport scene.
- You have chatbot access for the selected tour location.

## 1) Save your first navigation point

1. Open **Tours** and confirm the correct location is selected.
2. Move to the exact place you want visitors to reach.
3. Click **Save Position**.
4. Enter a clear area name (for example, `Reception` or `Main Hall`).
5. Click **Save Position**.

This stores the sweep ID, position, and rotation for that area.

## 2) Build a clean position library

Open **Manage Positions** and check each saved point:

- Area name is clear and consistent.
- Point is in the correct place.
- Duplicate or obsolete points are removed.

Use **Test Navigation** in the positions list to verify each point before using it in triggers.

## 3) Open chatbot triggers for the same tour

1. Open **Chatbot** from the sidebar.
2. Select the same tour location in the chatbot selector.
3. Open **Settings**.
4. Expand **Chatbot Triggers**.

Your trigger setup is tour-specific, so the selected tour must match your saved points.

## 4) Create a navigation trigger

1. Click **Add Trigger**.
2. Set **Condition** to:
   - `Keywords`, or
   - `Number of messages`
3. Set **Action** to **Move to tour point**.
4. Select the target point from **Tour point**.
5. Enter a clear **Response message**.
6. Save triggers.

Example keyword condition:
- Keywords: `reception, front desk, check-in`

Example response:
- "I can take you to the reception area now."

## 5) Test end-to-end chatbot navigation

1. Open the tour chatbot in **Tour Setup** or **Playground**.
2. Send a prompt that should match your trigger condition.
3. Confirm the chatbot response appears.
4. Confirm the tour navigates to the expected point.

If navigation does not fire, re-check condition keywords, selected tour point, and tour selection context.

## Common issues

- **Point does not appear in trigger dropdown**: Confirm the point is saved for the same tour context.
- **Trigger saves but no movement happens**: Re-test with clearer keywords and confirm action type is **Move to tour point**.
- **Wrong area opens**: Rename and re-save positions with clearer labels, then reselect the correct point in the trigger.
- **Too many similar points**: Keep one canonical point per visitor-facing area.

## Validation checklist

- Positions are saved with clear area names.
- Each point passes **Test Navigation**.
- Trigger action is set to **Move to tour point**.
- Chatbot prompt triggers both response and movement.
- Navigation remains consistent across repeated tests.

## Final note

Treat navigation points as controlled operational assets. Keep naming consistent, remove unused points, and revalidate trigger mappings whenever you change tour layout or menu flows.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'How to Train AI on Navigation Points | TourBots Guides',
  'Learn how to save tour positions and use chatbot triggers to guide visitors to specific areas automatically.',
  array[
    'Tour Setup',
    'Navigation Points',
    'Chatbot Triggers',
    'AI Navigation',
    'Operations'
  ]::text[],
  'intermediate',
  true,
  now(),
  0,
  6
);
