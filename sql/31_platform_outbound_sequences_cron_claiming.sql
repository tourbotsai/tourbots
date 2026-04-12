-- 31_platform_outbound_sequences_cron_claiming.sql
-- Atomic claiming for outbound sequence cron processing.
-- Run this after 30_platform_outbound_sequences_initial.sql.

create or replace function public.claim_platform_outbound_sequence_emails(
  p_now timestamptz default now(),
  p_limit integer default 100
)
returns setof public.platform_outbound_sequence_emails
language plpgsql
security definer
as $$
begin
  return query
  with claimable as (
    select e.id
    from public.platform_outbound_sequence_emails e
    where
      (
        e.status = 'scheduled'
        and e.scheduled_for <= p_now
      )
      or (
        e.status = 'processing'
        and e.updated_at < (p_now - interval '10 minutes')
      )
    order by e.scheduled_for asc
    for update skip locked
    limit greatest(coalesce(p_limit, 100), 1)
  )
  update public.platform_outbound_sequence_emails as target
  set
    status = 'processing',
    updated_at = now()
  from claimable
  where target.id = claimable.id
  returning target.*;
end;
$$;
