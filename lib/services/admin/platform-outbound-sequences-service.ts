import { Resend } from 'resend';
import { supabaseServiceRole as supabase } from '../../supabase-service-role';

type EnrollmentStatus = 'active' | 'completed' | 'stopped_manual' | 'paused';
type EmailStatus = 'scheduled' | 'processing' | 'sent' | 'failed' | 'cancelled';

export interface PlatformOutboundSequenceStepInput {
  step_number: number;
  scheduled_date: string;
  scheduled_time: string;
  scheduled_timezone?: string;
  email_subject: string;
  email_body: string;
  is_active?: boolean;
}

export interface PlatformOutboundSequenceInput {
  name: string;
  description?: string;
  steps: PlatformOutboundSequenceStepInput[];
}

const resend = new Resend(process.env.RESEND_API_KEY);

function splitContactName(contactName?: string | null) {
  const raw = (contactName || '').trim();
  if (!raw) {
    return {
      firstName: '',
      lastName: '',
      fullName: '',
    };
  }

  const parts = raw.split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ').trim(),
    fullName: raw,
  };
}

function interpolateTemplateValue(template: string, lead: any): string {
  const { firstName, lastName, fullName } = splitContactName(lead.contact_name);
  const values: Record<string, string> = {
    first_name: firstName || lead.company_name || '',
    last_name: lastName,
    full_name: fullName || lead.company_name || '',
    company_name: lead.company_name || '',
    email: lead.contact_email || '',
    website: lead.website || '',
    phone: lead.contact_phone || '',
  };

  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}|\{\s*([a-zA-Z0-9_]+)\s*\}/g, (_, key1, key2) => {
    const token = (key1 || key2 || '').toLowerCase();
    return values[token] ?? '';
  });
}

function normaliseTimeString(rawValue: unknown): string | null {
  if (typeof rawValue !== 'string') return null;
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(':');
  if (parts.length < 2 || parts.length > 3) return null;

  const [hourRaw, minuteRaw, secondRaw = '00'] = parts;
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const second = Number(secondRaw);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    !Number.isInteger(second) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    return null;
  }

  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  const ss = String(second).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function extractDateParts(rawDate: unknown): { year: number; month: number; day: number } | null {
  if (typeof rawDate !== 'string') return null;
  const trimmed = rawDate.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function extractTimeParts(rawTime: unknown): { hour: number; minute: number; second: number } | null {
  const normalised = normaliseTimeString(rawTime);
  if (!normalised) return null;
  const [h, m, s] = normalised.split(':').map((part) => Number(part));
  return { hour: h, minute: m, second: s };
}

function getOffsetMinutesForTimeZone(utcDate: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(utcDate);
  const map = parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  const asUtcTimestamp = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );

  return Math.round((asUtcTimestamp - utcDate.getTime()) / 60000);
}

