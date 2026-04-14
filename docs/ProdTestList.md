# Production E2E Tick List

Date: 14/04/2026  
Target: `tourbots.ai`  
External test site: `https://bodyactivegym.vercel.app`

Test account email: `apexfacilitiespricing@gmail.com`  
Test account password: `Test1234*`
Apex Test


## TO DO
- [X] Confirm live app opens at `tourbots.ai`.
- [X] Create account (or log in with test account above).
- [X] Confirm successful redirect into app dashboard.
- [X] Go to `App -> Tours`. Add Matterport tour URL. Save tour.
- [X] Add + test tour points.
- [X] Add + switch to second model

## D) Tour Menu Flow

- [ ] Go to `Tours -> Tour Menu`.
- [ ] Create menu sections/items linked to points.
- [ ] Save menu.
- [ ] Refresh and confirm menu persists.

## E) Chatbot Flow

- [ ] Go to `App -> Chatbots`.
- [ ] Add chatbot information content.
- [ ] Upload at least one knowledge document.
- [ ] Add at least 2 trigger rules.
- [ ] Apply chatbot customisation/branding.
- [ ] Test question: pricing.
- [ ] Test question: opening times.
- [ ] Test request: navigate to a specific area.
- [ ] Test off-topic question.

## F) Tour Embed Flow (External Site)

- [ ] Go to `Tours -> Share & Embed`.
- [ ] Copy tour embed code.
- [ ] Paste code into `bodyactivegym.vercel.app`.
- [ ] Publish/redeploy external site.
- [ ] Confirm embed loads correctly.
- [ ] Confirm chatbot opens and responds.
- [ ] Confirm tour navigation actions work.
- [ ] Confirm mobile view works.
- [ ] Confirm desktop view works.

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
