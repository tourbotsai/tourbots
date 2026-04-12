# Sentry and Alerting Setup (TourBots AI)

Last updated: 29/03/2026

## Purpose

This document records the full production monitoring setup implemented for TourBots AI, including:

- Sentry SDK integration in the Next.js application.
- Internal API/cron/webhook observability in the codebase.
- Alert routing by email (Resend) and optional webhook.
- Sentry issue alert rules configured in the Sentry project UI.

This is a developer handover reference so future engineers can understand and operate the setup without reverse-engineering the code.

## Scope

The implementation covers:

- Frontend + backend error/tracing ingestion into Sentry.
- Monitoring records for API 5xx, cron runs, and Stripe webhook processing.
- Alert notifications for critical operational failures.
- Production-focused Sentry alert rules.

It does not include:

- Third-party incident management platform configuration (for example, PagerDuty escalations).
- Custom dashboarding beyond the default Sentry views and internal database logs.

## High-level architecture

### 1) Sentry SDK telemetry

Sentry is integrated across all Next.js runtimes:

- Browser/client runtime (`instrumentation-client.ts`)
- Node.js server runtime (`sentry.server.config.ts`)
- Edge runtime (`sentry.edge.config.ts`)
- Global app error boundary (`app/global-error.tsx`)
- Request-level capture hook (`instrumentation.ts`)

`next.config.js` is wrapped with `withSentryConfig(...)` so builds can support source map upload and tunnelled transport.

### 2) Internal operational monitoring

In addition to Sentry, the app now writes structured monitoring records to Supabase:

- `api_error_events` for 5xx API failures.
- `cron_job_runs` for cron lifecycle and success/failure status.
- `webhook_event_runs` for webhook receipt, processing, deduplication, and failures.

This provides auditable internal telemetry independent of any third-party service.

### 3) Alert delivery channels

Alerts are emitted from `lib/ops-monitoring.ts` via:

- Resend email (using `ALERT_EMAIL_TO` and `ALERT_EMAIL_FROM`)
- Optional outbound webhook (`ALERT_WEBHOOK_URL`)

Both channels can run in parallel.

## Files created or updated

### Sentry SDK integration

- Created `instrumentation-client.ts`
- Created `sentry.server.config.ts`
- Created `sentry.edge.config.ts`
- Created `instrumentation.ts`
- Updated `app/global-error.tsx` to capture exceptions via Sentry
- Updated `next.config.js`:
  - Wrapped config with `withSentryConfig(...)`
  - Added Sentry ingest domains to CSP `connect-src`
  - Set Sentry org/project options and tunnel route

### Internal monitoring and alerting

- Created `sql/41_add_monitoring_and_alerting_tables.sql`
- Created `lib/ops-monitoring.ts`
- Updated cron routes:
  - `app/api/cron/publish-scheduled-blogs/route.ts`
  - `app/api/cron/send-outbound-sequence-emails/route.ts`
- Updated billing checkout route:
  - `app/api/app/billing/checkout/route.ts`
- Updated Stripe webhook route:
  - `app/api/webhooks/stripe/route.ts`
  - Switched DB client to service-role Supabase client
  - Added webhook event state tracking and duplicate handling
- Updated health route:
  - `app/api/health/route.ts` to use service-role client

### Environment templates

- Updated `.env.example` with:
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `SENTRY_DSN`
  - `SENTRY_AUTH_TOKEN`
  - `SENTRY_ORG`
  - `SENTRY_PROJECT`
  - `ALERT_WEBHOOK_URL`
  - `ALERT_EMAIL_TO`
  - `ALERT_EMAIL_FROM`

### Temporary test endpoint

- Created and removed during verification:
  - `app/api/internal/sentry-test/route.ts`
- This endpoint is no longer present.

## Supabase schema (monitoring tables)

Applied via `sql/41_add_monitoring_and_alerting_tables.sql`:

- `public.api_error_events`
  - Logs 5xx failures with route/method/status and context payload.
- `public.cron_job_runs`
  - Logs cron start/finish, duration, counts, status (`started`, `success`, `partial`, `failed`).
- `public.webhook_event_runs`
  - Logs webhook lifecycle (`received`, `processed`, `failed`, `ignored`) and attempt counts.

All three tables have indexes for operational querying and have RLS enabled.

## Environment variables

### Required for Sentry runtime ingestion

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_DSN` (can be same DSN value as public DSN)

### Required for alert email delivery

- `RESEND_API_KEY`
- `ALERT_EMAIL_TO` (for example: `tourbotsai@gmail.com`)
- `ALERT_EMAIL_FROM` (for example: `alerts@tourbots.ai`)

### Optional but recommended

- `ALERT_WEBHOOK_URL` (Slack, PagerDuty, Better Stack, etc.)
- `SENTRY_AUTH_TOKEN` (required for source map upload during build/deploy)
- `SENTRY_ORG` (`tourbots-ai`)
- `SENTRY_PROJECT` (`javascript-nextjs`)

## Sentry project and rules configured

Project: `tourbots-ai / javascript-nextjs`

Rules created:

1. `Critical - New issue (production)`
   - Trigger: new issue created
   - Filters: environment equals `production`; event level >= `error`
   - Action: email notification to issue owners, fallback to active members
   - Frequency: every 5 minutes per issue

2. `Critical - Regression (production)`
   - Trigger: issue changes from resolved to unresolved
   - Filter: environment equals `production`
   - Action: email notification to issue owners, fallback to active members
   - Frequency: every 5 minutes per issue

3. `Warning - Error spike (production)`
   - Trigger: issue seen more than 10 times in 5 minutes
   - Filter: environment equals `production`
   - Action: email notification to issue owners, fallback to active members
   - Frequency: every 10 minutes per issue

Existing default Sentry high-priority rule remained active.

## Verification completed

The following were verified during implementation:

- Sentry SDK installed and initialised in client/server/edge.
- Dev test event successfully emitted and received in Sentry.
- API endpoint returned expected 500 during test and produced a Sentry event ID.
- Lint checks passed for all touched files.

## Operational behaviour summary

### API 5xx

- Critical 5xx events can be recorded to `api_error_events`.
- Billing and webhook routes explicitly record and alert on critical failures.

### Cron jobs

- Each monitored cron route writes a start and finish record to `cron_job_runs`.
- Partial failures are tracked separately from hard failures.
- Failures trigger alert notifications.

### Stripe webhooks

- Events are tracked in `webhook_event_runs`.
- Duplicate processing protection is in place.
- Processing failures are logged and alert notifications are emitted.

## Security and token handling

- Sentry API tokens used during setup were revoked after rule configuration.
- Do not commit live API tokens to repository files.
- Use temporary scoped tokens for admin/API automation tasks, then revoke.

## Ongoing maintenance

- Keep `@sentry/nextjs` updated with regular dependency maintenance.
- Review Sentry rule noise quarterly and tune thresholds if needed.
- Keep alert recipient configuration current when on-call ownership changes.
- Validate cron/webhook alert delivery after major billing or outbound workflow changes.

## Troubleshooting

- If Sentry events do not appear:
  - Confirm DSN variables are present at runtime.
  - Confirm CSP still allows `*.sentry.io` / `*.ingest.sentry.io` in `connect-src`.
  - Restart app after env changes.
- If email alerts do not arrive:
  - Confirm `RESEND_API_KEY`, sender domain validity, and `ALERT_EMAIL_TO`.
  - Check Resend activity logs for delivery status.
- If source maps are missing:
  - Confirm `SENTRY_AUTH_TOKEN` is set in build environment.
  - Confirm `withSentryConfig(...)` remains active in `next.config.js`.
