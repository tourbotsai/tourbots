# TourBots Billing Catalogue Setup

This document defines the Stripe products and current sandbox/live Price IDs required for the TourBots billing model.

## Billing Model

- `Free` plan: onboarding/testing only, 1 free bot to try, capped messages.
- `Pro` plan: paid core plan for live usage (1 bot included).
- `Agency` plan: £49.99/mo, 3-bot shared pool, 3,000 messages, white-label included.
- Core add-ons (Pro only):
  - `Additional Bot` / Extra bot (+1,000 message credits per extra bot)
  - `Message Top-up Block`
  - `White-label`
- Agency add-ons (Agency only):
  - `Agency Additional Bot` (+1,000 message credits per extra bot)
  - `Agency Message Top-up Block`

One bot = one primary tour location **or** one standalone website chatbot.

## Stripe Products

Product **display names** were renamed in Stripe from “Additional Space” → “Additional Bot” (and Agency equivalent). **Price IDs are unchanged.**

- `TourBots Pro Plan`
- `TourBots Agency Plan`
- `TourBots Additional Bot Add-on` (same product/price as former Additional Space)
- `TourBots Message Top-up Block Add-on`
- `TourBots White-label Add-on`
- `TourBots Agency Additional Bot Add-on` (same product/price as former Agency Additional Space)
- `TourBots Agency Message Top-up Block Add-on`

## Price IDs

### Plans

| Plan Code | Price Type | Sandbox Price ID | Live Price ID |
|---|---|---|---|
| `free` | monthly | N/A | N/A |
| `pro` | monthly | `price_1TFLZiI5TESmVv5lczP7SPmP` | `price_1TtYv2IhlKvnT7OnAzPBwWMx` |
| `pro` | yearly (admin payment links; app checkout is monthly-only) | `price_1TFLamI5TESmVv5l5VYKrHs9` | `price_1TtYv2IhlKvnT7OnLDTtJiZd` |
| `agency` | monthly | `price_1TFgfPI5TESmVv5lCaYzbbOJ` | `price_1TtYv2IhlKvnT7OndOchIwDG` |

### Add-ons

| Add-on Code | Billing Unit | Sandbox Price ID | Live Price ID |
|---|---|---|---|
| `extra_bot` | monthly per bot | `price_1TFLceI5TESmVv5lNQ4Z1hZW` | `price_1TtYv1IhlKvnT7Onyv50RYNU` |
| `message_block` | monthly per 1000 messages | `price_1TFLdfI5TESmVv5lg6EDtnvM` | `price_1TtYv2IhlKvnT7OnxamOIhDk` |
| `white_label` | monthly per account | `price_1TFLe9I5TESmVv5lcrG9OMgF` | `price_1TtYv2IhlKvnT7OnIx4PUt5B` |
| `agency_extra_bot` | monthly per bot | `price_1Tcm6GI5TESmVv5l0bRsIC3B` | `price_1TtYv2IhlKvnT7Onftw2mrPs` |
| `agency_message_block` | monthly per 1000 messages | `price_1Tcm74I5TESmVv5l117Qi2Go` | `price_1TtYv1IhlKvnT7OnIhQGn528` |

Live IDs are applied via `sql/75_billing_live_price_ids.sql` (historically against `extra_space` / `agency_extra_space` codes).
Catalogue code rename: `sql/87_billing_unit_rename_space_to_bot.sql` — renames codes/columns to bots and **keeps** the existing `stripe_price_*` values. No separate price-ID migration SQL is required.

## Mapping To SQL

Relevant columns:

- `billing_plans.stripe_price_monthly_sandbox` / `_live` (and yearly where used)
- `billing_addons.stripe_price_monthly_sandbox` / `_live`
- Capacity: `billing_plans.included_bots`, `venue_billing_records.addon_extra_bots`, `venue_billing_records.effective_bot_limit`

## Notes

- Keep `free` without Stripe price IDs.
- Use sandbox IDs in development and live IDs in production only.
- Mode switch is env-driven: `STRIPE_MODE=development` → sandbox columns; otherwise → live columns.
- App checkout is monthly-only for plans and add-ons. Pro yearly exists for admin payment links only; no Agency yearly SKU.
- App checkout wiring currently uses:
  - recurring checkout for `pro` and `agency` upgrades (from free);
  - recurring add-on subscriptions for add-on purchases, then webhook increments add-on counters in `venue_billing_records`;
  - `pro <-> agency` switching via `subscriptions.update` (price swap with proration) in `/api/app/billing/switch-plan`.
- Agency capacity add-ons reuse the `addon_extra_bots` / `addon_message_blocks` counters (limit maths is identical); only the catalogue SKUs/prices differ.
- During cutover, RPCs dual-accept legacy codes `extra_space` / `agency_extra_space` so in-flight webhooks still apply.

## Production cutover checklist

1. Rename Stripe product display names in Dashboard (sandbox + live) to Additional Bot / Agency Additional Bot — **same price IDs** (done when renaming in place).
2. Run `sql/85_website_chatbots.sql` → `sql/86_conversations_chatbot_config_id.sql` → `sql/87_billing_unit_rename_space_to_bot.sql`.
3. Deploy the app (bot codes/columns + UI).
4. Optional: update any Stripe subscription/item metadata still using `addon_code=extra_space` to `extra_bot` (RPCs dual-accept either during cutover).
5. Verify checkout buy/cancel of Extra bot on a test venue; confirm `addon_extra_bots` matches quantity.
6. In Stripe Dashboard (Live mode), webhook endpoint at `https://tourbots.ai/api/webhooks/stripe` with the events listed in `Local_Stripe_Listener.txt`.
7. On Vercel **Production** only, set live keys and the Live webhook signing secret. Do **not** set `STRIPE_MODE=development` on Production.
8. Keep local `.env.local` on `STRIPE_MODE=development` with test keys so sandbox continues to work.
