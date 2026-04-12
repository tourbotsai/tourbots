# Agency Account Add-on Implementation Plan

Last updated: 27/03/2026

## Goal

Deliver a paid Agency add-on that allows agencies to:

- Manage multiple tours under one TourBots account.
- Share a client-facing chatbot management portal per tour.
- Embed that portal on their own website (for example, `vrtour360.co.uk/lilybrooke-manor-chatbot`).
- Let end clients log in and manage chatbot settings, customisation, analytics, and playground in a controlled scope.

## Current Architecture Summary (Confirmed)

- Account model is based on `users` and `venues` (no separate organisations table).
- One venue account can own multiple tours.
- Billing add-ons already include `white_label`, `extra_space`, and `message_block`.
- Embed/share patterns already exist in:
  - `lib/embed-generator.ts`
  - `components/app/tours/tour-share.tsx`
  - `components/app/chatbots/tour/chatbot-share.tsx`
- Settings tab pattern is in:
  - `app/(app)/app/settings/page.tsx`

## Critical Precondition

Before launching an external client portal, secure chatbot management APIs.  
Several `app/api/app/chatbots/*` routes currently accept direct `venueId` and `tourId` inputs without Firebase token checks and ownership validation.  
This must be hardened first.

## Delivery Strategy

Use an iframe-based portal first (fastest and safest release):

- Host portal UI on TourBots.
- Generate embed code for agencies.
- Agencies place the iframe code on their own domains.
- Add domain allowlisting and client credentials for security.

## Implementation Phases

### Phase 0 - Security Hardening (Mandatory)

- [x] Add authentication and authorisation checks to sensitive chatbot write/read routes under `app/api/app/chatbots/*`.
- [x] Verify Firebase token.
- [x] Derive `venueId` server-side from authenticated user.
- [x] Enforce `tourId` belongs to that venue.
- [x] Add audit events for config/customisation/documents/triggers/sections writes.

### Phase 1 - Billing Entitlement

- [x] Add new billing add-on code: `agency_portal`.
- [x] Extend `venue_billing_records` with `addon_agency_portal boolean`.
- [x] Add checkout support in:
  - `app/api/app/billing/checkout/route.ts`
- [x] Add webhook application logic in:
  - `app/api/webhooks/stripe/route.ts`
- [x] Surface in UI:
  - `components/app/settings/subscription-status.tsx`

### Phase 2 - Agency Data Model

Create new tables for portal configuration and access:

- [x] `agency_portal_settings` (branding, domain allowlist, enabled flag, logo, colours).
- [x] `agency_portal_shares` (per-tour share records, slug, enabled modules).
- [x] `agency_portal_users` (client login records per share, password hash, active flag).
- [x] `agency_portal_sessions` (or equivalent secure session tracking).

Key constraints:

- [x] Unique slug per venue.
- [x] Scoped access by share record.
- [x] Strong indexing for slug/session lookups.

### Phase 3 - Agency Settings UI (In-App)

Add a new `Agency Settings` tab in:

- [x] `app/(app)/app/settings/page.tsx`

New component:

- [x] `components/app/settings/agency-settings.tsx`

Capabilities:

- [x] Configure agency branding (name/logo/colours).
- [x] Manage allowed domains.
- [x] See per-tour cards with `Share chatbot settings`.
- [x] Open a modal to:
  - [x] Configure slug
  - [x] Select enabled modules
  - [x] Create/reset client login credentials
  - [x] Copy embed code
  - [x] Open preview URL

### Phase 4 - Hosted Portal + Embed

Add hosted route:

- [x] `app/embed/agency/[shareSlug]/page.tsx`

Add embed generator in:

- [x] `lib/embed-generator.ts` (`generateAgencyPortalEmbed`)

- [x] Add preview and copy flows mirroring existing tour/chatbot share UX.

### Phase 5 - Portal Authentication and Authorisation

Add public auth endpoints for portal clients:

- [x] Login endpoint for agency portal users.
- [x] Session handling via secure HttpOnly cookies.
- [x] CSRF protection for write actions.
- [x] Route-level module permission checks (tour/settings/customisation/analytics, with settings block-level controls).
- [x] Billing entitlement enforced on public portal access.
- [x] Login throttling and failed-attempt tracking added for brute-force protection.

Never trust `venueId` or `tourId` from portal client payloads.

### Phase 6 - Portal API Adapters

Create dedicated public portal API namespace (for example `app/api/public/agency-portal/*`) that:

- [x] Reuses internal service logic.
- [x] Applies strict share/user scope.
- [x] Applies module access controls.
- [x] Redacts sensitive data where needed.

### Phase 7 - QA and Controlled Release

- [ ] Run end-to-end checks:
  - [ ] Add-on purchase and entitlement.
  - [ ] Share creation and slug uniqueness.
  - [ ] Login/session lifecycle, including rate-limit lockout and retry.
  - [ ] Cross-account and cross-domain access prevention.
  - [ ] Embed rendering on external domain.
- [ ] Pilot with one live agency account before broad release.

## Initial SQL Scope

First migration required:

- Add `agency_portal` billing add-on.
- Add `addon_agency_portal` column to `venue_billing_records`.

Stripe sandbox price ID provided by product owner:

- `price_1TFgfPI5TESmVv5lCaYzbbOJ`

## Build Order (Recommended)

1. Security hardening.
2. Billing entitlement and SQL.
3. Agency settings tab + share modal.
4. Hosted portal route + embed generation.
5. Portal authentication + scoped API layer.
6. QA, pilot, release.

