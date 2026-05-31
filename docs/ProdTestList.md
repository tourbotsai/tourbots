# Production E2E Tick List

Date: 14/04/2026  
Target: `tourbots.ai`  
External test sites: `https://bodyactivegym.vercel.app` & `https://apexvrtours.vercel.app`

Platform Admin Test Account Email: tourbotsai@gmail.com

User Test Account (BodyactiveVercel) Email: `testone@test.com`  
User Test Account Password: `Test1234*`

Agency Owner Test Account Email (ApexVRtours): `touragency@test.com`
Agency Owner Test Account Password: `Test1234*`

Agency Client Test Account Email (ApexVRtours): `uniqueclient@test.com`
Agency Client Test Account Password: `NqhoGMYu9v69kq` `5MRvCy5uKefBW5`

## TO DO

## A) App Flow
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

## B) Chatbot Flow

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

## C) Tour Embed Flow (External Site)

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

## D) Tracking and Analytics

- [X] Generate real embed interactions (views, moves, messages, navigation).
- [X] Check TourBots analytics for matching events.
- [X] Confirm events are tied to correct venue/tour.

## E) Agency Portal Flow

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

## F) Agency Embed Flow (External Site)

- [X] Set up allowed domains.
- [X] Copy agency embed code.
- [X] Paste into `https://apexvrtours.vercel.app/tourmanagement`.
- [X] Publish/redeploy.
- [X] Confirm agency embed loads.
- [X] Confirm login works inside embed.
- [X] Confirm allowed actions work from embed context.
- [X] Confirm allocated message allowance works
- [X] Confirm white labelled embed code works

## G) Billing Flow

- Plans (free / pro / agency):
  - [X] Go to `Settings -> Billing`; three plan cards (Free, Pro, Agency), current plan, status, and limits display.
  - [X] On a free account, click `Upgrade plan` on Pro; complete Stripe checkout; confirm plan `Pro`, status `active`, limits update, invoice appears.
  - [X] On a free account, click `Upgrade plan` on Agency; complete Stripe checkout; plan `Agency`, status `active`, 3 spaces / 3,000 messages, white-label enabled, invoice appears. *(verified 30/05/2026, local Stripe test)*
  - [X] Confirm the Agency plan card lists its four features (incl. white-label / branded client portals).
  - [X] After upgrading to Agency, the `Agency` tab appears in the app sidebar and the portal is active with no manual enable step. *(verified 30/05/2026)*

- Plan switching (pro <-> agency):
  - [X] On Pro no addons, click `Switch to Agency`; confirm no checkout (in-app), plan becomes `Agency` with prorated billing and limits update to the agency pool. - `proplanswitch@test.com`
  - [X] On Agency no addons, click `Switch to Pro`; confirm plan becomes `Pro` and agency add-ons section disappears (core add-ons section appears). - `agencyplanswitch@test.com`
  - [X] Confirm an invoice / proration line appears in for the switch. (Pending invoice items in Stripe: credit for unused outgoing plan + charge for new plan, applied to next invoice.)
  - [X] On Pro with core Addons enabled, click `Switch to Agency`; confirm no checkout (in-app), plan becomes `Agency` with prorated billing and limits update to the agency pool. Confirm the core add-ons are cancelled as part of the switch (cascade): add-on counters reset, no core add-on subscriptions left active in Stripe, and a proration credit is generated for the unused add-on time. `protoagencyaddons@test.com`
  - [X] On Agency with agency addons enabled, click `Switch to Pro`; confirm plan becomes `Pro` and agency add-ons section disappears (core add-ons section appears). Confirm the agency add-ons are cancelled as part of the switch (cascade): counters reset, no agency add-on subscriptions left active in Stripe, and a proration credit is generated. `agencytoproaddons@test.com`

- Core add-ons (Pro only):
  - [X] On free or agency, confirm the `Core add-ons` section is not shown (Pro only).
  - [X] On Pro, buy extra spaces (quantity > 1); confirm count + total limits update.
  - [X] On Pro, buy a message block; confirm count + total messages update.
  - [X] On Pro, enable white-label; confirm status shows `active`.

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
  - [x] Pro: cancel a single core add-on; confirm only that add-on is scheduled and others stay active.
  - [x] Agency: cancel the agency plan; confirm scheduling (period-end drop to free tracked in section I).
  - [x] Cancel the main plan via `Manage plan` (Stripe customer portal); add-ons cascade to cancelling confirmed (period-end drop to free / add-ons clear tracked in section I).
  - [x] `Reactivate` a scheduled cancellation; confirm it resumes correctly.
    - `billingreactivate@test.com` 

## H) Platform Admin Flow

- [X] Log in with a platform admin account (email matches `PLATFORM_ADMIN_EMAIL`).
- [X] Confirm `Platform Admin` link appears in the app sidebar and opens `/admin/dashboard`.
- [X] Confirm a normal (non-admin) user is redirected away from `/admin/*` and admin APIs return 401/403.

- Dashboard:
  - [X] Confirm KPIs load (total accounts, total messages, total conversations, total views, total moves, monthly revenue).
  - [X] Click `Refresh`; confirm "Last updated" timestamp changes.

- Accounts:
  - [X] Open `Accounts`; confirm list loads (company, contact, email, phone, tours count, created).
  - [X] Open an account; edit and `Save` company details (name, email, phone, address).
  - [X] Confirm billing summary displays (revenue, message usage, active spaces, plan, add-ons).
  - [X] Select a tour; confirm `Tour Setup`, `Tour Menu`, `Share & Embed`, `Analytics` tabs load.
  - [X] In `Share & Embed`, copy preview URL / embed code and open preview.
  - [X] Edit + `Save` chatbot config (name, welcome, prompts, guardrails, active toggle, rate/hard limits).
  - [X] Add/edit a chatbot info section, upload a training document, add a trigger, apply customisation.

- Payments:
  - [X] Open `Payments -> Subscriptions & Add-ons`; search a venue.
  - [X] Change plan / billing status / extra spaces / message blocks / limit overrides / white-label; `Save`.
  - [X] Confirm the change reflects on that account's billing panel.

- Help Centre:
  - [X] `Help Articles`: create a draft article; publish it; view the public article.
  - [X] Edit then delete a test article.
  - [X] `Contact Form`: open a conversation; send a reply.

- Resources:
  - [X] `Blogs`: create + publish (or schedule) a blog; view public page; delete the test blog.
  - [X] `Guides`: create + publish a guide (set difficulty); view public page; delete the test guide.


## I) Awaiting time checks
  
  - [ ] Message usage limits reset on 1st of month

  - [ ] Cancelled addons resets usage limits at end of billing period
    - `billingtest@test.com` `Test1234*`
      - 1000 Message credits add-on Access ends: 30/06/2026
      - 1 Additional Space add-on Access ends: 30/06/2026
      - White label add-on Access ends: 30/06/2026
      Expected: Should stay on pro-plan, usage limits drop back 1 space 1000 message no white label.

  - [ ] Cancelled pro plan resets limits at end of billing period
    - `billingtest2@test.com` `Test1234*` 
      - Pro Plan Access ends: 30/06/2026
      Expected: Should switch back to free plan limits

  - [ ] Cancelled pro plan resets limits at end of billing period
    - `agencybillingtest@test.com` `Test1234*` 
      - Agency Plan Access ends: 30/06/2026
      Expected: Should switch back to free plan limits

  - [ ] Cancelled pro plan with addons to test if all addons cascade delete
    - `billingplancanceladdoncascade@test.com` `Test1234*` 
      - Pro Plan Access ends: 30/06/2026
      Expected: Should switch back to free plan limits, with no addons.

      