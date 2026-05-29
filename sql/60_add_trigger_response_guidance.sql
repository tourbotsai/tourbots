-- 60_add_trigger_response_guidance.sql
-- Adds optional free-text guidance for 'natural' delivery triggers. Lets owners
-- tell the AI how to use the response message (e.g. "always keep it short" or
-- "always mention checking the supplements site"). Ignored for 'exact' delivery.
-- Safe to run multiple times.

alter table public.chatbot_triggers
  add column if not exists response_guidance text;
