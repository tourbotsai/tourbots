-- 23_agency_portal_core.sql
-- Core data model for the Agency Portal feature.
-- Run this after 22_agency_portal_addon.sql.

create extension if not exists "pgcrypto";

-- Reuse shared updated_at trigger helper.
create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Per-venue agency portal settings and branding.
create table if not exists public.agency_portal_settings (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null unique,
  is_enabled boolean not null default false,
  agency_name text,
  logo_url text,
  primary_colour text,
  secondary_colour text,
  allowed_domains text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_agency_portal_settings_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint chk_agency_portal_settings_agency_name_not_blank
    check (agency_name is null or length(trim(agency_name)) > 0),
  constraint chk_agency_portal_settings_logo_url_not_blank
    check (logo_url is null or length(trim(logo_url)) > 0),
  constraint chk_agency_portal_settings_primary_colour_hex
    check (primary_colour is null or primary_colour ~ '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'),
  constraint chk_agency_portal_settings_secondary_colour_hex
    check (secondary_colour is null or secondary_colour ~ '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
);

-- Per-tour shared portal surface (slug + enabled modules).
create table if not exists public.agency_portal_shares (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null,
  tour_id uuid not null,
  share_slug text not null unique,
  is_active boolean not null default true,
  enabled_modules jsonb not null default
    '{"settings":true,"customisation":true,"analytics":true,"playground":true}'::jsonb,
  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_agency_portal_shares_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint fk_agency_portal_shares_tour
    foreign key (tour_id) references public.tours(id)
    on delete cascade,
  constraint fk_agency_portal_shares_created_by
    foreign key (created_by_user_id) references public.users(id)
    on delete set null,
  constraint uq_agency_portal_shares_venue_tour
    unique (venue_id, tour_id),
  constraint chk_agency_portal_shares_slug_not_blank
    check (length(trim(share_slug)) >= 3),
  constraint chk_agency_portal_shares_slug_format
    check (share_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- Client users who can sign in to a specific shared portal.
create table if not exists public.agency_portal_users (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null,
  venue_id uuid not null,
  email text not null,
  password_hash text not null,
  display_name text,
  is_active boolean not null default true,
  must_reset_password boolean not null default false,
  last_login_at timestamptz,
  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_agency_portal_users_share
    foreign key (share_id) references public.agency_portal_shares(id)
    on delete cascade,
  constraint fk_agency_portal_users_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint fk_agency_portal_users_created_by
    foreign key (created_by_user_id) references public.users(id)
    on delete set null,
  constraint chk_agency_portal_users_email_not_blank
    check (length(trim(email)) > 0),
  constraint chk_agency_portal_users_email_format
    check (position('@' in email) > 1),
  constraint chk_agency_portal_users_password_hash_not_blank
    check (length(trim(password_hash)) > 0)
);

-- Session storage for authenticated agency portal users.
create table if not exists public.agency_portal_sessions (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null,
  user_id uuid not null,
  venue_id uuid not null,
  session_token_hash text not null unique,
  csrf_token_hash text,
  ip_address inet,
  user_agent text,
  expires_at timestamptz not null,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),

  constraint fk_agency_portal_sessions_share
    foreign key (share_id) references public.agency_portal_shares(id)
    on delete cascade,
  constraint fk_agency_portal_sessions_user
    foreign key (user_id) references public.agency_portal_users(id)
    on delete cascade,
  constraint fk_agency_portal_sessions_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint chk_agency_portal_sessions_token_not_blank
    check (length(trim(session_token_hash)) > 0),
  constraint chk_agency_portal_sessions_expiry_future_window
    check (expires_at > created_at)
);

create unique index if not exists uq_agency_portal_users_share_email_lower
  on public.agency_portal_users (share_id, lower(email));

create index if not exists idx_agency_portal_shares_venue_active
  on public.agency_portal_shares (venue_id, is_active, created_at desc);

create index if not exists idx_agency_portal_shares_slug
  on public.agency_portal_shares (share_slug);

create index if not exists idx_agency_portal_users_share_active
  on public.agency_portal_users (share_id, is_active, created_at desc);

create index if not exists idx_agency_portal_users_venue
  on public.agency_portal_users (venue_id, created_at desc);

create index if not exists idx_agency_portal_sessions_user_expiry
  on public.agency_portal_sessions (user_id, expires_at desc);

create index if not exists idx_agency_portal_sessions_share_expiry
  on public.agency_portal_sessions (share_id, expires_at desc);

create index if not exists idx_agency_portal_sessions_expiry
  on public.agency_portal_sessions (expires_at asc);

drop trigger if exists trg_agency_portal_settings_set_updated_at on public.agency_portal_settings;
create trigger trg_agency_portal_settings_set_updated_at
before update on public.agency_portal_settings
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_agency_portal_shares_set_updated_at on public.agency_portal_shares;
create trigger trg_agency_portal_shares_set_updated_at
before update on public.agency_portal_shares
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_agency_portal_users_set_updated_at on public.agency_portal_users;
create trigger trg_agency_portal_users_set_updated_at
before update on public.agency_portal_users
for each row
execute function public.set_updated_at_timestamp();

