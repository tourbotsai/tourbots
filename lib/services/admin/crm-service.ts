import { supabaseServiceRole as supabase } from '../../supabase-service-role';
import {
  sendCrmSequenceEmailViaGmail,
  getActiveCrmGmailAccountRow,
  getValidAccessToken,
  bootstrapGmailHistoryId,
  getGmailHistorySince,
  fetchInboundGmailMessage,
  updateGmailHistoryId,
} from './crm-gmail-service';

export type CrmCompanyStatus =
  | 'not_started'
  | 'attempted'
  | 'in_sequence'
  | 'interested'
  | 'not_interested'
  | 'dormant';

export interface CrmCompany {
  id: string;
  company_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  region: string;
  notes_summary: string | null;
  source: string;
  status: CrmCompanyStatus;
  is_stopped: boolean;
  stopped_at: string | null;
  stopped_reason: CrmStoppedReason | null;
  created_at: string;
  updated_at: string;
}

export type CrmStoppedReason = 'manual' | 'inbound_reply';

export interface CrmCompanyWithActivity extends CrmCompany {
  last_activity_date: string | null;
}

export interface CrmNote {
  id: string;
  company_id: string;
  note_text: string;
  created_at: string;
}

export type CrmActivityType = 'call' | 'email';
export type CrmActivityDirection = 'outbound' | 'inbound';

export interface CrmActivity {
  id: string;
  company_id: string;
  activity_type: CrmActivityType;
  activity_date: string;
  activity_time: string | null;
  subject: string | null;
  summary: string;
  outcome: string | null;
  direction: CrmActivityDirection;
  created_at: string;
}

export interface CrmSequence {
  id: string;
  title: string;
  description: string | null;
  status: 'active' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface CrmSequenceWithStats extends CrmSequence {
  contact_count: number;
  step_count: number;
}

export interface CrmSequenceContact {
  id: string;
  sequence_id: string;
  company_id: string;
  added_at: string;
  company: CrmCompany | null;
}

export type CrmSequenceStepType = 'email' | 'call';

export interface CrmSequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  title: string;
  description: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  step_type: CrmSequenceStepType;
  email_subject: string | null;
  email_body: string | null;
  call_script: string | null;
  created_at: string;
}

export interface CrmSequenceStepStatus {
  id: string;
  step_id: string;
  company_id: string;
  completed_at: string | null;
}

function resolveTemplateVariables(template: string, company: CrmCompany): string {
  const companyName = company.company_name || '';
  const firstName = company.first_name?.trim();
  const lastName = company.last_name?.trim();

  // Fall back to the company name whenever a contact name isn't on file —
  // most companies in this CRM only ever have a company name, no personal contact.
  const values: Record<string, string> = {
    first_name: firstName || companyName,
    last_name: lastName || companyName,
    company_name: companyName,
  };

  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    return values[key.toLowerCase()] ?? '';
  });
}

// --------------------
// Companies
// --------------------

export async function listCrmCompanies(filters?: {
  status?: string;
  region?: string;
  search?: string;
}): Promise<CrmCompanyWithActivity[]> {
  let query = supabase.from('crm_companies').select('*').order('company_name', { ascending: true });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.region) {
    query = query.eq('region', filters.region);
  }
  if (filters?.search && filters.search.trim()) {
    const term = filters.search.trim();
    query = query.or(
      `company_name.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`
    );
  }

  const { data: companies, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (companies ?? []) as CrmCompany[];
  if (rows.length === 0) return [];

  const companyIds = rows.map((row) => row.id);
  const { data: activities, error: activitiesError } = await supabase
    .from('crm_activities')
    .select('company_id, activity_date')
    .in('company_id', companyIds);

  if (activitiesError) throw new Error(activitiesError.message);

  const lastActivityByCompany = new Map<string, string>();
  for (const activity of activities || []) {
    const existing = lastActivityByCompany.get(activity.company_id);
    if (!existing || activity.activity_date > existing) {
      lastActivityByCompany.set(activity.company_id, activity.activity_date);
    }
  }

  return rows.map((company) => ({
    ...company,
    last_activity_date: lastActivityByCompany.get(company.id) || null,
  }));
}

export async function getCrmCompanyById(companyId: string): Promise<CrmCompany | null> {
  const { data, error } = await supabase.from('crm_companies').select('*').eq('id', companyId).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data as CrmCompany;
}

