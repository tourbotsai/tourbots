-- 106_crm_agency_sequence_push_back_one_week.sql
-- Pushes the entire "TourBots Agency Sequence A - Call Led" schedule back by
-- exactly 7 days: first company's anchor moves from Monday 03/08/2026 to
-- Monday 10/08/2026, and everything else (step template dates, every
-- company's anchor_date, every scheduled email) shifts by the same +7 days.
--
-- A flat 7-day shift is safe here specifically because every date already in
-- play (template dates and all 64 anchor_dates) only ever lands on a weekday
-- — see crm_shift_to_weekday() in migration 74 — and adding exactly one week
-- never changes day-of-week, so no date can be pushed onto a weekend by this
-- change. No re-running of the look-ahead volume scheduler is needed.
--
-- Only touches crm_sequence_scheduled_emails rows still in 'scheduled'
-- status, so this is safe to run even after some early sends have gone out —
-- anything already sent/processing/failed/cancelled is left untouched.
--
-- Safe to re-run accidentally is NOT true here (unlike most other CRM
-- migrations) — this adds a relative offset, not an idempotent absolute
-- assignment, so running it twice would push back two weeks. Run once.

-- --------
-- 1. Step template dates (affects the sequence's own "Day 1" reference point,
--    used as a fallback for any future contact enrolled without their own
--    anchor_date, and for computing each step's offset from that reference).
-- --------

update public.crm_sequence_steps
set scheduled_date = scheduled_date + interval '7 days'
where sequence_id = (
  select id from public.crm_sequences where lower(title) = lower('TourBots Agency Sequence A - Call Led')
)
and scheduled_date is not null;

-- --------
-- 2. Every enrolled company's personal anchor_date.
-- --------

update public.crm_sequence_contacts
set anchor_date = anchor_date + interval '7 days'
where sequence_id = (
  select id from public.crm_sequences where lower(title) = lower('TourBots Agency Sequence A - Call Led')
)
and anchor_date is not null;

-- --------
-- 3. Recompute scheduled_for on every still-pending scheduled email against
--    the now-shifted step dates and anchor dates. Uses the same
--    crm_effective_step_date() helper as migrations 74/76, so this stays
--    fully consistent with how the app computes dates everywhere else.
-- --------

update public.crm_sequence_scheduled_emails e
set scheduled_for = public.crm_compute_scheduled_for(
  public.crm_effective_step_date(st.sequence_id, st.scheduled_date, sc.anchor_date),
  st.scheduled_time
)
from public.crm_sequence_steps st
join public.crm_sequence_contacts sc
  on sc.sequence_id = st.sequence_id
where e.step_id = st.id
  and e.company_id = sc.company_id
  and e.status = 'scheduled'
  and st.sequence_id = (
    select id from public.crm_sequences where lower(title) = lower('TourBots Agency Sequence A - Call Led')
  );
