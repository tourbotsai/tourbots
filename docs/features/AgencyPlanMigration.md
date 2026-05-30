# Agency Plan Migration Plan

Last updated: 30/05/2026

## Goal

Convert "Agency Portal" from a billing **add-on** into a first-class **plan tier**, so the billing model becomes three clean plans plus plan-scoped add-ons:

- `free` -> `pro` -> `agency`
- Add-ons attach to a paid plan and cascade-cancel with it (standard behaviour).

This removes the clunky "feature add-on vs capacity add-on" split that only existed because an add-on was behaving like a plan.

### Agency plan definition (product decisions, confirmed)

- **Price:** £49.99 / month.
- **Included:** 3 spaces + 3,000 messages.
- **White-label is built in.** The agency plan includes white-label branding; agencies can customise branding (the client portal already exposes branding via `agency_portal_settings`, and the main embed is treated as white-labelled). The `white_label` add-on is therefore not required on agency.
- **Shared space pool:** the 3 spaces are shared across (a) any tour the agency sets up normally in the main TourBots app and (b) tours they create and share as client portals. Each primary tour = 1 space. Deleting a tour frees a space.
- **Agency-scoped add-ons (separate SKUs):**
  - `agency_extra_space` - £9.99 / space / month.
  - `agency_message_block` - £9.99 / +1,000 messages / month.
- **Core add-ons (`extra_space`, `message_block`, `white_label`)** remain **Pro-only**.
- The billing page shows an **Agency add-ons** section only when the venue is on the agency plan, and the **core add-ons** section only when on pro. This lets agency pricing diverge from core pricing.

### Stripe prices (sandbox, confirmed)

- **Agency plan** - £49.99/mo: `price_1TFgfPI5TESmVv5lCaYzbbOJ` (the existing price; the product was renamed to "TourBots Agency Plan" in Stripe).
- **`agency_extra_space`** - £9.99/mo: `price_1Tcm6GI5TESmVv5l0bRsIC3B`.
- **`agency_message_block`** - £9.99/mo: `price_1Tcm74I5TESmVv5l117Qi2Go`.
- Live price ids to be added before production deploy.

### Deferred (explicitly out of scope for this migration)

- Per-customer credit/space allocation UI on the agency page (splitting the shared message pool across individual client portals, per-portal caps). Captured as a fast-follow.

## Current architecture (traced)

### Plans and entitlement
- Plans live in `billing_plans` (`free`, `pro`); a venue's plan is `venue_billing_records.plan_code` (FK -> `billing_plans.code`, `on delete restrict`). Adding an `agency` row satisfies the FK with no schema change.
- Effective plan honours admin overrides: `billing_override_enabled && override_plan_code ? override_plan_code : plan_code` (used in `deriveLimits` and `getLocationSpaceLimit`).
- Agency entitlement is currently the boolean `venue_billing_records.addon_agency_portal`, read in exactly 5 places:
  - `lib/agency-portal-auth.ts` (`getAgencyPortalVenueSettings` -> `validatePortalVenueAccess`)
  - `app/api/app/agency-portal/settings/route.ts`
  - `app/api/app/agency-portal/shares/route.ts` (`getEntitlement`)
  - `app/embed/agency/[shareSlug]/page.tsx`
  - `components/app/settings/agency-settings.tsx`

### Spaces (the important finding)
- A "space" = a primary tour/location (`tours` where `tour_type` primary/null and `is_active`).
- `getLocationSpaceLimit()` in `app/api/app/tours/route.ts` = `plan.included_spaces + addon_extra_spaces` (or `effective_space_limit` override), min 1. Tour creation (`POST /api/app/tours`) blocks when primary-tour count >= limit.
- An agency client portal is **backed by a tour**: `agency_portal_shares.tour_id` -> `tours.id`, and a share can only attach to an existing tour (created through the tours API). So **the shared space pool is already enforced in one place** - agency client portals and the agency's own tours both consume from the same primary-tour count.
- Conclusion: setting agency `included_spaces = 3` is sufficient; no new space-accounting system required.

### Messages
- `deriveLimits` (in `app/api/app/billing/route.ts`) computes `totalMessages = plan.included_messages + extra_space*1000 + message_block*1000` (or `effective_message_limit`). Agency message pool follows from `included_messages = 3000` plus agency message-block add-ons.

