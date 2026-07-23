-- 74_crm_stagger_agency_outreach_enrollment.sql
-- Fixes the burst-sending problem in 71/73: every one of the 64 companies in
-- "Initial Agency Sales Outreach" currently shares the exact same absolute
-- step dates (01/08, 04/08, 09/08, 16/08), so all 64 Day-1 emails would fire
-- at 14:00 on the same day — a dead giveaway to spam filters on a brand new
-- sending domain with zero reputation.
--
-- This introduces a per-contact "anchor_date": the contact's own personal
-- Day 1, independent of the sequence template's dates. Every step's date for
-- that contact is then computed as anchor_date + (step's template offset
-- from the sequence's earliest step date), shifted forward to the next
-- Monday if it would otherwise land on a weekend. When anchor_date is null
-- (the default for any other/future sequence), behaviour is unchanged —
-- everyone just uses the step's own scheduled_date, exactly as before.
--
-- The 64 companies are enrolled here on a look-ahead volume-ramp scheduler,
-- not just an enrollment-count ramp: before anchoring a new company to a
-- given day, it checks that day AND the two future days its Day-4/Day-9
-- follow-ups will land on (shifted off weekends) all still have headroom
-- under the cap. If any of the three would be pushed over, it tries the
-- next weekday instead. This makes the cap of 10 emails/day (ramping
-- 1 -> 10, Monday-Friday) a real, verified ceiling on TOTAL daily volume
-- (new sends + follow-ups combined) — not just a best-effort target on new
-- enrollments alone, which is what the first version of this migration got
-- wrong (it could still spike to 9/day against a nominal "5/day" cap).
--
-- All 64 companies are fully enrolled by 01/09/2026; the last company's
-- final call (Day 16) lands 16/09/2026. Peak verified daily volume: 10,
-- never exceeded.
--
-- Safe to re-run: anchor_date assignment and the scheduled_for recompute are
-- both deterministic and idempotent, and only ever touch rows still in
-- 'scheduled' status (never a row that's already sent/processing/cancelled).

-- --------
-- 1. Per-contact anchor date (generic — usable by any future sequence too)
-- --------

alter table public.crm_sequence_contacts
  add column if not exists anchor_date date;

comment on column public.crm_sequence_contacts.anchor_date is
  'This contact''s personal "Day 1" for the sequence, used to stagger enrollment for deliverability. When null, the sequence''s own step scheduled_date/scheduled_time apply as-is (no stagger). See crm_effective_step_date().';

-- --------
-- 2. Helpers: anchor-aware effective date, shifted off weekends
-- --------

create or replace function public.crm_shift_to_weekday(p_date date)
returns date
language sql
immutable
as $$
  select case extract(isodow from p_date)
    when 6 then p_date + 2  -- Saturday -> following Monday
    when 7 then p_date + 1  -- Sunday -> following Monday
    else p_date
  end;
$$;

create or replace function public.crm_sequence_template_anchor(p_sequence_id uuid)
returns date
language sql
stable
as $$
  select min(scheduled_date) from public.crm_sequence_steps where sequence_id = p_sequence_id;
$$;

-- The date a given step actually falls on for one specific contact: the
-- contact's own anchor_date plus that step's offset from the sequence
-- template's earliest step date, shifted off weekends. Falls back to the
-- step's own scheduled_date untouched when the contact has no anchor_date.
create or replace function public.crm_effective_step_date(
  p_sequence_id uuid,
  p_step_scheduled_date date,
  p_contact_anchor_date date
)
returns date
language sql
stable
as $$
  select case
    when p_step_scheduled_date is null then null
    when p_contact_anchor_date is null then p_step_scheduled_date
    else public.crm_shift_to_weekday(
      p_contact_anchor_date + (p_step_scheduled_date - public.crm_sequence_template_anchor(p_sequence_id))
    )
  end;
$$;

-- Full per-contact, per-step effective schedule for a sequence — covers
-- BOTH call and email steps (calls have no scheduled-email row of their
-- own), used by the sequence detail UI to show each company's own actual
-- date for every step instead of one shared date for everyone.
create or replace function public.crm_sequence_effective_schedule(p_sequence_id uuid)
returns table(step_id uuid, company_id uuid, effective_date date)
language sql
stable
as $$
  select
    st.id as step_id,
    sc.company_id,
    public.crm_effective_step_date(st.sequence_id, st.scheduled_date, sc.anchor_date) as effective_date
  from public.crm_sequence_steps st
  join public.crm_sequence_contacts sc on sc.sequence_id = st.sequence_id
  where st.sequence_id = p_sequence_id;
$$;

-- --------
-- 3. Make the scheduled-email sync helpers anchor-aware (future contacts too)
-- --------

create or replace function public.crm_sync_scheduled_emails_for_step(p_step_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.crm_sequence_scheduled_emails (step_id, company_id, scheduled_for)
  select
    st.id,
    sc.company_id,
    public.crm_compute_scheduled_for(
      public.crm_effective_step_date(st.sequence_id, st.scheduled_date, sc.anchor_date),
      st.scheduled_time
    )
  from public.crm_sequence_steps st
  join public.crm_sequence_contacts sc on sc.sequence_id = st.sequence_id
  where st.id = p_step_id
    and st.step_type = 'email'
    and st.scheduled_date is not null
  on conflict (step_id, company_id) do nothing;
end;
$$;

create or replace function public.crm_sync_scheduled_emails_for_contact(p_sequence_id uuid, p_company_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.crm_sequence_scheduled_emails (step_id, company_id, scheduled_for)
  select
    st.id,
    p_company_id,
    public.crm_compute_scheduled_for(
      public.crm_effective_step_date(
        st.sequence_id,
        st.scheduled_date,
        (select anchor_date from public.crm_sequence_contacts where sequence_id = p_sequence_id and company_id = p_company_id)
      ),
      st.scheduled_time
    )
  from public.crm_sequence_steps st
  where st.sequence_id = p_sequence_id
    and st.step_type = 'email'
    and st.scheduled_date is not null
  on conflict (step_id, company_id) do nothing;
end;
$$;

-- --------
-- 4. Assign each of the 64 companies their own staggered anchor_date
-- --------
-- Ordered deterministically by company_name so re-runs always land on the
-- same assignment. The array below is the output of the look-ahead volume
-- ramp scheduler described above (cap 10/day, Mon-Fri, guaranteeing total
-- daily volume including follow-ups never exceeds 10) — not hand-picked.

with ordered_companies as (
  select c.id, row_number() over (order by c.company_name, c.id) as rn
  from public.crm_companies c
  where c.source = 'UK VR Tour Prospect List'
),
anchor_slots as (
  select rn, anchor_date
  from unnest(array[
    date '2026-08-03', date '2026-08-04', date '2026-08-04', date '2026-08-05',
    date '2026-08-05', date '2026-08-05', date '2026-08-06', date '2026-08-06',
    date '2026-08-06', date '2026-08-07', date '2026-08-07', date '2026-08-07',
    date '2026-08-11', date '2026-08-11', date '2026-08-11', date '2026-08-11',
    date '2026-08-11', date '2026-08-11', date '2026-08-12', date '2026-08-12',
    date '2026-08-12', date '2026-08-12', date '2026-08-12', date '2026-08-12',
    date '2026-08-13', date '2026-08-18', date '2026-08-18', date '2026-08-18',
    date '2026-08-18', date '2026-08-18', date '2026-08-18', date '2026-08-18',
    date '2026-08-18', date '2026-08-18', date '2026-08-19', date '2026-08-19',
    date '2026-08-19', date '2026-08-19', date '2026-08-20', date '2026-08-20',
    date '2026-08-20', date '2026-08-20', date '2026-08-24', date '2026-08-24',
    date '2026-08-25', date '2026-08-25', date '2026-08-25', date '2026-08-25',
    date '2026-08-25', date '2026-08-25', date '2026-08-26', date '2026-08-27',
    date '2026-08-27', date '2026-08-27', date '2026-08-27', date '2026-08-31',
    date '2026-08-31', date '2026-08-31', date '2026-08-31', date '2026-08-31',
    date '2026-09-01', date '2026-09-01', date '2026-09-01', date '2026-09-01'
  ]) with ordinality as t(anchor_date, rn)
)
update public.crm_sequence_contacts sc
set anchor_date = a.anchor_date
from ordered_companies oc
join anchor_slots a on a.rn = oc.rn
where sc.company_id = oc.id
  and sc.sequence_id = (select id from public.crm_sequences where lower(title) = lower('Initial Agency Sales Outreach'));

-- --------
-- 5. Recompute already-existing scheduled emails (from migration 73) against
--    the new anchor dates. Only touches rows still 'scheduled' — never a
--    row that's already sent, processing, failed, or cancelled.
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
  and st.sequence_id = (select id from public.crm_sequences where lower(title) = lower('Initial Agency Sales Outreach'));
