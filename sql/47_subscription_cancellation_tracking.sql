-- 47_subscription_cancellation_tracking.sql
-- Track Stripe "cancel at period end" state and cancellation dates.

alter table public.subscriptions
  add column if not exists cancel_at_period_end boolean not null default false;

alter table public.subscriptions
  add column if not exists cancel_at timestamptz;

alter table public.subscriptions
  add column if not exists canceled_at timestamptz;
