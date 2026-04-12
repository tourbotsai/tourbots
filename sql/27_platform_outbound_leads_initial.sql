-- 27_platform_outbound_leads_initial.sql
-- Platform admin outbound lead database and note history.
-- Run this after 1_users_initial.sql.

create extension if not exists "pgcrypto";

-- Reuse shared updated_at helper across tables.
create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.platform_outbound_leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  website text,
  lead_source text,
  lead_status text not null default 'new',
  priority text not null default 'medium',
  notes_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_outbound_lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null,
  note text not null,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_outbound_leads_created_at
  on public.platform_outbound_leads(created_at desc);

create index if not exists idx_platform_outbound_leads_status_priority
  on public.platform_outbound_leads(lead_status, priority, created_at desc);

create index if not exists idx_platform_outbound_leads_company_name
  on public.platform_outbound_leads(company_name);

create index if not exists idx_platform_outbound_lead_notes_lead_created_at
  on public.platform_outbound_lead_notes(lead_id, created_at desc);

drop trigger if exists trg_platform_outbound_leads_set_updated_at on public.platform_outbound_leads;
create trigger trg_platform_outbound_leads_set_updated_at
before update on public.platform_outbound_leads
for each row
execute function public.set_updated_at_timestamp();