export interface UpdateCrmCompanyDetailsInput {
  company_name?: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  region?: string;
}

// Editable contact-record fields — separate from status/is_stopped, which have
// their own dedicated update paths. Used by the "Edit contact" form on the
// company detail page (e.g. filling in first/last name after seeding from a
// spreadsheet that only had company-level contact info).
export async function updateCrmCompanyDetails(
  companyId: string,
  input: UpdateCrmCompanyDetailsInput
): Promise<CrmCompany> {
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.company_name !== undefined) {
    const trimmed = input.company_name.trim();
    if (!trimmed) throw new Error('Company name cannot be blank');
    updatePayload.company_name = trimmed;
  }
  if (input.first_name !== undefined) updatePayload.first_name = input.first_name?.trim() || null;
  if (input.last_name !== undefined) updatePayload.last_name = input.last_name?.trim() || null;
  if (input.email !== undefined) updatePayload.email = input.email?.trim() || null;
  if (input.phone !== undefined) updatePayload.phone = input.phone?.trim() || null;
  if (input.region !== undefined) updatePayload.region = input.region?.trim() || '';

  const { data, error } = await supabase
    .from('crm_companies')
    .update(updatePayload)
    .eq('id', companyId)
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to update company details');
  return data as CrmCompany;
}

export async function updateCrmCompanyStatus(companyId: string, status: CrmCompanyStatus): Promise<CrmCompany> {
  const { data, error } = await supabase
    .from('crm_companies')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', companyId)
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to update company status');
  return data as CrmCompany;
}

