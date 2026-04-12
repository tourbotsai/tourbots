-- 19_seed_billing_settings_subscription_management_guide.sql
-- Seed guide for managing billing settings and subscription status.
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
  'Billing Settings and Subscription Management',
  'billing-settings-and-subscription-management',
  'Manage your active plan, review billing status, confirm included capacity, and run safe upgrade or downgrade actions from Settings.',
  $guide$
## What this guide covers

This guide explains how to manage billing from **Settings > Billing**. You will review plan status, check included capacity, switch plans where supported, and handle Stripe checkout for paid upgrades and add-ons.

## Before you start

- You are signed in to an account with access to the venue billing area.
- Stripe configuration is active for paid checkout flows.
- You know whether you are managing a test account or live account.

## 1) Open Billing in Settings

1. Go to **Settings**.
2. Open the **Billing** tab.
3. Confirm the top billing card shows your current plan and billing status.

Use **Refresh** to reload billing data after plan or add-on changes.

## 2) Read plan status and capacity correctly

The Billing panel shows:

- **Current Plan** and **Status**
- **Plan code badge** (for example, `FREE` or `PRO`)
- **Base spaces** and **Base messages**
- **Total spaces** and **Total messages** after add-ons or overrides

Capacity totals are calculated from your plan plus purchased add-ons.

## 3) Manage plan selection

Two plan cards are available in app billing:

- **Free**
- **Pro**

Plan actions:

1. Use **Upgrade via Stripe** on Pro to start hosted checkout.
2. Use **Switch to Free** to move back to free plan in app.
3. Confirm the plan badge and status update after completion.

Pro upgrades run through Stripe checkout and redirect back to Settings on success or cancellation.

## 4) Manage add-ons safely

Add-ons are shown in the **Add-ons** section.

- Add-ons are purchasable only when **Pro** is active.
- Quantity-based add-ons:
  - `extra_space`
  - `message_block`
- Account-level add-ons (single quantity):
  - `white_label`
  - `agency_portal`

Use **Buy** to launch Stripe checkout for the selected add-on.

## 5) Confirm post-purchase state

After checkout:

1. Return to **Settings > Billing**.
2. Click **Refresh**.
3. Confirm updates in:
   - Current plan and status
   - Add-on current values
   - Total spaces/messages limits

Webhook processing applies completed add-on and subscription updates to billing records.

## Common issues

- **Billing tab shows stale values**: refresh after checkout return.
- **Add-ons unavailable**: activate Pro first.
- **Upgrade did not apply yet**: allow webhook processing, then refresh.
- **Unexpected limit values**: review add-on counts and effective limit overrides.
- **Checkout does not start**: verify Stripe configuration and environment settings.

## Validation checklist

- Current plan and status are visible and accurate.
- Capacity values (base and total) match expected entitlement.
- Upgrade and downgrade actions follow intended flow.
- Add-on purchase controls are used only on Pro plan.
- Post-checkout values are revalidated with Refresh.

## Final note

Use Billing as a controlled operational workflow: verify status first, change one item at a time, then confirm limits after each completed checkout. This keeps entitlement and capacity planning accurate across teams.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'Billing Settings and Subscription Management | TourBots Guides',
  'Manage plans, billing status, and capacity limits in Settings, with safe Stripe checkout flows for Pro and add-ons.',
  array[
    'Billing',
    'Subscription',
    'Settings',
    'Add-ons',
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
