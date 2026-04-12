# TourBots Test Plan

We will keep tests simple and high value: start with authentication, then expand by product area.  
Default automation is Vitest integration tests for route handlers and services. Live smoke checks run separately against staging with real Firebase/Supabase and Stripe test mode.

## App

- [x] Auth login live smoke (`tests/app/auth-login.live.test.ts`)
- [x] Dashboard load live smoke (`tests/app/dashboard.live.test.ts`)
- [x] Tour viewer live smoke (`tests/app/tour-viewer.live.test.ts`)
- [x] Tour menu live smoke (`tests/app/tour-menu.live.test.ts`)
- [x] Tour analytics live smoke (`tests/app/tour-analytics.live.test.ts`)
- [x] Tour points live smoke (`tests/app/tour-points.live.test.ts`)
- [x] Tour locations/models live smoke (`tests/app/tour-locations.live.test.ts`)
- [x] Chatbot config (`tests/app/chatbot-config.live.test.ts`)
- [x] Chatbot information sections (`tests/app/chatbot-information.live.test.ts`)
- [x] Chatbot triggers (`tests/app/chatbot-triggers.live.test.ts`)
- [x] Chatbot customisation (`tests/app/chatbot-customisation.live.test.ts`)
- [x] Chatbot analytics (`tests/app/chatbot-analytics.live.test.ts`)
- [x] Settings - profile (`tests/app/settings-profile.live.test.ts`)
- [x] Settings - account (`tests/app/settings-account.live.test.ts`)
- [x] Settings - team members (`tests/app/settings-team-members.live.test.ts`)
- [x] Settings - billing and subscription (`tests/app/settings-billing.live.test.ts`)
- [x] Settings - agency (`tests/app/settings-agency.live.test.ts`)

## Agency Portal

- [x] App billing add-on checkout smoke (`tests/agency-portal/app-billing-addon-agency-portal.live.test.ts`)
- [x] App agency settings read/write smoke (`tests/agency-portal/app-agency-portal-settings.live.test.ts`)
- [x] App agency shares inventory smoke (`tests/agency-portal/app-agency-portal-shares.live.test.ts`)
- [x] Public portal auth login/session/logout smoke (`tests/agency-portal/public-agency-auth-session-login-logout.live.test.ts`)
- [x] Public portal CSRF enforcement smoke (`tests/agency-portal/public-agency-csrf-mutation.live.test.ts`)
- [x] Embed share SSR smoke (`tests/agency-portal/embed-agency-share-ssr.live.test.ts`)
- [x] Public portal core smoke (settings/customisation/analytics/information/triggers/config/documents) (`tests/agency-portal/public-agency-portal-core.live.test.ts`)
- [x] Public portal icon upload/remove smoke (`tests/agency-portal/public-agency-customisation-upload-icon.live.test.ts`)
- [x] Portal runtime bridge smoke (tour menu + points) (`tests/agency-portal/portal-bridge-tour-menu-points.live.test.ts`)
- [x] Removed playground endpoint contract smoke (`tests/agency-portal/public-agency-playground-removed.live.test.ts`)

## Admin

- [ ] Platform admin auth and RBAC smoke (`tests/admin/platform-admin-auth-rbac.live.test.ts`)
- [ ] Dashboard platform metrics smoke (`tests/admin/admin-dashboard-platform-metrics.live.test.ts`)
- [ ] Accounts and venues listing smoke (`tests/admin/admin-accounts-and-venues.live.test.ts`)
- [ ] Account detail and venue patch smoke (`tests/admin/admin-account-detail-and-patch-venue.live.test.ts`)
- [ ] Billing venues read/write smoke (`tests/admin/admin-billing-venues.live.test.ts`)
- [ ] Payments links and subscriptions read smoke (`tests/admin/admin-payments-and-links.live.test.ts`)
- [ ] Trials overview and checkout-session smoke (`tests/admin/admin-trials-overview-and-checkout.live.test.ts`)
- [ ] Outbound leads and notes smoke (`tests/admin/admin-outbound-leads-and-notes.live.test.ts`)
- [ ] Outbound sequences CRUD smoke (`tests/admin/admin-outbound-sequences-crud.live.test.ts`)
- [ ] Help articles and support conversations smoke (`tests/admin/admin-help-and-support.live.test.ts`)
- [ ] Resources blogs/guides CMS smoke (`tests/admin/admin-resources-cms.live.test.ts`)
- [ ] Sales metrics/leads/activities/sequences smoke (`tests/admin/admin-sales-core.live.test.ts`)
- [ ] Lead enrichment and AI email endpoints smoke (`tests/admin/admin-sales-ai-and-enrichment.live.test.ts`)

## First implementation

- [x] `tests/app/auth-login.live.test.ts`
- [x] `tests/app/dashboard.live.test.ts`

Helper:

- `tests/helpers/live-auth.ts` is the shared real sign-in helper for all live app tests.

## Run

- `npm run test:run`
- `npm test`