### Stripe / checkout / webhook
- Plan upgrades and add-ons are all separate Stripe subscriptions created via Checkout.
- `app/api/app/billing/checkout/route.ts`: `upgrade_plan` currently only accepts `pro`; add-on purchases gate capacity add-ons to `plan_code === 'pro'`.
- `mapStripePlanToBillingPlan` passes unknown plan names through unchanged, so `'agency'` already maps to `'agency'`.
- `handleSubscriptionUpdated` maps `plan_code` from the `subscriptions` table `plan_name`; add-on subscriptions are not stored in `subscriptions` (only main plan).
- Recent add-on cancellation work (feature/capacity split, agency cascade exclusion, `clearAgency`, the "also cancel agency" checkbox, the live `addonSubscriptions` query) exists only to make the agency *add-on* behave like a plan; most of it is removed by this migration.

## Target model

- `billing_plans`: `free`, `pro`, `agency`.
- `billing_addons`: core (`extra_space`, `message_block`, `white_label`) + agency (`agency_extra_space`, `agency_message_block`). The old `agency_portal` add-on is deactivated.
- Entitlement: a single helper `venueHasAgencyPortal(record)` returning `effectivePlanCode(record) === 'agency'`, replacing all `addon_agency_portal` reads.
- Add-on gating: core add-ons require `pro`; agency add-ons require `agency`.
- Cancellation: cancelling any paid plan cascades its add-ons (one consistent rule).

## Implementation phases

### Phase 1 - Billing catalogue + entitlement (SQL)
- [ ] New migration: insert `agency` into `billing_plans` (£49.99, `included_spaces = 3`, `included_messages = 3000`, sandbox price `price_1TFgfPI5TESmVv5lCaYzbbOJ`).
- [ ] Insert `agency_extra_space` (£9.99, sandbox `price_1Tcm6GI5TESmVv5l0bRsIC3B`) and `agency_message_block` (£9.99, sandbox `price_1Tcm74I5TESmVv5l117Qi2Go`) into `billing_addons`.
- [ ] Deactivate the old `agency_portal` add-on (`is_active = false`); leave `addon_agency_portal` column in place but stop relying on it (drop in a later cleanup migration).
- [ ] Add `apply_billing_addon_purchase` / `apply_billing_addon_cancellation` support for the new agency add-on codes (extend the `in (...)` allow-lists and add counters; see Phase 5).

### Phase 2 - Entitlement helpers
- [ ] Add `effectivePlanCode(record)` + `venueHasAgencyPortal(record)` (= `effectivePlanCode === 'agency'`) in a shared lib.
- [ ] Add `venueHasWhiteLabel(record)` (= `addon_white_label || effectivePlanCode === 'agency'`), since white-label is built into the agency plan. Use it wherever branding removal is gated.
- [ ] Replace the 5 `addon_agency_portal` reads with `venueHasAgencyPortal` (or plan-derived entitlement passed from the billing record).
- [ ] Update `lib/agency-portal-auth.ts` `getAgencyPortalVenueSettings` to select `plan_code, billing_override_enabled, override_plan_code` instead of `addon_agency_portal`.

### Phase 3 - Checkout + plan switching
- [ ] `billing/checkout`: allow `upgrade_plan` for `agency` (resolve agency price); widen capacity add-on gate from `pro` to `pro` OR `agency` per add-on family (core add-ons -> pro; agency add-ons -> agency).
- [ ] free -> pro / free -> agency: Checkout (no card on file yet).
- [ ] pro <-> agency: new in-app endpoint using Stripe `subscriptions.update` to swap the price item on the existing main subscription (proration), and update subscription metadata + `subscriptions.plan_name` + `venue_billing_records.plan_code`. `handleSubscriptionUpdated` reconciles via the mapped plan name.
- [ ] paid -> free: existing cancel flow (cascades add-ons).
- [ ] `billing` PUT (`select_plan`) and `useBilling` (`startPlanCheckout`, `selectPlan`) widened to include `agency`.

### Phase 4 - Webhook simplification
- [ ] `mapStripePlanToBillingPlan`: explicit `agency` mapping.
- [ ] Remove agency-as-add-on special casing: `FEATURE_ADDON_CODES` cascade exclusion, `agency_portal` branches in `handleSubscriptionDeleted`, the `clearAgency` option. Agency now cancels as a plan; add-ons cascade normally via the main-plan cancellation path.
- [ ] Keep the customer-id-on-add-on-subscription fix and the invoice customer-metadata fallback (still needed for add-on invoices).

### Phase 5 - Add-on accounting for agency add-ons
- [ ] Decide storage: either reuse `addon_extra_spaces` / `addon_message_blocks` counters (simplest - same pool maths) or add `addon_agency_extra_spaces` / `addon_agency_message_blocks` columns if agency capacity must be tracked separately for the future allocation UI. Recommendation: reuse the existing counters for now (limits maths is identical) and revisit when the allocation UI lands.
- [ ] Update `apply_billing_addon_purchase` / `apply_billing_addon_cancellation` and the checkout/webhook addon-code handling accordingly.

