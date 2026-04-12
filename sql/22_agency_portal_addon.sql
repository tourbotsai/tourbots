-- 22_agency_portal_addon.sql
-- Adds Agency Portal billing add-on support.
-- Run this after 21_billing_catalog_and_venue_records.sql.

-- 1) Add per-venue entitlement flag for Agency Portal.
alter table if exists public.venue_billing_records
  add column if not exists addon_agency_portal boolean not null default false;

-- 2) Seed Agency Portal add-on in billing catalogue.
insert into public.billing_addons (
  code,
  name,
  description,
  unit_label,
  monthly_price_gbp,
  stripe_price_monthly_sandbox,
  sort_order
)
values (
  'agency_portal',
  'Agency Portal',
  'Enable branded client portal access for agency-managed tours.',
  'per account',
  49.99,
  'price_1TFgfPI5TESmVv5lCaYzbbOJ',
  4
)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  unit_label = excluded.unit_label,
  monthly_price_gbp = excluded.monthly_price_gbp,
  stripe_price_monthly_sandbox = excluded.stripe_price_monthly_sandbox,
  sort_order = excluded.sort_order,
  updated_at = now();

