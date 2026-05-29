-- 53_add_chat_button_size_px.sql
-- Adds pixel-based chat button sizing for desktop and mobile customisation.

alter table if exists public.chatbot_customisations
  add column if not exists chat_button_size_px integer;

alter table if exists public.chatbot_customisations
  add column if not exists mobile_chat_button_size_px integer;

update public.chatbot_customisations
set chat_button_size_px = case lower(coalesce(chat_button_size, 'medium'))
  when 'small' then 64
  when 'large' then 104
  else 80
end
where chat_button_size_px is null;

update public.chatbot_customisations
set mobile_chat_button_size_px = case lower(coalesce(mobile_chat_button_size, chat_button_size, 'medium'))
  when 'small' then 48
  when 'large' then 80
  else 60
end
where mobile_chat_button_size_px is null;

alter table if exists public.chatbot_customisations
  alter column chat_button_size_px set default 80;

alter table if exists public.chatbot_customisations
  alter column mobile_chat_button_size_px set default 60;

alter table if exists public.chatbot_customisations
  alter column chat_button_size_px set not null;

alter table if exists public.chatbot_customisations
  alter column mobile_chat_button_size_px set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_chatbot_customisations_chat_button_size_px'
  ) then
    alter table public.chatbot_customisations
      add constraint chk_chatbot_customisations_chat_button_size_px
      check (chat_button_size_px between 48 and 128);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_chatbot_customisations_mobile_chat_button_size_px'
  ) then
    alter table public.chatbot_customisations
      add constraint chk_chatbot_customisations_mobile_chat_button_size_px
      check (mobile_chat_button_size_px between 40 and 104);
  end if;
end $$;
