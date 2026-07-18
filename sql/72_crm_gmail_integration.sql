-- 72_crm_gmail_integration.sql
-- Real Gmail/Workspace sending for CRM sequence emails.
--
-- crm_gmail_accounts: the single connected Gmail/Workspace account used to send
-- CRM sequence emails. Tokens are encrypted at rest (see crm-gmail-service.ts) —
-- this table stores ciphertext only, never a plaintext token.
--
-- crm_sequence_scheduled_emails: one row per (email step, company) pair. Created
-- automatically when a step is added to a sequence, or a contact is added to a
-- sequence, defaulting scheduled_for to the step's scheduled_date + scheduled_time
-- (interpreted as Europe/London local time). Per-contact overrides just update
-- scheduled_for on the existing row. Processed by a cron job that claims due rows
-- atomically (same pattern as claim_platform_outbound_sequence_emails).

create table if not exists public.crm_gmail_accounts (
  id uuid primary key default gen_random_uuid(),
  email_address text not null,
  display_name text,
  refresh_token_encrypted text not null,
  access_token_encrypted text,
  access_token_expires_at timestamptz,
  status text not null default 'active',
  connected_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_crm_gmail_accounts_status
    check (status in ('active', 'revoked'))
);

comment on table public.crm_gmail_accounts is
  'The connected Gmail/Workspace account used to send CRM sequence emails. V1 supports a single active account.';

create unique index if not exists uq_crm_gmail_accounts_email
  on public.crm_gmail_accounts (email_address);

drop trigger if exists trg_crm_gmail_accounts_set_updated_at on public.crm_gmail_accounts;
create trigger trg_crm_gmail_accounts_set_updated_at
before update on public.crm_gmail_accounts
for each row
execute function public.set_updated_at_timestamp();

alter table public.crm_gmail_accounts enable row level security;

drop policy if exists service_role_all_crm_gmail_accounts on public.crm_gmail_accounts;
create policy service_role_all_crm_gmail_accounts
  on public.crm_gmail_accounts
  for all
  to service_role
  using (true)
  with check (true);

-- --------
-- crm_sequence_scheduled_emails
-- --------

create table if not exists public.crm_sequence_scheduled_emails (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null,
  company_id uuid not null,
  scheduled_for timestamptz not null,
  status text not null default 'scheduled',
  attempts integer not null default 0,
  error_message text,
  gmail_message_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_crm_scheduled_emails_step
    foreign key (step_id) references public.crm_sequence_steps(id)
    on delete cascade,
  constraint fk_crm_scheduled_emails_company
    foreign key (company_id) references public.crm_companies(id)
    on delete cascade,
  constraint chk_crm_scheduled_emails_status
    check (status in ('scheduled', 'processing', 'sent', 'failed', 'cancelled'))
);

comment on table public.crm_sequence_scheduled_emails is
  'Queue of CRM sequence emails to send via the connected Gmail account, one row per (step, company). Processed by the send-crm-sequence-emails cron.';

create unique index if not exists uq_crm_scheduled_emails_step_company
  on public.crm_sequence_scheduled_emails (step_id, company_id);

create index if not exists idx_crm_scheduled_emails_status_due
  on public.crm_sequence_scheduled_emails (status, scheduled_for);

create index if not exists idx_crm_scheduled_emails_company
  on public.crm_sequence_scheduled_emails (company_id);

drop trigger if exists trg_crm_scheduled_emails_set_updated_at on public.crm_sequence_scheduled_emails;
create trigger trg_crm_scheduled_emails_set_updated_at
before update on public.crm_sequence_scheduled_emails
for each row
execute function public.set_updated_at_timestamp();

alter table public.crm_sequence_scheduled_emails enable row level security;

drop policy if exists service_role_all_crm_scheduled_emails on public.crm_sequence_scheduled_emails;
create policy service_role_all_crm_scheduled_emails
  on public.crm_sequence_scheduled_emails
  for all
  to service_role
  using (true)
  with check (true);

-- --------
-- Helpers
-- --------

-- Combines a step's scheduled_date + scheduled_time as Europe/London local time
-- and returns the equivalent timestamptz (UTC under the hood). Falls back to
-- 09:00 local if no time is set, and returns null if there's no date at all
-- (nothing to schedule).
create or replace function public.crm_compute_scheduled_for(p_date date, p_time time)
returns timestamptz
language sql
immutable
as $$
  select case
    when p_date is null then null
    else (p_date + coalesce(p_time, time '09:00')) at time zone 'Europe/London'
  end;
$$;

-- Ensures a scheduled_emails row exists for every contact currently enrolled in
-- an email step's sequence. Safe to call repeatedly — never overwrites an
-- existing (step, company) row, so per-contact time overrides are preserved.
create or replace function public.crm_sync_scheduled_emails_for_step(p_step_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.crm_sequence_scheduled_emails (step_id, company_id, scheduled_for)
  select st.id, sc.company_id, public.crm_compute_scheduled_for(st.scheduled_date, st.scheduled_time)
  from public.crm_sequence_steps st
  join public.crm_sequence_contacts sc on sc.sequence_id = st.sequence_id
  where st.id = p_step_id
    and st.step_type = 'email'
    and st.scheduled_date is not null
  on conflict (step_id, company_id) do nothing;
end;
$$;

-- Ensures a scheduled_emails row exists for every email step in a sequence for
-- one newly-added contact. Same conflict-safe behaviour as above.
create or replace function public.crm_sync_scheduled_emails_for_contact(p_sequence_id uuid, p_company_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.crm_sequence_scheduled_emails (step_id, company_id, scheduled_for)
  select st.id, p_company_id, public.crm_compute_scheduled_for(st.scheduled_date, st.scheduled_time)
  from public.crm_sequence_steps st
  where st.sequence_id = p_sequence_id
    and st.step_type = 'email'
    and st.scheduled_date is not null
  on conflict (step_id, company_id) do nothing;
end;
$$;

-- Atomic claiming for cron processing — mirrors claim_platform_outbound_sequence_emails
-- (31_platform_outbound_sequences_cron_claiming.sql). Reclaims anything stuck in
-- 'processing' for more than 10 minutes (e.g. a crashed function invocation).
create or replace function public.claim_crm_sequence_scheduled_emails(
  p_now timestamptz default now(),
  p_limit integer default 25
)
returns setof public.crm_sequence_scheduled_emails
language plpgsql
security definer
as $$
begin
  return query
  with claimable as (
    select e.id
    from public.crm_sequence_scheduled_emails e
    where
      (
        e.status = 'scheduled'
        and e.scheduled_for <= p_now
      )
      or (
        e.status = 'processing'
        and e.updated_at < (p_now - interval '10 minutes')
      )
    order by e.scheduled_for asc
    for update skip locked
    limit greatest(coalesce(p_limit, 25), 1)
  )
  update public.crm_sequence_scheduled_emails as target
  set
    status = 'processing',
    updated_at = now()
  from claimable
  where target.id = claimable.id
  returning target.*;
end;
$$;
