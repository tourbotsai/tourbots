-- 68_crm_initial.sql
-- TourBots Admin CRM: companies, notes, activities, and outreach sequences.
--
-- crm_sequence_step_status is NOT the source of truth for activity history —
-- it only drives tick/untick state on the Sequences tab. crm_activities is
-- always the single source of truth for what actually happened (manual logs
-- and sequence-step completions both write there).
--
-- RLS: admin-only tables, no anon/authenticated access — same service-role-only
-- model used by platform_outbound_* and embed_tour_moves.

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

-- --------
-- crm_companies
-- --------

create table if not exists public.crm_companies (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  first_name text,
  last_name text,
  email text,
  phone text,
  region text not null default '',
  notes_summary text,
  source text not null default 'UK VR Tour Prospect List',
  status text not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_crm_companies_company_name_not_blank
    check (length(trim(company_name)) > 0),
  constraint chk_crm_companies_status
    check (status in ('not_started', 'attempted', 'in_sequence', 'interested', 'not_interested', 'dormant'))
);

comment on table public.crm_companies is
  'Outbound CRM prospect companies (contact details, region, source, pipeline status).';

create index if not exists idx_crm_companies_status
  on public.crm_companies (status, created_at desc);

create index if not exists idx_crm_companies_region
  on public.crm_companies (region);

create index if not exists idx_crm_companies_company_name
  on public.crm_companies (company_name);

drop trigger if exists trg_crm_companies_set_updated_at on public.crm_companies;
create trigger trg_crm_companies_set_updated_at
before update on public.crm_companies
for each row
execute function public.set_updated_at_timestamp();

alter table public.crm_companies enable row level security;

drop policy if exists service_role_all_crm_companies on public.crm_companies;
create policy service_role_all_crm_companies
  on public.crm_companies
  for all
  to service_role
  using (true)
  with check (true);

-- --------
-- crm_notes
-- --------

create table if not exists public.crm_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  note_text text not null,
  created_at timestamptz not null default now(),

  constraint fk_crm_notes_company
    foreign key (company_id) references public.crm_companies(id)
    on delete cascade,
  constraint chk_crm_notes_note_text_not_blank
    check (length(trim(note_text)) > 0)
);

create index if not exists idx_crm_notes_company_created
  on public.crm_notes (company_id, created_at desc);

alter table public.crm_notes enable row level security;

drop policy if exists service_role_all_crm_notes on public.crm_notes;
create policy service_role_all_crm_notes
  on public.crm_notes
  for all
  to service_role
  using (true)
  with check (true);

-- --------
-- crm_activities
-- --------

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  activity_type text not null,
  activity_date date not null default current_date,
  activity_time time,
  subject text,
  summary text not null,
  outcome text,
  created_at timestamptz not null default now(),

  constraint fk_crm_activities_company
    foreign key (company_id) references public.crm_companies(id)
    on delete cascade,
  constraint chk_crm_activities_activity_type
    check (activity_type in ('call', 'email'))
);

comment on table public.crm_activities is
  'Single source of truth for CRM activity history — populated by manual logs (company detail view) and by sequence-step completions alike.';

create index if not exists idx_crm_activities_company_date
  on public.crm_activities (company_id, activity_date desc, created_at desc);

alter table public.crm_activities enable row level security;

drop policy if exists service_role_all_crm_activities on public.crm_activities;
create policy service_role_all_crm_activities
  on public.crm_activities
  for all
  to service_role
  using (true)
  with check (true);

-- --------
-- crm_sequences
-- --------

create table if not exists public.crm_sequences (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_crm_sequences_title_not_blank
    check (length(trim(title)) > 0),
  constraint chk_crm_sequences_status
    check (status in ('active', 'paused'))
);

create index if not exists idx_crm_sequences_status
  on public.crm_sequences (status, created_at desc);

drop trigger if exists trg_crm_sequences_set_updated_at on public.crm_sequences;
create trigger trg_crm_sequences_set_updated_at
before update on public.crm_sequences
for each row
execute function public.set_updated_at_timestamp();

