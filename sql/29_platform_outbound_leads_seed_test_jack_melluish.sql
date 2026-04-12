-- 29_platform_outbound_leads_seed_test_jack_melluish.sql
-- Seed a test lead for outbound workflow validation.

with inserted_lead as (
  insert into public.platform_outbound_leads (
    company_name,
    contact_name,
    contact_email,
    contact_phone,
    website,
    lead_source,
    lead_status,
    priority,
    notes_summary
  )
  select
    'TourBots AI',
    'Jack Melluish',
    'tourbotsai@gmail.com',
    null,
    'https://www.tourbots.ai',
    'Internal test',
    'new',
    'high',
    'Internal test lead for outbound workflow validation.'
  where not exists (
    select 1
    from public.platform_outbound_leads
    where lower(company_name) = lower('TourBots AI')
      and lower(coalesce(contact_email, '')) = lower('tourbotsai@gmail.com')
  )
  returning id
), target_lead as (
  select id from inserted_lead
  union all
  select id
  from public.platform_outbound_leads
  where lower(company_name) = lower('TourBots AI')
    and lower(coalesce(contact_email, '')) = lower('tourbotsai@gmail.com')
  limit 1
)
insert into public.platform_outbound_lead_notes (
  lead_id,
  note,
  created_by
)
select
  t.id,
  'Test lead created for Platform Admin outbound UI and notes flow.',
  null
from target_lead t
where not exists (
  select 1
  from public.platform_outbound_lead_notes n
  where n.lead_id = t.id
    and n.note ilike 'Test lead created for Platform Admin outbound UI and notes flow.%'
);
