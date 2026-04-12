-- 26_user_venue_access_initial.sql
-- Bootstrap user_venue_access for multi-user team access per venue.
-- Run this after 2_venues_initial.sql.

create extension if not exists "pgcrypto";

create table if not exists public.user_venue_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  venue_id uuid not null,
  role text not null default 'admin',
  created_by uuid,
  created_at timestamptz not null default now(),

  constraint chk_user_venue_access_role
    check (role in ('owner', 'admin', 'manager', 'viewer')),
  constraint uq_user_venue_access_user_venue
    unique (user_id, venue_id),
  constraint fk_user_venue_access_user
    foreign key (user_id) references public.users(id)
      on delete cascade,
  constraint fk_user_venue_access_venue
    foreign key (venue_id) references public.venues(id)
      on delete cascade,
  constraint fk_user_venue_access_created_by
    foreign key (created_by) references public.users(id)
      on delete set null
);

create index if not exists idx_user_venue_access_user_id
  on public.user_venue_access(user_id);

create index if not exists idx_user_venue_access_venue_id
  on public.user_venue_access(venue_id);

create index if not exists idx_user_venue_access_venue_role
  on public.user_venue_access(venue_id, role);

-- Backfill access rows for all existing users linked to a venue.
insert into public.user_venue_access (user_id, venue_id, role, created_by)
select
  u.id as user_id,
  u.venue_id as venue_id,
  case
    when v.owner_id = u.id then 'owner'
    else 'admin'
  end as role,
  v.owner_id as created_by
from public.users u
join public.venues v on v.id = u.venue_id
where u.venue_id is not null
on conflict (user_id, venue_id) do nothing;
