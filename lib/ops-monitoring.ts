import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { Resend } from 'resend';

type AlertLevel = 'warning' | 'critical';
type AlertCategory = 'api_5xx' | 'cron_failure' | 'cron_partial_failure' | 'billing_error' | 'webhook_error';

interface AlertPayload {
  level: AlertLevel;
  category: AlertCategory;
  title: string;
  message: string;
  details?: Record<string, unknown>;
}

const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL;
const ALERT_EMAIL_TO = process.env.ALERT_EMAIL_TO || process.env.SUPPORT_NOTIFICATION_EMAIL;
const ALERT_EMAIL_FROM = process.env.ALERT_EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'alerts@tourbots.ai';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_ENV = process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown';
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

function isWebhookConfigured() {
  return Boolean(ALERT_WEBHOOK_URL);
}

function isAlertEmailConfigured() {
  return Boolean(ALERT_EMAIL_TO && resend);
}

async function sendAlertEmail(payload: AlertPayload): Promise<void> {
  if (!isAlertEmailConfigured()) return;
  try {
    const subject = `[TourBots ${APP_ENV}] ${payload.level.toUpperCase()} ${payload.category}`;
    const detailsText = payload.details ? JSON.stringify(payload.details, null, 2) : '{}';

    await resend!.emails.send({
      from: ALERT_EMAIL_FROM,
      to: [ALERT_EMAIL_TO as string],
      subject,
      text: [
        payload.title,
        '',
        payload.message,
        '',
        `Environment: ${APP_ENV}`,
        `Category: ${payload.category}`,
        `Level: ${payload.level}`,
        `Timestamp: ${new Date().toISOString()}`,
        '',
        'Details:',
        detailsText,
      ].join('\n'),
    });
  } catch (error) {
    console.error('Failed sending ops alert email:', error);
  }
}

export async function notifyOpsAlert(payload: AlertPayload): Promise<void> {
  await Promise.all([
    sendAlertEmail(payload),
    (async () => {
      if (!isWebhookConfigured()) return;
      try {
        await fetch(ALERT_WEBHOOK_URL as string, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: 'tourbots-api',
            env: APP_ENV,
            timestamp: new Date().toISOString(),
            ...payload,
          }),
        });
      } catch (error) {
        console.error('Failed sending ops alert webhook:', error);
      }
    })(),
  ]);
}

export async function recordApi5xxEvent(input: {
  route: string;
  method: string;
  statusCode: number;
  errorMessage: string;
  context?: Record<string, unknown>;
  notify?: boolean;
  alertCategory?: AlertCategory;
}): Promise<void> {
  if (input.statusCode < 500 || input.statusCode > 599) return;

  try {
    await supabase.from('api_error_events').insert({
      route: input.route,
      method: input.method,
      status_code: input.statusCode,
      error_message: input.errorMessage,
      context: input.context || {},
    });
  } catch (error) {
    console.error('Failed recording api_error_events row:', error);
  }

  if (input.notify !== false) {
    await notifyOpsAlert({
      level: 'critical',
      category: input.alertCategory || 'api_5xx',
      title: `API ${input.statusCode}: ${input.method} ${input.route}`,
      message: input.errorMessage,
      details: input.context || {},
    });
  }
}

export async function startCronRun(input: {
  jobName: string;
  triggerSource: 'vercel_cron' | 'manual' | 'unknown';
  context?: Record<string, unknown>;
}): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('cron_job_runs')
      .insert({
        job_name: input.jobName,
        trigger_source: input.triggerSource,
        status: 'started',
        context: input.context || {},
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('Failed starting cron_job_runs row:', error);
      return null;
    }
    return data.id as string;
  } catch (error) {
    console.error('Failed starting cron run:', error);
    return null;
  }
}

export async function finishCronRun(
  runId: string | null,
  input: {
    status: 'success' | 'partial' | 'failed';
    startedAt: number;
    processedCount?: number;
    successCount?: number;
    failedCount?: number;
    errorMessage?: string;
    errorDetails?: Record<string, unknown>;
    route: string;
    method: string;
  }
): Promise<void> {
  const durationMs = Date.now() - input.startedAt;

  if (runId) {
    try {
      await supabase
        .from('cron_job_runs')
        .update({
          status: input.status,
          finished_at: new Date().toISOString(),
          duration_ms: durationMs,
          processed_count: input.processedCount || 0,
          success_count: input.successCount || 0,
          failed_count: input.failedCount || 0,
          error_message: input.errorMessage || null,
          error_details: input.errorDetails || {},
        })
        .eq('id', runId);
    } catch (error) {
      console.error('Failed finishing cron run:', error);
    }
  }

  if (input.status === 'failed') {
    await recordApi5xxEvent({
      route: input.route,
      method: input.method,
      statusCode: 500,
      errorMessage: input.errorMessage || 'Cron run failed',
      context: {
        durationMs,
        processedCount: input.processedCount || 0,
        failedCount: input.failedCount || 0,
        ...(input.errorDetails || {}),
      },
      alertCategory: 'cron_failure',
    });
    return;
  }

  if (input.status === 'partial' && (input.failedCount || 0) > 0) {
    await notifyOpsAlert({
      level: 'warning',
      category: 'cron_partial_failure',
      title: `Cron partial failure: ${input.method} ${input.route}`,
      message: `Completed with ${input.failedCount} failed item(s).`,
      details: {
        durationMs,
        processedCount: input.processedCount || 0,
        successCount: input.successCount || 0,
        failedCount: input.failedCount || 0,
      },
    });
  }
}

