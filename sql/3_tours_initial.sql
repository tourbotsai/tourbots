-- 3_tours_initial.sql
-- Bootstrap tours table for venue-linked Matterport uploads.
-- Run this after 1_users_initial.sql and 2_venues_initial.sql.

create extension if not exists "pgcrypto";

create table if not exists public.tours (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null,
  title text not null,
  description text,
  matterport_tour_id text not null,
  matterport_url text not null,
  thumbnail_url text,
  is_active boolean not null default true,
  view_count integer not null default 0,
  tour_type text not null default 'primary',
  display_order integer not null default 1,
  navigation_keywords text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_tours_tour_type
    check (tour_type in ('primary', 'secondary')),
  constraint fk_tours_venue_id_venues
    foreign key (venue_id) references public.venues(id)
    on delete cascade
);

create index if not exists idx_tours_venue_id on public.tours(venue_id);
create index if not exists idx_tours_venue_active on public.tours(venue_id, is_active);
create index if not exists idx_tours_venue_order on public.tours(venue_id, display_order);
create unique index if not exists idx_tours_matterport_tour_id on public.tours(matterport_tour_id);
create unique index if not exists idx_tours_one_primary_per_venue
  on public.tours(venue_id)
  where tour_type = 'primary';

-- Keep updated_at current on row updates.
create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tours_set_updated_at on public.tours;
create trigger trg_tours_set_updated_at
before update on public.tours
for each row
execute function public.set_updated_at_timestamp();

-- You requested no RLS for now.
alter table public.tours disable row level security;
