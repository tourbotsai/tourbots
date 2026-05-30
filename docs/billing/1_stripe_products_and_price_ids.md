# TourBots Billing Catalogue Setup

This document defines the Stripe products and current sandbox Price IDs required for the TourBots billing model.

## Billing Model

- `Free` plan: onboarding/testing only, no live space, capped messages.
- `Pro` plan: paid core plan for live usage.
- `Agency` plan: £49.99/mo, 3-space shared pool, 3,000 messages, white-label included.
- Core add-ons (Pro only):
  - `Additional Space` (+1,000 message credits per extra space)
  - `Message Top-up Block`
  - `White-label`
- Agency add-ons (Agency only):
  - `Agency Additional Space` (+1,000 message credits per extra space)
  - `Agency Message Top-up Block`

## Stripe Products

- `TourBots Pro Plan`
- `TourBots Agency Plan`
- `TourBots Additional Space Add-on`
- `TourBots Message Top-up Block Add-on`
- `TourBots White-label Add-on`
- `TourBots Agency Additional Space Add-on`
- `TourBots Agency Message Top-up Block Add-on`

## Price IDs

### Plans

| Plan Code | Price Type | Sandbox Price ID | Live Price ID |
|---|---|---|---|
| `free` | monthly | N/A | N/A |
| `pro` | monthly | `price_1TFLZiI5TESmVv5lczP7SPmP` | `price_live_pro_monthly` |
| `pro` | yearly (optional) | `price_1TFLamI5TESmVv5l5VYKrHs9` | `price_live_pro_yearly` |
| `agency` | monthly | `price_1TFgfPI5TESmVv5lCaYzbbOJ` | `price_live_agency_monthly` |

### Add-ons

| Add-on Code | Billing Unit | Sandbox Price ID | Live Price ID |
|---|---|---|---|
| `extra_space` | monthly per space | `price_1TFLceI5TESmVv5lNQ4Z1hZW` | `price_live_extra_space_monthly` |
| `message_block` | monthly per 1000 messages | `price_1TFLdfI5TESmVv5lg6EDtnvM` | `price_live_message_block_monthly` |
| `white_label` | monthly per account | `price_1TFLe9I5TESmVv5lcrG9OMgF` | `price_live_white_label_monthly` |
| `agency_extra_space` | monthly per space | `price_1Tcm6GI5TESmVv5l0bRsIC3B` | `price_live_agency_extra_space_monthly` |
| `agency_message_block` | monthly per 1000 messages | `price_1Tcm74I5TESmVv5l117Qi2Go` | `price_live_agency_message_block_monthly` |

## Mapping To SQL

Update these table columns once Price IDs are ready:

- `billing_plans.stripe_price_monthly_sandbox`
- `billing_plans.stripe_price_yearly_sandbox`
- `billing_plans.stripe_price_monthly_live`
- `billing_plans.stripe_price_yearly_live`
- `billing_addons.stripe_price_monthly_sandbox`
- `billing_addons.stripe_price_monthly_live`

## Notes

- Keep `free` without Stripe price IDs.
- Use sandbox IDs in development and live IDs in production only.
- App checkout wiring currently uses:
  - recurring checkout for `pro` and `agency` upgrades (from free);
  - recurring add-on subscriptions for add-on purchases, then webhook increments add-on counters in `venue_billing_records`;
  - `pro <-> agency` switching via `subscriptions.update` (price swap with proration) in `/api/app/billing/switch-plan`.
- Agency capacity add-ons reuse the `addon_extra_spaces` / `addon_message_blocks` counters (limit maths is identical); only the catalogue SKUs/prices differ.
