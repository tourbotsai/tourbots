-- 85_website_chatbots.sql
-- Allow tour-free website chatbots (chatbot_type = 'website', tour_id null).
-- Each website chatbot consumes one billing bot (same pool as primary tours).
-- Agency portal shares may point at a website chatbot via chatbot_config_id.
-- Run after 84_custom_action_signing_secret.sql.

begin;

-- ---------------------------------------------------------------------------
-- chatbot_configs: nullable tour_id + website type
-- ---------------------------------------------------------------------------
alter table public.chatbot_configs
  alter column tour_id drop not null;

alter table public.chatbot_configs
  drop constraint if exists chk_chatbot_configs_type_tour_only;

alter table public.chatbot_configs
  drop constraint if exists chk_chatbot_configs_type_allowed;

alter table public.chatbot_configs
  add constraint chk_chatbot_configs_type_allowed
    check (chatbot_type in ('tour', 'website'));

alter table public.chatbot_configs
  drop constraint if exists chk_chatbot_configs_tour_id_by_type;

alter table public.chatbot_configs
  add constraint chk_chatbot_configs_tour_id_by_type
    check (
      (chatbot_type = 'tour' and tour_id is not null)
      or (chatbot_type = 'website' and tour_id is null)
    );

drop index if exists public.idx_chatbot_configs_tour_unique;
create unique index idx_chatbot_configs_tour_unique
  on public.chatbot_configs(tour_id)
  where tour_id is not null;

-- ---------------------------------------------------------------------------
-- Dependent tables: allow website type + nullable tour_id
-- ---------------------------------------------------------------------------
alter table public.chatbot_documents
  alter column tour_id drop not null;

alter table public.chatbot_triggers
  alter column tour_id drop not null;

alter table public.chatbot_hard_limit_usage
  alter column tour_id drop not null;

alter table public.chatbot_hard_limit_usage
  drop constraint if exists chk_chatbot_hard_limit_usage_type_tour_only;

alter table public.chatbot_hard_limit_usage
  add constraint chk_chatbot_hard_limit_usage_type_allowed
    check (chatbot_type in ('tour', 'website'));

alter table public.chatbot_hard_limit_usage
  add column if not exists chatbot_config_id uuid;

alter table public.chatbot_hard_limit_usage
  drop constraint if exists fk_chatbot_hard_limit_usage_config;

alter table public.chatbot_hard_limit_usage
  add constraint fk_chatbot_hard_limit_usage_config
    foreign key (chatbot_config_id) references public.chatbot_configs(id)
    on delete cascade;

drop index if exists public.idx_chatbot_hard_limit_usage_venue_type_tour_unique;
create unique index idx_chatbot_hard_limit_usage_venue_type_tour_unique
  on public.chatbot_hard_limit_usage(venue_id, chatbot_type, tour_id)
  where tour_id is not null;

create unique index if not exists idx_chatbot_hard_limit_usage_venue_website_config_unique
  on public.chatbot_hard_limit_usage(venue_id, chatbot_type, chatbot_config_id)
  where tour_id is null and chatbot_config_id is not null;

alter table public.chatbot_customisations
  drop constraint if exists chk_chatbot_customisations_type_tour_only;

alter table public.chatbot_customisations
  add constraint chk_chatbot_customisations_type_allowed
    check (chatbot_type in ('tour', 'website'));

alter table public.chatbot_customisations
  add column if not exists chatbot_config_id uuid;

alter table public.chatbot_customisations
  drop constraint if exists fk_chatbot_customisations_config;

alter table public.chatbot_customisations
  add constraint fk_chatbot_customisations_config
    foreign key (chatbot_config_id) references public.chatbot_configs(id)
    on delete cascade;

drop index if exists public.idx_chatbot_customisations_tour_unique;
create unique index idx_chatbot_customisations_tour_unique
  on public.chatbot_customisations(venue_id, tour_id, chatbot_type)
  where tour_id is not null;

create unique index if not exists idx_chatbot_customisations_website_config_unique
  on public.chatbot_customisations(chatbot_config_id)
  where chatbot_config_id is not null and tour_id is null;

alter table public.rate_limit_logs
  drop constraint if exists chk_rate_limit_logs_type_tour_only;

alter table public.rate_limit_logs
  add constraint chk_rate_limit_logs_type_allowed
    check (chatbot_type in ('tour', 'website'));

alter table public.conversations
  drop constraint if exists chk_conversations_chatbot_type_tour_only;

alter table public.conversations
  add constraint chk_conversations_chatbot_type_allowed
    check (chatbot_type in ('tour', 'website'));

alter table public.embed_stats
  drop constraint if exists chk_embed_stats_chatbot_type;

alter table public.embed_stats
  add constraint chk_embed_stats_chatbot_type
    check (chatbot_type is null or chatbot_type in ('tour', 'website'));

