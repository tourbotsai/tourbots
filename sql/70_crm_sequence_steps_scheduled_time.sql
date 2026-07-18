-- 70_crm_sequence_steps_scheduled_time.sql
-- Add a time-of-day to sequence steps (e.g. calls at 10:00, emails at 14:00), separate from
-- scheduled_date. This is guidance shown in the UI only — V1 is manual, nothing fires
-- automatically at this time. Per-contact-independent times were considered and deliberately
-- left out; the time is set once per step for the whole sequence.

alter table public.crm_sequence_steps
  add column if not exists scheduled_time time;
