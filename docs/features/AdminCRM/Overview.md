# Admin CRM — Overview

Last updated: 18/07/2026

## Purpose

An internal-only outbound sales CRM for TourBots agency prospecting, built into the admin panel at `/admin/crm`. It replaces spreadsheet-based cold outreach tracking with:

- A single record per prospect company (`crm_companies`), with pipeline status, notes and a full activity history.
- Multi-step outreach **sequences** (call + email cadences), tracked per contact.
- A **real Gmail/Workspace account** connected via OAuth, used to send outreach emails and detect replies — no third-party ESP, no Resend, no tracking pixels.
- A hard, cross-sequence **"stop outreach"** flag that pulls a contact out of everything the moment they reply, ask to be removed, or are manually marked as such — separate from the sales-outcome `status` field.

The pre-existing `/admin/outbound` feature (`platform_outbound_leads`/`_sequences`/`_steps`/`_enrollments`, Resend-based sending) has been fully superseded by this CRM and removed (code deleted, legacy tables dropped in migration 80).

## Where it lives

| Area | Path |
|---|---|
| Sidebar entry | `components/admin/shared/admin-sidebar.tsx` / `admin-mobile-sidebar.tsx` ("CRM", between Accounts and Payments) |
| Main page (Companies / Sequences tabs) | `app/(admin)/admin/crm/page.tsx` |
| Company detail page | `app/(admin)/admin/crm/[companyId]/page.tsx` |
| Sequence detail page | `app/(admin)/admin/crm/sequences/[id]/page.tsx` |
| Service layer (all business logic) | `lib/services/admin/crm-service.ts` |
| Gmail OAuth + send/poll logic | `lib/services/admin/crm-gmail-service.ts` |
| API routes | `app/api/admin/crm/**` |
| Cron routes | `app/api/cron/send-crm-sequence-emails`, `app/api/cron/poll-crm-inbound-emails` |
| SQL migrations | `sql/68_crm_initial.sql` through `sql/79_crm_internal_qa_test_sequence.sql` |

All API routes are protected by `requirePlatformAdmin` (`lib/api/require-platform-admin.ts`) — same Firebase-based platform-admin check used elsewhere in the admin panel. All CRM tables have RLS enabled with a single `service_role_all_*` policy — no anon/authenticated access, service-role only.

## Data model

### `crm_companies`

One row per prospect. Core fields: `company_name`, `first_name`, `last_name`, `email`, `phone`, `region`, `source`, `notes_summary`.

- `status` — the sales pipeline stage: `not_started` → `attempted` → `in_sequence` → `interested` / `not_interested` / `dormant`. Manually editable on the company detail page. `interested`, `not_interested` and `dormant` are excluded from all automated sending (see "Sending pipeline" below).
- `is_stopped` / `stopped_at` / `stopped_reason` — a **separate**, cross-sequence hard stop. Independent of `status`. `stopped_reason` is `'manual'` (someone pressed Stop) or `'inbound_reply'` (the inbound poll cron detected a reply and stopped it automatically). Shown as a badge with a hover tooltip everywhere it appears (main table, company detail, sequence contacts list, per-step indicator).

### `crm_notes`

Free-text notes on a company, newest first, shown as a chronological feed on the company detail page. Independent of `crm_activities` — used for general context, not a record of an outreach action.

### `crm_activities`

**The single source of truth for everything that happened** — every call, every email, whether logged manually or generated automatically by a sequence step. Nothing else on this page should be read as "what actually happened"; `crm_sequence_step_status` (below) is UI-only.

- `activity_type`: `call` | `email`.
- `direction`: `outbound` | `inbound` (added in migration 78). Inbound rows are always created by the Gmail poll cron and rendered with a distinct indigo "Reply received" badge.
- `summary` — resolved call-script/email-body text, or a free-text note if one was provided (see "Call outcomes" below).
- `outcome` — free text; set automatically to "No answer" / "Positive" / "Negative" for sequence call steps, or editable inline for manually logged activities.

