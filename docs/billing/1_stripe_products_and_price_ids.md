# TourBots Billing Catalogue Setup

This document defines the Stripe products and current sandbox Price IDs required for the TourBots billing model.

## Billing Model

- `Free` plan: onboarding/testing only, no live space, capped messages.
- `Pro` plan: paid core plan for live usage.
- Add-ons:
  - `Additional Space` (+1,000 message credits per extra space)
  - `Message Top-up Block`
  - `White-label`

## Stripe Products

- `TourBots Pro Plan`
- `TourBots Additional Space Add-on`
- `TourBots Message Top-up Block Add-on`
- `TourBots White-label Add-on`

## Price IDs

### Plans

| Plan Code | Price Type | Sandbox Price ID | Live Price ID |
|---|---|---|---|
| `free` | monthly | N/A | N/A |
| `pro` | monthly | `price_1TFLZiI5TESmVv5lczP7SPmP` | `price_live_pro_monthly` |
| `pro` | yearly (optional) | `price_1TFLamI5TESmVv5l5VYKrHs9` | `price_live_pro_yearly` |

### Add-ons

| Add-on Code | Billing Unit | Sandbox Price ID | Live Price ID |
|---|---|---|---|
| `extra_space` | monthly per space | `price_1TFLceI5TESmVv5lNQ4Z1hZW` | `price_live_extra_space_monthly` |
| `message_block` | monthly per 1000 messages | `price_1TFLdfI5TESmVv5lg6EDtnvM` | `price_live_message_block_monthly` |
| `white_label` | monthly per account | `price_1TFLe9I5TESmVv5lcrG9OMgF` | `price_live_white_label_monthly` |

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
  - recurring checkout for `pro` upgrades;
  - one-time checkout for add-on purchases, then webhook increments add-on counters in `venue_billing_records`.
