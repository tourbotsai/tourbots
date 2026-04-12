-- 24_seed_agency_portal_addon_guide.sql
-- Seed guide for Agency Portal add-on setup and client access management.
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
  'Agency Portal Addon',
  'agency-portal-addon',
  'Enable Agency Portal, configure branded client access per tour, and control module permissions and credentials with secure operational controls.',
  $guide$
## What this guide covers

This guide explains how to activate the Agency Portal add-on, enable branded client access, and configure per-tour sharing with module-level permissions. It also covers credential handling, domain controls, and secure rollout checks.

## Before you start

- You can access **Settings > Billing** and **Settings > Agency Settings**.
- Your account is on Pro and can purchase add-ons in Billing.
- At least one active tour exists.
- You have a client email ready for portal access.

## 1) Activate the Agency Portal entitlement

1. Open **Settings > Billing**.
2. In **Add-ons**, find **Agency Portal** (`agency_portal`).
3. Click **Buy** and complete checkout.
4. Return to Billing and click **Refresh**.

Confirm Agency Portal is enabled in add-on status before continuing.

## 2) Enable the Agency Portal in settings

1. Open **Settings > Agency Settings**.
2. In **Agency Portal Branding**, enable **Enable agency portal**.
3. Click **Save agency settings**.

If entitlement is missing, Agency controls are disabled and this tab cannot be fully activated.

## 3) Configure branding and domain controls

In **Agency Portal Branding**, configure:

- **Agency name**
- **Agency logo** (PNG, JPEG, SVG, or WebP, up to 2MB)
- **Primary colour** and **Secondary colour**
- **Allowed domains** (one per line)

Save changes. Domain allowlisting is enforced at portal access level, so incorrect entries will block client access.

## 4) Create a per-tour share with module permissions

1. In **Per-tour Client Sharing**, choose a tour.
2. Click **Share chatbot settings**.
3. Set a unique **Share slug**.
4. Set **Share active** state.
5. Enable or disable modules:
   - `tour`
   - `settings`
   - `customisation`
   - `analytics`
6. If `settings` is enabled, configure settings blocks:
   - `config`
   - `information`
   - `documents`
   - `triggers`
7. Click **Save share**.

This controls exactly what the client can access inside the portal for that specific tour.

## 5) Set client credentials and manage password lifecycle

Inside the share modal:

1. Enter **Client email**.
2. Enter **Client password** (or leave blank to generate a temporary password on save).
3. Save the share.
4. If needed later, use **Regenerate password**.

When a temporary password is generated, copy and share it through your approved secure channel.

## 6) Validate preview and embed deployment

After saving:

1. Use **Open preview** to validate the live share.
2. Copy either:
   - iFrame embed code, or
   - Advanced script embed code.
3. Confirm the embed loads with the expected branding and enabled modules.

If the portal is disabled at account level, permanent preview and live embed behaviour remain blocked.

## 7) Apply security and operations checks

Use this minimum operational checklist:

- Keep **Share active** off until validation is complete.
- Disable shares immediately if access must be revoked.
- Confirm domain allowlist entries match the client’s deployment domains.
- Validate client login from the target domain.
- Track failed login behaviour (rate-limited after repeated failures).

Current login protection applies a failed-attempt threshold in a rolling time window to reduce brute-force risk.

## Common issues

- **Agency tab shows warning and disabled controls**: entitlement is not enabled on billing record.
- **Client cannot access portal from their site**: allowed domain list does not match request domain.
- **Preview works temporarily but not permanently**: share was not saved, or portal is not enabled.
- **Client can see the wrong modules**: share module toggles were not saved for that tour.
- **Credential confusion after password reset**: old password is invalid after regeneration; share new value securely.

## Validation checklist

- Agency Portal add-on is enabled in Billing.
- Agency portal is enabled and saved in Agency Settings.
- Branding and allowed domains are configured and verified.
- Share slug, modules, and settings blocks are correctly set per tour.
- Client credential flow is tested end-to-end.
- Preview and embed output match operational expectations.

## Final note

Treat Agency Portal setup as access governance, not only a sharing action. Configure entitlement, permissions, domains, and credentials together so each client receives the correct controlled experience.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'Agency Portal Addon | TourBots Guides',
  'Learn how to enable Agency Portal, configure client access per tour, and manage secure module permissions and credentials.',
  array[
    'Add-ons',
    'Agency Portal',
    'Client Access',
    'Permissions',
    'Settings'
  ]::text[],
  'intermediate',
  true,
  now(),
  0,
  8
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