// Stopping a company blocks it from every automated send and flags it as
// "do not call" everywhere it appears, across every sequence it belongs to —
// independent of, and without overwriting, its sales-outcome status. Any
// scheduled-but-not-yet-sent emails are cancelled immediately so nothing
// slips out before the next cron run.
export async function stopCrmCompanyOutreach(
  companyId: string,
  reason: CrmStoppedReason = 'manual'
): Promise<CrmCompany> {
  const { data, error } = await supabase
    .from('crm_companies')
    .update({
      is_stopped: true,
      stopped_at: new Date().toISOString(),
      stopped_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', companyId)
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to stop company outreach');

  await supabase
    .from('crm_sequence_scheduled_emails')
    .update({ status: 'cancelled', error_message: `Cancelled — ${data.company_name} was marked stopped` })
    .eq('company_id', companyId)
    .eq('status', 'scheduled');

  return data as CrmCompany;
}

export async function resumeCrmCompanyOutreach(companyId: string): Promise<CrmCompany> {
  const { data, error } = await supabase
    .from('crm_companies')
    .update({ is_stopped: false, stopped_at: null, stopped_reason: null, updated_at: new Date().toISOString() })
    .eq('id', companyId)
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to resume company outreach');
  return data as CrmCompany;
}

// --------------------
// Notes
// --------------------

export async function listCrmNotes(companyId: string): Promise<CrmNote[]> {
  const { data, error } = await supabase
    .from('crm_notes')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as CrmNote[];
}

export async function createCrmNote(companyId: string, noteText: string): Promise<CrmNote> {
  const cleanNote = noteText.trim();
  if (!cleanNote) throw new Error('Note cannot be empty');

  const { data, error } = await supabase
    .from('crm_notes')
    .insert([{ company_id: companyId, note_text: cleanNote }])
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to create note');
  return data as CrmNote;
}

// --------------------
// Activities
// --------------------

export async function listCrmActivities(companyId: string): Promise<CrmActivity[]> {
  const { data, error } = await supabase
    .from('crm_activities')
    .select('*')
    .eq('company_id', companyId)
    .order('activity_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as CrmActivity[];
}

export interface CreateCrmActivityInput {
  activity_type: CrmActivityType;
  activity_date: string;
  activity_time?: string | null;
  subject?: string | null;
  summary: string;
  outcome?: string | null;
  direction?: CrmActivityDirection;
}

export async function createCrmActivity(companyId: string, input: CreateCrmActivityInput): Promise<CrmActivity> {
  if (!input.summary || !input.summary.trim()) {
    throw new Error('Summary is required');
  }

  const { data, error } = await supabase
    .from('crm_activities')
    .insert([
      {
        company_id: companyId,
        activity_type: input.activity_type,
        activity_date: input.activity_date,
        activity_time: input.activity_time || null,
        subject: input.subject?.trim() || null,
        summary: input.summary.trim(),
        outcome: input.outcome?.trim() || null,
        direction: input.direction || 'outbound',
      },
    ])
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to log activity');
  return data as CrmActivity;
}

export async function updateCrmActivityOutcome(activityId: string, outcome: string): Promise<CrmActivity> {
  const { data, error } = await supabase
    .from('crm_activities')
    .update({ outcome: outcome.trim() || null })
    .eq('id', activityId)
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to update activity outcome');
  return data as CrmActivity;
}

// --------------------
// Sequences
// --------------------

export async function listCrmSequences(): Promise<CrmSequenceWithStats[]> {
  const { data: sequences, error } = await supabase
    .from('crm_sequences')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (sequences ?? []) as CrmSequence[];
  if (rows.length === 0) return [];

  const sequenceIds = rows.map((row) => row.id);
  const [{ data: contacts, error: contactsError }, { data: steps, error: stepsError }] = await Promise.all([
    supabase.from('crm_sequence_contacts').select('sequence_id').in('sequence_id', sequenceIds),
    supabase.from('crm_sequence_steps').select('sequence_id').in('sequence_id', sequenceIds),
  ]);

  if (contactsError) throw new Error(contactsError.message);
  if (stepsError) throw new Error(stepsError.message);

  const contactCounts = new Map<string, number>();
  for (const row of contacts || []) {
    contactCounts.set(row.sequence_id, (contactCounts.get(row.sequence_id) || 0) + 1);
  }

  const stepCounts = new Map<string, number>();
  for (const row of steps || []) {
    stepCounts.set(row.sequence_id, (stepCounts.get(row.sequence_id) || 0) + 1);
  }

  return rows.map((sequence) => ({
    ...sequence,
    contact_count: contactCounts.get(sequence.id) || 0,
    step_count: stepCounts.get(sequence.id) || 0,
  }));
}

export interface CreateCrmSequenceInput {
  title: string;
  description?: string | null;
  status?: 'active' | 'paused';
}

export async function createCrmSequence(input: CreateCrmSequenceInput): Promise<CrmSequence> {
  if (!input.title || !input.title.trim()) {
    throw new Error('Title is required');
  }

  const { data, error } = await supabase
    .from('crm_sequences')
    .insert([
      {
        title: input.title.trim(),
        description: input.description?.trim() || null,
        status: input.status || 'active',
      },
    ])
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to create sequence');
  return data as CrmSequence;
}

export async function getCrmSequenceById(sequenceId: string): Promise<CrmSequence | null> {
  const { data, error } = await supabase.from('crm_sequences').select('*').eq('id', sequenceId).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data as CrmSequence;
}

export async function updateCrmSequence(
  sequenceId: string,
  input: Partial<CreateCrmSequenceInput>
): Promise<CrmSequence> {
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) updatePayload.title = input.title.trim();
  if (input.description !== undefined) updatePayload.description = input.description?.trim() || null;
  if (input.status !== undefined) updatePayload.status = input.status;

  const { data, error } = await supabase
    .from('crm_sequences')
    .update(updatePayload)
    .eq('id', sequenceId)
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to update sequence');
  return data as CrmSequence;
}

export async function deleteCrmSequence(sequenceId: string): Promise<void> {
  const { error } = await supabase.from('crm_sequences').delete().eq('id', sequenceId);
  if (error) throw new Error(error.message);
}

// --------------------
// Sequence contacts
// --------------------

export async function listCrmSequenceContacts(sequenceId: string): Promise<CrmSequenceContact[]> {
  const { data, error } = await supabase
    .from('crm_sequence_contacts')
    .select('*')
    .eq('sequence_id', sequenceId)
    .order('added_at', { ascending: false });

  if (error) throw new Error(error.message);

  const rows = data || [];
  const companyIds = rows.map((row: any) => row.company_id).filter(Boolean);
  let companyMap: Record<string, CrmCompany> = {};

  if (companyIds.length > 0) {
    const { data: companies, error: companiesError } = await supabase
      .from('crm_companies')
      .select('*')
      .in('id', companyIds);

    if (companiesError) throw new Error(companiesError.message);

    companyMap = (companies || []).reduce<Record<string, CrmCompany>>((acc, company: any) => {
      acc[company.id] = company;
      return acc;
    }, {});
  }

  return rows.map((row: any) => ({
    ...row,
    company: companyMap[row.company_id] || null,
  }));
}

export async function addCrmSequenceContact(sequenceId: string, companyId: string): Promise<CrmSequenceContact> {
  const { data: existing } = await supabase
    .from('crm_sequence_contacts')
    .select('id')
    .eq('sequence_id', sequenceId)
    .eq('company_id', companyId)
    .maybeSingle();

  if (existing) {
    throw new Error('This company is already in the sequence');
  }

  const { data, error } = await supabase
    .from('crm_sequence_contacts')
    .insert([{ sequence_id: sequenceId, company_id: companyId }])
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to add contact to sequence');

  await supabase
    .from('crm_companies')
    .update({ status: 'in_sequence', updated_at: new Date().toISOString() })
    .eq('id', companyId)
    .eq('status', 'not_started');

  // Queue a scheduled email for every existing email step in this sequence for
  // this contact, defaulting to that step's date/time. Never overwrites an
  // existing row, so this is safe even if called more than once.
  const { error: syncError } = await supabase.rpc('crm_sync_scheduled_emails_for_contact', {
    p_sequence_id: sequenceId,
    p_company_id: companyId,
  });
  if (syncError) console.error('Failed to queue scheduled emails for new contact:', syncError);

  return { ...(data as any), company: null };
}

export async function removeCrmSequenceContact(sequenceId: string, companyId: string): Promise<void> {
  const { error } = await supabase
    .from('crm_sequence_contacts')
    .delete()
    .eq('sequence_id', sequenceId)
    .eq('company_id', companyId);

  if (error) throw new Error(error.message);
}

// --------------------
// Sequence steps
// --------------------

export async function listCrmSequenceSteps(sequenceId: string): Promise<CrmSequenceStep[]> {
  const { data, error } = await supabase
    .from('crm_sequence_steps')
    .select('*')
    .eq('sequence_id', sequenceId)
    .order('step_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as CrmSequenceStep[];
}

export interface CreateCrmSequenceStepInput {
  title: string;
  description?: string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  step_type: CrmSequenceStepType;
  email_subject?: string | null;
  email_body?: string | null;
  call_script?: string | null;
}

export async function createCrmSequenceStep(
  sequenceId: string,
  input: CreateCrmSequenceStepInput
): Promise<CrmSequenceStep> {
  if (!input.title || !input.title.trim()) {
    throw new Error('Title is required');
  }
  if (input.step_type === 'email' && (!input.email_subject?.trim() || !input.email_body?.trim())) {
    throw new Error('Email steps require a subject and body');
  }
  if (input.step_type === 'call' && !input.call_script?.trim()) {
    throw new Error('Call steps require a script');
  }

  const { count } = await supabase
    .from('crm_sequence_steps')
    .select('*', { count: 'exact', head: true })
    .eq('sequence_id', sequenceId);

  const { data, error } = await supabase
    .from('crm_sequence_steps')
    .insert([
      {
        sequence_id: sequenceId,
        step_order: (count || 0) + 1,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        scheduled_date: input.scheduled_date || null,
        scheduled_time: input.scheduled_time || null,
        step_type: input.step_type,
        email_subject: input.step_type === 'email' ? input.email_subject?.trim() || null : null,
        email_body: input.step_type === 'email' ? input.email_body?.trim() || null : null,
        call_script: input.step_type === 'call' ? input.call_script?.trim() || null : null,
      },
    ])
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to create sequence step');

  if (data.step_type === 'email') {
    // Queue a scheduled email for every contact already enrolled in this
    // sequence, defaulting to this step's date/time.
    const { error: syncError } = await supabase.rpc('crm_sync_scheduled_emails_for_step', {
      p_step_id: data.id,
    });
    if (syncError) console.error('Failed to queue scheduled emails for new step:', syncError);
  }

  return data as CrmSequenceStep;
}

export async function listCrmSequenceStepStatuses(sequenceId: string): Promise<CrmSequenceStepStatus[]> {
  const { data: steps, error: stepsError } = await supabase
    .from('crm_sequence_steps')
    .select('id')
    .eq('sequence_id', sequenceId);

  if (stepsError) throw new Error(stepsError.message);

  const stepIds = (steps || []).map((row: any) => row.id);
  if (stepIds.length === 0) return [];

  const { data, error } = await supabase.from('crm_sequence_step_status').select('*').in('step_id', stepIds);

  if (error) throw new Error(error.message);
  return (data ?? []) as CrmSequenceStepStatus[];
}

export type CrmCallOutcome = 'no_answer' | 'positive' | 'negative';

export const CALL_OUTCOME_LABELS: Record<CrmCallOutcome, string> = {
  no_answer: 'No answer',
  positive: 'Positive',
  negative: 'Negative',
};

export interface CompleteCrmSequenceStepOptions {
  // Call outcome, captured via the "No answer" / "Positive" / "Negative"
  // buttons. Free text notes from the Positive/Negative modal are stored as
  // the activity summary, overriding the default call-script/email-body text.
  outcome?: CrmCallOutcome | null;
  note?: string | null;
  // From the Negative outcome modal's "stop this contact" checkbox — stops
  // outreach for the company across every sequence it belongs to.
  stopContact?: boolean;
  // Email steps only — used by the "Mark as sent" action, which logs the
  // step as done without actually calling the Gmail API. Also flips the
  // matching crm_sequence_scheduled_emails row to 'sent' so the cron never
  // tries to send it for real afterwards.
  markScheduledEmailSent?: boolean;
}

/**
 * Marks a sequence step complete for a specific contact. This is the single
 * action that both logs the real activity (source of truth) and updates the
 * tick state used to render completion in the Sequences tab.
 */
export async function completeCrmSequenceStep(
  stepId: string,
  companyId: string,
  options: CompleteCrmSequenceStepOptions = {}
): Promise<{
  activity: CrmActivity;
  stepStatus: CrmSequenceStepStatus;
}> {
  const [{ data: step, error: stepError }, { data: company, error: companyError }] = await Promise.all([
    supabase.from('crm_sequence_steps').select('*').eq('id', stepId).single(),
    supabase.from('crm_companies').select('*').eq('id', companyId).single(),
  ]);

  if (stepError || !step) throw new Error('Sequence step not found');
  if (companyError || !company) throw new Error('Company not found');

  const stepRow = step as CrmSequenceStep;
  const companyRow = company as CrmCompany;

  const note = options.note?.trim() || null;
  const summarySource = stepRow.step_type === 'email' ? stepRow.email_body : stepRow.call_script;
  const summary = note || (summarySource ? resolveTemplateVariables(summarySource, companyRow) : stepRow.title);
  const subject =
    stepRow.step_type === 'email' && stepRow.email_subject
      ? resolveTemplateVariables(stepRow.email_subject, companyRow)
      : null;
  const outcome = options.outcome ? CALL_OUTCOME_LABELS[options.outcome] : null;

  const { data: activity, error: activityError } = await supabase
    .from('crm_activities')
    .insert([
      {
        company_id: companyId,
        activity_type: stepRow.step_type,
        activity_date: new Date().toISOString().slice(0, 10),
        subject,
        summary,
        outcome,
      },
    ])
    .select('*')
    .single();

  if (activityError || !activity) throw new Error(activityError?.message || 'Failed to log activity for step completion');

  const { data: stepStatus, error: stepStatusError } = await supabase
    .from('crm_sequence_step_status')
    .upsert(
      [{ step_id: stepId, company_id: companyId, completed_at: new Date().toISOString() }],
      { onConflict: 'step_id,company_id' }
    )
    .select('*')
    .single();

  if (stepStatusError || !stepStatus) {
    throw new Error(stepStatusError?.message || 'Failed to update step status');
  }

  if (options.markScheduledEmailSent && stepRow.step_type === 'email') {
    await supabase
      .from('crm_sequence_scheduled_emails')
      .update({ status: 'sent', sent_at: new Date().toISOString(), error_message: null })
      .eq('step_id', stepId)
      .eq('company_id', companyId)
      .in('status', ['scheduled', 'processing', 'failed', 'cancelled']);
  }

  if (options.stopContact) {
    await stopCrmCompanyOutreach(companyId);
  }

  return { activity: activity as CrmActivity, stepStatus: stepStatus as CrmSequenceStepStatus };
}

/**
 * Reverses the tick state only. The activity record already logged for this
 * completion is left untouched — crm_activities always keeps a factual record
 * of what happened, even if the checkbox is later un-ticked by mistake.
 */
export async function uncompleteCrmSequenceStep(stepId: string, companyId: string): Promise<void> {
  const { error } = await supabase
    .from('crm_sequence_step_status')
    .delete()
    .eq('step_id', stepId)
    .eq('company_id', companyId);

  if (error) throw new Error(error.message);
}

// --------------------
// Scheduled emails (Gmail sending)
// --------------------

export type CrmScheduledEmailStatus = 'scheduled' | 'processing' | 'sent' | 'failed' | 'cancelled';

export interface CrmScheduledEmail {
  id: string;
  step_id: string;
  company_id: string;
  scheduled_for: string;
  status: CrmScheduledEmailStatus;
  attempts: number;
  error_message: string | null;
  gmail_message_id: string | null;
  gmail_thread_id: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

// Statuses that must never receive an automated send — matches the outreach
// doc's hard stop rule: any reply pulls a company out of the sequence, and
// "Interested" means manual follow-up only from here on.
const STATUSES_EXCLUDED_FROM_SENDING: CrmCompanyStatus[] = ['interested', 'not_interested', 'dormant'];

export async function listCrmScheduledEmailsForSequence(sequenceId: string): Promise<CrmScheduledEmail[]> {
  const { data: steps, error: stepsError } = await supabase
    .from('crm_sequence_steps')
    .select('id')
    .eq('sequence_id', sequenceId);

  if (stepsError) throw new Error(stepsError.message);

  const stepIds = (steps || []).map((row: any) => row.id);
  if (stepIds.length === 0) return [];

  const { data, error } = await supabase.from('crm_sequence_scheduled_emails').select('*').in('step_id', stepIds);

  if (error) throw new Error(error.message);
  return (data ?? []) as CrmScheduledEmail[];
}

export interface CrmSequenceEffectiveScheduleEntry {
  step_id: string;
  company_id: string;
  effective_date: string | null;
}

/**
 * Each contact's own actual date for every step in the sequence (call steps
 * included, which have no scheduled-email row of their own) — derived from
 * their anchor_date via crm_sequence_effective_schedule(). Used by the
 * sequence detail UI so staggered enrollment shows correctly per company
 * instead of one shared date for everyone.
 */
export async function listCrmSequenceEffectiveSchedule(
  sequenceId: string
): Promise<CrmSequenceEffectiveScheduleEntry[]> {
  const { data, error } = await supabase.rpc('crm_sequence_effective_schedule', {
    p_sequence_id: sequenceId,
  });

  if (error) throw new Error(error.message);
  return (data ?? []) as CrmSequenceEffectiveScheduleEntry[];
}

/**
 * Overrides the send time for one contact's queued email. Reviving a
 * previously failed/cancelled row back to 'scheduled' lets a rescheduled time
 * actually get picked up by the cron again.
 */
export async function rescheduleCrmScheduledEmail(
  scheduledEmailId: string,
  scheduledForIso: string
): Promise<CrmScheduledEmail> {
  const { data, error } = await supabase
    .from('crm_sequence_scheduled_emails')
    .update({
      scheduled_for: scheduledForIso,
      status: 'scheduled',
      error_message: null,
    })
    .eq('id', scheduledEmailId)
    .in('status', ['scheduled', 'failed', 'cancelled'])
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to reschedule email — it may already be sending or sent');
  }
  return data as CrmScheduledEmail;
}

export async function cancelCrmScheduledEmail(scheduledEmailId: string): Promise<CrmScheduledEmail> {
  const { data, error } = await supabase
    .from('crm_sequence_scheduled_emails')
    .update({ status: 'cancelled', error_message: null })
    .eq('id', scheduledEmailId)
    .in('status', ['scheduled', 'failed'])
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to cancel email — it may already be sending or sent');
  }
  return data as CrmScheduledEmail;
}

/**
 * Sends and logs one queued email. Shared by the manual "Send now" action and
 * the cron job — both paths end up here so a send always does exactly one
 * thing: send via Gmail, then log to crm_activities and tick crm_sequence_step_status.
 */
async function processCrmScheduledEmail(scheduledEmail: CrmScheduledEmail): Promise<void> {
  const [{ data: step, error: stepError }, { data: company, error: companyError }] = await Promise.all([
    supabase.from('crm_sequence_steps').select('*').eq('id', scheduledEmail.step_id).single(),
    supabase.from('crm_companies').select('*').eq('id', scheduledEmail.company_id).single(),
  ]);

  if (stepError || !step) throw new Error('Sequence step not found');
  if (companyError || !company) throw new Error('Company not found');

  const stepRow = step as CrmSequenceStep;
  const companyRow = company as CrmCompany;

  if (companyRow.is_stopped) {
    await supabase
      .from('crm_sequence_scheduled_emails')
      .update({
        status: 'cancelled',
        error_message: `Skipped — ${companyRow.company_name} is marked stopped`,
      })
      .eq('id', scheduledEmail.id);
    return;
  }

  if (STATUSES_EXCLUDED_FROM_SENDING.includes(companyRow.status)) {
    await supabase
      .from('crm_sequence_scheduled_emails')
      .update({
        status: 'cancelled',
        error_message: `Skipped — ${companyRow.company_name} is marked "${companyRow.status}"`,
      })
      .eq('id', scheduledEmail.id);
    return;
  }

  const subject = resolveTemplateVariables(stepRow.email_subject || stepRow.title, companyRow);
  const body = resolveTemplateVariables(stepRow.email_body || '', companyRow);
  const recipientEmail = companyRow.email?.trim();

  if (!recipientEmail) {
    const attempts = scheduledEmail.attempts + 1;
    await supabase
      .from('crm_sequence_scheduled_emails')
      .update({
        status: 'failed',
        attempts,
        error_message: `${companyRow.company_name} has no email address on file`,
      })
      .eq('id', scheduledEmail.id);
    return;
  }

  try {
    const { gmailMessageId, gmailThreadId } = await sendCrmSequenceEmailViaGmail({
      toAddress: recipientEmail,
      toName: contactDisplayName(companyRow),
      subject,
      bodyText: body,
    });

    const nowIso = new Date().toISOString();

    await supabase
      .from('crm_activities')
      .insert([
        {
          company_id: companyRow.id,
          activity_type: 'email',
          activity_date: nowIso.slice(0, 10),
          subject,
          summary: body,
          outcome: null,
        },
      ]);

    await supabase
      .from('crm_sequence_step_status')
      .upsert([{ step_id: stepRow.id, company_id: companyRow.id, completed_at: nowIso }], {
        onConflict: 'step_id,company_id',
      });

    await supabase
      .from('crm_sequence_scheduled_emails')
      .update({
        status: 'sent',
        sent_at: nowIso,
        gmail_message_id: gmailMessageId,
        gmail_thread_id: gmailThreadId,
        attempts: scheduledEmail.attempts + 1,
        error_message: null,
      })
      .eq('id', scheduledEmail.id);
  } catch (error: any) {
    const attempts = scheduledEmail.attempts + 1;
    // Same retry ceiling as the existing outbound sequence pipeline — after 3
    // attempts stop retrying automatically and surface it for manual review.
    const nextStatus: CrmScheduledEmailStatus = attempts >= 3 ? 'failed' : 'scheduled';
    await supabase
      .from('crm_sequence_scheduled_emails')
      .update({
        status: nextStatus,
        attempts,
        error_message: error.message || 'Failed to send email',
      })
      .eq('id', scheduledEmail.id);
    throw error;
  }
}

function contactDisplayName(company: CrmCompany): string {
  const name = `${company.first_name || ''} ${company.last_name || ''}`.trim();
  return name || company.company_name;
}

/**
 * Manual "Send now" action — claims one specific queued email and sends it
 * immediately, bypassing its scheduled_for time.
 */
export async function sendCrmScheduledEmailNow(scheduledEmailId: string): Promise<void> {
  const { data, error } = await supabase
    .from('crm_sequence_scheduled_emails')
    .update({ status: 'processing' })
    .eq('id', scheduledEmailId)
    .in('status', ['scheduled', 'failed'])
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'This email cannot be sent right now — it may already be sending or sent');
  }

  await processCrmScheduledEmail(data as CrmScheduledEmail);
}

