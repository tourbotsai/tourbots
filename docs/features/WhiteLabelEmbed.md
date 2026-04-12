# White-Label Agency Embed Domain (Phase 1 Feature Brief)

## Goal

Enable agency customers to configure their own embed source domain for Agency Portal shares (for example, `https://portal.clientagency.co.uk`) so copied embed code and share links use the agency domain instead of `tourbots.ai`.

This is intentionally planned as a **post-launch feature**. The current priority remains getting the existing platform live and fully tested.

## Why this matters

- Improves white-label credibility during agency sales.
- Reduces visible platform branding in client-facing workflows.
- Creates a clear premium differentiation for Agency Portal customers.
- Supports higher-value B2B retainers where agencies require their own branded delivery URL.

## Current state (as of 11/04/2026)

- Agency embed code source is derived from the running app host.
- In production, agency embed links resolve to `tourbots.ai`.
- `Allowed domains` currently controls where agency portal access is permitted, not which domain is generated in embed code.

## Proposed feature outcomes

1. Agency can save a dedicated `Embed source URL` in Agency Portal Branding.
2. Share modal embed code generation uses that saved URL.
3. Copied iframe/script snippets show the agency domain.
4. Platform validates and safely handles domain usage without weakening existing access controls.

## Scope (Phase 1)

### In scope

- Data model support for embed source URL.
- Agency settings API support for reading/updating this value.
- Agency settings UI field above `Allowed domains`.
- Embed generation logic updated to use configured source URL (with safe fallback).
- Domain validation updates so requests from configured embed host work correctly.
- Documentation and operational checklist for onboarding agency domains.

### Out of scope (Phase 1)

- Full self-serve DNS automation.
- Automated SSL provisioning workflow.
- Multi-domain routing per agency with dashboard provisioning wizard.
- Billing/packaging changes for feature monetisation.

## Technical approach

### 1) Data model

Add fields to `agency_portal_settings`:

- `embed_base_url text null` (full URL, HTTPS in production)
- optional follow-on fields for later phases:
  - `embed_domain_status text` (`pending`, `verified`, `live`, `failed`)
  - `embed_verified_at timestamptz`

### 2) API changes

Update `app/api/app/agency-portal/settings/route.ts`:

- Accept `embed_base_url` in validation schema.
- Normalise and validate URL format.
- Return saved value in GET/PUT responses.

### 3) UI changes

Update `components/app/settings/agency-settings.tsx`:

- Add `Embed source URL` input above `Allowed domains`.
- Add helper text:
  - Example format: `https://portal.youragency.co.uk`
  - Explain this controls generated embed/share link host.
- Persist via existing Save agency settings action.

### 4) Embed generation changes

Update `lib/embed-generator.ts`:

- Allow `generateAgencyPortalEmbed()` to accept base URL override.
- Use `settings.embed_base_url` when present.
- Fallback to current host behaviour if unset.

### 5) Access control compatibility

Update `lib/agency-portal-auth.ts`:

- Ensure configured embed domain is treated as a trusted portal host where appropriate.
- Keep `allowed_domains` enforcement for parent/client site access.
- Preserve current local/dev allowances.

## Operational prerequisites

For each agency domain:

1. Domain must point to hosting target (DNS configured).
2. TLS certificate must be active for that hostname.
3. App routes must resolve correctly on that host:
   - `/embed/agency/[shareSlug]`
   - `/api/public/agency-portal/*`
   - `/_next/*`

## Risks and mitigations

- **Risk:** Misconfigured DNS causes broken embeds.
  - **Mitigation:** Field validation + clear helper text + onboarding checklist.
- **Risk:** Overly broad domain trust weakens security.
  - **Mitigation:** Keep strict domain normalisation and host checks; do not bypass existing access controls.
- **Risk:** CORS/session issues on custom hosts.
  - **Mitigation:** Test matrix for login/session/authenticated API calls on custom domain.

## Acceptance criteria

- Agency saves `Embed source URL` successfully from settings UI.
- Generated iframe/script embed code uses saved URL host.
- Share preview opens and loads correctly from that host.
- Agency client sign-in works on that host.
- Existing agencies without `embed_base_url` remain unaffected.
- No regression in current `allowed_domains` protections.

## Test plan (feature rollout)

- Unit-level validation for URL parsing/normalisation.
- Manual smoke on:
  - Save settings
  - Copy iframe/script code
  - Open preview
  - Login/logout in embedded portal
  - Settings/customisation/analytics/triggers API calls
- Negative tests:
  - Invalid URL formats
  - Non-HTTPS URL in production
  - Host mismatch / unauthorised domain access

## Rollout plan

1. Ship current platform as-is and complete launch test pass.
2. Build Phase 1 white-label embed source support behind a controlled rollout flag.
3. Validate with one pilot agency domain.
4. Expand to additional agencies after pilot sign-off.

## Definition of done

Feature is considered done when at least one live agency share is successfully delivered and embedded using a non-`tourbots.ai` domain, with authentication and settings workflows fully operational.
