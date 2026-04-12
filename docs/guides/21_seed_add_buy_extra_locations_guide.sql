-- 21_seed_add_buy_extra_locations_guide.sql
-- Seed guide for purchasing and using extra locations.
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
  'How to Add and Buy Extra Locations',
  'how-to-add-and-buy-extra-locations',
  'Purchase extra space add-ons and create additional tour locations with verified capacity checks and post-purchase validation.',
  $guide$
## What this guide covers

This guide explains how to purchase extra location capacity and then create additional tour locations. You will run the full workflow from Billing purchase to location creation validation in Tours.

## Before you start

- You can access **Settings > Billing** and **Tours**.
- You are on an account with Pro eligibility for add-ons.
- You have Matterport model details ready for each new location.

## 1) Check your current location capacity

1. Open **Settings > Billing**.
2. Review:
   - **Base spaces**
   - **Total spaces**
3. Confirm whether available space is enough for your planned new locations.

If total spaces are already fully used, purchase extra space before attempting to add locations.

## 2) Buy extra space add-ons

1. In **Billing > Add-ons**, find **Additional Space** (`extra_space`).
2. Enter the required quantity.
3. Click **Buy** and complete Stripe checkout.
4. Return to **Settings > Billing**.
5. Click **Refresh** and confirm capacity totals increased.

Each extra space increases location capacity and contributes additional message allowance.

## 3) Create a new tour location

1. Go to **Tours**.
2. Open **Manage Tour Locations**.
3. Click **Add New Tour Location**.
4. Enter:
   - Matterport URL
   - Matterport ID
   - Location title
   - Optional description
5. Save the location.

New location creation is checked against billing space limits before write completion.

## 4) Validate location and selector behaviour

1. Confirm the new location appears in the Tours header selector.
2. Select the location and verify the correct model loads.
3. Confirm associated tabs (Tour Setup, Tour Menu, Share & Embed, Analytics) work in the new location scope.

This ensures location context is fully active after creation.

## 5) Handle capacity errors correctly

If you hit a location limit:

1. Return to **Settings > Billing**.
2. Purchase additional **extra_space** quantity.
3. Refresh Billing and reconfirm total spaces.
4. Retry location creation.

Do not retry repeatedly without verifying billing totals first.

## Common issues

- **Cannot add a location**: check total spaces vs used spaces in Billing and Tours.
- **Purchase completed but limit unchanged**: refresh Billing after webhook processing.
- **Wrong model details saved**: verify Matterport URL and model ID before saving.
- **Location created but not visible in selector**: refresh Tours data and recheck active locations.
- **Still blocked after purchase**: confirm add-on quantity and current values in Billing.

## Validation checklist

- Extra space purchase is visible in Billing.
- Total spaces increased as expected.
- New location saves without limit errors.
- New location appears in selector and loads correctly.
- Tours tabs operate in the new location scope.

## Final note

Treat extra location rollout as a two-step operation: entitlement first, location creation second. Verifying capacity before and after purchase prevents failed setup attempts and keeps deployment predictable.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'How to Add and Buy Extra Locations | TourBots Guides',
  'Learn how to buy additional space add-ons and create extra tour locations with correct validation and post-purchase checks.',
  array[
    'Add-ons',
    'Billing',
    'Tour Setup',
    'Locations',
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
