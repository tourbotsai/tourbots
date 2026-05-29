-- 55_add_timestamp_color.sql
-- Adds a customisable message timestamp colour for desktop and mobile so
-- timestamps stay legible when the chat window background is changed (e.g. dark).

alter table if exists public.chatbot_customisations
  add column if not exists timestamp_color text;

alter table if exists public.chatbot_customisations
  add column if not exists mobile_timestamp_color text;

-- Backfill existing rows with a neutral grey so behaviour is unchanged for current chatbots.
update public.chatbot_customisations
set timestamp_color = '#9CA3AF'
where timestamp_color is null;

alter table if exists public.chatbot_customisations
  alter column timestamp_color set default '#9CA3AF';