alter table public.crm_sequences enable row level security;

drop policy if exists service_role_all_crm_sequences on public.crm_sequences;
create policy service_role_all_crm_sequences
  on public.crm_sequences
  for all
  to service_role
  using (true)
  with check (true);

-- --------
-- crm_sequence_contacts
-- --------

create table if not exists public.crm_sequence_contacts (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null,
  company_id uuid not null,
  added_at timestamptz not null default now(),

  constraint fk_crm_sequence_contacts_sequence
    foreign key (sequence_id) references public.crm_sequences(id)
    on delete cascade,
  constraint fk_crm_sequence_contacts_company
    foreign key (company_id) references public.crm_companies(id)
    on delete cascade
);

create unique index if not exists uq_crm_sequence_contacts_sequence_company
  on public.crm_sequence_contacts (sequence_id, company_id);

create index if not exists idx_crm_sequence_contacts_sequence
  on public.crm_sequence_contacts (sequence_id, added_at desc);

create index if not exists idx_crm_sequence_contacts_company
  on public.crm_sequence_contacts (company_id);

alter table public.crm_sequence_contacts enable row level security;

drop policy if exists service_role_all_crm_sequence_contacts on public.crm_sequence_contacts;
create policy service_role_all_crm_sequence_contacts
  on public.crm_sequence_contacts
  for all
  to service_role
  using (true)
  with check (true);

-- --------
-- crm_sequence_steps
-- --------

create table if not exists public.crm_sequence_steps (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null,
  step_order integer not null,
  title text not null,
  description text,
  scheduled_date date,
  step_type text not null,
  email_subject text,
  email_body text,
  call_script text,
  created_at timestamptz not null default now(),

  constraint fk_crm_sequence_steps_sequence
    foreign key (sequence_id) references public.crm_sequences(id)
    on delete cascade,
  constraint chk_crm_sequence_steps_step_type
    check (step_type in ('email', 'call')),
  constraint chk_crm_sequence_steps_step_order
    check (step_order >= 1)
);

comment on column public.crm_sequence_steps.email_body is
  'Supports {{first_name}}, {{last_name}}, {{company_name}} variables, resolved per-contact on step completion.';

create unique index if not exists uq_crm_sequence_steps_sequence_order
  on public.crm_sequence_steps (sequence_id, step_order);

create index if not exists idx_crm_sequence_steps_sequence
  on public.crm_sequence_steps (sequence_id, step_order);

alter table public.crm_sequence_steps enable row level security;

drop policy if exists service_role_all_crm_sequence_steps on public.crm_sequence_steps;
create policy service_role_all_crm_sequence_steps
  on public.crm_sequence_steps
  for all
  to service_role
  using (true)
  with check (true);

-- --------
-- crm_sequence_step_status
-- --------

create table if not exists public.crm_sequence_step_status (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null,
  company_id uuid not null,
  completed_at timestamptz,

  constraint fk_crm_sequence_step_status_step
    foreign key (step_id) references public.crm_sequence_steps(id)
    on delete cascade,
  constraint fk_crm_sequence_step_status_company
    foreign key (company_id) references public.crm_companies(id)
    on delete cascade
);

comment on table public.crm_sequence_step_status is
  'Drives tick/untick state on the Sequences tab only — NOT the source of truth for activity history. See crm_activities.';

create unique index if not exists uq_crm_sequence_step_status_step_company
  on public.crm_sequence_step_status (step_id, company_id);

create index if not exists idx_crm_sequence_step_status_company
  on public.crm_sequence_step_status (company_id);

alter table public.crm_sequence_step_status enable row level security;

drop policy if exists service_role_all_crm_sequence_step_status on public.crm_sequence_step_status;
create policy service_role_all_crm_sequence_step_status
  on public.crm_sequence_step_status
  for all
  to service_role
  using (true)
  with check (true);
