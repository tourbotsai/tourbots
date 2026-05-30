# Production E2E Tick List

Date: 14/04/2026  
Target: `tourbots.ai`  
External test sites: `https://bodyactivegym.vercel.app` & `https://apexvrtours.vercel.app`

User Test Account (Bodyactive Vercel) Email: `testone@test.com`  
User Test Account Password: `Test1234*`

Agency Owner Test Account Email: `touragency@test.com`
Agency Owner Test Account Password: `Test1234*`

Agency Client Test Account Email: `uniqueclient@test.com`
Agency Client Test Account Password: `NqhoGMYu9v69kq` `5MRvCy5uKefBW5`

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

- [X] Generate real embed interactions (views, moves, messages, navigation).
- [X] Check TourBots analytics for matching events.
- [X] Confirm events are tied to correct venue/tour.

## H) Agency Portal Flow

- [X] Upgrade to agency plan for account.
- [X] Go to `Settings -> Agency Settings`.
- [X] Configure branding 
- [X] Create client portal for a test tour.
- [X] Create/reset agency client login credentials.
- [X] Open agency preview URL.
- [X] Log in as agency client.
- [X] Confirm logout and session handling work.
- [X] Confirm enabled modules load.
- [X] Confirm disabled modules are blocked.

## I) Agency Embed Flow (External Site)

- [X] Set up allowed domains.
- [X] Copy agency embed code.
- [X] Paste into `https://apexvrtours.vercel.app/tourmanagement`.
- [X] Publish/redeploy.
- [X] Confirm agency embed loads.
- [X] Confirm login works inside embed.
- [ ] Confirm allowed actions work from embed context.

## J) Billing Flow

- Plans (free / pro / agency):
  - [x] Go to `Settings -> Billing`; three plan cards (Free, Pro, Agency), current plan, status, and limits display.
  - [ ] On a free account, click `Upgrade plan` on Pro; complete Stripe checkout; confirm plan `Pro`, status `active`, limits update, invoice appears.
  - [x] On a free account, click `Upgrade plan` on Agency; complete Stripe checkout; plan `Agency`, status `active`, 3 spaces / 3,000 messages, white-label enabled, invoice appears. *(verified 30/05/2026, local Stripe test)*
  - [x] Confirm the Agency plan card lists its four features (incl. white-label / branded client portals).
  - [x] After upgrading to Agency, the `Agency` tab appears in the app sidebar and the portal is active with no manual enable step. *(verified 30/05/2026)*

- Plan switching (pro <-> agency):
  - [ ] On Pro, click `Switch to Agency`; confirm no checkout (in-app), plan becomes `Agency` with prorated billing and limits update to the agency pool.
  - [ ] On Agency, click `Switch to Pro`; confirm plan becomes `Pro` and agency add-ons section disappears (core add-ons section appears).
  - [ ] Confirm an invoice / proration line appears for the switch.

- Core add-ons (Pro only):
  - [ ] On free or agency, confirm the `Core add-ons` section is not shown (Pro only).
  - [ ] On Pro, buy extra spaces (quantity > 1); confirm count + total limits update.
  - [ ] On Pro, buy a message block; confirm count + total messages update.
  - [ ] On Pro, enable white-label; confirm status shows `active`.

- Agency add-ons (Agency only):
  - [x] On free or pro, confirm the `Agency add-ons` section is not shown (Agency only).
  - [x] On Agency, buy an agency additional space (£9.99); total spaces update (4 active) and a separate invoice is generated. *(verified 30/05/2026, local Stripe test)*
  - [x] On Agency, buy an agency message block (£9.99); total messages update (+1,000 -> 4,000) and a separate invoice is generated. *(verified 30/05/2026, local Stripe test)*
  - [x] Confirm white-label is NOT offered as a purchasable add-on on Agency (included with the plan).