/**
 * Cron entry point — atomically claims every due (or stuck) queued email and
 * sends each in turn, with a small delay between sends so a burst of same-time
 * emails (e.g. 64 contacts all due at 14:00) trickles out rather than firing
 * as one instantaneous batch.
 */
export async function processAllPendingCrmSequenceEmails(): Promise<{
  processed: number;
  sent: number;
  failed: number;
  errors: string[];
}> {
  const { data: claimed, error } = await supabase.rpc('claim_crm_sequence_scheduled_emails', {
    p_now: new Date().toISOString(),
    p_limit: 25,
  });

  if (error) throw new Error(error.message);

  const rows = (claimed || []) as CrmScheduledEmail[];
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      await processCrmScheduledEmail(row);
      sent += 1;
    } catch (error: any) {
      failed += 1;
      errors.push(`Scheduled email ${row.id}: ${error.message || 'Unknown error'}`);
    }
    // Stagger Gmail API calls slightly rather than firing them all in one instant.
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  return { processed: rows.length, sent, failed, errors };
}

// --------------------
// Inbound reply detection (poll cron)
// --------------------

/**
 * Cron entry point — polls the connected Gmail inbox for new mail since the
 * last check, matches senders to CRM companies, logs a "reply received"
 * activity for any match, and auto-stops that company's outreach across
 * every sequence. Every message seen (matched or not) is recorded in
 * crm_gmail_inbound_messages so re-running the cron never double-processes.
 */
