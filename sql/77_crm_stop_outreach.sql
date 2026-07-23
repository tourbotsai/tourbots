-- 77_crm_stop_outreach.sql
-- Adds a cross-sequence "stop outreach" flag to crm_companies.
--
-- This is deliberately separate from the existing `status` column (which
-- represents the sales outcome — not_started / attempted / in_sequence /
-- interested / not_interested / dormant). Stopping a company is an
-- independent, reversible action: it blocks automated sends and flags the
-- contact as "do not call" everywhere they appear, without throwing away
-- whatever status they were already in.
--
-- Because the flag lives on crm_companies rather than crm_sequence_contacts,
-- it automatically applies across every sequence the company is enrolled in.

alter table public.crm_companies
  add column if not exists is_stopped boolean not null default false,
  add column if not exists stopped_at timestamptz;

comment on column public.crm_companies.is_stopped is
  'When true, all automated sends are blocked and the contact is flagged as "do not call" in every sequence they belong to. Independent of the sales-outcome status column.';

create index if not exists idx_crm_companies_is_stopped
  on public.crm_companies (is_stopped)
  where is_stopped;
