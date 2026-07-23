-- 76_crm_agency_sequence_a_call_led.sql
-- Replaces the 7-step "Initial Agency Sales Outreach" cadence (4 calls + 3
-- emails, Day 1/4/9/16) with "TourBots Agency Sequence A - Call Led" (3
-- calls + 4 emails, Day 1/4/9/14). Pure content/data change — no application
-- code touches step count or mix, so nothing else needs to change.
--
-- Idempotent AND self-correcting, same pattern as 71: matches the sequence
-- by either its old or new title (safe to re-run even after the rename has
-- already applied), deletes and re-inserts its steps every run, and always
-- recomputes anchor_date + scheduled_for from scratch so re-running always
-- converges on the same state.
--
-- Recomputing anchor_date is necessary (not just a step-content change):
-- the new Day-14 breakup email adds a 4th landing day per enrollment cohort
-- that the migration 74 ramp never accounted for (it only ever planned
-- around 3 email offsets: 0, +3, +8). Re-run through the same look-ahead
-- scheduler with the new offset set (calls 0/+3/+8, emails 0/+3/+8/+13),
-- still capped at 10/day, Monday-Friday, guaranteeing total daily volume
-- (new enrollments + every follow-up landing that day) never exceeds 10:
--
--   - All 64 companies fully enrolled by 15/09/2026.
--   - Last company's Day-14 breakup email lands 28/09/2026.
--   - Peak verified daily volume: 10, never exceeded.

-- --------
-- 1. Rename + update the sequence in place
-- --------

update public.crm_sequences
set
  title = 'TourBots Agency Sequence A - Call Led',
  description = $txt$Call first, email as backup. 3 calls, 4 emails, spaced Day 1, Day 4, Day 9, Day 14. Each email under 80 words. Stop the whole sequence immediately on any answered call with a clear outcome, interested or not.$txt$
where lower(title) in (lower('Initial Agency Sales Outreach'), lower('TourBots Agency Sequence A - Call Led'));

-- --------
-- 2. Clear out the old steps before re-inserting the new structure. Run as
--    its own statement so it is guaranteed to complete before the insert
--    that follows (no reliance on CTE execution ordering).
-- --------

delete from public.crm_sequence_steps
where sequence_id = (
  select id from public.crm_sequences where lower(title) = lower('TourBots Agency Sequence A - Call Led')
);

-- --------
-- 3. Insert the new 7-step structure: 3 calls + 4 emails, Day 1/4/9/14.
-- --------

insert into public.crm_sequence_steps (
  sequence_id, step_order, title, description, scheduled_date, scheduled_time,
  step_type, email_subject, email_body, call_script
)
select s.id, v.step_order, v.title, v.description, v.scheduled_date, v.scheduled_time,
       v.step_type, v.email_subject, v.email_body, v.call_script
