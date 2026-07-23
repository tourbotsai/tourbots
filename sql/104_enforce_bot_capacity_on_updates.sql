-- 104_enforce_bot_capacity_on_updates.sql
-- Close update-path capacity bypasses while preserving migration 102's
-- transaction-level advisory locking and billing-limit calculation.

drop trigger if exists trg_enforce_venue_bot_capacity_on_tours on public.tours;
drop trigger if exists trg_enforce_venue_bot_capacity_on_chatbot_configs on public.chatbot_configs;
drop trigger if exists trg_enforce_venue_bot_capacity_on_tours_insert on public.tours;
drop trigger if exists trg_enforce_venue_bot_capacity_on_tours_capacity_update on public.tours;
drop trigger if exists trg_enforce_venue_bot_capacity_on_chatbot_configs_insert on public.chatbot_configs;
drop trigger if exists trg_enforce_venue_bot_capacity_on_chatbot_configs_capacity_update on public.chatbot_configs;

-- New primary tours consume capacity. Legacy rows with NULL tour_type remain
-- primary tours for compatibility with the existing billing model.
create trigger trg_enforce_venue_bot_capacity_on_tours_insert
  before insert on public.tours
  for each row
  when (
    new.is_active is true
    and (new.tour_type = 'primary' or new.tour_type is null)
  )
  execute function public.enforce_venue_bot_capacity();

-- Check only when an update makes a tour consume capacity in its destination
-- venue. Updates to an already-counted tour in the same venue must not count
-- the row itself and reject ordinary metadata changes.
create trigger trg_enforce_venue_bot_capacity_on_tours_capacity_update
  before update of venue_id, is_active, tour_type on public.tours
  for each row
  when (
    new.is_active is true
    and (new.tour_type = 'primary' or new.tour_type is null)
    and (
      new.venue_id is distinct from old.venue_id
      or old.is_active is not true
      or (old.tour_type <> 'primary' and old.tour_type is not null)
    )
  )
  execute function public.enforce_venue_bot_capacity();

-- Every website chatbot configuration consumes capacity, regardless of its
-- active flag, matching the existing usage calculation in migration 102.
create trigger trg_enforce_venue_bot_capacity_on_chatbot_configs_insert
  before insert on public.chatbot_configs
  for each row
  when (new.chatbot_type = 'website')
  execute function public.enforce_venue_bot_capacity();

create trigger trg_enforce_venue_bot_capacity_on_chatbot_configs_capacity_update
  before update of venue_id, chatbot_type on public.chatbot_configs
  for each row
  when (
    new.chatbot_type = 'website'
    and (
      new.venue_id is distinct from old.venue_id
      or old.chatbot_type is distinct from 'website'
    )
  )
  execute function public.enforce_venue_bot_capacity();
