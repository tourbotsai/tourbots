-- 30_platform_outbound_sequences_initial.sql
-- Platform outbound automated email sequences.
-- Run this after 27_platform_outbound_leads_initial.sql.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.platform_outbound_sequences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_outbound_sequence_steps (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null,
  step_number integer not null,
  scheduled_date date not null,
  scheduled_time time not null,
  scheduled_timezone text not null default 'Europe/London',
  email_subject text not null,
  email_body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_outbound_sequence_enrollments (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null,
  lead_id uuid not null,
  status text not null default 'active',
  current_step integer not null default 1,
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  stopped_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_outbound_sequence_emails (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null,
  enrollment_id uuid not null,
  step_id uuid not null,
  lead_id uuid not null,
  email_to text not null,
  email_subject text not null,
  email_body text not null,
  scheduled_for timestamptz not null,
  status text not null default 'scheduled',
  resend_message_id text,
  sent_at timestamptz,
  error_message text,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_platform_outbound_sequences_active
  on public.platform_outbound_sequences(is_active, created_at desc);

create index if not exists idx_platform_outbound_sequence_steps_sequence
  on public.platform_outbound_sequence_steps(sequence_id, step_number);

create index if not exists idx_platform_outbound_sequence_enrollments_sequence_status
  on public.platform_outbound_sequence_enrollments(sequence_id, status, enrolled_at desc);

create index if not exists idx_platform_outbound_sequence_enrollments_lead
  on public.platform_outbound_sequence_enrollments(lead_id, status, enrolled_at desc);

create index if not exists idx_platform_outbound_sequence_emails_schedule_status
  on public.platform_outbound_sequence_emails(status, scheduled_for asc);

create index if not exists idx_platform_outbound_sequence_emails_sequence
  on public.platform_outbound_sequence_emails(sequence_id, created_at desc);

create index if not exists idx_platform_outbound_sequence_emails_enrollment
  on public.platform_outbound_sequence_emails(enrollment_id, created_at desc);

drop trigger if exists trg_platform_outbound_sequences_set_updated_at on public.platform_outbound_sequences;
create trigger trg_platform_outbound_sequences_set_updated_at
before update on public.platform_outbound_sequences
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_platform_outbound_sequence_steps_set_updated_at on public.platform_outbound_sequence_steps;
create trigger trg_platform_outbound_sequence_steps_set_updated_at
before update on public.platform_outbound_sequence_steps
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_platform_outbound_sequence_enrollments_set_updated_at on public.platform_outbound_sequence_enrollments;
create trigger trg_platform_outbound_sequence_enrollments_set_updated_at
before update on public.platform_outbound_sequence_enrollments
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_platform_outbound_sequence_emails_set_updated_at on public.platform_outbound_sequence_emails;
create trigger trg_platform_outbound_sequence_emails_set_updated_at
before update on public.platform_outbound_sequence_emails
for each row
execute function public.set_updated_at_timestamp();