from (select id from public.crm_sequences where lower(title) = lower('TourBots Agency Sequence A - Call Led')) s
cross join (
  values
    (
      1,
      $txt$Call 1 — live conversation$txt$,
      $txt$Morning call. If answered with a clear outcome, stop sequence. If no answer or voicemail, send Email 1 same day.$txt$,
      date '2026-08-01',
      time '10:00',
      'call',
      null,
      null,
      $txt$OPENING
Hi {{first_name}}, it's Jack, I run a company called TourBots. Sorry to catch you out of the blue, have you got two minutes?
Wait for a yes. If they say they are busy: no worries at all, when is a better time to grab you for five minutes. Book it and hang up. Don't pitch to someone who has told you they are busy.

THE PITCH
So the reason I'm calling, you obviously do virtual tours for your clients already. I've built a platform that adds an AI chatbot on top of the tour. It answers visitor questions instantly and can actually navigate the tour to show people around specific areas when they ask. It's fully white label, so it sits under your own branding. The way agencies like yours use it is pretty simple. You're probably hosting tours for somewhere between ten and twenty pounds a month right now. This lets you add an AI layer on top and charge your clients thirty to fifty pounds a month instead. Same tour, same client, just a lot more value and a much stronger monthly retainer for you.

THE QUESTION
How many active tours or clients are you managing at the moment, roughly?
Get them talking about their own numbers. Once they give you a figure, reflect it back: so even if a quarter of those took it up at forty pounds a month, that is [do the maths live] extra a month for basically no extra work on your end. Let the number land.

THE CLOSE
I'd love to just get you set up with a free agency account so you can have a proper play with it, no commitment, just have a look and see what you think. Can I grab your email and get that over to you today?
Get the email. That is the win on this call, not a sale, an account set up and a warm lead. Once you have the email: brilliant, I'll get that sent over in the next hour. Give it a proper look, and I'll give you a quick call in a few days to see what you think, sound good?

VOICEMAIL (if no answer)
Hi {{first_name}}, it's Jack Melluish calling from TourBots, sorry I missed you. I had a quick idea about adding AI to the virtual tours you deliver for clients, could be a nice extra monthly revenue line for you. I'll send an email over now, but give me a shout if you get a spare few minutes, cheers, bye.
Keep it under 20 seconds. Always follow with Email 1 the same day so the voicemail and email reinforce each other.

Stop the sequence immediately if they give a clear no, ask to be removed, or express interest — move them to Interested/Not Interested status instead of continuing.$txt$
    ),
    (
      2,
      $txt$Email 1 — same day as Call 1$txt$,
      $txt$The general opener. No pricing, no sales angle, just a clear explanation of what it is.$txt$,
      date '2026-08-01',
      time '14:00',
      'email',
      $txt$Add AI to your virtual tours$txt$,
      $txt$Hi {{first_name}},

Quick one. Just tried to give you a call.

I run TourBots AI, a platform that adds an AI guide to virtual tours. It sits on any Matterport tour, answers visitor questions, and can navigate the tour to specific areas on request.

Might be useful given {{company_name}} works in virtual tours.

Happy to set you up with a free account so you can see it run on one of your own tours, or jump on a call to walk you through it. No cost, no commitment.

Jack$txt$,
      null
    ),
    (
      3,
      $txt$Call 2 — follow-up$txt$,
      $txt$Second call attempt. If answered with a clear outcome, stop sequence. If no answer, send Email 2 same day.$txt$,
      date '2026-08-04',
      time '10:00',
      'call',
      null,
      null,
      $txt$OPENING
Hi {{first_name}}, it's Jack again from TourBots, sorry to keep trying, have you got two minutes now?

THE PITCH
Just wanted to catch you properly this time. I've built a platform that adds an AI chatbot on top of virtual tours, answers visitor questions instantly and can navigate the tour to show people around specific areas when they ask. Fully white label, sits under your own branding. Most agencies are hosting tours for ten to twenty pounds a month right now. This lets you add an AI layer on top and charge thirty to fifty pounds a month instead. Same tour, same client, just a lot more value each month.

THE QUESTION
How many active tours or clients are you managing at the moment, roughly?

THE CLOSE
I'd love to just get you set up with a free agency account so you can have a proper play with it, no commitment. Can I grab your email and get that over to you today?

Same objection handling and voicemail approach as Call 1 if needed.

Stop the sequence immediately if they give a clear no, ask to be removed, or express interest — move them to Interested/Not Interested status instead of continuing.$txt$
    ),
    (
      4,
      $txt$Email 2 — same day as Call 2$txt$,
      $txt$The economics angle. First mention of the revenue upside, now that they have had the general context from Email 1.$txt$,
      date '2026-08-04',
      time '14:00',
      'email',
      $txt$more than a hosting fee$txt$,
      $txt$Hi {{first_name}},

Tried to catch you again.

Most agencies host tours for around £10 to £20 a month. TourBots lets you add an AI layer on top and charge £30 to £50 a month instead. Same tour, same client relationship, just a lot more value each month.

Happy to set you up with a free account so you can see it working, or jump on a call to walk you through it.

Jack$txt$,
      null
    ),
    (
      5,
      $txt$Call 3 — follow-up$txt$,
      $txt$Third call attempt. If answered with a clear outcome, stop sequence. If no answer, send Email 3 same day.$txt$,
      date '2026-08-09',
      time '10:00',
      'call',
      null,
      null,
      $txt$OPENING
Hi {{first_name}}, Jack again from TourBots, I promise this is the last time I chase, have you got two minutes?

THE PITCH
Same thing I mentioned before. AI chatbot on top of the virtual tours you're already delivering, answers questions and navigates the tour on request, fully white label under your own branding. Lets you take a ten to twenty pound a month hosting fee and turn it into thirty to fifty pounds a month with the AI layer added.

THE CLOSE
Rather than keep calling, happy to just get you set up with a free account so you can see it for yourself whenever suits. Can I grab your email?

Stop the sequence immediately if they give a clear no, ask to be removed, or express interest — move them to Interested/Not Interested status instead of continuing.$txt$
    ),
    (
      6,
      $txt$Email 3 — same day as Call 3$txt$,
      $txt$A new angle, not a repeat. White label control, addressing the "yet another platform" objection before it is raised.$txt$,
      date '2026-08-09',
      time '14:00',
      'email',
      $txt$your own branding, not ours$txt$,
      $txt$Hi {{first_name}},

One more thing worth knowing. TourBots runs fully white label. Your clients log into a portal under your own branding and domain. They never see TourBots anywhere, you keep the relationship and set the price.

Worth a quick look at what that looks like set up under {{company_name}}'s own domain?

Jack$txt$,
      null
    ),
    (
      7,
      $txt$Email 4 — breakup, Day 14$txt$,
      $txt$No call attempt. Email only, sent regardless of previous call outcomes (unless the company has already moved to Interested/Not Interested/Dormant). Breakup emails consistently outperform other follow-ups in reply rate — removes pressure, offers an easy out, keeps the free account offer live rather than closing the door.$txt$,
      date '2026-08-14',
      time '14:00',
      'email',
      $txt$Last one from me$txt$,
      $txt$Hi {{first_name}},

Don't want to keep filling your inbox, so I'll leave this as the last one for now.

If adding an AI layer to your tours ever becomes something worth exploring, whether that's now or down the line, the offer of a free account stands. Just drop me a reply whenever suits.

Good luck with everything in the meantime.

Jack$txt$,
      null
    )
) as v(step_order, title, description, scheduled_date, scheduled_time, step_type, email_subject, email_body, call_script);

