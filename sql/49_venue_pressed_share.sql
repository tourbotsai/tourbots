-- 49_venue_pressed_share.sql
-- Persist onboarding "Share" step: set when the venue copies the simple iframe embed code.

alter table public.venues
  add column if not exists pressed_share boolean not null default false;

comment on column public.venues.pressed_share is
  'True after the venue has copied the simple iframe embed from Share & Embed (onboarding checklist).';
