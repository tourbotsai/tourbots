-- 25_seed_client_access_permissions_matrix_agency_portal_guide.sql
-- Seed guide for Agency Portal client access permissions and recommended presets.
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
  'Client Access Permissions Matrix (Agency Portal)',
  'client-access-permissions-matrix-agency-portal',
  'Define exactly what clients can access and edit by module, apply safe permission presets, and validate share-level controls before rollout.',
  $guide$
## What this guide covers

This guide provides a practical permissions matrix for Agency Portal shares. It explains module-level access, settings-block access, effective edit behaviour, and recommended presets for different client ownership models.

## Before you start

- Agency Portal add-on is active and portal is enabled.
- A per-tour share already exists.
- Client credentials are configured.
- You can open the share modal in **Settings > Agency Settings**.

## 1) Understand permission layers

Agency Portal permissions are controlled per share in two layers:

- **Module layer**
  - `tour`
  - `settings`
  - `customisation`
  - `analytics`
- **Settings blocks layer** (applies only when `settings` is enabled)
  - `config`
  - `information`
  - `documents`
  - `triggers`

If a module is disabled, its tab is unavailable in the client portal.

## 2) Use the permissions matrix

Apply the following matrix when configuring each client share.

### Module matrix

- **Tour**
  - Access: tour setup and tour menu views for the shared location.
  - Use when: clients need operational control of tour content.
- **Settings**
  - Access: chatbot settings area, further scoped by settings blocks.
  - Use when: clients need prompt and knowledge control.
- **Customisation**
  - Access: chatbot appearance controls (desktop/mobile).
  - Use when: clients manage brand and UX styling.
- **Analytics**
  - Access: scoped conversation/session analytics for the shared tour.
  - Use when: clients monitor performance and outcomes.

### Settings block matrix

- **Config**
  - Access: core chatbot configuration values.
  - Typical owner: agency + client jointly.
- **Information**
  - Access: structured chatbot information sections and fields.
  - Typical owner: client content owner.
- **Documents**
  - Access: knowledge document list/upload/delete for the scoped chatbot.
  - Typical owner: client operations or agency content lead.
- **Triggers**
  - Access: trigger conditions/actions for chatbot behaviour.
  - Typical owner: agency implementation lead.

## 3) Configure permissions per share

1. Open **Settings > Agency Settings**.
2. In **Per-tour Client Sharing**, select a tour and open share settings.
3. Set **Share active**.
4. Toggle required modules.
5. If `settings` is enabled, configure `config/information/documents/triggers`.
6. Save the share.

Always configure permissions at share level, not at account level assumptions.

## 4) Apply recommended permission presets

Use one of these presets as a baseline.

- **Read-only client review**
  - Enable: `analytics`
  - Disable: `tour`, `settings`, `customisation`
- **Content manager**
  - Enable: `settings`, `customisation`, `analytics`
  - Settings blocks: `information`, `documents`
  - Disable settings blocks: `triggers` (and optionally `config`)
- **Operational editor**
  - Enable: `tour`, `settings`, `customisation`, `analytics`
  - Settings blocks: all enabled
- **Agency-controlled (client limited)**
  - Enable: `analytics` (optional)
  - Disable: `tour`, `settings`, `customisation`

Start with least privilege, then enable only what is required.

## 5) Validate effective access

For each share:

1. Sign in as the client user.
2. Confirm visible tabs match enabled modules.
3. Confirm settings sections match enabled settings blocks.
4. Attempt an authorised edit and save.
5. Attempt a blocked action and confirm it is denied.

Validation must include both UI visibility and actual API enforcement.

## Common issues

- **Client sees too many tabs**: module toggles were not saved on the intended share.
- **Settings tab visible but missing expected sections**: settings blocks are disabled.
- **Client can edit areas they should not**: share permissions were configured too broadly.
- **Client reports blocked access from valid embed**: domain allowlist may not match deployment domain.
- **Unexpected write failures**: verify the share is active and client session is valid.

## Validation checklist

- Module permissions are set intentionally per share.
- Settings blocks are aligned to client responsibilities.
- At least one blocked-action test is completed.
- At least one allowed-action save is completed.
- Permission preset and rationale are documented per client.

## Final note

Treat Agency Portal permissions as contractual controls. Use explicit share-level matrix decisions, validate effective behaviour, and document the final access profile before go-live.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'Client Access Permissions Matrix (Agency Portal) | TourBots Guides',
  'Learn how to set client permissions per module and settings block in Agency Portal, with practical presets and validation checks.',
  array[
    'Agency Portal',
    'Permissions',
    'Client Access',
    'Settings',
    'Governance'
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