-- --------
-- 4. Recompute anchor_date for the 64 enrolled companies against the new
--    offset set (calls 0/+3/+8, emails 0/+3/+8/+13), via the same
--    look-ahead scheduler introduced in migration 74. Ordered
--    deterministically by company_name so re-runs always land on the same
--    assignment. The array below is the scheduler's output, not hand-picked.
-- --------

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
    date '2026-08-12', date '2026-08-12', date '2026-08-18', date '2026-08-18',
    date '2026-08-18', date '2026-08-18', date '2026-08-18', date '2026-08-18',
    date '2026-08-18', date '2026-08-19', date '2026-08-20', date '2026-08-20',
    date '2026-08-20', date '2026-08-25', date '2026-08-25', date '2026-08-25',
    date '2026-08-25', date '2026-08-25', date '2026-08-25', date '2026-08-26',
    date '2026-08-26', date '2026-08-26', date '2026-09-01', date '2026-09-01',
    date '2026-09-01', date '2026-09-01', date '2026-09-01', date '2026-09-01',
    date '2026-09-01', date '2026-09-01', date '2026-09-01', date '2026-09-02',
    date '2026-09-03', date '2026-09-03', date '2026-09-03', date '2026-09-08',
    date '2026-09-08', date '2026-09-08', date '2026-09-08', date '2026-09-08',
    date '2026-09-08', date '2026-09-08', date '2026-09-09', date '2026-09-15'
  ]) with ordinality as t(anchor_date, rn)
)
update public.crm_sequence_contacts sc
set anchor_date = a.anchor_date
from ordered_companies oc
join anchor_slots a on a.rn = oc.rn
where sc.company_id = oc.id
  and sc.sequence_id = (
    select id from public.crm_sequences where lower(title) = lower('TourBots Agency Sequence A - Call Led')
  );

-- --------
-- 5. Regenerate scheduled emails for the 4 new email steps against the
--    freshly recomputed anchor dates. The old scheduled-email rows were
--    already cascade-deleted along with the old steps in step 2 above, so
--    this is a clean insert, not a merge.
-- --------

do $$
declare
  v_step record;
begin
  for v_step in
    select st.id
    from public.crm_sequence_steps st
    join public.crm_sequences sq on sq.id = st.sequence_id
    where lower(sq.title) = lower('TourBots Agency Sequence A - Call Led')
      and st.step_type = 'email'
  loop
    perform public.crm_sync_scheduled_emails_for_step(v_step.id);
  end loop;
end;
$$;
