-- 50_venue_hide_onboarding_checklist.sql
-- Profile → Display Preferences: hide the dashboard onboarding checklist entirely when true.

alter table public.venues
  add column if not exists hide_onboarding_checklist boolean not null default false;

comment on column public.venues.hide_onboarding_checklist is
  'When true, the dashboard onboarding checklist is not shown (venue preference).';