- Current plan / add-on display:
  - [x] Current plan bar shows status `active` and a next payment date (not `pending` / `Not available`). *(verified 30/05/2026)*
  - [x] Each purchased add-on appears as its own row with status, start date, next payment, amount and quantity (separate rows per purchase). *(verified 30/05/2026)*
  - [x] `Manage plan` opens the Stripe customer portal showing the plan and all add-on subscriptions. *(verified 30/05/2026)*
  - [x] All subscriptions and invoices for a venue share a single Stripe customer (plan + add-ons grouped together). *(verified 30/05/2026)*

- Cancellation:
  - [ ] Pro: cancel a single core add-on; confirm only that add-on is scheduled and others stay active.
  - [ ] Agency: cancel a single agency add-on; confirm only that add-on is scheduled and others stay active.
  - [ ] Cancel the main plan via `Manage plan` (Stripe customer portal); confirm at period end the plan drops to free and add-ons clear.
  - [ ] `Reactivate` a scheduled cancellation; confirm it resumes correctly.

## K) Platform Admin Flow

- [ ] Log in with a platform admin account (email matches `PLATFORM_ADMIN_EMAIL`).
- [ ] Confirm `Platform Admin` link appears in the app sidebar and opens `/admin/dashboard`.
- [ ] Confirm a normal (non-admin) user is redirected away from `/admin/*` and admin APIs return 401/403.

- Dashboard:
  - [ ] Confirm KPIs load (total accounts, total messages, total conversations, monthly revenue).
  - [ ] Click `Refresh`; confirm "Last updated" timestamp changes.

- Accounts:
  - [ ] Open `Accounts`; confirm list loads (company, contact, email, phone, tours count, created).
  - [ ] Open an account; edit and `Save` company details (name, email, phone, address).
  - [ ] Toggle setup mode; refresh and confirm it persists.
  - [ ] Confirm billing summary displays (revenue, message usage, active spaces, plan, add-ons).
  - [ ] Select a tour; confirm `Tour Setup`, `Tour Menu`, `Share & Embed`, `Analytics` tabs load.
  - [ ] In `Share & Embed`, copy preview URL / embed code and open preview.
  - [ ] Edit + `Save` chatbot config (name, welcome, prompts, guardrails, active toggle, rate/hard limits).
  - [ ] Add/edit a chatbot info section, upload a training document, add a trigger, apply customisation.

- Payments:
  - [ ] Open `Payments -> Subscriptions & Add-ons`; search a venue.
  - [ ] Change plan / billing status / extra spaces / message blocks / limit overrides / white-label; `Save`.
  - [ ] Confirm the change reflects on that account's billing panel.
  - [ ] `Payment Links`: create a payment link (venue, email, plan, cycle); confirm it appears in the table; copy link.

- Outbound:
  - [ ] `Leads Database`: search a lead; open detail modal; add a note and `Save`.
  - [ ] `Automated Sequences`: create a sequence with multiple email steps.
  - [ ] Open sequence detail; `Add leads` (enrol a lead); confirm scheduled email actions appear.
  - [ ] `Pause` then `Activate` the sequence.

- Help Centre:
  - [ ] `Help Articles`: create a draft article; publish it; view the public article.
  - [ ] Edit then delete a test article.
  - [ ] `Contact Form`: open a conversation; send a reply.

- Resources:
  - [ ] `Blogs`: create + publish (or schedule) a blog; view public page; delete the test blog.
  - [ ] `Guides`: create + publish a guide (set difficulty); view public page; delete the test guide.

## L) Bugs and UX Sweep (Do Throughout)

- [ ] Log every bug immediately (what happened, expected, screenshot).
- [ ] Mark severity: `P0`, `P1`, `P2`, `P3`.
- [ ] Fix critical issues found during run.
- [ ] Re-test each fixed issue.

## M) Final Sign-off

- [ ] Customer flow passes end-to-end.
- [ ] Tour embed passes on external site.
- [ ] Tracking/analytics pass.
- [ ] Agency portal flow passes.
- [ ] Agency embed flow passes.
- [ ] Billing flow passes.
- [ ] Platform admin flow passes.
- [ ] No open `P0` or `P1` issues.