function buildScheduledAtIso(step: any): string | null {
  const dateParts = extractDateParts(step?.scheduled_date);
  const timeParts = extractTimeParts(step?.scheduled_time);
  const timezone =
    typeof step?.scheduled_timezone === 'string' && step.scheduled_timezone.trim().length > 0
      ? step.scheduled_timezone.trim()
      : 'Europe/London';

  if (!dateParts || !timeParts) {
    return null;
  }

  // Build UTC from a timezone-local wall time using iterative offset correction.
  const baseUtcMs = Date.UTC(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    timeParts.hour,
    timeParts.minute,
    timeParts.second
  );

  let offset = getOffsetMinutesForTimeZone(new Date(baseUtcMs), timezone);
  let candidateUtcMs = baseUtcMs - offset * 60_000;
  const correctedOffset = getOffsetMinutesForTimeZone(new Date(candidateUtcMs), timezone);
  if (correctedOffset !== offset) {
    offset = correctedOffset;
    candidateUtcMs = baseUtcMs - offset * 60_000;
  }

  const date = new Date(candidateUtcMs);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

async function resyncActiveEnrollmentsForSequence(sequenceId: string): Promise<void> {
  const { data: activeEnrollments, error: activeEnrollmentsError } = await supabase
    .from('platform_outbound_sequence_enrollments')
    .select('id')
    .eq('sequence_id', sequenceId)
    .eq('status', 'active');

  if (activeEnrollmentsError) {
    throw new Error(activeEnrollmentsError.message);
  }

  for (const enrollment of activeEnrollments || []) {
    const enrollmentId = (enrollment as any).id as string;

    await supabase
      .from('platform_outbound_sequence_emails')
      .delete()
      .eq('enrollment_id', enrollmentId)
      .in('status', ['scheduled', 'processing', 'failed', 'cancelled']);

    await scheduleEnrollmentEmails(enrollmentId);
  }
}

async function scheduleEnrollmentEmails(
  enrollmentId: string
): Promise<{ success: boolean; scheduledCount: number; error?: string }> {
  try {
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('platform_outbound_sequence_enrollments')
      .select('*')
      .eq('id', enrollmentId)
      .single();

    if (enrollmentError || !enrollment) {
      return { success: false, scheduledCount: 0, error: 'Enrollment not found' };
    }

    const { data: sequence, error: sequenceError } = await supabase
      .from('platform_outbound_sequences')
      .select('*')
      .eq('id', enrollment.sequence_id)
      .single();

    if (sequenceError || !sequence) {
      return { success: false, scheduledCount: 0, error: 'Sequence not found' };
    }

    const { data: lead, error: leadError } = await supabase
      .from('platform_outbound_leads')
      .select('*')
      .eq('id', enrollment.lead_id)
      .single();

    if (leadError || !lead) {
      return { success: false, scheduledCount: 0, error: 'Lead not found' };
    }

    if (!lead.contact_email || !lead.contact_email.trim()) {
      return { success: false, scheduledCount: 0, error: 'Lead has no email address' };
    }

    const { data: steps, error: stepsError } = await supabase
      .from('platform_outbound_sequence_steps')
      .select('*')
      .eq('sequence_id', enrollment.sequence_id)
      .eq('is_active', true)
      .order('step_number', { ascending: true });

    if (stepsError) {
      return { success: false, scheduledCount: 0, error: stepsError.message };
    }

    let scheduledCount = 0;

    for (const step of steps || []) {
      const scheduledFor = buildScheduledAtIso(step);
      if (!scheduledFor) {
        continue;
      }
      const scheduledDate = new Date(scheduledFor);
      if (Number.isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
        continue;
      }

      const emailSubject = interpolateTemplateValue(step.email_subject, lead);
      const emailBody = interpolateTemplateValue(step.email_body, lead);

      const { error: emailInsertError } = await supabase
        .from('platform_outbound_sequence_emails')
        .insert({
          sequence_id: enrollment.sequence_id,
          enrollment_id: enrollment.id,
          step_id: step.id,
          lead_id: lead.id,
          email_to: lead.contact_email,
          email_subject: emailSubject,
          email_body: emailBody,
          scheduled_for: scheduledFor,
          status: 'scheduled',
        });

      if (!emailInsertError) {
        scheduledCount += 1;
      }
    }

    // Keep enrollment active even when no steps are currently schedulable.
    // This allows later step edits/additions to resync and schedule correctly.
    if (scheduledCount === 0) {
      await supabase
        .from('platform_outbound_sequence_enrollments')
        .update({
          current_step: 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', enrollmentId)
        .eq('status', 'active');
    }

    return { success: true, scheduledCount };
  } catch (error: any) {
    console.error('Error scheduling outbound enrollment emails:', error);
    return {
      success: false,
      scheduledCount: 0,
      error: error.message || 'Failed to schedule enrollment emails',
    };
  }
}

export async function listPlatformOutboundSequences() {
  const { data: sequences, error } = await supabase
    .from('platform_outbound_sequences')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const sequenceIds = (sequences || []).map((s) => s.id);
  if (sequenceIds.length === 0) {
    return [];
  }

  const [{ data: enrollments }, { data: emails }, { data: steps }] = await Promise.all([
    supabase
      .from('platform_outbound_sequence_enrollments')
      .select('sequence_id,status')
      .in('sequence_id', sequenceIds),
    supabase
      .from('platform_outbound_sequence_emails')
      .select('sequence_id,status')
      .in('sequence_id', sequenceIds),
    supabase
      .from('platform_outbound_sequence_steps')
      .select('sequence_id,id,is_active')
      .in('sequence_id', sequenceIds),
  ]);

  const enrollmentStats = (enrollments || []).reduce<Record<string, number>>((acc, row: any) => {
    if (row.status === 'active') {
      acc[row.sequence_id] = (acc[row.sequence_id] || 0) + 1;
    }
    return acc;
  }, {});

  const sentStats = (emails || []).reduce<Record<string, { sent: number; total: number }>>((acc, row: any) => {
    if (!acc[row.sequence_id]) {
      acc[row.sequence_id] = { sent: 0, total: 0 };
    }
    acc[row.sequence_id].total += 1;
    if (row.status === 'sent') {
      acc[row.sequence_id].sent += 1;
    }
    return acc;
  }, {});

  const stepStats = (steps || []).reduce<Record<string, number>>((acc, row: any) => {
    if (row.is_active) {
      acc[row.sequence_id] = (acc[row.sequence_id] || 0) + 1;
    }
    return acc;
  }, {});

  return (sequences || []).map((sequence: any) => {
    const sentData = sentStats[sequence.id] || { sent: 0, total: 0 };
    const progressPercent = sentData.total > 0 ? Math.round((sentData.sent / sentData.total) * 100) : 0;
    return {
      ...sequence,
      active_enrollment_count: enrollmentStats[sequence.id] || 0,
      step_count: stepStats[sequence.id] || 0,
      sent_email_count: sentData.sent,
      total_email_count: sentData.total,
      progress_percent: progressPercent,
    };
  });
}

export async function createPlatformOutboundSequence(input: PlatformOutboundSequenceInput) {
  const { data: sequence, error: sequenceError } = await supabase
    .from('platform_outbound_sequences')
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      is_active: true,
    })
    .select('*')
    .single();

  if (sequenceError || !sequence) {
    throw new Error(sequenceError?.message || 'Failed to create sequence');
  }

  const orderedSteps = [...input.steps].sort((a, b) => a.step_number - b.step_number);
  const stepsToInsert = orderedSteps.map((step, idx) => ({
    sequence_id: sequence.id,
    step_number: idx + 1,
    scheduled_date: step.scheduled_date,
    scheduled_time: step.scheduled_time,
    scheduled_timezone: step.scheduled_timezone || 'Europe/London',
    email_subject: step.email_subject.trim(),
    email_body: step.email_body.trim(),
    is_active: step.is_active ?? true,
  }));

  const { error: stepsError } = await supabase
    .from('platform_outbound_sequence_steps')
    .insert(stepsToInsert);

  if (stepsError) {
    throw new Error(stepsError.message);
  }

  return sequence;
}

export async function getPlatformOutboundSequenceById(sequenceId: string, includeEnrollments = false) {
  const { data: sequence, error: sequenceError } = await supabase
    .from('platform_outbound_sequences')
    .select('*')
    .eq('id', sequenceId)
    .single();

  if (sequenceError) {
    if (sequenceError.code === 'PGRST116') {
      return null;
    }
    throw new Error(sequenceError.message);
  }

  const { data: steps, error: stepsError } = await supabase
    .from('platform_outbound_sequence_steps')
    .select('*')
    .eq('sequence_id', sequenceId)
    .eq('is_active', true)
    .order('step_number', { ascending: true });

  if (stepsError) {
    throw new Error(stepsError.message);
  }

  let enrollments: any[] = [];
  if (includeEnrollments) {
    const { data: enrollmentRows, error: enrollmentsError } = await supabase
      .from('platform_outbound_sequence_enrollments')
      .select('*')
      .eq('sequence_id', sequenceId)
      .order('enrolled_at', { ascending: false });

    if (enrollmentsError) {
      throw new Error(enrollmentsError.message);
    }

    const rows = enrollmentRows || [];
    const leadIds = rows.map((row: any) => row.lead_id).filter(Boolean);
    let leadMap: Record<string, any> = {};

    if (leadIds.length > 0) {
      const { data: leadsData } = await supabase
        .from('platform_outbound_leads')
        .select('id,company_name,contact_name,contact_email,contact_phone,website,lead_status,priority')
        .in('id', leadIds);

      leadMap = (leadsData || []).reduce<Record<string, any>>((acc, lead: any) => {
        acc[lead.id] = lead;
        return acc;
      }, {});
    }

    enrollments = rows.map((row: any) => ({
      ...row,
      lead: leadMap[row.lead_id] || null,
    }));
  }

  return {
    sequence,
    steps: steps || [],
    enrollments,
  };
}

export async function updatePlatformOutboundSequence(sequenceId: string, input: PlatformOutboundSequenceInput) {
  const { error: sequenceError } = await supabase
    .from('platform_outbound_sequences')
    .update({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sequenceId);

  if (sequenceError) {
    throw new Error(sequenceError.message);
  }

  await supabase
    .from('platform_outbound_sequence_steps')
    .delete()
    .eq('sequence_id', sequenceId);

  const orderedSteps = [...input.steps].sort((a, b) => a.step_number - b.step_number);
  const stepsToInsert = orderedSteps.map((step, idx) => ({
    sequence_id: sequenceId,
    step_number: idx + 1,
    scheduled_date: step.scheduled_date,
    scheduled_time: step.scheduled_time,
    scheduled_timezone: step.scheduled_timezone || 'Europe/London',
    email_subject: step.email_subject.trim(),
    email_body: step.email_body.trim(),
    is_active: step.is_active ?? true,
  }));

  const { error: stepsError } = await supabase
    .from('platform_outbound_sequence_steps')
    .insert(stepsToInsert);

  if (stepsError) {
    throw new Error(stepsError.message);
  }

  await resyncActiveEnrollmentsForSequence(sequenceId);
}

export async function togglePlatformOutboundSequence(sequenceId: string, isActive: boolean) {
  const { error } = await supabase
    .from('platform_outbound_sequences')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sequenceId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deletePlatformOutboundSequence(sequenceId: string) {
  const { data: activeEnrollments, error: enrollmentsError } = await supabase
    .from('platform_outbound_sequence_enrollments')
    .select('id')
    .eq('sequence_id', sequenceId)
    .eq('status', 'active');

  if (enrollmentsError) {
    throw new Error(enrollmentsError.message);
  }

  if ((activeEnrollments || []).length > 0) {
    throw new Error('Stop all active enrollments before deleting this sequence');
  }

  await supabase
    .from('platform_outbound_sequence_emails')
    .delete()
    .eq('sequence_id', sequenceId);

  await supabase
    .from('platform_outbound_sequence_enrollments')
    .delete()
    .eq('sequence_id', sequenceId);

  await supabase
    .from('platform_outbound_sequence_steps')
    .delete()
    .eq('sequence_id', sequenceId);

  const { error } = await supabase
    .from('platform_outbound_sequences')
    .delete()
    .eq('id', sequenceId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function enrollLeadInPlatformOutboundSequence(sequenceId: string, leadId: string) {
  const { data: lead, error: leadError } = await supabase
    .from('platform_outbound_leads')
    .select('id,company_name,contact_email')
    .eq('id', leadId)
    .single();

  if (leadError || !lead) {
    throw new Error('Lead not found');
  }

  if (!lead.contact_email || !lead.contact_email.trim()) {
    throw new Error('Lead does not have an email address');
  }

  const { data: existing } = await supabase
    .from('platform_outbound_sequence_enrollments')
    .select('id,status')
    .eq('sequence_id', sequenceId)
    .eq('lead_id', leadId)
    .single();

  if (existing?.status === 'active') {
    throw new Error('Lead is already enrolled in this sequence');
  }

  let enrollmentId = existing?.id as string | undefined;

  if (existing) {
    const { data: reactivated, error: updateError } = await supabase
      .from('platform_outbound_sequence_enrollments')
      .update({
        status: 'active' satisfies EnrollmentStatus,
        current_step: 1,
        enrolled_at: new Date().toISOString(),
        completed_at: null,
        stopped_reason: null,
      })
      .eq('id', existing.id)
      .select('id')
      .single();

    if (updateError || !reactivated) {
      throw new Error(updateError?.message || 'Failed to reactivate enrollment');
    }
    enrollmentId = reactivated.id;

    await supabase
      .from('platform_outbound_sequence_emails')
      .delete()
      .eq('enrollment_id', enrollmentId);
  } else {
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('platform_outbound_sequence_enrollments')
      .insert({
        sequence_id: sequenceId,
        lead_id: leadId,
        status: 'active',
        current_step: 1,
      })
      .select('id')
      .single();

    if (enrollmentError || !enrollment) {
      throw new Error(enrollmentError?.message || 'Failed to enroll lead');
    }
    enrollmentId = enrollment.id;
  }

  if (!enrollmentId) {
    throw new Error('Failed to resolve enrollment ID');
  }

  const scheduleResult = await scheduleEnrollmentEmails(enrollmentId);
  if (!scheduleResult.success) {
    throw new Error(scheduleResult.error || 'Failed to schedule sequence emails');
  }

  return {
    enrollmentId,
    scheduledCount: scheduleResult.scheduledCount,
  };
}

export async function stopPlatformOutboundSequenceEnrollment(enrollmentId: string, reason: string) {
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('platform_outbound_sequence_enrollments')
    .select('*')
    .eq('id', enrollmentId)
    .single();

  if (enrollmentError || !enrollment) {
    throw new Error('Enrollment not found');
  }

  await supabase
    .from('platform_outbound_sequence_enrollments')
    .update({
      status: 'stopped_manual' satisfies EnrollmentStatus,
      stopped_reason: reason,
      completed_at: new Date().toISOString(),
    })
    .eq('id', enrollmentId);

  await supabase
    .from('platform_outbound_sequence_emails')
    .update({
      status: 'cancelled' satisfies EmailStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('enrollment_id', enrollmentId)
    .in('status', ['scheduled', 'processing', 'failed']);
}

export async function listPlatformOutboundSequenceActions(sequenceId: string) {
  const { data, error } = await supabase
    .from('platform_outbound_sequence_emails')
    .select('*')
    .eq('sequence_id', sequenceId)
    .order('scheduled_for', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const emailRows = data || [];
  const leadIds = Array.from(new Set(emailRows.map((row: any) => row.lead_id).filter(Boolean)));
  const stepIds = Array.from(new Set(emailRows.map((row: any) => row.step_id).filter(Boolean)));

  const [leadsResponse, stepsResponse] = await Promise.all([
    leadIds.length > 0
      ? supabase
          .from('platform_outbound_leads')
          .select('id,company_name,contact_name,contact_email')
          .in('id', leadIds)
      : Promise.resolve({ data: [] as any[] }),
    stepIds.length > 0
      ? supabase
          .from('platform_outbound_sequence_steps')
          .select('id,step_number')
          .in('id', stepIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const leadMap = (leadsResponse.data || []).reduce<Record<string, any>>((acc, lead: any) => {
    acc[lead.id] = lead;
    return acc;
  }, {});
  const stepMap = (stepsResponse.data || []).reduce<Record<string, any>>((acc, step: any) => {
    acc[step.id] = step;
    return acc;
  }, {});

  return emailRows.map((row: any) => ({
    ...row,
    lead: leadMap[row.lead_id] || null,
    step: stepMap[row.step_id] || null,
  }));
}

export async function processAllPendingPlatformOutboundSequenceEmails() {
  const db = supabase;
  const now = new Date().toISOString();
  const { data: pendingEmails, error: pendingError } = await db.rpc(
    'claim_platform_outbound_sequence_emails',
    {
      p_now: now,
      p_limit: 100,
    }
  );

  if (pendingError) {
    throw new Error(pendingError.message);
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  const rows = pendingEmails || [];
  const sequenceIds = Array.from(new Set(rows.map((row: any) => row.sequence_id).filter(Boolean)));
  const stepIds = Array.from(new Set(rows.map((row: any) => row.step_id).filter(Boolean)));

  const [sequencesResponse, stepsResponse] = await Promise.all([
    sequenceIds.length > 0
      ? db
          .from('platform_outbound_sequences')
          .select('id,name,is_active')
          .in('id', sequenceIds)
      : Promise.resolve({ data: [] as any[] }),
    stepIds.length > 0
      ? db
          .from('platform_outbound_sequence_steps')
          .select('id,step_number')
          .in('id', stepIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const sequenceMap = (sequencesResponse.data || []).reduce<Record<string, any>>((acc, sequence: any) => {
    acc[sequence.id] = sequence;
    return acc;
  }, {});
  const stepMap = (stepsResponse.data || []).reduce<Record<string, any>>((acc, step: any) => {
    acc[step.id] = step;
    return acc;
  }, {});

  for (const email of rows) {
    const sequence = sequenceMap[email.sequence_id];
    if (!sequence?.is_active) {
      await db
        .from('platform_outbound_sequence_emails')
        .update({
          status: 'scheduled' satisfies EmailStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', email.id)
        .eq('status', 'processing');
      continue;
    }
    const recipient = typeof email.email_to === 'string' ? email.email_to.trim() : '';
    if (!recipient) {
      await db
        .from('platform_outbound_sequence_emails')
        .update({
          status: 'failed' satisfies EmailStatus,
          attempts: (email.attempts || 0) + 1,
          error_message: 'Missing recipient email',
          updated_at: new Date().toISOString(),
        })
        .eq('id', email.id);
      failed += 1;
      errors.push(`Email ${email.id}: Missing recipient email`);
      continue;
    }

    const fromAddress = process.env.OUTBOUND_SEQUENCE_FROM_EMAIL || 'TourBots AI <hello@tourbots.ai>';
    const replyToAddress = process.env.OUTBOUND_SEQUENCE_REPLY_TO_EMAIL || 'tourbotsai@gmail.com';

    try {
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [recipient],
        subject: email.email_subject,
        text: email.email_body,
        replyTo: replyToAddress,
      });

      if (error) {
        throw new Error(error.message);
      }

      await db
        .from('platform_outbound_sequence_emails')
        .update({
          status: 'sent' satisfies EmailStatus,
          sent_at: new Date().toISOString(),
          resend_message_id: data?.id || null,
          attempts: (email.attempts || 0) + 1,
          error_message: null,
        })
        .eq('id', email.id)
        .eq('status', 'processing');

      const stepNumber = stepMap[email.step_id]?.step_number || 1;
      await db
        .from('platform_outbound_sequence_enrollments')
        .update({
          current_step: stepNumber + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', email.enrollment_id)
        .eq('status', 'active');

      const { count: remainingScheduled } = await db
        .from('platform_outbound_sequence_emails')
        .select('*', { count: 'exact', head: true })
        .eq('enrollment_id', email.enrollment_id)
        .eq('status', 'scheduled');

      if (!remainingScheduled || remainingScheduled === 0) {
        await db
          .from('platform_outbound_sequence_enrollments')
          .update({
            status: 'completed' satisfies EnrollmentStatus,
            completed_at: new Date().toISOString(),
          })
          .eq('id', email.enrollment_id)
          .eq('status', 'active');
      }

      sent += 1;
    } catch (error: any) {
      const attempts = (email.attempts || 0) + 1;
      const finalStatus: EmailStatus = attempts >= 3 ? 'failed' : 'scheduled';

      await db
        .from('platform_outbound_sequence_emails')
        .update({
          status: finalStatus,
          attempts,
          error_message: error.message || 'Failed to send email',
          updated_at: new Date().toISOString(),
        })
        .eq('id', email.id)
        .eq('status', 'processing');

      failed += 1;
      errors.push(`Email ${email.id}: ${error.message || 'Unknown error'}`);
    }
  }

  return {
    processed: (pendingEmails || []).length,
    sent,
    failed,
    errors,
  };
}
