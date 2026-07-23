-- 80_drop_legacy_platform_outbound_tables.sql
-- The legacy "Outbound" admin feature (leads + Resend-based sequences) has
-- been fully superseded by the CRM feature (crm_companies, crm_sequences,
-- crm_gmail_accounts, etc. — see sql/68 onwards). All application code,
-- API routes, UI pages and the associated cron job have already been
-- removed. This migration drops the now-unused legacy tables and function.
--
-- Safe to run any time — nothing in the codebase reads or writes these
-- tables any more. Run this on the live database when convenient.

-- --------
-- 1. Drop the cron-claiming RPC first. It returns `setof
--    platform_outbound_sequence_emails`, so Postgres tracks a dependency
--    on that table's row type — the function must go before the table.
-- --------

drop function if exists public.claim_platform_outbound_sequence_emails(timestamptz, integer);

-- --------
-- 2. Drop tables in child-to-parent order (cascade as a safety net in case
--    any ad-hoc constraints were added outside the tracked migrations).
-- --------

drop table if exists public.platform_outbound_sequence_emails cascade;
drop table if exists public.platform_outbound_sequence_enrollments cascade;
drop table if exists public.platform_outbound_sequence_steps cascade;
drop table if exists public.platform_outbound_lead_notes cascade;
drop table if exists public.platform_outbound_sequences cascade;
drop table if exists public.platform_outbound_leads cascade;

-- Note: public.set_updated_at_timestamp() is a shared trigger helper used
-- by many other tables (including the CRM tables) and is intentionally
-- left in place.