-- ---------------------------------------------------------------------------
-- agency_portal_shares: tour OR website chatbot
-- ---------------------------------------------------------------------------
alter table public.agency_portal_shares
  alter column tour_id drop not null;

alter table public.agency_portal_shares
  add column if not exists chatbot_config_id uuid;

alter table public.agency_portal_shares
  drop constraint if exists uq_agency_portal_shares_venue_tour;

alter table public.agency_portal_shares
  drop constraint if exists fk_agency_portal_shares_tour;

alter table public.agency_portal_shares
  add constraint fk_agency_portal_shares_tour
    foreign key (tour_id) references public.tours(id)
    on delete cascade;

alter table public.agency_portal_shares
  drop constraint if exists fk_agency_portal_shares_chatbot_config;

alter table public.agency_portal_shares
  add constraint fk_agency_portal_shares_chatbot_config
    foreign key (chatbot_config_id) references public.chatbot_configs(id)
    on delete cascade;

alter table public.agency_portal_shares
  drop constraint if exists chk_agency_portal_shares_tour_or_config;

alter table public.agency_portal_shares
  add constraint chk_agency_portal_shares_tour_or_config
    check (
      (tour_id is not null and chatbot_config_id is null)
      or (tour_id is null and chatbot_config_id is not null)
    );

create unique index if not exists uq_agency_portal_shares_venue_tour
  on public.agency_portal_shares(venue_id, tour_id)
  where tour_id is not null;

create unique index if not exists uq_agency_portal_shares_venue_config
  on public.agency_portal_shares(venue_id, chatbot_config_id)
  where chatbot_config_id is not null;

-- ---------------------------------------------------------------------------
-- RLS: allow public reads for active website chatbots
-- ---------------------------------------------------------------------------
drop policy if exists anon_read_active_chatbot_configs on public.chatbot_configs;
create policy anon_read_active_chatbot_configs
  on public.chatbot_configs
  for select
  to anon, authenticated
  using (
    is_active = true
    and chatbot_type in ('tour', 'website')
    and (
      (chatbot_type = 'website' and tour_id is null)
      or exists (
        select 1
        from public.tours t
        where t.id = chatbot_configs.tour_id
          and t.is_active = true
      )
    )
  );

drop policy if exists anon_read_active_chatbot_customisations on public.chatbot_customisations;
create policy anon_read_active_chatbot_customisations
  on public.chatbot_customisations
  for select
  to anon, authenticated
  using (
    is_active = true
    and chatbot_type in ('tour', 'website')
    and (
      (chatbot_type = 'website' and tour_id is null)
      or exists (
        select 1
        from public.tours t
        where t.id = chatbot_customisations.tour_id
          and t.is_active = true
      )
    )
  );

drop policy if exists anon_read_active_chatbot_triggers on public.chatbot_triggers;
create policy anon_read_active_chatbot_triggers
  on public.chatbot_triggers
  for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1
      from public.chatbot_configs c
      left join public.tours t on t.id = c.tour_id
      where c.id = chatbot_triggers.chatbot_config_id
        and c.is_active = true
        and (
          (c.chatbot_type = 'website' and c.tour_id is null)
          or (t.id is not null and t.is_active = true)
        )
    )
  );

drop policy if exists anon_read_active_chatbot_info_sections on public.chatbot_info_sections;
create policy anon_read_active_chatbot_info_sections
  on public.chatbot_info_sections
  for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1
      from public.chatbot_configs c
      left join public.tours t on t.id = c.tour_id
      where c.id = chatbot_info_sections.chatbot_config_id
        and c.is_active = true
        and (
          (c.chatbot_type = 'website' and c.tour_id is null)
          or (t.id is not null and t.is_active = true)
        )
    )
  );