### Phase 6 - UI (app billing tab)
- [ ] `subscription-status.tsx`: three plan cards (free/pro/agency); revert the feature/capacity section split.
- [ ] Two add-on sections, plan-scoped: **Core add-ons** shown only on `pro`; **Agency add-ons** shown only on `agency`. (White-label is built into agency, so it does not appear as a purchasable add-on there; surface it as an included feature on the agency plan card.)
- [ ] Remove the "also cancel agency add-on" checkbox and agency-specific dialog logic; keep generic per-add-on cancel.
- [ ] Plan switch buttons (Upgrade to Agency / Downgrade to Pro) wired to the Phase 3 switch endpoint.
- [ ] `venue-settings.tsx` "Account type": agency shows as the plan (`Plan: Agency`), not an add-on.

### Phase 7 - Public pricing + docs + tests
- [ ] `components/website/pricing/PricingPlans.tsx`: move Agency from the add-ons strip into a third plan card; add the agency add-ons to the add-ons strip (or a note); update `PricingFAQ`/copy as needed.
- [ ] `docs/billing/1_stripe_products_and_price_ids.md`: add the agency plan + agency add-on prices.
- [ ] `docs/ProdTestList.md`: update the Billing flow for plans free/pro/agency, plan switching, and the two add-on families.
- [ ] Update agency-portal live tests that assert on `addon_agency_portal` to assert on the agency plan instead.

## Behaviour matrix

| Starting state | Action | Result |
|---|---|---|
| Free | Upgrade to Pro | Checkout; plan -> pro; core add-ons unlock |
| Free | Upgrade to Agency | Checkout; plan -> agency; 3 spaces / 3,000 msgs; agency add-ons unlock |
| Pro | Switch to Agency | Subscription price swap (proration); plan -> agency |
| Agency | Switch to Pro | Subscription price swap (proration); plan -> pro; agency add-ons no longer purchasable (existing ones cascade per rule below) |
| Pro | Cancel plan | Plan -> free at period end; core add-ons cascade-cancel |
| Agency | Cancel plan | Plan -> free at period end; agency add-ons cascade-cancel |
| Pro/Agency | Cancel a single add-on | Only that add-on ends at period end |
| Agency | Create client portal | Requires a tour (consumes 1 of 3 spaces); blocked at limit unless agency space add-on bought |

## SQL scope (first migration)

- Insert `agency` plan into `billing_plans` (£49.99, 3 spaces, 3,000 messages, sandbox price `price_1TFgfPI5TESmVv5lCaYzbbOJ`).
- Insert `agency_extra_space` (sandbox `price_1Tcm6GI5TESmVv5l0bRsIC3B`) and `agency_message_block` (sandbox `price_1Tcm74I5TESmVv5l117Qi2Go`) into `billing_addons`.
- Deactivate `agency_portal` add-on (`is_active = false`).
- Extend the addon-apply / addon-cancel RPC allow-lists for the new agency add-on codes.

## Build order (recommended)

1. SQL catalogue (agency plan + agency add-ons) and entitlement helper.
2. Checkout widening + pro<->agency switch endpoint.
3. Webhook simplification.
4. App billing UI (plan cards + plan-scoped add-on sections).
5. Public pricing + docs + tests.
6. QA: full plan transition matrix, space-limit enforcement across main tours + client portals, add-on cascade, invoices.

## Risks

- **Plan switching / proration** (pro<->agency) is the only genuinely new Stripe behaviour; everything else is mechanical and net-simplifying.
- Migration of the existing test agency add-on subscription: cancel/retire it; no real agency customers exist pre-launch.
- Ensure `effectivePlanCode` (with admin override) is used everywhere entitlement is checked so platform-admin grants still work.

## Implementation progress

- [x] **Phase 1 + Phase 5 (SQL)** - `sql/62_agency_plan_and_addons.sql`:
  - Inserted `agency` plan (£49.99, 3 spaces, 3,000 messages, sandbox price `price_1TFgfPI5TESmVv5lCaYzbbOJ`).
  - Inserted `agency_extra_space` (£9.99) and `agency_message_block` (£9.99) add-ons with their sandbox price ids.
  - Deactivated the legacy `agency_portal` add-on.
  - Extended `apply_billing_addon_purchase` / `apply_billing_addon_cancellation` allow-lists; agency add-ons reuse the existing `addon_extra_spaces` / `addon_message_blocks` counters so limit derivation is unchanged.
