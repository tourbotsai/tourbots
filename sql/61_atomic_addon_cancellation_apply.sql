-- 61_atomic_addon_cancellation_apply.sql
-- Clears a single add-on from a venue's billing record when its Stripe
-- subscription ends. Mirrors apply_billing_addon_purchase so concurrent
-- webhook deliveries cannot race each other into an inconsistent state.

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
  if p_addon_code not in ('extra_space', 'message_block', 'white_label', 'agency_portal') then
    raise exception 'Unsupported addon_code: %', p_addon_code;
  end if;

  update public.venue_billing_records
  set
    addon_extra_spaces = greatest(
      0,
      public.venue_billing_records.addon_extra_spaces -
        case when p_addon_code = 'extra_space' then v_quantity else 0 end
    ),
    addon_message_blocks = greatest(
      0,
      public.venue_billing_records.addon_message_blocks -
        case when p_addon_code = 'message_block' then v_quantity else 0 end
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