drop policy if exists anon_read_active_chatbot_info_fields on public.chatbot_info_fields;
create policy anon_read_active_chatbot_info_fields
  on public.chatbot_info_fields
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.chatbot_info_sections s
      join public.chatbot_configs c on c.id = s.chatbot_config_id
      left join public.tours t on t.id = c.tour_id
      where s.id = chatbot_info_fields.section_id
        and s.is_active = true
        and c.is_active = true
        and (
          (c.chatbot_type = 'website' and c.tour_id is null)
          or (t.id is not null and t.is_active = true)
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Rate limit RPC
-- ---------------------------------------------------------------------------
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
  if p_chatbot_type not in ('tour', 'website') then
    raise exception 'chatbot_type must be tour or website';
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

-- ---------------------------------------------------------------------------
-- Hard limit RPC (tour or website)
-- Signature extended with optional chatbot_config_id for website bots.
-- ---------------------------------------------------------------------------
drop function if exists public.increment_hard_limit_usage(uuid, text, uuid);

create or replace function public.increment_hard_limit_usage(
  p_venue_id uuid,
  p_chatbot_type text default 'tour',
  p_tour_id uuid default null,
  p_chatbot_config_id uuid default null
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
  v_selected_tour_id uuid := p_tour_id;
  v_config_id uuid := p_chatbot_config_id;
  v_limits_enabled boolean := false;
  v_daily_limit integer := 1000;
  v_weekly_limit integer := 3000;
  v_monthly_limit integer := 10000;
  v_yearly_limit integer := 100000;
  v_usage public.chatbot_hard_limit_usage%rowtype;
begin
  if p_chatbot_type not in ('tour', 'website') then
    raise exception 'chatbot_type must be tour or website';
  end if;

  if p_chatbot_type = 'website' then
    if v_config_id is null then
      raise exception 'chatbot_config_id is required for website chatbots';
    end if;

    select
      coalesce(c.hard_limits_enabled, false),
      coalesce(c.hard_limit_daily_messages, 1000),
      coalesce(c.hard_limit_weekly_messages, 3000),
      coalesce(c.hard_limit_monthly_messages, 10000),
      coalesce(c.hard_limit_yearly_messages, 100000)
    into
      v_limits_enabled,
      v_daily_limit,
      v_weekly_limit,
      v_monthly_limit,
      v_yearly_limit
    from public.chatbot_configs c
    where c.id = v_config_id
      and c.venue_id = p_venue_id
      and c.chatbot_type = 'website'
    limit 1;

    insert into public.chatbot_hard_limit_usage (
      venue_id,
      chatbot_type,
      tour_id,
      chatbot_config_id,
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
      'website',
      null,
      v_config_id,
      0, 0, 0, 0,
      date_trunc('day', v_now) + interval '1 day',
      date_trunc('week', v_now) + interval '1 week',
      date_trunc('month', v_now) + interval '1 month',
      date_trunc('year', v_now) + interval '1 year',
      v_now
    )
    on conflict (venue_id, chatbot_type, chatbot_config_id)
      where tour_id is null and chatbot_config_id is not null
    do nothing;

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
      and u.chatbot_type = 'website'
      and u.chatbot_config_id = v_config_id
    returning * into v_usage;

  else
    -- tour path
    if v_selected_tour_id is null then
      select t.id
      into v_selected_tour_id
      from public.tours t
      where t.venue_id = p_venue_id
        and t.is_active = true
      order by
        case when t.tour_type = 'primary' then 0 else 1 end,
        t.display_order asc,
        t.created_at asc
      limit 1;
    end if;

    if v_selected_tour_id is null then
      raise exception 'No active tour found for venue %', p_venue_id;
    end if;

    select
      coalesce(c.hard_limits_enabled, false),
      coalesce(c.hard_limit_daily_messages, 1000),
      coalesce(c.hard_limit_weekly_messages, 3000),
      coalesce(c.hard_limit_monthly_messages, 10000),
      coalesce(c.hard_limit_yearly_messages, 100000)
    into
      v_limits_enabled,
      v_daily_limit,
      v_weekly_limit,
      v_monthly_limit,
      v_yearly_limit
    from public.chatbot_configs c
    where c.venue_id = p_venue_id
      and c.chatbot_type = 'tour'
      and c.tour_id = v_selected_tour_id
    limit 1;

    insert into public.chatbot_hard_limit_usage (
      venue_id,
      chatbot_type,
      tour_id,
      chatbot_config_id,
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
      'tour',
      v_selected_tour_id,
      null,
      0, 0, 0, 0,
      date_trunc('day', v_now) + interval '1 day',
      date_trunc('week', v_now) + interval '1 week',
      date_trunc('month', v_now) + interval '1 month',
      date_trunc('year', v_now) + interval '1 year',
      v_now
    )
    on conflict (venue_id, chatbot_type, tour_id)
      where tour_id is not null
    do nothing;

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
      and u.chatbot_type = 'tour'
      and u.tour_id = v_selected_tour_id
    returning * into v_usage;
  end if;

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

revoke all on function public.increment_hard_limit_usage(uuid, text, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.increment_hard_limit_usage(uuid, text, uuid, uuid)
  to service_role;

-- Keep a 3-arg overload for existing tour callers
create or replace function public.increment_hard_limit_usage(
  p_venue_id uuid,
  p_chatbot_type text default 'tour',
  p_tour_id uuid default null
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
begin
  return query
  select *
  from public.increment_hard_limit_usage(p_venue_id, p_chatbot_type, p_tour_id, null::uuid);
end;
$$;

revoke all on function public.increment_hard_limit_usage(uuid, text, uuid)
  from public, anon, authenticated;
grant execute on function public.increment_hard_limit_usage(uuid, text, uuid)
  to service_role;

commit;
