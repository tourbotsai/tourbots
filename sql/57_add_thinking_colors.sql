-- 57_add_thinking_colors.sql
-- Adds customisable colours for the "AI is typing/thinking" indicator bubble
-- (background and label text) for desktop and mobile, so it stays legible
-- against any chat window background.

alter table if exists public.chatbot_customisations
  add column if not exists thinking_background_color text;

alter table if exists public.chatbot_customisations
  add column if not exists thinking_text_color text;

alter table if exists public.chatbot_customisations
  add column if not exists mobile_thinking_background_color text;

alter table if exists public.chatbot_customisations
  add column if not exists mobile_thinking_text_color text;

-- Backfill existing rows with neutral defaults so behaviour is unchanged.
update public.chatbot_customisations
set thinking_background_color = '#F3F4F6'
where thinking_background_color is null;

update public.chatbot_customisations
set thinking_text_color = '#6B7280'
where thinking_text_color is null;

update public.chatbot_customisations
set mobile_thinking_background_color = '#F3F4F6'
where mobile_thinking_background_color is null;

update public.chatbot_customisations
set mobile_thinking_text_color = '#6B7280'
where mobile_thinking_text_color is null;

alter table if exists public.chatbot_customisations
  alter column thinking_background_color set default '#F3F4F6';

alter table if exists public.chatbot_customisations
  alter column thinking_text_color set default '#6B7280';

alter table if exists public.chatbot_customisations
  alter column mobile_thinking_background_color set default '#F3F4F6';

alter table if exists public.chatbot_customisations
  alter column mobile_thinking_text_color set default '#6B7280';
