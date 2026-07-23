-- 78_crm_inbound_email_monitoring.sql
-- Inbound reply detection for the connected CRM Gmail account.
--
-- A polling cron (see app/api/cron/poll-crm-inbound-emails) periodically
-- checks the connected Gmail inbox for new mail using the Gmail History API,
-- matches senders against crm_companies.email, logs a crm_activities row for
-- any match, and auto-stops outreach for that company (reusing the existing
-- stopCrmCompanyOutreach mechanism). No changes to outbound email format —
-- open/click tracking is deliberately out of scope here.

alter table public.crm_gmail_accounts
  add column if not exists last_history_id text;

comment on column public.crm_gmail_accounts.last_history_id is
  'Cursor into the Gmail History API (users.history.list) used by the inbound-poll cron. Null until the first poll bootstraps it via users.getProfile.';

alter table public.crm_sequence_scheduled_emails
  add column if not exists gmail_thread_id text;

comment on column public.crm_sequence_scheduled_emails.gmail_thread_id is
  'Gmail thread ID captured when the email was sent, for a future "view thread in Gmail" link.';

alter table public.crm_activities
  add column if not exists direction text not null default 'outbound';

alter table public.crm_activities
  drop constraint if exists chk_crm_activities_direction;

alter table public.crm_activities
  add constraint chk_crm_activities_direction
    check (direction in ('outbound', 'inbound'));

comment on column public.crm_activities.direction is
  'outbound = something we sent/logged; inbound = a reply we detected from the contact''s email address.';

alter table public.crm_companies
  add column if not exists stopped_reason text;

comment on column public.crm_companies.stopped_reason is
  'Why is_stopped was set — e.g. "manual" (Stop button) or "inbound_reply" (auto-paused after detecting a reply). Null when not stopped.';

-- --------
-- crm_gmail_inbound_messages
-- --------
-- Dedup ledger + audit trail for every inbound message the poller has seen,
-- whether or not it matched a known company. Not surfaced as its own UI page
-- in v1 — matched messages are logged into crm_activities instead, which is
-- what actually shows up on the company timeline.

create table if not exists public.crm_gmail_inbound_messages (
  id uuid primary key default gen_random_uuid(),
  gmail_message_id text not null,
  gmail_thread_id text,
  company_id uuid,
  matched boolean not null default false,
  from_address text not null,
  subject text,
  body_text text,
  received_at timestamptz,
  processed_at timestamptz not null default now(),

  constraint fk_crm_gmail_inbound_messages_company
    foreign key (company_id) references public.crm_companies(id)
    on delete set null
);

comment on table public.crm_gmail_inbound_messages is
  'Every inbound message seen by the poll-crm-inbound-emails cron, matched or not — used purely for idempotency (skip already-processed message IDs) and debugging.';

create unique index if not exists uq_crm_gmail_inbound_messages_gmail_message_id
  on public.crm_gmail_inbound_messages (gmail_message_id);

create index if not exists idx_crm_gmail_inbound_messages_company
  on public.crm_gmail_inbound_messages (company_id);

alter table public.crm_gmail_inbound_messages enable row level security;

drop policy if exists service_role_all_crm_gmail_inbound_messages on public.crm_gmail_inbound_messages;
create policy service_role_all_crm_gmail_inbound_messages
  on public.crm_gmail_inbound_messages
  for all
  to service_role
  using (true)
  with check (true);
