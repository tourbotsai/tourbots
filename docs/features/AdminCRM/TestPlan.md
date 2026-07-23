# Admin CRM — Test Plan

Last updated: 18/07/2026

Manual end-to-end test plan for the Gmail send + inbound-reply pipeline, using the dedicated internal QA sequence (migration `sql/79_crm_internal_qa_test_sequence.sql`). Everything here sends only to two addresses you control — `jack.melluish@centrus.ai` and `jackoliverdev@gmail.com` — never to a real prospect. See [Overview.md](./Overview.md) for how each piece works under the hood.

## 0. Pre-requisites (one-off)

- [ ] **Google Cloud Console**: `https://www.googleapis.com/auth/gmail.readonly` added to the OAuth consent screen's scopes (you confirmed this is already done).
- [ ] **Run migration `sql/79_crm_internal_qa_test_sequence.sql`** — creates the two test companies, the "Internal QA Test Sequence" (3 calls + 4 emails, Day 0/1/2/3 starting the day after you run it), enrols both contacts, and queues their scheduled emails.
- [ ] **Push the code** in this change set (SQL 79, Gmail service, CRM service, new poll cron route, frontend badges/tooltips).
- [ ] **Reconnect Gmail**: on `/admin/crm`, disconnect the existing `jack@tourbotsai.com` connection and reconnect it. This is required because the existing refresh token only carries the old `gmail.send` grant — it will not pick up `gmail.readonly` until you re-consent. Confirm the account picker shows `jack@tourbotsai.com` (not the admin login email) and that the connect succeeds without an `org_internal` error.

## 1. Sanity-check the test data landed correctly

- [ ] Go to `/admin/crm` → Companies tab. Confirm **Centrus (Test)** (`jack.melluish@centrus.ai`) and **Oliver (Test)** (`jackoliverdev@gmail.com`) both exist, status `In sequence`, not stopped.
- [ ] Go to Sequences tab. Confirm **Internal QA Test Sequence** exists with 2 contacts and 7 steps.
- [ ] Open the sequence. Expand **Steps**. Confirm the 7 steps show in order: Call 1 (Day 0), Email 1 (Day 0), Call 2 (Day 1), Email 2 (Day 1), Call 3 (Day 2), Email 3 (Day 2), Email 4 — breakup (Day 3).
- [ ] Expand **Contacts**. Confirm both test contacts are listed, neither stopped, search box filters correctly by typing "centrus" or "oliver".

## 2. Auto-send (the main thing being tested)

Emails only send once the cron actually runs. Until Vercel is upgraded, trigger it manually:

```bash
curl -X POST https://<your-domain>/api/cron/send-crm-sequence-emails \
  -H "Authorization: Bearer <CRON_SECRET>"
```

- [ ] **Before Day 0's 14:00**: run the command above. Response should show `processed: 0` (nothing due yet) — confirms the cron runs cleanly with no false positives.
- [ ] **On/after Day 0 14:00**: run it again. Both `jack.melluish@centrus.ai` and `jackoliverdev@gmail.com` should receive **"[TEST] Add AI to your virtual tours"** within a minute or two.
- [ ] Check each inbox: sender is `jack@tourbotsai.com` (or the display name on that account), body has `{{first_name}}` resolved to **Jack** (not left as literal `{{first_name}}` and not falling back to the company name), and reads cleanly as plain text.
- [ ] On the sequence page, that step's row for both contacts should now show **"Sent [date/time]"** with an **Undo** link, not the "Sending..." or "Failed" state.
- [ ] On each company's detail page → Activity History, confirm an **Email** activity was logged automatically (not "Reply received" — this is an outbound send) with the resolved subject/body visible when expanded.
- [ ] Repeat this check on/after Day 1 14:00 (Email 2) and Day 2 14:00 (Email 3) as those days arrive — same expectations each time.

## 3. Inbound reply → auto-stop (test with Email 2)

