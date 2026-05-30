-- 62_agency_plan_and_addons.sql
-- Converts "Agency Portal" from a billing add-on into a first-class plan tier
-- (free -> pro -> agency) and introduces agency-scoped add-ons.
-- Run after 61_atomic_addon_cancellation_apply.sql.

-- 1) Agency plan: GBP 49.99/mo, 3 spaces, 3,000 messages. White-label is
--    treated as included by the application layer (no add-on required).
insert into public.billing_plans (
  code,
  name,
  description,
  monthly_price_gbp,
  yearly_price_gbp,
  included_spaces,
  included_messages,
  stripe_price_monthly_sandbox,
  sort_order
)
values (
  'agency',
  'Agency',
  'Agency plan with a shared 3-space pool, branded client portals, and white-label included.',
  49.99,
  null,
  3,
  3000,
  'price_1TFgfPI5TESmVv5lCaYzbbOJ',
  3
)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  monthly_price_gbp = excluded.monthly_price_gbp,
  included_spaces = excluded.included_spaces,
  included_messages = excluded.included_messages,
  stripe_price_monthly_sandbox = excluded.stripe_price_monthly_sandbox,
  sort_order = excluded.sort_order,
  updated_at = now();

-- 2) Agency-scoped add-ons (separate SKUs so agency pricing can diverge from core).
insert into public.billing_addons (
  code,
  name,
  description,
  unit_label,
  monthly_price_gbp,
  stripe_price_monthly_sandbox,
  sort_order
)
values
  (
    'agency_extra_space',
    'Agency Additional Space',
    'Additional space for the agency pool, includes +1,000 message credits.',
    'per space',
    9.99,
    'price_1Tcm6GI5TESmVv5l0bRsIC3B',
    5
  ),
  (
    'agency_message_block',
    'Agency Message Top-up Block',
    'Additional 1,000 monthly message credits for the agency pool.',
    'per 1000 messages',
    9.99,
    'price_1Tcm74I5TESmVv5l117Qi2Go',
    6
  )
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  unit_label = excluded.unit_label,
  monthly_price_gbp = excluded.monthly_price_gbp,
  stripe_price_monthly_sandbox = excluded.stripe_price_monthly_sandbox,
  sort_order = excluded.sort_order,
  updated_at = now();

-- 3) Retire the legacy agency_portal add-on (agency is now a plan).
update public.billing_addons
set is_active = false,
    updated_at = now()
where code = 'agency_portal';

-- 4) Extend the atomic add-on apply RPC to recognise the agency add-on codes.
--    Agency capacity reuses the existing extra_spaces / message_blocks counters
--    so limit derivation is unchanged; only the catalogue/pricing differs.
create or replace function public.apply_billing_addon_purchase(
  p_venue_id uuid,
  p_addon_code text,
  p_quantity integer default 1
)
returns table (
  addon_extra_spaces integer,
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
    'extra_space', 'message_block', 'white_label', 'agency_portal',
    'agency_extra_space', 'agency_message_block'
  ) then
    raise exception 'Unsupported addon_code: %', p_addon_code;
  end if;

  insert into public.venue_billing_records (
    venue_id,
    plan_code,
    billing_status,
    addon_extra_spaces,
    addon_message_blocks,
    addon_white_label,
    addon_agency_portal
  )
  values (
    p_venue_id,
    'free',
    'free',
    case when p_addon_code in ('extra_space', 'agency_extra_space') then v_quantity else 0 end,
    case when p_addon_code in ('message_block', 'agency_message_block') then v_quantity else 0 end,
    case when p_addon_code = 'white_label' then true else false end,
    case when p_addon_code = 'agency_portal' then true else false end
  )
  on conflict (venue_id)
  do update set
    addon_extra_spaces = public.venue_billing_records.addon_extra_spaces +
      case when p_addon_code in ('extra_space', 'agency_extra_space') then v_quantity else 0 end,
    addon_message_blocks = public.venue_billing_records.addon_message_blocks +
      case when p_addon_code in ('message_block', 'agency_message_block') then v_quantity else 0 end,
    addon_white_label = public.venue_billing_records.addon_white_label or
      (p_addon_code = 'white_label'),
    addon_agency_portal = public.venue_billing_records.addon_agency_portal or
      (p_addon_code = 'agency_portal');

  return query
  select
    vbr.addon_extra_spaces,
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

-- 5) Extend the atomic add-on cancellation RPC for the agency add-on codes.
create or replace function public.apply_billing_addon_cancellation(
  p_venue_id uuid,
  p_addon_code text,
  p_quantity integer default 1
)
returns table (
  addon_extra_spaces integer,
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
    'extra_space', 'message_block', 'white_label', 'agency_portal',
    'agency_extra_space', 'agency_message_block'
  ) then
    raise exception 'Unsupported addon_code: %', p_addon_code;
  end if;

  update public.venue_billing_records
  set
    addon_extra_spaces = greatest(
      0,
      public.venue_billing_records.addon_extra_spaces -
        case when p_addon_code in ('extra_space', 'agency_extra_space') then v_quantity else 0 end
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
    vbr.addon_extra_spaces,
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
