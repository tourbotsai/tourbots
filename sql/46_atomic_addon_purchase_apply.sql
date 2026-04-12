-- 46_atomic_addon_purchase_apply.sql
-- Prevent lost updates for concurrent Stripe add-on webhook deliveries.

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
  if p_addon_code not in ('extra_space', 'message_block', 'white_label', 'agency_portal') then
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
    case when p_addon_code = 'extra_space' then v_quantity else 0 end,
    case when p_addon_code = 'message_block' then v_quantity else 0 end,
    case when p_addon_code = 'white_label' then true else false end,
    case when p_addon_code = 'agency_portal' then true else false end
  )
  on conflict (venue_id)
  do update set
    addon_extra_spaces = public.venue_billing_records.addon_extra_spaces +
      case when p_addon_code = 'extra_space' then v_quantity else 0 end,
    addon_message_blocks = public.venue_billing_records.addon_message_blocks +
      case when p_addon_code = 'message_block' then v_quantity else 0 end,
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
