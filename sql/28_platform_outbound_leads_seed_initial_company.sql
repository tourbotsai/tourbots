-- 28_platform_outbound_leads_seed_initial_company.sql
-- Seed one outbound lead for initial platform-admin outreach.
-- Source checked: 28/03/2026.

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
    '360 Virtual Tour Co.',
    null,
    'hello@360virtualtour.co',
    '+44 2071237960',
    'https://www.360virtualtour.co/',
    'Website research',
    'new',
    'high',
    'UK virtual tour provider with broad portfolio and likely strong reseller fit for white-label AI chatbot upsell.'
  where not exists (
    select 1
    from public.platform_outbound_leads
    where lower(company_name) = lower('360 Virtual Tour Co.')
      and lower(coalesce(contact_email, '')) = lower('hello@360virtualtour.co')
  )
  returning id
), target_lead as (
  select id from inserted_lead
  union all
  select id
  from public.platform_outbound_leads
  where lower(company_name) = lower('360 Virtual Tour Co.')
    and lower(coalesce(contact_email, '')) = lower('hello@360virtualtour.co')
  limit 1
)
insert into public.platform_outbound_lead_notes (
  lead_id,
  note,
  created_by
)
select
  t.id,
  'Initial outbound hypothesis: offer agency account with white-label portal, then propose campaign to their existing virtual tour clients to upsell AI chatbot add-ons on each tour.',
  null
from target_lead t
where not exists (
  select 1
  from public.platform_outbound_lead_notes n
  where n.lead_id = t.id
    and n.note ilike 'Initial outbound hypothesis:%'
);
