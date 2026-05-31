-- 66_agency_client_message_allocation.sql
-- Per-client message-credit allocation for the Agency Portal.
--
-- An agency account holds a single monthly message pool (plan included_messages
-- + add-ons). By default this pool is SHARED across all client tours. When the
-- agency switches to ALLOCATED mode, each client (one agency_portal_shares row
-- per tour) is given a fixed monthly slice. When a client's tour reaches its
-- slice its chatbot stops, while the other clients keep working. The agency's
-- overall pool limit still applies as a backstop.
--
-- Usage is counted live against the same calendar-month window used for the
-- billing pool (see lib/billing-period.ts), so allocations reset monthly with
-- no extra reset job.

-- Mode toggle on the agency settings row.
alter table if exists public.agency_portal_settings
  add column if not exists client_usage_mode text not null default 'shared';

alter table if exists public.agency_portal_settings
  drop constraint if exists chk_agency_portal_settings_client_usage_mode;

alter table if exists public.agency_portal_settings
  add constraint chk_agency_portal_settings_client_usage_mode
    check (client_usage_mode in ('shared', 'allocated'));

-- Per-client monthly allocation (number of visitor messages). Null means no
-- allocation has been set; in allocated mode a null/0 allocation blocks the
-- client immediately (they must be given an explicit slice to send messages).
alter table if exists public.agency_portal_shares
  add column if not exists message_credit_allocation integer;

alter table if exists public.agency_portal_shares
  drop constraint if exists chk_agency_portal_shares_message_credit_allocation;

alter table if exists public.agency_portal_shares
  add constraint chk_agency_portal_shares_message_credit_allocation
    check (
      message_credit_allocation is null
      or message_credit_allocation >= 0
    );