export async function markWebhookReceived(input: {
  provider: string;
  eventId: string;
  eventType: string;
}): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('webhook_event_runs')
      .select('id, attempt_count, status')
      .eq('provider', input.provider)
      .eq('event_id', input.eventId)
      .maybeSingle();

    if (!existing) {
      await supabase.from('webhook_event_runs').insert({
        provider: input.provider,
        event_id: input.eventId,
        event_type: input.eventType,
        status: 'received',
        attempt_count: 1,
      });
      return;
    }

    await supabase
      .from('webhook_event_runs')
      .update({
        status: existing.status === 'processed' ? 'processed' : 'received',
        attempt_count: Number(existing.attempt_count || 1) + 1,
      })
      .eq('id', existing.id);
  } catch (error) {
    console.error('Failed marking webhook received:', error);
  }
}

export async function claimWebhookForProcessing(input: {
  provider: string;
  eventId: string;
  eventType: string;
}): Promise<boolean> {
  try {
    const { data: inserted, error: insertError } = await supabase
      .from('webhook_event_runs')
      .upsert(
        {
          provider: input.provider,
          event_id: input.eventId,
          event_type: input.eventType,
          // Reuse 'ignored' as an in-flight processing lock state.
          status: 'ignored',
          attempt_count: 1,
        },
        { onConflict: 'provider,event_id', ignoreDuplicates: true }
      )
      .select('id')
      .maybeSingle();

    if (insertError) {
      console.error('Failed inserting webhook claim row:', insertError);
      return false;
    }

    // Brand-new event: this request owns processing.
    if (inserted?.id) return true;

    // Existing event: claim only if it is retriable and not already in-flight/processed.
    const { data: claimedRows, error: claimError } = await supabase
      .from('webhook_event_runs')
      .update({
        status: 'ignored',
        event_type: input.eventType,
      })
      .eq('provider', input.provider)
      .eq('event_id', input.eventId)
      .in('status', ['received', 'failed'])
      .select('id');

    if (claimError) {
      console.error('Failed claiming existing webhook row:', claimError);
      return false;
    }

    if (claimedRows && claimedRows.length > 0) {
      // Increment attempt count only for successful claims.
      const claimedId = claimedRows[0].id as string;
      const { data: current } = await supabase
        .from('webhook_event_runs')
        .select('attempt_count')
        .eq('id', claimedId)
        .maybeSingle();

      await supabase
        .from('webhook_event_runs')
        .update({
          attempt_count: Number(current?.attempt_count || 1) + 1,
        })
        .eq('id', claimedId);

      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed claiming webhook for processing:', error);
    return false;
  }
}

export async function isWebhookAlreadyProcessed(provider: string, eventId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('webhook_event_runs')
      .select('status')
      .eq('provider', provider)
      .eq('event_id', eventId)
      .maybeSingle();

    return data?.status === 'processed';
  } catch {
    return false;
  }
}

export async function markWebhookProcessed(input: {
  provider: string;
  eventId: string;
  httpStatus?: number;
}): Promise<void> {
  try {
    await supabase
      .from('webhook_event_runs')
      .update({
        status: 'processed',
        http_status: input.httpStatus || 200,
        processed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('provider', input.provider)
      .eq('event_id', input.eventId);
  } catch (error) {
    console.error('Failed marking webhook processed:', error);
  }
}

export async function markWebhookFailed(input: {
  provider: string;
  eventId: string;
  eventType: string;
  errorMessage: string;
  httpStatus?: number;
  context?: Record<string, unknown>;
}): Promise<void> {
  try {
    await supabase
      .from('webhook_event_runs')
      .update({
        status: 'failed',
        event_type: input.eventType,
        http_status: input.httpStatus || 500,
        error_message: input.errorMessage,
        context: input.context || {},
        processed_at: new Date().toISOString(),
      })
      .eq('provider', input.provider)
      .eq('event_id', input.eventId);
  } catch (error) {
    console.error('Failed marking webhook failed:', error);
  }

  await recordApi5xxEvent({
    route: '/api/webhooks/stripe',
    method: 'POST',
    statusCode: input.httpStatus || 500,
    errorMessage: input.errorMessage,
    context: {
      provider: input.provider,
      eventId: input.eventId,
      eventType: input.eventType,
      ...(input.context || {}),
    },
    alertCategory: 'webhook_error',
  });
}
