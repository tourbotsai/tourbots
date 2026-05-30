-- 63_fix_billing_upsert_conflict_indexes.sql
-- The webhook upserts subscriptions/invoices via PostgREST `onConflict`, which
-- emits `ON CONFLICT (<col>)` with no index predicate. A *partial* unique index
-- (WHERE <col> IS NOT NULL) is not a valid arbiter for that statement, so the
-- upsert fails (42P10) and the row is silently dropped. Convert the two partial
-- unique indexes to full unique indexes (Postgres still treats NULLs as
-- distinct, so multiple NULL rows remain allowed) so the upserts succeed.

drop index if exists public.uq_subscriptions_stripe_subscription_id;
create unique index if not exists uq_subscriptions_stripe_subscription_id
  on public.subscriptions (stripe_subscription_id);

drop index if exists public.uq_invoices_stripe_invoice_id;
create unique index if not exists uq_invoices_stripe_invoice_id
  on public.invoices (stripe_invoice_id);
