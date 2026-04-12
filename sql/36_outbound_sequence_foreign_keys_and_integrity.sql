-- 36_outbound_sequence_foreign_keys_and_integrity.sql
-- Add missing foreign keys and integrity constraints for outbound lead/sequence tables.

-- --------
-- Foreign keys
-- --------

alter table if exists public.platform_outbound_lead_notes
  drop constraint if exists fk_platform_outbound_lead_notes_lead;
alter table public.platform_outbound_lead_notes
  add constraint fk_platform_outbound_lead_notes_lead
  foreign key (lead_id) references public.platform_outbound_leads(id)
  on delete cascade
  not valid;

alter table if exists public.platform_outbound_lead_notes
  drop constraint if exists fk_platform_outbound_lead_notes_created_by;
alter table public.platform_outbound_lead_notes
  add constraint fk_platform_outbound_lead_notes_created_by
  foreign key (created_by) references public.users(id)
  on delete set null
  not valid;

alter table if exists public.platform_outbound_sequence_steps
  drop constraint if exists fk_platform_outbound_sequence_steps_sequence;
alter table public.platform_outbound_sequence_steps
  add constraint fk_platform_outbound_sequence_steps_sequence
  foreign key (sequence_id) references public.platform_outbound_sequences(id)
  on delete cascade
  not valid;

alter table if exists public.platform_outbound_sequence_enrollments
  drop constraint if exists fk_platform_outbound_sequence_enrollments_sequence;
alter table public.platform_outbound_sequence_enrollments
  add constraint fk_platform_outbound_sequence_enrollments_sequence
  foreign key (sequence_id) references public.platform_outbound_sequences(id)
  on delete cascade
  not valid;

alter table if exists public.platform_outbound_sequence_enrollments
  drop constraint if exists fk_platform_outbound_sequence_enrollments_lead;
alter table public.platform_outbound_sequence_enrollments
  add constraint fk_platform_outbound_sequence_enrollments_lead
  foreign key (lead_id) references public.platform_outbound_leads(id)
  on delete cascade
  not valid;

alter table if exists public.platform_outbound_sequence_emails
  drop constraint if exists fk_platform_outbound_sequence_emails_sequence;
alter table public.platform_outbound_sequence_emails
  add constraint fk_platform_outbound_sequence_emails_sequence
  foreign key (sequence_id) references public.platform_outbound_sequences(id)
  on delete cascade
  not valid;

alter table if exists public.platform_outbound_sequence_emails
  drop constraint if exists fk_platform_outbound_sequence_emails_enrollment;
alter table public.platform_outbound_sequence_emails
  add constraint fk_platform_outbound_sequence_emails_enrollment
  foreign key (enrollment_id) references public.platform_outbound_sequence_enrollments(id)
  on delete cascade
  not valid;

alter table if exists public.platform_outbound_sequence_emails
  drop constraint if exists fk_platform_outbound_sequence_emails_step;
alter table public.platform_outbound_sequence_emails
  add constraint fk_platform_outbound_sequence_emails_step
  foreign key (step_id) references public.platform_outbound_sequence_steps(id)
  on delete cascade
  not valid;

alter table if exists public.platform_outbound_sequence_emails
  drop constraint if exists fk_platform_outbound_sequence_emails_lead;
alter table public.platform_outbound_sequence_emails
  add constraint fk_platform_outbound_sequence_emails_lead
  foreign key (lead_id) references public.platform_outbound_leads(id)
  on delete cascade
  not valid;

-- --------
-- Uniqueness to prevent duplicate logical rows
-- --------

create unique index if not exists uq_platform_outbound_sequence_steps_sequence_step
  on public.platform_outbound_sequence_steps(sequence_id, step_number);

create unique index if not exists uq_platform_outbound_sequence_enrollments_sequence_lead
  on public.platform_outbound_sequence_enrollments(sequence_id, lead_id);

create unique index if not exists uq_platform_outbound_sequence_emails_enrollment_step
  on public.platform_outbound_sequence_emails(enrollment_id, step_id);

-- --------
-- Check constraints for valid states
-- --------

alter table if exists public.platform_outbound_leads
  drop constraint if exists chk_platform_outbound_leads_company_name_not_blank;
alter table public.platform_outbound_leads
  add constraint chk_platform_outbound_leads_company_name_not_blank
  check (length(trim(company_name)) > 0)
  not valid;

alter table if exists public.platform_outbound_leads
  drop constraint if exists chk_platform_outbound_leads_status;
alter table public.platform_outbound_leads
  add constraint chk_platform_outbound_leads_status
  check (lead_status in ('new', 'attempted_contact', 'in_conversation', 'qualified', 'proposal_sent', 'won', 'lost'))
  not valid;

alter table if exists public.platform_outbound_leads
  drop constraint if exists chk_platform_outbound_leads_priority;
alter table public.platform_outbound_leads
  add constraint chk_platform_outbound_leads_priority
  check (priority in ('low', 'medium', 'high'))
  not valid;

alter table if exists public.platform_outbound_lead_notes
  drop constraint if exists chk_platform_outbound_lead_notes_note_not_blank;
alter table public.platform_outbound_lead_notes
  add constraint chk_platform_outbound_lead_notes_note_not_blank
  check (length(trim(note)) > 0)
  not valid;

alter table if exists public.platform_outbound_sequences
  drop constraint if exists chk_platform_outbound_sequences_name_not_blank;
alter table public.platform_outbound_sequences
  add constraint chk_platform_outbound_sequences_name_not_blank
  check (length(trim(name)) > 0)
  not valid;

alter table if exists public.platform_outbound_sequence_steps
  drop constraint if exists chk_platform_outbound_sequence_steps_step_number;
alter table public.platform_outbound_sequence_steps
  add constraint chk_platform_outbound_sequence_steps_step_number
  check (step_number >= 1)
  not valid;

alter table if exists public.platform_outbound_sequence_enrollments
  drop constraint if exists chk_platform_outbound_sequence_enrollments_status;
alter table public.platform_outbound_sequence_enrollments
  add constraint chk_platform_outbound_sequence_enrollments_status
  check (status in ('active', 'paused', 'completed', 'stopped_manual'))
  not valid;

alter table if exists public.platform_outbound_sequence_enrollments
  drop constraint if exists chk_platform_outbound_sequence_enrollments_current_step;
alter table public.platform_outbound_sequence_enrollments
  add constraint chk_platform_outbound_sequence_enrollments_current_step
  check (current_step >= 1)
  not valid;

alter table if exists public.platform_outbound_sequence_emails
  drop constraint if exists chk_platform_outbound_sequence_emails_status;
alter table public.platform_outbound_sequence_emails
  add constraint chk_platform_outbound_sequence_emails_status
  check (status in ('scheduled', 'processing', 'sent', 'failed', 'cancelled'))
  not valid;

alter table if exists public.platform_outbound_sequence_emails
  drop constraint if exists chk_platform_outbound_sequence_emails_attempts;
alter table public.platform_outbound_sequence_emails
  add constraint chk_platform_outbound_sequence_emails_attempts
  check (attempts >= 0)
  not valid;

alter table if exists public.platform_outbound_sequence_emails
  drop constraint if exists chk_platform_outbound_sequence_emails_email_to_not_blank;
alter table public.platform_outbound_sequence_emails
  add constraint chk_platform_outbound_sequence_emails_email_to_not_blank
  check (length(trim(email_to)) > 0)
  not valid;
