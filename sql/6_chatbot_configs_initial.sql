-- 6_chatbot_configs_initial.sql
-- Bootstrap chatbot configuration table for one chatbot per tour.
-- Run this after 3_tours_initial.sql.

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

create table if not exists public.chatbot_configs (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null,
  tour_id uuid not null,

  chatbot_type text not null default 'tour',
  chatbot_name text not null default 'Tour Assistant',
  welcome_message text,
  personality_prompt text,
  instruction_prompt text,

  guardrails_enabled boolean not null default false,
  guardrail_prompt text,
  is_active boolean not null default true,

  openai_vector_store_id text,

  hard_limits_enabled boolean not null default false,
  hard_limit_daily_messages integer,
  hard_limit_weekly_messages integer,
  hard_limit_monthly_messages integer,
  hard_limit_yearly_messages integer,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_chatbot_configs_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint fk_chatbot_configs_tour
    foreign key (tour_id) references public.tours(id)
    on delete cascade,

  constraint chk_chatbot_configs_type_tour_only
    check (chatbot_type = 'tour'),
  constraint chk_chatbot_configs_daily_limit
    check (hard_limit_daily_messages is null or hard_limit_daily_messages >= 0),
  constraint chk_chatbot_configs_weekly_limit
    check (hard_limit_weekly_messages is null or hard_limit_weekly_messages >= 0),
  constraint chk_chatbot_configs_monthly_limit
    check (hard_limit_monthly_messages is null or hard_limit_monthly_messages >= 0),
  constraint chk_chatbot_configs_yearly_limit
    check (hard_limit_yearly_messages is null or hard_limit_yearly_messages >= 0)
);

-- One chatbot per tour.
create unique index if not exists idx_chatbot_configs_tour_unique
  on public.chatbot_configs(tour_id);

create index if not exists idx_chatbot_configs_venue_id
  on public.chatbot_configs(venue_id);

drop trigger if exists trg_chatbot_configs_set_updated_at on public.chatbot_configs;
create trigger trg_chatbot_configs_set_updated_at
before update on public.chatbot_configs
for each row
execute function public.set_updated_at_timestamp();