### `crm_sequences` / `crm_sequence_steps` / `crm_sequence_contacts` / `crm_sequence_step_status`

- A **sequence** (`crm_sequences`) is a named, reusable cadence — e.g. "TourBots Agency Sequence A - Call Led".
- **Steps** (`crm_sequence_steps`) are ordered `call` or `email` entries with a template `scheduled_date` + `scheduled_time`, and content:
  - Call steps: `call_script` (supports `{{first_name}}`, `{{last_name}}`, `{{company_name}}`).
  - Email steps: `email_subject` + `email_body` (same variables).
  - Variables resolve via `resolveTemplateVariables()` in `crm-service.ts`: falls back to `company_name` whenever `first_name`/`last_name` isn't on file.
- **Contacts** (`crm_sequence_contacts`) enrol a company into a sequence. Has an optional per-contact `anchor_date` — see "Staggered enrollment" below.
- **Step status** (`crm_sequence_step_status`) is a simple tick/untick table (`step_id` + `company_id` + `completed_at`) that drives the checkbox/button state on the sequence page only. It is never read as history — `crm_activities` is.

### `crm_gmail_accounts`

The connected Gmail/Workspace account (currently one at a time — `jack@tourbotsai.com`). Stores AES-256-GCM–encrypted OAuth refresh/access tokens, `display_name`, `status` (`active`/`revoked`), and `last_history_id` (the Gmail History API cursor used by the inbound poll cron — see below).

### `crm_sequence_scheduled_emails`

One row per (email step, company) pair — the actual send queue. `status`: `scheduled` → `processing` → `sent` / `failed` / `cancelled`. Carries `scheduled_for` (computed, see below), `attempts`, `error_message`, `gmail_message_id`, `gmail_thread_id`.

### `crm_gmail_inbound_messages`

Dedup ledger + audit trail for the inbound poll cron (migration 78). One row per inbound Gmail message seen, whether or not it matched a company (`matched boolean`, `company_id` nullable). Not surfaced as its own UI page — matched messages show up as `crm_activities` rows instead; this table exists purely so the cron never double-processes a message and so unmatched replies aren't silently lost.

## Company lifecycle & the "stop" mechanism

Two independent axes:

1. **`status`** — where this company is in the sales pipeline. Set manually on the company detail page, or automatically flipped `not_started` → `in_sequence` when first added to a sequence.
2. **`is_stopped`** — "never contact again, in any sequence, automatically or manually." Set by:
   - Pressing **Stop outreach** on the company detail page, or the per-contact **Stop** button on a sequence's Contacts list (`stopped_reason: 'manual'`).
   - The **inbound poll cron** detecting a reply from that company's email address (`stopped_reason: 'inbound_reply'`) — fully automatic, no human action needed.
   - Choosing **Negative** on a call-outcome and ticking "stop outreach for this contact" in the modal.

`stopCrmCompanyOutreach()` (`crm-service.ts`) is the single function behind all of these. It flags the company and immediately cancels every still-`scheduled` row in `crm_sequence_scheduled_emails` for that company, across every sequence — so nothing already queued slips out before the next cron run. **Resume** (`resumeCrmCompanyOutreach()`) clears the flag; it does not automatically re-queue anything.

## Sequences UI (`/admin/crm/sequences/[id]`)

