-- 56_add_send_button_size_px.sql
-- Adds pixel-based send button sizing for desktop and mobile customisation,
-- replacing the small/medium/large dropdown with a px control (like Input Height).

alter table if exists public.chatbot_customisations
  add column if not exists send_button_size_px integer;

alter table if exists public.chatbot_customisations
  add column if not exists mobile_send_button_size_px integer;

-- Backfill from the legacy enum so behaviour is unchanged for current chatbots.
update public.chatbot_customisations
set send_button_size_px = case lower(coalesce(send_button_size, 'medium'))
  when 'small' then 32
  when 'large' then 48
  else 36
end
where send_button_size_px is null;

update public.chatbot_customisations
set mobile_send_button_size_px = case lower(coalesce(mobile_send_button_size, send_button_size, 'medium'))
  when 'small' then 32
  when 'large' then 48
  else 36
end
where mobile_send_button_size_px is null;

alter table if exists public.chatbot_customisations
  alter column send_button_size_px set default 36;

alter table if exists public.chatbot_customisations
  alter column mobile_send_button_size_px set default 36;

alter table if exists public.chatbot_customisations
  alter column send_button_size_px set not null;

alter table if exists public.chatbot_customisations
  alter column mobile_send_button_size_px set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_chatbot_customisations_send_button_size_px'
  ) then
    alter table public.chatbot_customisations
      add constraint chk_chatbot_customisations_send_button_size_px
      check (send_button_size_px between 28 and 56);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_chatbot_customisations_mobile_send_button_size_px'
  ) then
    alter table public.chatbot_customisations
      add constraint chk_chatbot_customisations_mobile_send_button_size_px
      check (mobile_send_button_size_px between 28 and 56);
  end if;
end $$;
