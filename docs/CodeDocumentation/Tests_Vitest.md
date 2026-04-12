# Vitest Live Testing Setup (TourBots AI)

Last updated: 29/03/2026

## Purpose

This document records the live Vitest smoke-test setup for TourBots AI, including:

- Test architecture and execution model.
- Authentication/context helpers used by tests.
- Category-by-category test coverage for `app`, `agency-portal`, and `admin`.
- Explicit coverage boundaries (what is intentionally excluded from the active suite).

This is a developer handover reference so engineers can understand what is validated, how it is validated, and why, without reading each test file first.

## Scope

The active suite validates production-like behaviour using real network calls and real backend services:

- Firebase auth token generation.
- Live Next.js API routes.
- Live Supabase-backed reads/writes.
- Live session, cookie, and CSRF flows where relevant.
- Live external integrations where endpoints are active in current product flow.

The active suite does not use:

- Mocked API responses.
- Mocked database fixtures.
- Stubbed auth providers.
- Fake fallback data paths.

## High-level architecture

### 1) Test runner and structure

- Runner: `vitest`
- Category folders:
  - `tests/app`
  - `tests/agency-portal`
  - `tests/admin`

### 2) Live context helpers

The suite uses dedicated helpers to create real authenticated contexts before each category runs:

- `tests/helpers/live-auth.ts`
  - Reads live env credentials and signs in through Firebase Identity Toolkit.
- `tests/helpers/live-app-context.ts`
  - Builds app user context (`baseUrl`, `idToken`, `venueId`, `tourId`) from live APIs.
- `tests/helpers/live-settings-context.ts`
  - Extends context for settings tests needing live profile/team metadata.
- `tests/helpers/live-agency-context.ts`
  - Creates and logs into real agency portal shares; returns live cookie/CSRF headers.
- `tests/helpers/live-admin-context.ts`
  - Signs in a platform admin Firebase user and validates bearer access on admin routes.

### 3) Category scripts

From `package.json`:

- `npm run test:app` -> `vitest run tests/app`
- `npm run test:agency-portal` -> `vitest run tests/agency-portal`
- `npm run test:admin` -> `vitest run tests/admin`

## Environment requirements

The suite expects live credentials and endpoints in `.env.local`.

Core test variables:

- `TEST_BASE_URL`
- `TEST_FIREBASE_API_KEY`
- `TEST_FIREBASE_EMAIL`
- `TEST_FIREBASE_PASSWORD`
- `TEST_PLATFORM_ADMIN_EMAIL`
- `TEST_PLATFORM_ADMIN_PASSWORD`

If these are invalid or incomplete, tests fail early by design.

## Test inventory and behaviour

## App tests (`tests/app`)

### Authentication and shell

- `auth-login.live.test.ts`
  - Verifies real app login/auth validation path using Firebase token and backend user checks.
- `dashboard.live.test.ts`
  - Verifies dashboard data loads correctly for a real venue/user context.

### Tours

- `tour-viewer.live.test.ts`
  - Verifies tour viewer data contract for a real active tour.
- `tour-menu.live.test.ts`
  - Verifies tour menu API loads menu structure for a real tour.
- `tour-analytics.live.test.ts`
  - Verifies tour analytics endpoint responds with real analytics payload.
- `tour-points.live.test.ts`
  - Verifies tour points endpoint returns real point inventory.
- `tour-locations.live.test.ts`
  - Verifies venue/tour location listing behaviour for active data.

### Chatbot

- `chatbot-config.live.test.ts`
  - Verifies chatbot config load/update pathways on live data.
- `chatbot-customisation.live.test.ts`
  - Verifies customisation payloads load and persist correctly.
- `chatbot-analytics.live.test.ts`
  - Verifies chatbot analytics reads for active venue/tour.
- `chatbot-information.live.test.ts`
  - Verifies information-sections endpoints for chatbot content.
- `chatbot-triggers.live.test.ts`
  - Verifies chatbot trigger listing/update behaviour.

### Settings

- `settings-profile.live.test.ts`
  - Verifies profile read/write with real user data.
- `settings-account.live.test.ts`
  - Verifies account-level settings endpoints.
- `settings-team-members.live.test.ts`
  - Verifies team member listing/management endpoints.
- `settings-billing.live.test.ts`
  - Verifies billing settings read paths and contracts.
- `settings-agency.live.test.ts`
  - Verifies app-side agency settings integration points.

## Agency Portal tests (`tests/agency-portal`)

### App-side agency management

- `app-billing-addon-agency-portal.live.test.ts`
  - Verifies agency add-on checkout/session initiation path.
- `app-agency-portal-settings.live.test.ts`
  - Verifies agency portal settings read/write from app admin side.
- `app-agency-portal-shares.live.test.ts`
  - Verifies share inventory and share upsert flows.

### Public portal auth and security

- `public-agency-auth-session-login-logout.live.test.ts`
  - Verifies full client auth lifecycle (login, session check, logout).
- `public-agency-csrf-mutation.live.test.ts`
  - Verifies mutating public endpoints enforce CSRF protection.

### Public portal runtime and content

- `public-agency-portal-core.live.test.ts`
  - Verifies core module load for settings, customisation, analytics, information, triggers, chatbot config, documents.
- `portal-bridge-tour-menu-points.live.test.ts`
  - Verifies portal runtime bridge to tour menu and points endpoints.
- `embed-agency-share-ssr.live.test.ts`
  - Verifies embed route server-side rendering for a live share slug.
- `public-agency-customisation-upload-icon.live.test.ts`
  - Verifies live icon upload/remove flow in portal customisation.
- `public-agency-playground-removed.live.test.ts`
  - Verifies removed playground endpoint returns `410 Gone`.

## Admin tests (`tests/admin`) - active suite

### Platform access and dashboard

- `platform-admin-auth-rbac.live.test.ts`
  - Verifies admin endpoint RBAC: unauthorised requests fail, platform-admin bearer succeeds.
- `admin-dashboard-platform-metrics.live.test.ts`
  - Verifies platform metrics endpoint returns full and typed metric views.

### Accounts, venues, and billing

- `admin-accounts-and-venues.live.test.ts`
  - Verifies account listing payload from live venue/user/tour joins.
- `admin-account-detail-and-patch-venue.live.test.ts`
  - Verifies venue detail retrieval and safe no-op live patch path.
- `admin-billing-venues.live.test.ts`
  - Verifies billing venues table payload (plans, add-ons, row joins).
- `admin-payments-and-links.live.test.ts`
  - Verifies payment link/subscription listing endpoints used by Payments UI.

### Outbound, help, and resources

- `admin-outbound-leads-and-notes.live.test.ts`
  - Verifies outbound lead listing and lead notes retrieval.
- `admin-outbound-sequences-crud.live.test.ts`
  - Verifies outbound sequence create/read/toggle/delete lifecycle.
- `admin-help-and-support.live.test.ts`
  - Verifies help articles and support conversation lists.
- `admin-resources-cms.live.test.ts`
  - Verifies blog and guide CMS listing endpoints.

## Operational expectations

- These tests are smoke-level integration checks, not exhaustive business-rule tests.
- They are designed to catch auth regressions, contract breaks, and major live flow failures quickly.
- Because calls are live, runtime can vary with network and external provider latency.

## Maintenance notes

- Keep helper contexts aligned with auth/session changes first; most failures cascade from helper drift.
- If active product scope changes (for example, Sales CRM reintroduced in navigation), re-enable and extend corresponding live tests.
- Add new tests in the relevant category folder and run the category script before merging.
