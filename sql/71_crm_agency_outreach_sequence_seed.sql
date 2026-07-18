-- 71_crm_agency_outreach_sequence_seed.sql
-- Seeds the "Initial Agency Sales Outreach" sequence: 7 steps matching the
-- doc's actual phone-first cadence exactly — a call and its backup email fall
-- on the SAME day (call 10:00, email 14:00), not spread across separate days.
-- The final touch is a call-only attempt with no further email.
--
--   Day 1   Step 1  Call   01/08/2026 10:00
--           Step 2  Email  01/08/2026 14:00  (same day, backup/reinforcement)
--   Day 4   Step 3  Call   04/08/2026 10:00
--           Step 4  Email  04/08/2026 14:00  (same day, only if still no response)
--   Day 9   Step 5  Call   09/08/2026 10:00
--           Step 6  Email  09/08/2026 14:00  (same day — the breakup email)
--   Day 16  Step 7  Call   16/08/2026 10:00  (final attempt only, no email — mark Dormant)
--
-- All emails/call scripts use {{first_name}}, {{last_name}}, {{company_name}} —
-- resolved per-contact on step completion (see crm-service.ts), falling back to
-- company_name when no personal contact name is on file, which is the case for
-- every company on this list today.
--
-- Idempotent AND self-correcting: re-running this file always deletes and
-- re-inserts this sequence's steps before recreating them, so a fix like this
-- one can simply be re-run to bring an already-migrated environment up to
-- date. Note this does mean any step-completion ticks already logged against
-- the old (incorrect) step structure will be cleared when this runs — the
-- underlying crm_activities history is untouched either way.

-- Step 1: make sure the sequence itself exists (idempotent — only inserts if missing).
insert into public.crm_sequences (title, description, status)
select
  $txt$Initial Agency Sales Outreach$txt$,
  $txt$Phone-first cadence for the UK VR tour agency prospect list — calls on day 1/4/9/16 from 01/08/2026, each backed up by a same-day email (except the final call-only attempt). See TourBots AI Ltd Agency Sales Outreach Strategy (July 2026) for the full playbook.$txt$,
  'active'
where not exists (
  select 1 from public.crm_sequences where lower(title) = lower('Initial Agency Sales Outreach')
);

-- Step 2: clear out any previously seeded steps for this sequence before re-inserting
-- the corrected structure below. Run as its own statement so it is guaranteed to
-- complete before the insert that follows (no reliance on CTE execution ordering).
delete from public.crm_sequence_steps
where sequence_id = (select id from public.crm_sequences where lower(title) = lower('Initial Agency Sales Outreach'));

-- Step 3: insert the corrected 7-step structure.
insert into public.crm_sequence_steps (
  sequence_id, step_order, title, description, scheduled_date, scheduled_time,
  step_type, email_subject, email_body, call_script
)
select s.id, v.step_order, v.title, v.description, v.scheduled_date, v.scheduled_time,
       v.step_type, v.email_subject, v.email_body, v.call_script
