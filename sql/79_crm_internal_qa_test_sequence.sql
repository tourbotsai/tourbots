-- 79_crm_internal_qa_test_sequence.sql
-- Internal-only QA sequence for end-to-end testing of the Gmail send +
-- inbound-reply pipeline before it goes anywhere near real prospects.
--
-- Sends ONLY to two addresses you personally control:
--   - jack.melluish@centrus.ai
--   - jackoliverdev@gmail.com
--
-- Structurally identical to the real "TourBots Agency Sequence A - Call Led"
-- (3 calls + 4 emails) so a clean pass here proves the real sequence will
-- behave correctly too — just compressed to Day 0/1/2/3 (instead of
-- Day 1/4/9/14) so the whole run completes within a few days, and content
-- is clearly marked [TEST] so there's no chance of confusing this with a
-- real send.
--
-- Safe to re-run: every insert is guarded with "where not exists" / "on
-- conflict do nothing", and this sequence's own steps are deleted and
-- re-inserted each run (same idempotent pattern as migration 76).

-- --------
-- 1. Test companies (only created if they don't already exist by email)
-- --------

insert into public.crm_companies (company_name, first_name, last_name, email, region, source, status)
select 'Centrus (Test)', 'Jack', 'Melluish', 'jack.melluish@centrus.ai', 'Internal QA', 'Internal QA', 'not_started'
where not exists (
  select 1 from public.crm_companies where lower(email) = lower('jack.melluish@centrus.ai')
);

insert into public.crm_companies (company_name, first_name, last_name, email, region, source, status)
select 'Oliver (Test)', 'Jack', 'Oliver', 'jackoliverdev@gmail.com', 'Internal QA', 'Internal QA', 'not_started'
where not exists (
  select 1 from public.crm_companies where lower(email) = lower('jackoliverdev@gmail.com')
);

update public.crm_companies
set status = 'in_sequence', updated_at = now()
where lower(email) in (lower('jack.melluish@centrus.ai'), lower('jackoliverdev@gmail.com'))
  and status = 'not_started';

-- --------
-- 2. The test sequence itself
-- --------

insert into public.crm_sequences (title, description, status)
select
  'Internal QA Test Sequence',
  $txt$Internal-only test of the full call+email cadence and the Gmail send/receive pipeline. Sends ONLY to jack.melluish@centrus.ai and jackoliverdev@gmail.com — never touches real prospects. Mirrors "TourBots Agency Sequence A - Call Led" exactly (3 calls + 4 emails), compressed to Day 0/1/2/3 so the run completes in a few days.$txt$,
  'active'
where not exists (
  select 1 from public.crm_sequences where lower(title) = lower('Internal QA Test Sequence')
);

-- --------
-- 3. Steps — delete first so re-running always converges on the same state
-- --------

delete from public.crm_sequence_steps
where sequence_id = (
  select id from public.crm_sequences where lower(title) = lower('Internal QA Test Sequence')
);

insert into public.crm_sequence_steps (
  sequence_id, step_order, title, description, scheduled_date, scheduled_time,
  step_type, email_subject, email_body, call_script
)
select s.id, v.step_order, v.title, v.description, v.scheduled_date, v.scheduled_time,
       v.step_type, v.email_subject, v.email_body, v.call_script
from (select id from public.crm_sequences where lower(title) = lower('Internal QA Test Sequence')) s
cross join (
  values
    (
      1,
      $txt$TEST Call 1 — Day 0$txt$,
      $txt$No auto-send for calls — tick this off yourself with any outcome once you're ready to test that path.$txt$,
      date '2026-07-19',
      time '10:00',
      'call',
      null,
      null,
      $txt$This is a test call step, not a real one.

Tick it off with any outcome to check the full loop:
- No answer -> logs an activity immediately, no modal.
- Positive -> opens a modal, type a note, save -> activity is logged with your note, sequence keeps going.
- Negative -> opens a modal, type a note, tick "stop outreach for this contact", save -> activity is logged, this contact goes to Stopped everywhere (all future calls/emails across every sequence it's in).

Undo is available afterwards to reset and try a different outcome.$txt$
    ),
    (
      2,
      $txt$TEST Email 1 — Day 0$txt$,
      $txt$Auto-sends via the connected Gmail account at the scheduled time — this is the main thing being tested.$txt$,
      date '2026-07-19',
      time '14:00',
      'email',
      $txt$[TEST] Add AI to your virtual tours$txt$,
      $txt$Hi {{first_name}},

Internal test send from the TourBots CRM — Email 1 of 4 in the QA sequence.

This should have arrived automatically from jack@tourbotsai.com without anyone pressing a button. No action needed, just confirming it landed for {{company_name}}.

Jack$txt$,
      null
    ),
    (
      3,
      $txt$TEST Call 2 — Day 1$txt$,
      $txt$Second test call step, same checks as Call 1.$txt$,
      date '2026-07-20',
      time '10:00',
      'call',
      null,
      null,
      $txt$Second test call step. Tick off with a different outcome than you used for Call 1 so both the Positive and Negative modal paths get exercised across the two test contacts before this run ends.$txt$
    ),
    (
      4,
      $txt$TEST Email 2 — Day 1$txt$,
      $txt$Auto-sends via Gmail. Reply to THIS email from one of the two test inboxes to test inbound auto-stop.$txt$,
      date '2026-07-20',
      time '14:00',
      'email',
      $txt$[TEST] more than a hosting fee$txt$,
      $txt$Hi {{first_name}},

Internal test send — Email 2 of 4.

Reply to this one from {{company_name}}'s inbox to test that the poll cron detects it, logs it as a "Reply received" activity, and stops all further sends/calls for this contact only — the other test contact should be unaffected.

Jack$txt$,
      null
    ),
    (
      5,
      $txt$TEST Call 3 — Day 2$txt$,
      $txt$Third test call step.$txt$,
      date '2026-07-21',
      time '10:00',
      'call',
      null,
      null,
      $txt$Third test call step — same as before. If this contact was already stopped by the Email 2 reply test, it should show as "Stopped — do not call" instead of action buttons here.$txt$
    ),
    (
      6,
      $txt$TEST Email 3 — Day 2$txt$,
      $txt$Auto-sends via Gmail, unless this contact was already stopped.$txt$,
      date '2026-07-21',
      time '14:00',
      'email',
      $txt$[TEST] your own branding, not ours$txt$,
      $txt$Hi {{first_name}},

Internal test send — Email 3 of 4.

If you replied to Email 2 with this address, you should NOT receive this one — that's the auto-stop working.

Jack$txt$,
      null
    ),
    (
      7,
      $txt$TEST Email 4 — breakup, Day 3$txt$,
      $txt$Final email, no call attempt — mirrors the real breakup step. Auto-sends via Gmail, unless this contact was already stopped.$txt$,
      date '2026-07-22',
      time '14:00',
      'email',
      $txt$[TEST] Last one from me$txt$,
      $txt$Hi {{first_name}},

Internal test send — Email 4 of 4, last one in this QA run.

If everything above worked, this whole sequence is safe to point at real prospects.

Jack$txt$,
      null
    )
) as v(step_order, title, description, scheduled_date, scheduled_time, step_type, email_subject, email_body, call_script);

-- --------
-- 4. Enrol both test contacts — no anchor_date needed, only 2 contacts and
--    no burst-sending risk to guard against, so each just uses the step's
--    own scheduled_date/time directly.
-- --------

insert into public.crm_sequence_contacts (sequence_id, company_id)
select seq.id, c.id
from public.crm_sequences seq
join public.crm_companies c
  on lower(c.email) in (lower('jack.melluish@centrus.ai'), lower('jackoliverdev@gmail.com'))
where lower(seq.title) = lower('Internal QA Test Sequence')
on conflict (sequence_id, company_id) do nothing;

-- --------
-- 5. Queue scheduled emails for both contacts against the 4 email steps above
-- --------

do $$
declare
  v_step record;
begin
  for v_step in
    select st.id
    from public.crm_sequence_steps st
    join public.crm_sequences sq on sq.id = st.sequence_id
    where lower(sq.title) = lower('Internal QA Test Sequence')
      and st.step_type = 'email'
  loop
    perform public.crm_sync_scheduled_emails_for_step(v_step.id);
  end loop;
end;
$$;
