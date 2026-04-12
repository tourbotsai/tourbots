-- 20_seed_pro_plan_requirement_for_addons_guide.sql
-- Seed guide for Pro plan eligibility before purchasing add-ons.
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
  'Pro Plan Requirement for Add-ons',
  'pro-plan-requirement-for-add-ons',
  'Understand add-on eligibility, why Pro is required, and how to run a safe upgrade-first workflow before purchasing extras.',
  $guide$
## What this guide covers

This guide explains why add-ons require an active Pro plan in the Billing interface and how to run an upgrade-first purchase workflow. You will confirm eligibility, upgrade correctly, and then purchase the required add-ons.

## Before you start

- You have access to **Settings > Billing**.
- You know which add-on outcome is required (spaces, messages, white-label, or Agency Portal).
- You are ready to complete Stripe checkout for paid changes.

## 1) Confirm current eligibility

1. Open **Settings**.
2. Select the **Billing** tab.
3. Check the current plan badge and plan status.

In the current app billing flow, add-on purchase controls are available once the plan is **Pro**.

## 2) Understand available add-ons

Add-ons in Billing include:

- `extra_space`
- `message_block`
- `white_label`
- `agency_portal`

Operational behaviour:

- Quantity-based inputs are used for `extra_space` and `message_block`.
- Single-account purchases are used for `white_label` and `agency_portal`.

## 3) Run upgrade-first workflow

If you are not on Pro:

1. In plan cards, select **Upgrade via Stripe** on the Pro plan.
2. Complete hosted checkout.
3. Return to **Settings > Billing**.
4. Click **Refresh** and confirm plan status is now Pro.

Only proceed to add-on purchase after Pro status is visible in Billing.

## 4) Purchase add-ons after Pro activation

1. In **Add-ons**, choose the required item.
2. Set quantity where applicable.
3. Click **Buy** to open checkout.
4. Complete payment and return to Settings.
5. Refresh billing data and verify:
   - add-on current value
   - updated total spaces/messages where relevant

## 5) Validate entitlement before rollout

Before operational rollout:

1. Confirm Billing totals match expected capacity.
2. Confirm plan and add-on states reflect completed purchases.
3. Document new entitlement values for the account.

This avoids launch issues caused by assumed, but unconfirmed, billing changes.

## Common issues

- **Add-ons appear disabled or hidden**: verify Pro plan is active and refresh Billing.
- **Plan changed but add-on state not updated**: allow webhook processing, then refresh.
- **Wrong quantity purchased**: check quantity fields before starting checkout.
- **Expected limits not visible**: review add-on current values and total capacity blocks.
- **Checkout flow interruption**: rerun from Billing and complete checkout in one pass.

## Validation checklist

- Pro plan is confirmed before add-on purchase attempts.
- Correct add-on and quantity are selected.
- Checkout completion is followed by Billing refresh.
- Total capacity values reflect the intended purchase.
- Entitlement changes are documented before go-live actions.

## Final note

Use an upgrade-first sequence for predictable purchasing: confirm eligibility, complete Pro upgrade, then buy add-ons with immediate post-check validation. This keeps capacity planning and billing governance accurate.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'Pro Plan Requirement for Add-ons | TourBots Guides',
  'Learn how Pro plan eligibility controls add-on purchasing and how to run a reliable upgrade-first billing workflow.',
  array[
    'Billing',
    'Add-ons',
    'Subscription',
    'Settings',
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
