-- 107_crm_template_variable_test_sequence.sql
-- One-off internal test sequence to confirm {{first_name}}/{{company_name}}
-- template variable resolution works correctly on a real Gmail send, ahead
-- of the real "TourBots Agency Sequence A - Call Led" going live.
--
-- Sends ONLY to jack.melluish@centrus.ai (the "Centrus (Test)" company
-- already created by migration 79 — first_name 'Jack', last_name
-- 'Melluish', company_name 'Centrus (Test)'). Because first_name and
-- company_name are genuinely different strings on this contact, seeing both
-- resolve correctly (not just falling back to company_name everywhere)
-- actually proves the substitution is working, not just that a fallback
-- happened to look right.
--
-- 2 email-only steps (no calls), content mirrors the real sequence's
-- Email 1 / Email 2 wording so this is a faithful test of what prospects
-- will actually receive — just marked [TEST] and re-dated to fire
-- Tue 28 July 2026 13:00 and Wed 29 July 2026 14:00.
--
-- Safe to re-run: contact insert is guarded with "where not exists", the
-- sequence is only created if missing, and this sequence's own steps are
-- deleted and re-inserted every run (same idempotent pattern as migration 76).

-- --------
-- 1. Make sure the test contact exists (idempotent — migration 79 already
--    creates this row in most environments, this is just a safety net).
-- --------

insert into public.crm_companies (company_name, first_name, last_name, email, region, source, status)
select 'Centrus (Test)', 'Jack', 'Melluish', 'jack.melluish@centrus.ai', 'Internal QA', 'Internal QA', 'in_sequence'
where not exists (
  select 1 from public.crm_companies where lower(email) = lower('jack.melluish@centrus.ai')
);

-- --------
-- 2. The test sequence itself
-- --------

insert into public.crm_sequences (title, description, status)
select
  'Template Variable Test',
  $txt$One-off internal test of {{first_name}}/{{company_name}} template variable resolution on a real Gmail send. Sends ONLY to jack.melluish@centrus.ai — never touches real prospects. 2 emails, content mirrors the real "TourBots Agency Sequence A - Call Led" Email 1 / Email 2 wording.$txt$,
  'active'
where not exists (
  select 1 from public.crm_sequences where lower(title) = lower('Template Variable Test')
);

-- --------
-- 3. Steps — delete first so re-running always converges on the same state
-- --------

delete from public.crm_sequence_steps
where sequence_id = (
  select id from public.crm_sequences where lower(title) = lower('Template Variable Test')
);

insert into public.crm_sequence_steps (
  sequence_id, step_order, title, description, scheduled_date, scheduled_time,
  step_type, email_subject, email_body, call_script
)
select s.id, v.step_order, v.title, v.description, v.scheduled_date, v.scheduled_time,
       v.step_type, v.email_subject, v.email_body, v.call_script
from (select id from public.crm_sequences where lower(title) = lower('Template Variable Test')) s
cross join (
  values
    (
      1,
      $txt$TEST Email 1 — variable resolution check$txt$,
      $txt$Auto-sends via the connected Gmail account. Confirms {{first_name}} and {{company_name}} both resolve correctly (they're different strings on this test contact, so a correct send proves real substitution, not just a fallback).$txt$,
      date '2026-07-28',
      time '13:00',
      'email',
      $txt$[TEST] Add AI to your virtual tours$txt$,
      $txt$Hi {{first_name}},

Internal template-variable test send from the TourBots CRM.

I run TourBots AI, a platform that adds an AI guide to virtual tours. It sits on any Matterport tour, answers visitor questions, and can navigate the tour to specific areas on request.

Might be useful given {{company_name}} works in virtual tours.

If both the name above and the company name in that last line look right, variable resolution is working correctly.

Jack$txt$,
      null
    ),
    (
      2,
      $txt$TEST Email 2 — variable resolution check$txt$,
      $txt$Auto-sends via the connected Gmail account the following day.$txt$,
      date '2026-07-29',
      time '14:00',
      'email',
      $txt$[TEST] more than a hosting fee$txt$,
      $txt$Hi {{first_name}},

Second internal test send — Email 2 of 2.

Most agencies host tours for around £10 to £20 a month. TourBots lets you add an AI layer on top and charge £30 to £50 a month instead. Same tour, same client relationship, just a lot more value each month.

If everything above worked — correct name, correct company, both emails landed at the right time — this whole sequence is safe to point at real prospects.

Jack$txt$,
      null
    )
) as v(step_order, title, description, scheduled_date, scheduled_time, step_type, email_subject, email_body, call_script);

-- --------
-- 4. Enrol the single test contact — no anchor_date needed, only one
--    contact and no burst-sending risk to guard against, so it just uses
--    each step's own scheduled_date/time directly.
-- --------

insert into public.crm_sequence_contacts (sequence_id, company_id)
select seq.id, c.id
from public.crm_sequences seq
join public.crm_companies c
  on lower(c.email) = lower('jack.melluish@centrus.ai')
where lower(seq.title) = lower('Template Variable Test')
on conflict (sequence_id, company_id) do nothing;

-- --------
-- 5. Queue scheduled emails for the contact against both email steps above
-- --------

do $$
declare
  v_step record;
begin
  for v_step in
    select st.id
    from public.crm_sequence_steps st
    join public.crm_sequences sq on sq.id = st.sequence_id
    where lower(sq.title) = lower('Template Variable Test')
      and st.step_type = 'email'
  loop
    perform public.crm_sync_scheduled_emails_for_step(v_step.id);
  end loop;
end;
$$;
