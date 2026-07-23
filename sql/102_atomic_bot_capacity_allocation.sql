-- 102_atomic_bot_capacity_allocation.sql
-- Enforce paid bot capacity inside the insert transaction. A bot is an active
-- primary tour or a website chatbot configuration.

create or replace function public.enforce_venue_bot_capacity()
returns trigger
language plpgsql
as $$
declare
  v_plan_code text;
  v_base_bots integer;
  v_extra_bots integer;
  v_effective_limit integer;
  v_bot_limit integer;
  v_used integer;
begin
  if tg_table_name = 'tours' then
    if not (new.is_active and (new.tour_type = 'primary' or new.tour_type is null)) then
      return new;
    end if;
  elsif tg_table_name = 'chatbot_configs' then
    if new.chatbot_type <> 'website' then
      return new;
    end if;
  else
    raise exception 'Unsupported table for bot capacity enforcement';
  end if;

  perform pg_advisory_xact_lock(hashtext('venue-bot-capacity:' || new.venue_id::text));

  select
    case
      when vbr.billing_override_enabled and vbr.override_plan_code is not null then vbr.override_plan_code
      else coalesce(vbr.plan_code, 'free')
    end,
    coalesce(vbr.addon_extra_bots, 0),
    vbr.effective_bot_limit
  into v_plan_code, v_extra_bots, v_effective_limit
  from public.venues v
  left join public.venue_billing_records vbr on vbr.venue_id = v.id
  where v.id = new.venue_id;

  if not found then
    raise exception 'Venue not found';
  end if;

  select coalesce(included_bots, 0)
  into v_base_bots
  from public.billing_plans
  where code = coalesce(v_plan_code, 'free')
  limit 1;

  v_base_bots := greatest(coalesce(v_base_bots, 0), case when coalesce(v_plan_code, 'free') = 'free' then 1 else 0 end);
  v_bot_limit := greatest(coalesce(v_effective_limit, v_base_bots + coalesce(v_extra_bots, 0)), 1);

  select
    (select count(*) from public.tours
      where venue_id = new.venue_id
        and is_active = true
        and (tour_type = 'primary' or tour_type is null))
    +
    (select count(*) from public.chatbot_configs
      where venue_id = new.venue_id
        and chatbot_type = 'website')
  into v_used;

  if v_used >= v_bot_limit then
    raise exception 'Bot limit reached (%/%). Upgrade your plan or purchase extra bot add-ons to add another tour or website chatbot.', v_used, v_bot_limit
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_venue_bot_capacity_on_tours on public.tours;
create trigger trg_enforce_venue_bot_capacity_on_tours
  before insert on public.tours
  for each row execute function public.enforce_venue_bot_capacity();

drop trigger if exists trg_enforce_venue_bot_capacity_on_chatbot_configs on public.chatbot_configs;
create trigger trg_enforce_venue_bot_capacity_on_chatbot_configs
  before insert on public.chatbot_configs
  for each row execute function public.enforce_venue_bot_capacity();
