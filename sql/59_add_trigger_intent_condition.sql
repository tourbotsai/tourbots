-- 59_add_trigger_intent_condition.sql
-- Adds an 'intent' condition type for AI-driven triggers, where the owner
-- describes the user's intent in natural language (e.g. "wants to get in touch
-- with a member of the team") instead of listing keywords.
-- Safe to run multiple times.

alter table public.chatbot_triggers
  add column if not exists condition_intent text;

-- Allow 'intent' alongside the existing condition types. The original inline
-- constraint is auto-named chatbot_triggers_condition_type_check.
alter table public.chatbot_triggers
  drop constraint if exists chatbot_triggers_condition_type_check;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_chatbot_triggers_condition_type'
  ) then
    alter table public.chatbot_triggers
      add constraint chk_chatbot_triggers_condition_type
      check (condition_type in ('keywords', 'message_count', 'intent'));
  end if;
end $$;
