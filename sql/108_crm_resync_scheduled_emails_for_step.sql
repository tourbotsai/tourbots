-- 108_crm_resync_scheduled_emails_for_step.sql
-- Supports editing a sequence step from the admin UI: when a step's date,
-- time, or content changes after contacts are already enrolled, any
-- already-queued scheduled emails for that step need their scheduled_for
-- recomputed — crm_sync_scheduled_emails_for_step() (migration 72) only
-- inserts rows that don't exist yet, it never touches existing ones, so a
-- second function is needed for the "step already had scheduled emails,
-- now the date/time changed" case.
--
-- Only ever touches rows still in 'scheduled' status — a row that's already
-- sent, processing, failed, or cancelled is left exactly as it is.

create or replace function public.crm_resync_scheduled_emails_for_step(p_step_id uuid)
returns void
language plpgsql
as $$
begin
  update public.crm_sequence_scheduled_emails e
  set scheduled_for = public.crm_compute_scheduled_for(
    public.crm_effective_step_date(st.sequence_id, st.scheduled_date, sc.anchor_date),
    st.scheduled_time
  )
  from public.crm_sequence_steps st
  join public.crm_sequence_contacts sc
    on sc.sequence_id = st.sequence_id
  where e.step_id = st.id
    and e.company_id = sc.company_id
    and e.status = 'scheduled'
    and st.id = p_step_id;
end;
$$;
