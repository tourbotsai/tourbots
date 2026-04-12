-- 45_enforce_billing_webhook_idempotency_keys.sql
-- Creates missing billing event tables (if needed) and enforces Stripe idempotency keys.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_name text not null default 'essential',
  status text not null default 'pending',
  current_price numeric(10,2),
  billing_cycle text not null default 'monthly',
  next_billing_date timestamptz,
  is_trial boolean not null default false,
  trial_period_days integer,
  trial_end_date timestamptz,
  trial_started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_subscriptions_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint chk_subscriptions_status_valid
    check (status in ('pending', 'active', 'trialing', 'cancelled', 'past_due')),
  constraint chk_subscriptions_billing_cycle_valid
    check (billing_cycle in ('monthly', 'yearly')),
  constraint chk_subscriptions_trial_period_days_non_negative
    check (trial_period_days is null or trial_period_days >= 0),
  constraint chk_subscriptions_current_price_non_negative
    check (current_price is null or current_price >= 0)
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null,
  stripe_invoice_id text not null,
  amount_paid numeric(10,2) not null default 0,
  currency text not null default 'gbp',
  status text not null,
  invoice_pdf text,
  billing_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_invoices_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint chk_invoices_amount_paid_non_negative
    check (amount_paid >= 0),
  constraint chk_invoices_status_valid
    check (status in ('paid', 'pending', 'failed'))
);

create index if not exists idx_invoices_venue_created
  on public.invoices (venue_id, created_at desc);

alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;

do $$
begin
  if exists (
    select 1
    from public.subscriptions
    where stripe_subscription_id is not null
    group by stripe_subscription_id
    having count(*) > 1
  ) then
    raise exception 'Duplicate stripe_subscription_id values exist in public.subscriptions. Resolve duplicates before applying unique index.';
  end if;

  if exists (
    select 1
    from public.invoices
    where stripe_invoice_id is not null
    group by stripe_invoice_id
    having count(*) > 1
  ) then
    raise exception 'Duplicate stripe_invoice_id values exist in public.invoices. Resolve duplicates before applying unique index.';
  end if;
end $$;

create unique index if not exists uq_subscriptions_stripe_subscription_id
  on public.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

create unique index if not exists uq_invoices_stripe_invoice_id
  on public.invoices (stripe_invoice_id)
  where stripe_invoice_id is not null;
