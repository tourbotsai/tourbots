# Production E2E Tick List

Date: 14/04/2026  
Target: `tourbots.ai`  
External test site: `https://bodyactivegym.vercel.app`

Test account email: `apexfacilitiespricing@gmail.com`  
Test account password: `Test1234*`
Apex Test

Local Test account email: `testone@test.com`  
Test account password: `Test1234*`

## TO DO
- [X] Confirm live app opens at `tourbots.ai`.
- [X] Create account (or log in with test account above).
- [X] Confirm successful redirect into app dashboard.
- [X] Go to `App -> Tours`. Add Matterport tour URL. Save tour.
- [X] Add + test tour points.
- [X] Add + switch to second model
- [X] Go to `Tours -> Tour Menu`.
- [X] Create menu sections/items linked to points.
- [X] Save menu.
- [X] Refresh and confirm menu persists.

## E) Chatbot Flow

- [X] Go to `App -> Chatbots`.
- [X] Add chatbot information content.
- [X] Upload at least one knowledge document.
- [X] Add at least 2 trigger rules.
- [X] Apply chatbot customisation/branding.
- [X] Full Playground testing:
- [X] Test question: pricing.
  - Test: Testing pricing trigger, AI Response + URL
  - Prompt: "How much is a monthly membership, and do you offer off-peak or student rates?"
- [X] Test question: opening times.
  - Prompt: "What are your opening hours at the weekend?"
- [X] Test Testing uploaded document, class time.
  - Prompt: "What time is the Yoga Flow class on a Saturday?"
  - Expected (from timetable doc): 11:00.
- [X] Test off-topic question.
  - Prompt: "What's the best film to watch this weekend?"
- [X] Test all customisation settings Desktop/Mobile

## F) Tour Embed Flow (External Site)

- [X] Go to `Tours -> Share & Embed`.
- [X] Copy tour embed code.
- [X] Paste code into other webiste repo.
- [X] Confirm embed loads correctly.
- [X] Confirm chatbot opens and responds.
  - Send multile messages in one chat
- [X] Confirm tour navigation actions work.
  - Prompt: "Can you take me to the free weights area?"
- [X] Confirm mobile view works.
- [X] Confirm desktop view works.

## G) Tracking and Analytics

- [ ] Generate real embed interactions (views, messages, navigation).
- [ ] Check TourBots analytics for matching events.
- [ ] Confirm events are tied to correct venue/tour.

## H) Agency Portal Flow

- [ ] Enable/confirm agency portal add-on for account.
- [ ] Go to `Settings -> Agency Settings`.
- [ ] Configure branding and allowed domains.
- [ ] Create agency share for a test tour.
- [ ] Create/reset agency client login credentials.
- [ ] Open agency preview URL.
- [ ] Log in as agency client.
- [ ] Confirm enabled modules load.
- [ ] Confirm disabled modules are blocked.
- [ ] Confirm logout and session handling work.

## I) Agency Embed Flow (External Site)

- [ ] Copy agency embed code.
- [ ] Paste into `bodyactivegym.vercel.app` (or test page).
- [ ] Publish/redeploy.
- [ ] Confirm agency embed loads.
- [ ] Confirm login works inside embed.
- [ ] Confirm allowed actions work from embed context.

## J) Bugs and UX Sweep (Do Throughout)

- [ ] Log every bug immediately (what happened, expected, screenshot).
- [ ] Mark severity: `P0`, `P1`, `P2`, `P3`.
- [ ] Fix critical issues found during run.
- [ ] Re-test each fixed issue.

## K) Final Sign-off

- [ ] Customer flow passes end-to-end.
- [ ] Tour embed passes on external site.
- [ ] Tracking/analytics pass.
- [ ] Agency portal flow passes.
- [ ] Agency embed flow passes.
- [ ] No open `P0` or `P1` issues.
