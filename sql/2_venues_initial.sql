-- 2_venues_initial.sql
-- Bootstrap venues table and foreign keys.
-- Run this after 1_users_initial.sql.

create extension if not exists "pgcrypto";

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  website_url text,
  phone text,
  email text,
  address text not null default '',
  city text not null default '',
  postcode text not null default '',
  country text not null default 'UK',
  owner_id uuid,
  subscription_plan text not null default 'essential',
  subscription_status text not null default 'pending',
  stripe_customer_id text,
  theme_preference text not null default 'light',
  is_active boolean not null default true,
  in_setup boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_venues_slug on public.venues(slug);
create index if not exists idx_venues_owner_id on public.venues(owner_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_venues_owner_id_users'
  ) then
    alter table public.venues
      add constraint fk_venues_owner_id_users
      foreign key (owner_id) references public.users(id)
      on delete set null;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_users_venue_id_venues'
  ) then
    alter table public.users
      add constraint fk_users_venue_id_venues
      foreign key (venue_id) references public.venues(id)
      on delete set null;
  end if;
end
$$;
