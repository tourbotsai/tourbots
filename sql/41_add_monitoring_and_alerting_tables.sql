-- 41_add_monitoring_and_alerting_tables.sql
-- Baseline observability tables for API errors, cron runs, and webhook processing.

create table if not exists public.api_error_events (
  id uuid primary key default gen_random_uuid(),
  route text not null,
  method text not null,
  status_code integer not null check (status_code >= 500 and status_code <= 599),
  error_message text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_error_events_created_at
  on public.api_error_events (created_at desc);

create index if not exists idx_api_error_events_route_created_at
  on public.api_error_events (route, created_at desc);

alter table public.api_error_events enable row level security;


create table if not exists public.cron_job_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  trigger_source text not null check (trigger_source in ('vercel_cron', 'manual', 'unknown')),
  status text not null check (status in ('started', 'success', 'partial', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms integer,
  processed_count integer not null default 0,
  success_count integer not null default 0,
  failed_count integer not null default 0,
  error_message text,
  error_details jsonb not null default '{}'::jsonb,
  context jsonb not null default '{}'::jsonb
);

create index if not exists idx_cron_job_runs_job_started_at
  on public.cron_job_runs (job_name, started_at desc);

create index if not exists idx_cron_job_runs_status_started_at
  on public.cron_job_runs (status, started_at desc);

alter table public.cron_job_runs enable row level security;


create table if not exists public.webhook_event_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  status text not null check (status in ('received', 'processed', 'failed', 'ignored')),
  attempt_count integer not null default 1,
  http_status integer,
  error_message text,
  context jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create unique index if not exists idx_webhook_event_runs_provider_event_id
  on public.webhook_event_runs (provider, event_id);

create index if not exists idx_webhook_event_runs_status_received_at
  on public.webhook_event_runs (status, received_at desc);

alter table public.webhook_event_runs enable row level security;
