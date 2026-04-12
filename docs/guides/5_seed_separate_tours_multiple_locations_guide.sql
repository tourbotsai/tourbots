-- 5_seed_separate_tours_multiple_locations_guide.sql
-- Seed guide for setting up separate tours as multiple locations.
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
  'How to Set Up Separate Tours Multiple Locations',
  'how-to-set-up-separate-tours-multiple-locations',
  'Create and manage multiple tour locations under one account, and configure the correct chatbot per location.',
  $guide$
## What this guide covers

This guide explains how to create separate tours as distinct locations in TourBots. You will add a new tour location, confirm location limits, and configure the chatbot for each location correctly.

## Before you start

- At least one tour location already exists in **Tours**.
- You have the Matterport URL for the new location.
- You have available spaces, or a plan/add-on that allows another location.

## 1) Open the location manager

1. Go to **Tours**.
2. In the header location selector, click **Manage Tour Locations**.
3. Review your current usage shown as **Locations used: X/Y**.

This confirms whether you can add a new location immediately.

## 2) Add a new tour location

1. In **Manage Tour Locations**, click **Add New Tour Location**.
2. Complete the tour form:
   - **Full Matterport URL**
   - **Matterport ID**
   - **Tour Name**
   - **Tour Description** (optional)
3. Save the location.

The new location is created as a separate primary tour location.

## 3) Switch between locations from the Tours header

1. Use the Tours page location selector.
2. Select each location and confirm the viewer updates to the correct model context.
3. Confirm the location title and associated models are correct.

This verifies that locations are separated correctly for operations.

## 4) Configure chatbot per location

Each location should have its own chatbot configuration.

1. Open **Chatbot** from the sidebar.
2. Use the chatbot tour selector to choose a location.
3. Configure settings for that location.
4. Repeat for each additional location.

This keeps answers, information, and behaviour relevant to each space.

## 5) Confirm location capacity and billing impact

If you cannot add another location:

- Check **Settings > Billing** for current plan and limits.
- Confirm whether an extra space add-on is required.
- Purchase additional capacity if needed, then retry location creation.

Location creation is enforced by available space entitlement.

## Common issues

- **Add location button disabled**: You have reached your space limit.
- **Wrong location selected**: Recheck the header selector before making changes.
- **Chatbot changes applied to wrong tour**: Confirm selected location in Chatbot before editing.
- **Location appears without expected model**: Re-open the tour details and verify Matterport URL/ID.

## Validation checklist

- New location appears in the Tours header selector.
- Switching locations updates the active tour context.
- Each location can be selected in the Chatbot page.
- Chatbot configuration is applied per location.
- Capacity and billing limits are understood by the account owner.

## Final note

Use separate tours (locations) when spaces should be managed independently. If the spaces belong to one continuous location experience, use multiple models within one tour instead.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'How to Set Up Separate Tours Multiple Locations | TourBots Guides',
  'Learn how to create separate tour locations in TourBots and configure the chatbot correctly for each location.',
  array[
    'Tour Setup',
    'Multiple Locations',
    'Chatbot Setup',
    'Billing',
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