- [x] **Phase 2 (Entitlement)** - `lib/billing-entitlements.ts` adds `effectivePlanCode`, `venueHasAgencyPortal`, `venueHasWhiteLabel`, and `ENTITLEMENT_COLUMNS`. Replaced the entitlement-gating reads:
  - `lib/agency-portal-auth.ts` `getAgencyPortalVenueSettings` (now plan-derived, returns `agency_entitled`).
  - `app/api/app/agency-portal/settings/route.ts` (returns `entitlement.entitled`).
  - `app/api/app/agency-portal/shares/route.ts` `getEntitlement`.
  - `app/embed/agency/[shareSlug]/page.tsx`.
  - `components/app/settings/agency-settings.tsx` reads `entitlement.entitled`.
  - (Billing-UI display reads in `subscription-status.tsx` / `venue-settings.tsx` are reworked in Phase 6; webhook in Phase 4; tests in Phase 7.)
- [x] **Phase 3 (Checkout + plan switching)**:
  - `app/api/app/billing/checkout/route.ts`: `upgrade_plan` accepts `pro` or `agency` (resolves price by code); add-on gate is plan-scoped (core add-ons -> pro, agency add-ons -> agency); `ADDON_CODES` now lists the agency add-ons and drops `agency_portal`.
  - **NEW** `app/api/app/billing/switch-plan/route.ts`: pro<->agency price swap on the existing main subscription via `subscriptions.update` (proration), updates customer metadata, `venue_billing_records.plan_code`, `subscriptions.plan_name`, and logs a `plan_switched_by_user` event.
  - `hooks/app/useBilling.ts`: `AddonCode` updated to the agency add-on codes; `startPlanCheckout`/`purchaseAddon` widened; new `switchPlan(pro|agency)` action.
  - Note: the DB-only `billing` PUT (`select_plan`) is intentionally left as free/pro only - selecting agency without payment would be incorrect; agency is reached via checkout or switch-plan.
- [x] **Phase 4 (Webhook simplification)** - `app/api/webhooks/stripe/route.ts`:
  - `mapStripePlanToBillingPlan` maps `agency` explicitly.
  - `ADDON_CODES` now lists the agency add-ons (and drops `agency_portal`).
  - Removed `FEATURE_ADDON_CODES`, the `includeAgency`/`clearAgency` options - all add-ons cascade with the main plan (pro or agency).
  - Kept the customer-id-on-add-on-subscription fix and invoice customer-metadata fallback.
  - Mirror simplification applied to `app/api/cron/reconcile-stripe-cancellation-state/route.ts`.
  - `app/api/app/billing/cancel-addon/route.ts` allow-list updated to the agency add-on codes.
- [x] **Phase 6 (App billing UI)**:
  - `components/app/settings/subscription-status.tsx`: three plan cards (free/pro/agency) with plan-aware actions (free->checkout, pro<->agency->switch, paid->free->cancel). Agency card shows "Branded client portals" + "White-label included". Add-on sections are plan-scoped: **Core add-ons** render only on Pro, **Agency add-ons** only on Agency. Removed the feature/capacity split, the agency-add-on cancel checkbox, and `agency_portal` references. Manage/cancel now applies to any paid plan and the cancel dialog notes add-ons cascade automatically.
  - `components/app/settings/venue-settings.tsx`: "Account type" now reflects `Agency` as a plan and drops the Agency Portal add-on line.
- [x] **Phase 7 (Public pricing + docs + tests)**:
  - `components/website/pricing/PricingPlans.tsx`: Agency moved into a third plan card (£49.99); add-ons strip retitled "Pro add-ons" with a note about agency add-ons; agency portal add-on removed.
  - `components/website/pricing/PricingFAQ.tsx` + `PricingHero.tsx`: copy updated from "Agency portal add-on" to the Agency plan.
  - `docs/billing/1_stripe_products_and_price_ids.md`: agency plan + agency add-on prices and wiring notes added.
  - `docs/ProdTestList.md`: Billing flow rewritten for free/pro/agency, plan switching, and the two add-on families.
  - Tests: `tests/helpers/live-agency-context.ts` and `tests/agency-portal/app-agency-portal-shares.live.test.ts` assert on `entitlement.entitled`; `app-billing-addon-agency-portal.live.test.ts` now exercises the agency plan checkout.
  - `lib/types.ts`: `BillingAddon.code` union updated to the agency add-on codes.

### Post-implementation notes
- The `addon_agency_portal` column remains in `venue_billing_records` for backward compatibility but is no longer read for entitlement; it is force-set false on cancellation. A later cleanup migration can drop it.
- Run `sql/62_agency_plan_and_addons.sql` against the database before deploying. Set the live Stripe price IDs on the new `agency` plan and agency add-on rows when going to production.
