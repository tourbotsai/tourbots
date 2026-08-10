-- 110_fix_mark_apollo3d_stale_stripe_customer.sql
-- Clear Mark Shepherd / Apollo 3D's stale Stripe test-mode customer ID from live DB.
--
-- Context:
--   venue Apollo 3D (1c0f36ef-4ca0-4754-a381-094bb1db5f60) has a correct agency
--   billing override, but still stores cus_UecY1nLT4Ldk8t. That customer exists
--   only in Stripe test mode. Production (live Stripe) logs:
--   "No such customer: 'cus_UecY1nLT4Ldk8t'" on GET /api/app/billing.
--
-- Safe: override entitlements come from venue_billing_records plan fields, not Stripe.
-- There is no live stripe_subscription_id to preserve.

update public.venue_billing_records
set
  stripe_customer_id = null,
  updated_at = now()
where venue_id = '1c0f36ef-4ca0-4754-a381-094bb1db5f60'
  and stripe_customer_id = 'cus_UecY1nLT4Ldk8t';

update public.subscriptions
set
  stripe_customer_id = null,
  updated_at = now()
where venue_id = '1c0f36ef-4ca0-4754-a381-094bb1db5f60'
  and stripe_customer_id = 'cus_UecY1nLT4Ldk8t';

-- Optional sanity check after running:
-- select venue_id, plan_code, billing_override_enabled, override_plan_code,
--        billing_status, stripe_customer_id, stripe_subscription_id
-- from public.venue_billing_records
-- where venue_id = '1c0f36ef-4ca0-4754-a381-094bb1db5f60';