export async function processInboundGmailMessages(): Promise<{
  checked: number;
  matched: number;
  unmatched: number;
  errors: string[];
}> {
  const account = await getActiveCrmGmailAccountRow();
  if (!account) {
    return { checked: 0, matched: 0, unmatched: 0, errors: [] };
  }

  const accessToken = await getValidAccessToken(account);
  const errors: string[] = [];

  if (!account.last_history_id) {
    const historyId = await bootstrapGmailHistoryId(accessToken);
    await updateGmailHistoryId(account.id, historyId);
    return { checked: 0, matched: 0, unmatched: 0, errors: [] };
  }

  const history = await getGmailHistorySince(accessToken, account.last_history_id);

  if (history.expired) {
    // Gmail's history retention window (~1 week) has been exceeded since the
    // last successful poll — re-bootstrap from "now" rather than erroring
    // forever. Any mail that arrived in the gap will be missed, which is an
    // acceptable trade-off for a cron that is expected to run every 5 minutes.
    const historyId = await bootstrapGmailHistoryId(accessToken);
    await updateGmailHistoryId(account.id, historyId);
    return { checked: 0, matched: 0, unmatched: 0, errors: ['Gmail history expired — re-bootstrapped cursor'] };
  }

  let matched = 0;
  let unmatched = 0;

  for (const messageId of history.messageIds) {
    try {
      const { data: existing } = await supabase
        .from('crm_gmail_inbound_messages')
        .select('id')
        .eq('gmail_message_id', messageId)
        .maybeSingle();
      if (existing) continue;

      const message = await fetchInboundGmailMessage(accessToken, messageId);

      // Never treat mail sent from our own connected mailbox as an inbound
      // reply (e.g. a copy of an outbound send that also lands in INBOX).
      if (message.fromAddress === account.email_address.toLowerCase()) continue;

      const { data: company } = await supabase
        .from('crm_companies')
        .select('*')
        .ilike('email', message.fromAddress)
        .maybeSingle();

      if (company) {
        matched += 1;
        await supabase.from('crm_activities').insert([
          {
            company_id: company.id,
            activity_type: 'email',
            activity_date: (message.receivedAt || new Date().toISOString()).slice(0, 10),
            subject: message.subject,
            summary: message.bodyText.slice(0, 5000) || '(no content)',
            outcome: 'Replied — outreach auto-paused',
            direction: 'inbound',
          },
        ]);
        await stopCrmCompanyOutreach(company.id, 'inbound_reply');
      } else {
        unmatched += 1;
      }

      await supabase.from('crm_gmail_inbound_messages').insert([
        {
          gmail_message_id: message.gmailMessageId,
          gmail_thread_id: message.gmailThreadId,
          company_id: company?.id || null,
          matched: Boolean(company),
          from_address: message.fromAddress,
          subject: message.subject,
          body_text: message.bodyText,
          received_at: message.receivedAt,
        },
      ]);
    } catch (error: any) {
      errors.push(`Message ${messageId}: ${error.message || 'Unknown error'}`);
    }
  }

  await updateGmailHistoryId(account.id, history.latestHistoryId);

  return { checked: history.messageIds.length, matched, unmatched, errors };
}
