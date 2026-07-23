-- 103_billing_bot_compatibility.sql
-- Forward-only guard for the already-applied space-to-bot column rename.
-- Do not rename columns here: production is already on the bot schema.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'billing_plans' and column_name = 'included_bots'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'venue_billing_records' and column_name = 'addon_extra_bots'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'venue_billing_records' and column_name = 'effective_bot_limit'
  ) then
    raise exception 'Bot billing columns are missing; sql/87_billing_unit_rename_space_to_bot.sql must be applied first';
  end if;
end;
$$;

-- The application and Stripe webhook continue accepting legacy add-on codes
-- while existing subscription metadata is migrated to the bot terminology.
update public.billing_addons
set
  name = case
    when code = 'extra_bot' then 'Additional Bot'
    when code = 'agency_extra_bot' then 'Agency Additional Bot'
    else name
  end,
  unit_label = case
    when code in ('extra_bot', 'agency_extra_bot') then 'per bot'
    else unit_label
  end,
  updated_at = now()
where code in ('extra_bot', 'agency_extra_bot');

-- Refresh PostgREST's function metadata after the changed RPC return shape in
-- migration 87. This is harmless on Supabase and avoids stale schema caches.
notify pgrst, 'reload schema';