from (select id from public.crm_sequences where lower(title) = lower('Initial Agency Sales Outreach')) s
cross join (
  values
    (
      1,
      $txt$Call 1 — live conversation$txt$,
      $txt$First call attempt. Run the live conversation script if {{first_name}} answers. If it's a gatekeeper or voicemail, leave the voicemail script below and send Email 1 (next step) the same day.$txt$,
      date '2026-08-01',
      time '10:00',
      'call',
      null,
      null,
      $txt$GATEKEEPER / GENERAL LINE
"Hi, is {{first_name}} about? It's Jack from TourBots — I had a quick idea for their virtual tour clients I wanted to run past them, shouldn't take more than a few minutes."
If pushed for more detail: "It's about adding an AI layer to the tours they're already delivering — happy to explain properly when they're free." Don't over-explain to a gatekeeper, just get through.

LIVE CONVERSATION — OPENING
"Hi {{first_name}}, it's Jack — I run a company called TourBots. Sorry to catch you out of the blue, have you got two minutes?"
Wait for a yes. If busy: "No worries at all, when's a better time to grab you for five minutes?" — book it and hang up. Don't pitch to someone who's told you they're busy.

THE PITCH
"So the reason I'm calling — you obviously do virtual tours for your clients already. I've built a platform that adds an AI chatbot on top of the tour — it answers visitor questions instantly and can actually navigate the tour to show people around specific areas when they ask. It's fully white-label, so it sits under your own branding. The way agencies like {{company_name}} use it is pretty simple: you're probably hosting tours for somewhere between £10 and £20 a month right now. This lets you add an AI layer on top and charge your clients £40-50 a month instead — same tour, same client, just a lot more value and a much stronger monthly retainer for you."

THE QUESTION
"How many active tours or clients are you managing at the moment, roughly?" Get them talking, then reflect the number back: "So even if a quarter of those took it up at £40 a month, that's [do the maths live] extra a month for basically no extra work on your end." Let the number land.

THE CLOSE
"I'd love to just get you set up with a free agency account so you can have a proper play with it — no commitment, just have a look and see what you think. Can I grab your email and get that over to you today?" Get the email — that's the win on this call. Then: "Brilliant, I'll get that sent over in the next hour. Give it a proper look, and I'll give you a quick call in a few days to see what you think — sound good?"

OBJECTIONS
"We already have something like this" -> "Oh nice, what are you using? ... Interesting — how's it working out for the tour navigation side of things specifically?" (Most competitors do basic chat only, not navigation — find the gap.)
"Not interested" -> "No worries at all, appreciate you taking the call. Mind if I send you a one-pager anyway in case it's useful down the line?" — always leave the door open.
"Send me some info" -> "Of course — I'll set you up a free account rather than just a PDF so you can actually see it working, that alright?" Get the email either way.
"How much does it cost?" -> "Free to start, then it scales from there — but the real value is in what you can charge your clients on top. Let's get you a free account and you can see the numbers for yourself."

VOICEMAIL (if no answer)
"Hi {{first_name}}, it's Jack Melluish calling from TourBots — sorry I missed you. I had a quick idea about adding AI to the virtual tours you deliver for clients, could be a nice extra monthly revenue line for you. I'll send an email over now, but give me a shout if you get a spare few minutes — cheers, bye." Keep it under 20 seconds. Send Email 1 straight after, same day.

Stop the sequence immediately if they give a clear no, ask to be removed, or express interest — move them to Interested/Not Interested status instead of continuing.$txt$
    ),
    (
      2,
      $txt$Email 1 — same day as Call 1$txt$,
      $txt$Send the same day as the first call, whether it was a live conversation, gatekeeper, or voicemail — keeps TourBots on their radar either way.$txt$,
      date '2026-08-01',
      time '14:00',
      'email',
      $txt$Quick one from our call earlier$txt$,
      $txt$Hi {{first_name}},

Tried to catch you earlier — no worries if now's not the time.

Quick context: I run TourBots, a white-label AI layer for virtual tours. It sits on top of the tours you're already delivering, answers visitor questions instantly, and can navigate the tour to show people specific areas on request.

The angle for agencies like {{company_name}}: most are hosting tours for around £10-20/month. This lets you add an AI tier on top and charge clients £40-50/month instead — same tour, same relationship, meaningfully better monthly value.

Happy to set you up with a free agency account so you can have a proper look, no commitment at all. Just let me know and I'll get it sorted.

Jack$txt$,
      null
    ),
    (
      3,
      $txt$Call 2 — follow-up$txt$,
      $txt$Call again if there's been no response to Email 1. Use the same live conversation script as Call 1 (step 1).$txt$,
      date '2026-08-04',
      time '10:00',
      'call',
      null,
      null,
      $txt$Follow-up attempt — {{first_name}} hasn't responded to Email 1 yet. Use the same opening, pitch, question, and close as Call 1 (see step 1 for the full script). If they mention the earlier email or voicemail, acknowledge it briefly: "Yeah, sorry, I know I've been pestering you a bit — just wanted to catch you properly this time."

If there's still no answer, leave a short voicemail again: "Hi {{first_name}}, Jack again from TourBots — just following up on the email I sent over. No pressure at all, give me a shout if you get a minute." Send Email 2 (next step) the same day only if this call also goes unanswered.

Stop the sequence immediately if they give a clear no, ask to be removed, or express interest.$txt$
    ),
    (
      4,
      $txt$Email 2 — same day as Call 2, only if still no response$txt$,
      $txt$Only send this the same day as Call 2, and only if there's still been no response — i.e. the second call also went unanswered.$txt$,
      date '2026-08-04',
      time '14:00',
      'email',
      $txt$Re: Quick one from our call earlier$txt$,
      $txt$Hi {{first_name}},

Just bumping this back up in case it got buried.

For context on why it might be worth five minutes — we built this off the back of a virtual tour company that used the same platform to sign up a large number of gym clients, each paying significantly more per month than a standard hosting fee, purely because of the AI layer on top.

If it's useful, I can set you up with a free account today so you can see it running on one of your own tours. If it's not the right fit, no problem at all — just let me know and I'll leave you to it.

Jack$txt$,
      null
    ),
    (
      5,
      $txt$Call 3 — follow-up$txt$,
      $txt$Call again if there's still been no response. Use the same live conversation script as Call 1 (step 1), but keep it brief and low-pressure — this is the third attempt.$txt$,
      date '2026-08-09',
      time '10:00',
      'call',
      null,
      null,
      $txt$Brief, low-pressure check-in call. "Hi {{first_name}}, it's Jack from TourBots again — I know I've called a couple of times now, so I'll keep this short. Just wanted to check whether adding an AI layer to your tours is something worth a proper look, or whether it's just not the right fit at the moment — either answer is completely fine." Let them answer honestly.

If genuinely not interested, thank them and update {{company_name}}'s status to Not Interested — do not continue the sequence. If there's still no answer, send the breakup email (next step) the same day.

Stop the sequence immediately if they give a clear no, ask to be removed, or express interest.$txt$
    ),
    (
      6,
      $txt$Email 3 — breakup email, same day as Call 3$txt$,
      $txt$The final scripted email. Send the same day as Call 3, only if there's still no answer.$txt$,
      date '2026-08-09',
      time '14:00',
      'email',
      $txt$Last one from me$txt$,
      $txt$Hi {{first_name}},

Don't want to keep filling your inbox, so I'll leave this as the last one for now.

If adding an AI layer to your tours ever becomes something worth exploring — whether that's now or down the line — the offer of a free account stands, just drop me a reply whenever suits.

Good luck with everything in the meantime.

Jack$txt$,
      null
    ),
    (
      7,
      $txt$Call 4 — final attempt, no further email$txt$,
      $txt$Final call attempt only — no further email after this. If there's still no response, mark {{company_name}} as Dormant rather than continuing to chase.$txt$,
      date '2026-08-16',
      time '10:00',
      'call',
      null,
      null,
      $txt$Final attempt — keep it very brief. "Hi {{first_name}}, it's Jack from TourBots, last time I'll chase this one. Totally understand if now's just not the right time — I'll leave the free account offer open for whenever it is. Take care."

If there's no answer, leave a short voicemail with the same tone, then mark {{company_name}} as Dormant in the CRM. No further email — the sequence ends here.

Stop the sequence immediately if they give a clear no, ask to be removed, or express interest.$txt$
    )
) as v(step_order, title, description, scheduled_date, scheduled_time, step_type, email_subject, email_body, call_script);

-- Step 4: enrol every company from the prospect list as a contact (idempotent).
insert into public.crm_sequence_contacts (sequence_id, company_id)
select s.id, c.id
from (select id from public.crm_sequences where lower(title) = lower('Initial Agency Sales Outreach')) s
cross join public.crm_companies c
where c.source = 'UK VR Tour Prospect List'
on conflict (sequence_id, company_id) do nothing;
