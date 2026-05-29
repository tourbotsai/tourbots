-- 58_add_trigger_response_mode.sql
-- Adds a response delivery mode for AI-driven triggers.
--   'natural' (default): the AI weaves the configured response into the conversation naturally.
--   'exact'           : the AI must reply with the configured response message verbatim.
-- Safe to run multiple times.

alter table public.chatbot_triggers
  add column if not exists response_mode text not null default 'natural';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_chatbot_triggers_response_mode'
  ) then
    alter table public.chatbot_triggers
      add constraint chk_chatbot_triggers_response_mode
      check (response_mode in ('exact', 'natural'));
  end if;
end $$;

-- Backfill any existing rows to the default delivery mode.
update public.chatbot_triggers
set response_mode = 'natural'
where response_mode is null;
