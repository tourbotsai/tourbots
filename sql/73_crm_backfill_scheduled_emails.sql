-- 73_crm_backfill_scheduled_emails.sql
-- Backfills crm_sequence_scheduled_emails for every email step already created
-- in 71_crm_agency_outreach_sequence_seed.sql against every company already
-- enrolled as a contact. Safe to re-run — crm_sync_scheduled_emails_for_step
-- never overwrites an existing (step, company) row.

do $$
declare
  v_step record;
begin
  for v_step in
    select st.id
    from public.crm_sequence_steps st
    join public.crm_sequences sq on sq.id = st.sequence_id
    where lower(sq.title) = lower('Initial Agency Sales Outreach')
      and st.step_type = 'email'
  loop
    perform public.crm_sync_scheduled_emails_for_step(v_step.id);
  end loop;
end;
$$;
