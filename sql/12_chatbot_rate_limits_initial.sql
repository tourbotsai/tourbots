-- 12_chatbot_rate_limits_initial.sql
-- Bootstrap rate limiting support for tour chatbots.
-- Run this after 6_chatbot_configs_initial.sql.

create extension if not exists "pgcrypto";

-- Shared updated_at trigger function (safe to reuse).
create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add missing rate limit config columns to chatbot_configs (safe for existing table).
alter table public.chatbot_configs
  add column if not exists rate_limit_requests_per_minute integer,
  add column if not exists rate_limit_requests_per_hour integer,
  add column if not exists rate_limit_requests_per_day integer,
  add column if not exists rate_limit_requests_per_week integer,
  add column if not exists rate_limit_requests_per_month integer,
  add column if not exists rate_limit_burst_limit integer,
  add column if not exists enable_rate_limiting boolean;

-- Apply defaults for new setups while preserving any existing values.
update public.chatbot_configs
set
  rate_limit_requests_per_minute = coalesce(rate_limit_requests_per_minute, 30),
  rate_limit_requests_per_hour = coalesce(rate_limit_requests_per_hour, 100),
  rate_limit_requests_per_day = coalesce(rate_limit_requests_per_day, 500),
  rate_limit_requests_per_week = coalesce(rate_limit_requests_per_week, 2000),
  rate_limit_requests_per_month = coalesce(rate_limit_requests_per_month, 8000),
  rate_limit_burst_limit = coalesce(rate_limit_burst_limit, 10),
  enable_rate_limiting = coalesce(enable_rate_limiting, true);

-- Request log table used by lib/rate-limiter.ts
create table if not exists public.rate_limit_logs (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null,
  chatbot_type text not null default 'tour',
  ip_address text not null,
  window_start timestamptz not null,
  requests_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_rate_limit_logs_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint chk_rate_limit_logs_type_tour_only
    check (chatbot_type = 'tour'),
  constraint chk_rate_limit_logs_requests_non_negative
    check (requests_count >= 0)
);

create unique index if not exists idx_rate_limit_logs_unique_window
  on public.rate_limit_logs(venue_id, chatbot_type, ip_address, window_start);

create index if not exists idx_rate_limit_logs_lookup
  on public.rate_limit_logs(venue_id, chatbot_type, ip_address, window_start);

drop trigger if exists trg_rate_limit_logs_set_updated_at on public.rate_limit_logs;
create trigger trg_rate_limit_logs_set_updated_at
before update on public.rate_limit_logs
for each row
execute function public.set_updated_at_timestamp();

-- RPC used by lib/rate-limiter.ts
create or replace function public.increment_rate_limit_count(
  p_venue_id uuid,
  p_chatbot_type text,
  p_ip_address text,
  p_window_start timestamptz
)
returns void
language plpgsql
as $$
begin
  if p_chatbot_type <> 'tour' then
    raise exception 'chatbot_type must be tour';
  end if;

  insert into public.rate_limit_logs (
    venue_id,
    chatbot_type,
    ip_address,
    window_start,
    requests_count
  )
  values (
    p_venue_id,
    p_chatbot_type,
    p_ip_address,
    p_window_start,
    1
  )
  on conflict (venue_id, chatbot_type, ip_address, window_start)
  do update
  set
    requests_count = public.rate_limit_logs.requests_count + 1,
    updated_at = now();
end;
$$;
