-- 23_seed_white_label_addon_setup_commercial_use_cases_guide.sql
-- Seed guide for White-Label add-on setup and commercial rollout.
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
  'White-Label Add-on: Setup and Commercial Use Cases',
  'white-label-add-on-setup-and-commercial-use-cases',
  'Set up the White-Label add-on, remove TourBots branding where permitted, and deploy a clear commercial governance model for client-facing delivery.',
  $guide$
## What this guide covers

This guide explains when to use the White-Label add-on, how to enable it through Billing, and how to apply branding settings safely in chatbot customisation. It also covers operational controls for agency and client-facing rollouts.

## Before you start

- You can access **Settings > Billing**.
- Your account is on Pro, with add-on purchasing available in the Billing UI.
- You know which tours and client environments need branded or white-labelled chatbot behaviour.

## 1) Confirm White-Label is commercially required

Use White-Label when:

- Client contracts require removal of platform branding.
- You need a consistent client-owned brand experience across embedded chatbot touchpoints.
- Your delivery model includes multi-client governance and brand standards.

If platform attribution is acceptable, keep default branding enabled to reduce governance overhead.

## 2) Purchase the White-Label add-on

1. Open **Settings > Billing**.
2. In **Add-ons**, locate the White-Label add-on (`white_label`).
3. Click **Buy**.
4. Complete Stripe checkout.
5. Return to Billing and click **Refresh**.

Validate that White-Label now shows as **Enabled** in current add-on status.

## 3) Apply branding settings in chatbot customisation

1. Open the relevant tour in **Chatbots**.
2. Go to **Customisation**.
3. In **Colours & Branding**, review **Show "Powered by TourBots"** for desktop and mobile.
4. Set branding visibility based on your approved commercial policy.
5. Save changes and verify the live preview.

With White-Label active, branding controls are unlocked. Without it, branding controls remain locked.

## 4) Validate deployment output before client release

For each production tour:

1. Open desktop and mobile previews.
2. Confirm branding visibility matches contract requirements.
3. Test embedded chatbot behaviour on the target site.
4. Record pass/fail for branding compliance and sign-off owner.

Do not publish to client environments until branding checks pass on both device contexts.

## 5) Run governance for client-facing delivery

Use a simple governance model:

- Define a default branding policy per client account.
- Require sign-off for any change to branding visibility.
- Keep a dated audit note for White-Label activation and rollout scope.
- Include branding checks in your go-live checklist for every new tour.

This keeps commercial delivery consistent when multiple operators manage the same account.

## Common issues

- **White-Label purchased but still shown as disabled**: refresh Billing after webhook completion.
- **Branding switch is locked in customisation**: confirm White-Label entitlement is enabled for the current venue.
- **Branding differs between desktop and mobile**: validate both desktop and mobile customisation sections.
- **Client sees unexpected attribution in embed**: retest saved customisation on the live embedded page.
- **Internal policy mismatch**: align settings to the approved client contract before go-live.

## Validation checklist

- White-Label commercial requirement is documented.
- Billing shows White-Label as enabled.
- Desktop and mobile branding controls are configured intentionally.
- Live embedded output matches contractual branding requirements.
- Governance and sign-off records are completed.

## Final note

Treat White-Label as a commercial control, not only a visual setting. Purchase entitlement, apply branded behaviour consistently, and enforce a repeatable sign-off process before each client rollout.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'White-Label Add-on: Setup and Commercial Use Cases | TourBots Guides',
  'Learn how to set up the White-Label add-on, configure branding controls, and run a compliant client-facing rollout process.',
  array[
    'Add-ons',
    'Billing',
    'White-Label',
    'Branding',
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
