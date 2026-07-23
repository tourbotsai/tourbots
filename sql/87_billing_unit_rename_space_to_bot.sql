-- 87_billing_unit_rename_space_to_bot.sql
-- Renames the billing capacity unit from "space" to "bot" end-to-end:
--   included_spaces → included_bots
--   addon_extra_spaces → addon_extra_bots
--   effective_space_limit → effective_bot_limit
--   extra_space → extra_bot
--   agency_extra_space → agency_extra_bot
-- Run after 86_conversations_chatbot_config_id.sql (and after website-chatbot migrations).
--
-- RPCs dual-accept legacy codes (extra_space / agency_extra_space) for one cutover
-- release so in-flight Stripe webhooks still apply. Remove dual-accept once all
-- Stripe subscription metadata and price items use the new codes.

-- ---------------------------------------------------------------------------
-- 1) billing_plans.included_spaces → included_bots
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'billing_plans'
      and column_name = 'included_spaces'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'billing_plans'
      and column_name = 'included_bots'
  ) then
    alter table public.billing_plans
      rename column included_spaces to included_bots;
  end if;
end $$;

alter table public.billing_plans
  drop constraint if exists chk_billing_plans_included_spaces_non_negative;

alter table public.billing_plans
  drop constraint if exists chk_billing_plans_included_bots_non_negative;

alter table public.billing_plans
  add constraint chk_billing_plans_included_bots_non_negative
  check (included_bots >= 0);

-- Plan copy: space → bot
update public.billing_plans
set
  description = 'Live production plan with one included bot and message allowance.',
  updated_at = now()
where code = 'pro'
  and description ilike '%space%';

update public.billing_plans
set
  description = 'Agency plan with a shared 3-bot pool, branded client portals, and white-label included.',
  updated_at = now()
where code = 'agency'
  and description ilike '%space%';

-- ---------------------------------------------------------------------------
-- 2) venue_billing_records space columns → bot
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'venue_billing_records'
      and column_name = 'addon_extra_spaces'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'venue_billing_records'
      and column_name = 'addon_extra_bots'
  ) then
    alter table public.venue_billing_records
      rename column addon_extra_spaces to addon_extra_bots;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'venue_billing_records'
      and column_name = 'effective_space_limit'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'venue_billing_records'
      and column_name = 'effective_bot_limit'
  ) then
    alter table public.venue_billing_records
      rename column effective_space_limit to effective_bot_limit;
  end if;
end $$;

alter table public.venue_billing_records
  drop constraint if exists chk_venue_billing_records_spaces_non_negative;
alter table public.venue_billing_records
  drop constraint if exists chk_venue_billing_records_bots_non_negative;
alter table public.venue_billing_records
  add constraint chk_venue_billing_records_bots_non_negative
  check (addon_extra_bots >= 0);

alter table public.venue_billing_records
  drop constraint if exists chk_venue_billing_records_space_limit_non_negative;
alter table public.venue_billing_records
  drop constraint if exists chk_venue_billing_records_bot_limit_non_negative;
alter table public.venue_billing_records
  add constraint chk_venue_billing_records_bot_limit_non_negative
  check (effective_bot_limit is null or effective_bot_limit >= 0);

-- ---------------------------------------------------------------------------
-- 3) Catalogue codes + display names
-- ---------------------------------------------------------------------------
update public.billing_addons
set
  code = 'extra_bot',
  name = 'Additional Bot',
  description = 'Additional active bot, includes +1,000 message credits.',
  unit_label = 'per bot',
  updated_at = now()
where code = 'extra_space';

update public.billing_addons
set
  code = 'agency_extra_bot',
  name = 'Agency Additional Bot',
  description = 'Additional bot for the agency pool, includes +1,000 message credits.',
  unit_label = 'per bot',
  updated_at = now()
where code = 'agency_extra_space';

-- ---------------------------------------------------------------------------
-- 4) Atomic add-on RPCs (new column names + dual-accept legacy codes)
--    Must drop first: return column names changed from addon_extra_spaces.
-- ---------------------------------------------------------------------------
drop function if exists public.apply_billing_addon_purchase(uuid, text, integer);
drop function if exists public.apply_billing_addon_cancellation(uuid, text, integer);

create or replace function public.apply_billing_addon_purchase(
  p_venue_id uuid,
  p_addon_code text,
  p_quantity integer default 1
)
returns table (
  addon_extra_bots integer,
  addon_message_blocks integer,
  addon_white_label boolean,
  addon_agency_portal boolean
)
language plpgsql
as $$
declare
  v_quantity integer := greatest(coalesce(p_quantity, 1), 1);
