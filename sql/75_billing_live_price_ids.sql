-- 75_billing_live_price_ids.sql
-- Populates Stripe Live price IDs on the billing catalogue.
-- Sandbox columns are left unchanged so local STRIPE_MODE=development keeps working.
-- Run after 62_agency_plan_and_addons.sql (and any later billing migrations).
-- Source: docs/billing/livestripeproductids.txt

-- Plans
update public.billing_plans
set
  stripe_price_monthly_live = 'price_1TtYv2IhlKvnT7OnAzPBwWMx',
  stripe_price_yearly_live = 'price_1TtYv2IhlKvnT7OnLDTtJiZd',
  yearly_price_gbp = 199.99,
  updated_at = now()
where code = 'pro';

update public.billing_plans
set
  stripe_price_monthly_live = 'price_1TtYv2IhlKvnT7OndOchIwDG',
  updated_at = now()
where code = 'agency';

-- Add-ons (Pro-scoped)
update public.billing_addons
set
  stripe_price_monthly_live = 'price_1TtYv1IhlKvnT7Onyv50RYNU',
  updated_at = now()
where code = 'extra_space';

update public.billing_addons
set
  stripe_price_monthly_live = 'price_1TtYv2IhlKvnT7OnxamOIhDk',
  updated_at = now()
where code = 'message_block';

update public.billing_addons
set
  stripe_price_monthly_live = 'price_1TtYv2IhlKvnT7OnIx4PUt5B',
  updated_at = now()
where code = 'white_label';

-- Add-ons (Agency-scoped)
update public.billing_addons
set
  stripe_price_monthly_live = 'price_1TtYv2IhlKvnT7Onftw2mrPs',
  updated_at = now()
where code = 'agency_extra_space';

update public.billing_addons
set
  stripe_price_monthly_live = 'price_1TtYv1IhlKvnT7OnIhQGn528',
  updated_at = now()
where code = 'agency_message_block';

-- Verification (run manually after applying):
-- select code, stripe_price_monthly_sandbox, stripe_price_monthly_live, stripe_price_yearly_live
-- from public.billing_plans
-- order by sort_order;
--
-- select code, stripe_price_monthly_sandbox, stripe_price_monthly_live
-- from public.billing_addons
-- where is_active = true
-- order by sort_order;
