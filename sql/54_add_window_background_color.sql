-- 54_add_window_background_color.sql
-- Adds a customisable chat window body background colour (the area below the
-- header and above the send bar) for desktop and mobile customisation.

alter table if exists public.chatbot_customisations
  add column if not exists window_background_color text;

alter table if exists public.chatbot_customisations
  add column if not exists mobile_window_background_color text;

-- Backfill existing rows with white so behaviour is unchanged for current chatbots.
update public.chatbot_customisations
set window_background_color = '#FFFFFF'
where window_background_color is null;

alter table if exists public.chatbot_customisations
  alter column window_background_color set default '#FFFFFF';