begin
  if p_addon_code not in (
    'extra_bot', 'message_block', 'white_label', 'agency_portal',
    'agency_extra_bot', 'agency_message_block',
    -- Dual-accept legacy codes during Stripe cutover
    'extra_space', 'agency_extra_space'
  ) then
    raise exception 'Unsupported addon_code: %', p_addon_code;
  end if;

  insert into public.venue_billing_records (
    venue_id,
    plan_code,
    billing_status,
    addon_extra_bots,
    addon_message_blocks,
    addon_white_label,
    addon_agency_portal
  )
  values (
    p_venue_id,
    'free',
    'free',
    case when p_addon_code in ('extra_bot', 'agency_extra_bot', 'extra_space', 'agency_extra_space')
      then v_quantity else 0 end,
    case when p_addon_code in ('message_block', 'agency_message_block') then v_quantity else 0 end,
    case when p_addon_code = 'white_label' then true else false end,
    case when p_addon_code = 'agency_portal' then true else false end
  )
  on conflict (venue_id)
  do update set
    addon_extra_bots = public.venue_billing_records.addon_extra_bots +
      case when p_addon_code in ('extra_bot', 'agency_extra_bot', 'extra_space', 'agency_extra_space')
        then v_quantity else 0 end,
    addon_message_blocks = public.venue_billing_records.addon_message_blocks +
      case when p_addon_code in ('message_block', 'agency_message_block') then v_quantity else 0 end,
    addon_white_label = public.venue_billing_records.addon_white_label or
      (p_addon_code = 'white_label'),
    addon_agency_portal = public.venue_billing_records.addon_agency_portal or
      (p_addon_code = 'agency_portal');

  return query
  select
    vbr.addon_extra_bots,
    vbr.addon_message_blocks,
    vbr.addon_white_label,
    vbr.addon_agency_portal
  from public.venue_billing_records vbr
  where vbr.venue_id = p_venue_id;
end;
$$;

revoke all on function public.apply_billing_addon_purchase(uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.apply_billing_addon_purchase(uuid, text, integer)
  to service_role;

create or replace function public.apply_billing_addon_cancellation(
  p_venue_id uuid,
  p_addon_code text,
  p_quantity integer default 1
)
returns table (
  addon_extra_bots integer,
  addon_message_blocks integer,
  addon_white_label boolean,
  addon_agency_portal boolean
)
language plpgsql
as $$
declare
  v_quantity integer := greatest(coalesce(p_quantity, 1), 1);
begin
  if p_addon_code not in (
    'extra_bot', 'message_block', 'white_label', 'agency_portal',
    'agency_extra_bot', 'agency_message_block',
    -- Dual-accept legacy codes during Stripe cutover
    'extra_space', 'agency_extra_space'
  ) then
    raise exception 'Unsupported addon_code: %', p_addon_code;
  end if;

  update public.venue_billing_records
  set
    addon_extra_bots = greatest(
      0,
      public.venue_billing_records.addon_extra_bots -
        case when p_addon_code in ('extra_bot', 'agency_extra_bot', 'extra_space', 'agency_extra_space')
          then v_quantity else 0 end
    ),
    addon_message_blocks = greatest(
      0,
      public.venue_billing_records.addon_message_blocks -
        case when p_addon_code in ('message_block', 'agency_message_block') then v_quantity else 0 end
    ),
    addon_white_label = case
      when p_addon_code = 'white_label' then false
      else public.venue_billing_records.addon_white_label
    end,
    addon_agency_portal = case
      when p_addon_code = 'agency_portal' then false
      else public.venue_billing_records.addon_agency_portal
    end
  where public.venue_billing_records.venue_id = p_venue_id;

  return query
  select
    vbr.addon_extra_bots,
    vbr.addon_message_blocks,
    vbr.addon_white_label,
    vbr.addon_agency_portal
  from public.venue_billing_records vbr
  where vbr.venue_id = p_venue_id;
end;
$$;

revoke all on function public.apply_billing_addon_cancellation(uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.apply_billing_addon_cancellation(uuid, text, integer)
  to service_role;

-- Verification (run manually after applying):
-- select code, included_bots from public.billing_plans order by sort_order;
-- select code, name, unit_label from public.billing_addons where code like '%bot%' or code like '%space%';
-- select addon_extra_bots, effective_bot_limit from public.venue_billing_records limit 5;
