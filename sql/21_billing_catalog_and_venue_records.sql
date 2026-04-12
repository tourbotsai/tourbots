-- 21_billing_catalog_and_venue_records.sql
-- Billing catalogue (plans/add-ons) + per-venue billing records.
-- Run this after 2_venues_initial.sql.

create extension if not exists "pgcrypto";

-- Shared updated_at trigger function (safe to reuse).
create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  monthly_price_gbp numeric(10,2) not null default 0,
  yearly_price_gbp numeric(10,2),
  included_spaces integer not null default 0,
  included_messages integer not null default 0,
  stripe_price_monthly_sandbox text,
  stripe_price_yearly_sandbox text,
  stripe_price_monthly_live text,
  stripe_price_yearly_live text,
  is_public boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_billing_plans_code_not_blank
    check (length(trim(code)) > 0),
  constraint chk_billing_plans_name_not_blank
    check (length(trim(name)) > 0),
  constraint chk_billing_plans_monthly_non_negative
    check (monthly_price_gbp >= 0),
  constraint chk_billing_plans_yearly_non_negative
    check (yearly_price_gbp is null or yearly_price_gbp >= 0),
  constraint chk_billing_plans_included_spaces_non_negative
    check (included_spaces >= 0),
  constraint chk_billing_plans_included_messages_non_negative
    check (included_messages >= 0)
);

create table if not exists public.billing_addons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  unit_label text not null,
  monthly_price_gbp numeric(10,2) not null default 0,
  stripe_price_monthly_sandbox text,
  stripe_price_monthly_live text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_billing_addons_code_not_blank
    check (length(trim(code)) > 0),
  constraint chk_billing_addons_name_not_blank
    check (length(trim(name)) > 0),
  constraint chk_billing_addons_unit_label_not_blank
    check (length(trim(unit_label)) > 0),
  constraint chk_billing_addons_monthly_non_negative
    check (monthly_price_gbp >= 0)
);

create table if not exists public.venue_billing_records (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null unique,
  plan_code text not null default 'free',
  billing_status text not null default 'free',
  billing_override_enabled boolean not null default false,
  override_plan_code text,
  addon_extra_spaces integer not null default 0,
  addon_message_blocks integer not null default 0,
  addon_white_label boolean not null default false,
  effective_space_limit integer,
  effective_message_limit integer,
  stripe_customer_id text,
  stripe_subscription_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_venue_billing_records_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint fk_venue_billing_records_plan
    foreign key (plan_code) references public.billing_plans(code)
    on delete restrict,
  constraint fk_venue_billing_records_override_plan
    foreign key (override_plan_code) references public.billing_plans(code)
    on delete set null,
  constraint chk_venue_billing_records_status_valid
    check (billing_status in ('free', 'active', 'past_due', 'cancelled', 'trialing')),
  constraint chk_venue_billing_records_spaces_non_negative
    check (addon_extra_spaces >= 0),
  constraint chk_venue_billing_records_messages_non_negative
    check (addon_message_blocks >= 0),
  constraint chk_venue_billing_records_space_limit_non_negative
    check (effective_space_limit is null or effective_space_limit >= 0),
  constraint chk_venue_billing_records_message_limit_non_negative
    check (effective_message_limit is null or effective_message_limit >= 0)
);

create table if not exists public.venue_billing_events (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null,
  event_type text not null,
  event_source text not null default 'system',
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint fk_venue_billing_events_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint chk_venue_billing_events_event_type_not_blank
    check (length(trim(event_type)) > 0),
  constraint chk_venue_billing_events_event_source_not_blank
    check (length(trim(event_source)) > 0)
);

create index if not exists idx_billing_plans_active_sort
  on public.billing_plans(is_active, sort_order asc);

create index if not exists idx_billing_addons_active_sort
  on public.billing_addons(is_active, sort_order asc);

create index if not exists idx_venue_billing_records_status_plan
  on public.venue_billing_records(billing_status, plan_code);

create index if not exists idx_venue_billing_events_venue_created
  on public.venue_billing_events(venue_id, created_at desc);

drop trigger if exists trg_billing_plans_set_updated_at on public.billing_plans;
create trigger trg_billing_plans_set_updated_at
before update on public.billing_plans
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_billing_addons_set_updated_at on public.billing_addons;
create trigger trg_billing_addons_set_updated_at
before update on public.billing_addons
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_venue_billing_records_set_updated_at on public.venue_billing_records;
create trigger trg_venue_billing_records_set_updated_at
before update on public.venue_billing_records
for each row
execute function public.set_updated_at_timestamp();

-- Seed default plans
insert into public.billing_plans (
  code,
  name,
  description,
  monthly_price_gbp,
  yearly_price_gbp,
  included_spaces,
  included_messages,
  stripe_price_monthly_sandbox,
  stripe_price_yearly_sandbox,
  sort_order
)
values
  (
    'free',
    'Free',
    'Test account for setup and validation before going live.',
    0,
    0,
    1,
    25,
    null,
    null,
    1
  ),
  (
    'pro',
    'Pro',
    'Live production plan with one included space and message allowance.',
    19.99,
    null,
    1,
    1000,
    'price_1TFLZiI5TESmVv5lczP7SPmP',
    'price_1TFLamI5TESmVv5l5VYKrHs9',
    2
  )
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  monthly_price_gbp = excluded.monthly_price_gbp,
  yearly_price_gbp = excluded.yearly_price_gbp,
  included_spaces = excluded.included_spaces,
  included_messages = excluded.included_messages,
  stripe_price_monthly_sandbox = excluded.stripe_price_monthly_sandbox,
  stripe_price_yearly_sandbox = excluded.stripe_price_yearly_sandbox,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Seed default add-ons
insert into public.billing_addons (
  code,
  name,
  description,
  unit_label,
  monthly_price_gbp,
  stripe_price_monthly_sandbox,
  sort_order
)
values
  (
    'extra_space',
    'Additional Space',
    'Additional active space, includes +1,000 message credits.',
    'per space',
    14.99,
    'price_1TFLceI5TESmVv5lNQ4Z1hZW',
    1
  ),
  (
    'message_block',
    'Message Top-up Block',
    'Additional monthly message capacity block.',
    'per 1000 messages',
    9.99,
    'price_1TFLdfI5TESmVv5lg6EDtnvM',
    2
  ),
  (
    'white_label',
    'White-label',
    'Remove TourBots branding across the experience.',
    'per account',
    19.99,
    'price_1TFLe9I5TESmVv5lcrG9OMgF',
    3
  )
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  unit_label = excluded.unit_label,
  monthly_price_gbp = excluded.monthly_price_gbp,
  stripe_price_monthly_sandbox = excluded.stripe_price_monthly_sandbox,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Ensure every venue has a billing record (default: free)
insert into public.venue_billing_records (venue_id, plan_code, billing_status)
select v.id, 'free', 'free'
from public.venues v
where not exists (
  select 1
  from public.venue_billing_records vbr
  where vbr.venue_id = v.id
);
