-- 10_chatbot_hard_limits_initial.sql
-- Bootstrap hard limit usage tracking + increment function for tour chatbots.
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

create table if not exists public.chatbot_hard_limit_usage (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null,
  chatbot_type text not null default 'tour',

  daily_messages_used integer not null default 0,
  weekly_messages_used integer not null default 0,
  monthly_messages_used integer not null default 0,
  yearly_messages_used integer not null default 0,

  daily_reset_at timestamptz not null default (date_trunc('day', now()) + interval '1 day'),
  weekly_reset_at timestamptz not null default (date_trunc('week', now()) + interval '1 week'),
  monthly_reset_at timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
  yearly_reset_at timestamptz not null default (date_trunc('year', now()) + interval '1 year'),

  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_chatbot_hard_limit_usage_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint chk_chatbot_hard_limit_usage_type_tour_only
    check (chatbot_type = 'tour'),
  constraint chk_chatbot_hard_limit_usage_non_negative
    check (
      daily_messages_used >= 0
      and weekly_messages_used >= 0
      and monthly_messages_used >= 0
      and yearly_messages_used >= 0
    )
);

create unique index if not exists idx_chatbot_hard_limit_usage_venue_type_unique
  on public.chatbot_hard_limit_usage(venue_id, chatbot_type);

create index if not exists idx_chatbot_hard_limit_usage_venue_id
  on public.chatbot_hard_limit_usage(venue_id);

drop trigger if exists trg_chatbot_hard_limit_usage_set_updated_at on public.chatbot_hard_limit_usage;
create trigger trg_chatbot_hard_limit_usage_set_updated_at
before update on public.chatbot_hard_limit_usage
for each row
execute function public.set_updated_at_timestamp();

-- RPC used by hard-limit-service.ts
create or replace function public.increment_hard_limit_usage(
  p_venue_id uuid,
  p_chatbot_type text default 'tour'
)
returns table (
  daily_used integer,
  weekly_used integer,
  monthly_used integer,
  yearly_used integer,
  daily_limit integer,
  weekly_limit integer,
  monthly_limit integer,
  yearly_limit integer,
  limits_enabled boolean
)
language plpgsql
as $$
declare
  v_now timestamptz := now();
  v_limits_enabled boolean;
  v_daily_limit integer;
  v_weekly_limit integer;
  v_monthly_limit integer;
  v_yearly_limit integer;
  v_usage public.chatbot_hard_limit_usage%rowtype;
begin
  if p_chatbot_type <> 'tour' then
    raise exception 'chatbot_type must be tour';
  end if;

  select
    coalesce(c.hard_limits_enabled, false) as hard_limits_enabled,
    coalesce(c.hard_limit_daily_messages, 1000) as hard_limit_daily_messages,
    coalesce(c.hard_limit_weekly_messages, 3000) as hard_limit_weekly_messages,
    coalesce(c.hard_limit_monthly_messages, 10000) as hard_limit_monthly_messages,
    coalesce(c.hard_limit_yearly_messages, 100000) as hard_limit_yearly_messages
  into
    v_limits_enabled,
    v_daily_limit,
    v_weekly_limit,
    v_monthly_limit,
    v_yearly_limit
  from public.chatbot_configs c
  where c.venue_id = p_venue_id
    and c.chatbot_type = p_chatbot_type
  order by c.updated_at desc
  limit 1;

  if not found then
    v_limits_enabled := false;
    v_daily_limit := 1000;
    v_weekly_limit := 3000;
    v_monthly_limit := 10000;
    v_yearly_limit := 100000;
  end if;

  insert into public.chatbot_hard_limit_usage (
    venue_id,
    chatbot_type,
    daily_messages_used,
    weekly_messages_used,
    monthly_messages_used,
    yearly_messages_used,
    daily_reset_at,
    weekly_reset_at,
    monthly_reset_at,
    yearly_reset_at,
    last_message_at
  )
  values (
    p_venue_id,
    p_chatbot_type,
    0,
    0,
    0,
    0,
    date_trunc('day', v_now) + interval '1 day',
    date_trunc('week', v_now) + interval '1 week',
    date_trunc('month', v_now) + interval '1 month',
    date_trunc('year', v_now) + interval '1 year',
    v_now
  )
  on conflict (venue_id, chatbot_type) do nothing;

  update public.chatbot_hard_limit_usage u
  set
    daily_messages_used = case when v_now >= u.daily_reset_at then 1 else u.daily_messages_used + 1 end,
    weekly_messages_used = case when v_now >= u.weekly_reset_at then 1 else u.weekly_messages_used + 1 end,
    monthly_messages_used = case when v_now >= u.monthly_reset_at then 1 else u.monthly_messages_used + 1 end,
    yearly_messages_used = case when v_now >= u.yearly_reset_at then 1 else u.yearly_messages_used + 1 end,
    daily_reset_at = case when v_now >= u.daily_reset_at then date_trunc('day', v_now) + interval '1 day' else u.daily_reset_at end,
    weekly_reset_at = case when v_now >= u.weekly_reset_at then date_trunc('week', v_now) + interval '1 week' else u.weekly_reset_at end,
    monthly_reset_at = case when v_now >= u.monthly_reset_at then date_trunc('month', v_now) + interval '1 month' else u.monthly_reset_at end,
    yearly_reset_at = case when v_now >= u.yearly_reset_at then date_trunc('year', v_now) + interval '1 year' else u.yearly_reset_at end,
    last_message_at = v_now,
    updated_at = v_now
  where u.venue_id = p_venue_id
    and u.chatbot_type = p_chatbot_type
  returning * into v_usage;

  return query
  select
    v_usage.daily_messages_used,
    v_usage.weekly_messages_used,
    v_usage.monthly_messages_used,
    v_usage.yearly_messages_used,
    v_daily_limit,
    v_weekly_limit,
    v_monthly_limit,
    v_yearly_limit,
    v_limits_enabled;
end;
$$;
