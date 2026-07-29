-- 109_cleanup_unused_venues_and_users.sql
-- Manual production cleanup (run in Supabase SQL editor).
--
-- KEEP (from docs/demoaccounts.md + admin + Apollo live):
--   tourbotsai@gmail.com  → Tour Bots
--   website@tourbots.ai   → TourBots Website
--   agency@tourbots.ai    → TourBots Agency  (+ portal user agencyclient@tourbots.ai)
--   mpskin@tourbots.ai    → MP Skin
--   mark@apollo3d.co.uk   → Apollo 3D
--
-- Does NOT delete Firebase Auth users — remove those separately in Firebase console.
-- Does NOT touch CRM companies / sequences.
--
-- Recommended: run STEP 0 preview first, then STEP 1 inside a transaction.

-- ============================================================
-- STEP 0 — PREVIEW (safe, read-only)
-- ============================================================

with keep_emails as (
  select lower(unnest(array[
    'tourbotsai@gmail.com',
    'website@tourbots.ai',
    'agency@tourbots.ai',
    'mpskin@tourbots.ai',
    'mark@apollo3d.co.uk'
  ])) as email
),
keep_users as (
  select u.id, u.email
  from public.users u
  join keep_emails k on lower(u.email) = k.email
),
keep_venues as (
  select v.id, v.name, v.slug, u.email as owner_email
  from public.venues v
  join keep_users u on u.id = v.owner_id
)
select 'KEEP venues' as bucket, kv.name, kv.slug, kv.owner_email, kv.id::text
from keep_venues kv
union all
select 'DELETE venues', v.name, v.slug, coalesce(u.email, '(no owner)'), v.id::text
from public.venues v
left join public.users u on u.id = v.owner_id
where v.id not in (select id from keep_venues)
union all
select 'DELETE users', u.email, coalesce(u.role, ''), coalesce(u.first_name, ''), u.id::text
from public.users u
where lower(u.email) not in (select email from keep_emails)
order by 1, 2;

-- ============================================================
-- STEP 1 — DELETE (run after preview looks right)
-- Wrap in a transaction. If anything looks wrong: ROLLBACK;
-- ============================================================

begin;

with keep_emails as (
  select lower(unnest(array[
    'tourbotsai@gmail.com',
    'website@tourbots.ai',
    'agency@tourbots.ai',
    'mpskin@tourbots.ai',
    'mark@apollo3d.co.uk'
  ])) as email
),
keep_user_ids as (
  select u.id
  from public.users u
  join keep_emails k on lower(u.email) = k.email
),
keep_venue_ids as (
  select v.id
  from public.venues v
  where v.owner_id in (select id from keep_user_ids)
),
deleted_venues as (
  delete from public.venues v
  where v.id not in (select id from keep_venue_ids)
  returning v.id, v.name, v.slug
)
select * from deleted_venues order by name;

-- Drop leftover app users that are not on the keep list
-- (includes tourbots2@gmail.com, test accounts, live.signup.*, etc.)
with keep_emails as (
  select lower(unnest(array[
    'tourbotsai@gmail.com',
    'website@tourbots.ai',
    'agency@tourbots.ai',
    'mpskin@tourbots.ai',
    'mark@apollo3d.co.uk'
  ])) as email
),
deleted_users as (
  delete from public.users u
  where lower(u.email) not in (select email from keep_emails)
  returning u.id, u.email
)
select * from deleted_users order by email;

-- On kept agency venues, remove portal logins that are not the real Apex client.
-- Keeps: agencyclient@tourbots.ai under TourBots Agency.
-- Skips Apollo / other keep venues' portal users only if they match that email
-- (Apollo currently has 0 portal users).
with deleted_portal_users as (
  delete from public.agency_portal_users apu
  where lower(apu.email) <> lower('agencyclient@tourbots.ai')
    and apu.venue_id in (
      select v.id
      from public.venues v
      join public.users u on u.id = v.owner_id
      where lower(u.email) in (
        'tourbotsai@gmail.com',
        'website@tourbots.ai',
        'agency@tourbots.ai',
        'mpskin@tourbots.ai',
        'mark@apollo3d.co.uk'
      )
    )
  returning apu.id, apu.email, apu.venue_id
)
select * from deleted_portal_users order by email;

-- ============================================================
-- STEP 2 — VERIFY (still inside the transaction)
-- Expect: 5 users, 5 venues, and agencyclient still present.
-- ============================================================

select 'users left' as check, count(*)::text as value from public.users
union all
select 'venues left', count(*)::text from public.venues
union all
select 'user emails', string_agg(email, ', ' order by email) from public.users
union all
select 'venue names', string_agg(name, ', ' order by name) from public.venues
union all
select 'agencyclient portal rows', count(*)::text
from public.agency_portal_users
where lower(email) = lower('agencyclient@tourbots.ai');

-- If the verify block looks correct:
--   commit;
-- If not:
--   rollback;