- [ ] Once **Email 2** ("[TEST] more than a hosting fee") has sent to both addresses, reply to it from **one** of the two inboxes only (e.g. `jack.melluish@centrus.ai`) — leave the other one untouched.
- [ ] Trigger the inbound poll cron manually:

```bash
curl -X POST https://<your-domain>/api/cron/poll-crm-inbound-emails \
  -H "Authorization: Bearer <CRON_SECRET>"
```

- [ ] Response should show `matched: 1`. Note: the **first ever** call to this endpoint after reconnecting Gmail will bootstrap `last_history_id` and process nothing (`checked: 0`) — that's expected; run it once to bootstrap, send/reply, then run it again to actually detect the reply.
- [ ] On the **replied-from** company's detail page: a new **"Reply received"** activity (indigo badge) should appear in Activity History, with the reply's text visible when expanded.
- [ ] That company should now show the **Stopped** badge everywhere it appears (main table, company detail, sequence contacts list) — hover it and confirm the tooltip says **"Stopped automatically — a reply was detected on [date/time]"**, not "Stopped manually".
- [ ] On the sequence page, that contact's remaining steps (Call 3, Email 3, Email 4) should show **"Stopped — do not call"** / **"Stopped — no automated email"** instead of action buttons.
- [ ] Run the send cron again once Email 3's time arrives: confirm the **stopped** contact does **not** receive it, while the **other, un-replied** test contact **does** receive it as normal — proves the stop is scoped to one contact, not the whole sequence.
- [ ] Resume the stopped contact afterwards (Resume button) if you want to keep testing with it, or leave it stopped — either is fine for this test.

## 4. Call step outcomes

Use **Call 1**, **Call 2** and **Call 3** across the two contacts to exercise all three outcome paths (e.g. try a different outcome on each contact/step combination so all three get covered at least once):

- [ ] **No answer**: click it. Should complete immediately with no modal. Confirm an activity is logged (Activity History → Call, no outcome text needed beyond "No answer" label) and the row shows the "Logged to activity history" / Undo state.
- [ ] **Positive**: click it, a modal should open. Type a note (e.g. "Said he'd take a look, call back Thursday"), save. Confirm: the activity's summary is your note (not the default call script text), outcome shows "Positive", and the contact is **not** stopped — its other steps remain actionable.
- [ ] **Negative, without ticking "stop outreach"**: click it, type a note, leave the checkbox unticked, save. Confirm: activity logged with outcome "Negative", contact is **not** stopped, sequence continues as normal.
- [ ] **Negative, with "stop outreach for this contact" ticked**: click it, type a note, tick the checkbox, save. Confirm: activity logged, and the contact immediately shows the **Stopped** badge (tooltip: "Stopped manually on [date/time]") everywhere, with all its other pending steps showing the stopped state.
- [ ] For any of the above, click **Undo** on a completed step and confirm the tick reverts (step becomes actionable again) but the activity you just logged is still visible, unchanged, in Activity History — history is never deleted by Undo.

## 5. Email "Mark as sent"

- [ ] On an email step that hasn't sent yet (or after resetting one via Undo), click **Mark as sent**.
- [ ] Confirm: no email actually leaves Gmail, but an activity is logged, the step ticks, and — check the underlying scheduled-email row's status — it flips straight to `sent` so the send cron will not also try to send it for real afterwards.

## 6. Regression check on the real production sequence

Not part of the QA sequence, but worth a final glance before trusting all this against the 64 real companies:

- [ ] Open **TourBots Agency Sequence A - Call Led**. Confirm the Contacts/Steps cards still collapse/expand correctly, the per-contact list still sorts by due date, search still works, and none of the real companies were accidentally affected by anything above (they use a different sequence and different companies entirely, so this should be a no-op check).
- [ ] Confirm the send and poll crons both ran cleanly against the full 64-company sequence with no unexpected errors in the response payload (`errors: []` or absent).

## Sign-off

Once every box above is ticked, the pipeline is proven safe to rely on for the real 64-company sequence with no further manual babysitting beyond working the Upcoming Actions / Steps lists day to day.