- **Upcoming Actions** (top card, expanded by default) — the next 5 incomplete, non-stopped actions across the whole sequence, sorted by due date, each with its full action buttons. Lets you work a sequence without scrolling through every contact.
- **Contacts** (collapsed by default) — search box, one compact row per contact (name, contact, phone, Stopped badge if applicable), with per-contact **Stop**/**Resume** and **Remove from sequence** buttons. Stopping here is contact-wide, not sequence-wide — it stops every sequence that contact is in.
- **Steps** (collapsed by default) — one card per step, each contact listed with due date and the relevant action for that step type.

### Completing a step: call outcomes

Call steps use three outcome buttons instead of a checkbox, handled by `completeCrmSequenceStep()`:

| Button | Behaviour |
|---|---|
| **No answer** | Logs the activity immediately (summary = the resolved call script), ticks the step. No modal. |
| **Positive** | Opens a modal for a free-text note. On save: logs the activity (summary = your note if provided, else the call script), ticks the step. Sequence continues untouched. |
| **Negative** | Opens the same modal plus a **"Stop outreach for this contact"** checkbox. On save: logs the activity, ticks the step, and — only if the checkbox was ticked — calls `stopCrmCompanyOutreach(companyId, 'manual')`. If left unticked, the sequence continues exactly as with Positive. |

Every completed step shows an **Undo** link, which removes the tick (`crm_sequence_step_status` row) but never touches the `crm_activities` row already logged — history is permanent, only the UI "done" state can be reverted.

### Completing a step: email outcomes

Email steps never show a checkbox — they're expected to auto-send (see below). Instead:

- **Mark as sent** — logs the activity and ticks the step *without* calling the Gmail API, and flips the matching `crm_sequence_scheduled_emails` row straight to `sent` so the cron never tries to send it again. Used for anything sent manually outside the automated pipeline.
- Once a step has actually auto-sent, it shows the real sent time (from `crm_sequence_scheduled_emails.sent_at`) instead of a generic "done" message, plus **Undo**.

## Sending pipeline (Gmail)

### Connecting

`/admin/crm` → connect Gmail card → OAuth consent flow (`lib/services/admin/crm-gmail-service.ts`, `app/api/admin/crm/gmail/{connect,callback}`). Tokens are encrypted at rest (AES-256-GCM, `CRM_GMAIL_TOKEN_ENCRYPTION_KEY`) and never returned to the client. Only one active account is supported — connecting a new one revokes the previous row.

Scopes requested: `gmail.send`, `gmail.readonly`, `openid`, `email`. `gmail.readonly` was added in migration 78 for inbound polling — see below for the Google Cloud Console step this requires.

### Scheduling

Every email step gets a `crm_sequence_scheduled_emails` row per enrolled contact, computed by `crm_compute_scheduled_for(date, time)` (Europe/London local time → UTC). This happens automatically whenever:
- A new email step is created (`crm_sync_scheduled_emails_for_step`).
- A new contact is added to a sequence (`crm_sync_scheduled_emails_for_contact`).

### Staggered enrollment ("anchor dates")

Sending 64 companies' Day-1 emails all at the same instant is a deliverability red flag on a still-warming domain. `crm_sequence_contacts.anchor_date` (migration 74) lets each contact have its own personal "Day 1", independent of the sequence template's dates:

- `crm_sequence_template_anchor(sequenceId)` — the sequence's earliest step date (its "Day 0").
- `crm_effective_step_date(sequenceId, stepDate, contactAnchorDate)` — `anchor_date + (stepDate − templateAnchor)`, shifted off weekends (`crm_shift_to_weekday`). Falls back to the step's own `scheduled_date` untouched when `anchor_date` is null.
- `crm_sequence_effective_schedule(sequenceId)` — the full per-contact, per-step effective date table, used by the sequence UI to show each company's own real date instead of one shared date for everyone.

The 64-company production list was enrolled via a look-ahead volume-ramp scheduler (implemented directly in SQL, migrations 74 and 76): 1 email/day ramping to a 10/day cap, Monday–Friday, verified against **total** daily volume (new enrollments + every future follow-up landing that day), not just new-enrollment count.

### Cron: sending

`app/api/cron/send-crm-sequence-emails` (every 5 minutes) → `processAllPendingCrmSequenceEmails()` → `claim_crm_sequence_scheduled_emails` (atomic `SKIP LOCKED` claim, reclaims anything stuck in `processing` for >10 minutes) → `processCrmScheduledEmail()` per row, staggered ~400ms apart.

`processCrmScheduledEmail()`:
1. Skips (cancels, with a reason) if the company is `is_stopped`, or its `status` is `interested`/`not_interested`/`dormant`.
2. Resolves template variables, sends via `sendCrmSequenceEmailViaGmail()` (builds a plain-text RFC 2822 MIME message, base64url-encodes it, calls `gmail.send`).
3. On success: logs an `outbound` activity, ticks `crm_sequence_step_status`, marks the scheduled-email row `sent` with the real Gmail `messageId`/`threadId`.
4. On failure: retries up to 3 attempts, then `failed` for manual review.

### Cron: inbound reply detection (migration 78)

`app/api/cron/poll-crm-inbound-emails` (every 5 minutes) → `processInboundGmailMessages()`:

1. Reads the connected account's `last_history_id`. If null (first run), bootstraps it via `users.getProfile` and returns — deliberately does **not** retroactively process old mail.
2. Calls `getGmailHistorySince()` (`users.history.list`, paginated) for every `messageAdded` in `INBOX` since that cursor. If Gmail reports the cursor has expired (>~1 week old), re-bootstraps and skips that cycle rather than erroring forever.
3. For each new message ID: skips if already in `crm_gmail_inbound_messages`; fetches it in full (`fetchInboundGmailMessage()` — parses `From`/`Subject`, walks MIME parts for a plain-text body, falls back to stripped HTML then the Gmail snippet); ignores anything sent from the connected mailbox itself.
4. Matches the sender address (case-insensitive) against `crm_companies.email`.
   - **Matched**: logs an `inbound` activity (visible as a distinct "Reply received" badge), and calls `stopCrmCompanyOutreach(companyId, 'inbound_reply')` — immediately cancelling every other queued send for that company, in every sequence.
   - **Unmatched**: recorded in `crm_gmail_inbound_messages` only, `matched: false`, for visibility/debugging.
5. Always advances `last_history_id`, whether or not any messages matched.

Deliberately **out of scope** for this pass: open tracking (pixel), click tracking (link rewriting), and any "read/unread" indicator — all would require converting to HTML emails, which was explicitly rejected to protect deliverability on a still-warming sending domain. Emails stay plain text.

### Cron config

Vercel Hobby plan doesn't support cron jobs, so all four cron definitions (including both CRM crons) currently live only in `vercel.txt` as a backup/reference, **not** in the live `vercel.json`. They need to be manually triggered (`POST` with the `CRON_SECRET` bearer token) until the account is upgraded, at which point `vercel.txt`'s contents should be copied into `vercel.json`.

## Google Cloud Console requirements

- OAuth consent screen scopes must include `gmail.send` and `gmail.readonly`.
- App stays in **Testing** publishing status with `jack@tourbotsai.com` as a listed test user — `gmail.readonly` is a Google-classified *restricted* scope, and CASA security assessment is only required for verified/public apps.
- No Pub/Sub, no domain-wide delegation, no additional redirect URIs — polling needs none of that.
- **Reconnecting is required** any time the requested scope set changes (e.g. after migration 78 added `gmail.readonly`) — an existing refresh token only carries whatever scopes were granted at the time it was issued.

## Required environment variables

```
CRM_GMAIL_CLIENT_ID=
CRM_GMAIL_CLIENT_SECRET=
CRM_GMAIL_REDIRECT_URI=https://<domain>/api/admin/crm/gmail/callback
CRM_GMAIL_TOKEN_ENCRYPTION_KEY=   # 64-char hex string (32 bytes), AES-256-GCM
CRON_SECRET=
```

## Known gaps / explicitly deferred

- **Per-sequence Gmail accounts** — considered, deferred; one global connected account is used for all sequences for now.
- **Open/click tracking** ("eyeball" read icon, link click tracking) — deferred, requires HTML emails, rejected on deliverability grounds for now.
- **Global "Today's Actions" bar** — discussed but not built. The closest equivalent today is the per-sequence "Upcoming Actions" card on each sequence detail page (next 5 incomplete actions, sorted by due date). A cross-sequence version would need a new dashboard-style aggregation across all active sequences.
- **`vercel.json` cron entries** — not live; see "Cron config" above.
