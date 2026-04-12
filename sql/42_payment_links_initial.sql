-- 42_payment_links_initial.sql
-- Creates payment_links table used by app checkout, Stripe webhook reconciliation, and admin billing views.
-- Run this after 2_venues_initial.sql.

create extension if not exists "pgcrypto";

-- Safe re-definition in case this migration runs independently.
create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.payment_links (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null,
  stripe_payment_link_id text not null,
  stripe_payment_link_url text,
  stripe_checkout_session_id text,
  plan_name text not null,
  custom_price numeric(10,2),
  trial_period_days integer,
  customer_email text,
  created_by text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_payment_links_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint chk_payment_links_plan_name_not_blank
    check (length(trim(plan_name)) > 0),
  constraint chk_payment_links_custom_price_non_negative
    check (custom_price is null or custom_price >= 0),
  constraint chk_payment_links_trial_days_non_negative
    check (trial_period_days is null or trial_period_days >= 0),
  constraint chk_payment_links_status_valid
    check (status in ('pending', 'paid', 'expired', 'cancelled', 'failed'))
);

create index if not exists idx_payment_links_venue_created
  on public.payment_links (venue_id, created_at desc);

create index if not exists idx_payment_links_venue_status
  on public.payment_links (venue_id, status);

create index if not exists idx_payment_links_customer_email
  on public.payment_links (customer_email);

create index if not exists idx_payment_links_stripe_checkout_session_id
  on public.payment_links (stripe_checkout_session_id);

create index if not exists idx_payment_links_stripe_payment_link_id
  on public.payment_links (stripe_payment_link_id);

create index if not exists idx_payment_links_status_created
  on public.payment_links (status, created_at desc);

drop trigger if exists trg_payment_links_set_updated_at on public.payment_links;
create trigger trg_payment_links_set_updated_at
before update on public.payment_links
for each row
execute function public.set_updated_at_timestamp();
