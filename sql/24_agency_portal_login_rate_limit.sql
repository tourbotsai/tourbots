-- 24_agency_portal_login_rate_limit.sql
-- Rate-limit support table for agency portal login attempts.

create table if not exists public.agency_portal_login_attempts (
  id uuid primary key default gen_random_uuid(),
  share_slug text not null,
  email text not null,
  ip_address inet,
  attempted_at timestamptz not null default now(),
  success boolean not null default false,
  constraint chk_agency_portal_login_attempts_share_slug_not_blank
    check (length(trim(share_slug)) > 0),
  constraint chk_agency_portal_login_attempts_email_not_blank
    check (length(trim(email)) > 0)
);

create index if not exists idx_agency_portal_login_attempts_identity_time
  on public.agency_portal_login_attempts (share_slug, lower(email), attempted_at desc);

create index if not exists idx_agency_portal_login_attempts_ip_time
  on public.agency_portal_login_attempts (ip_address, attempted_at desc);

create index if not exists idx_agency_portal_login_attempts_attempted_at
  on public.agency_portal_login_attempts (attempted_at desc);
