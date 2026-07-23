import { NextRequest, NextResponse } from 'next/server';
import { processInboundGmailMessages } from '@/lib/services/admin/crm-service';
import { finishCronRun, startCronRun } from '@/lib/ops-monitoring';

function validateCronSecret(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('❌ CRON_SECRET is not configured');
    return NextResponse.json(
      { success: false, error: 'CRON_SECRET is not configured' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  let runId: string | null = null;
  try {
    const authError = validateCronSecret(request);
    if (authError) return authError;
    runId = await startCronRun({
      jobName: 'poll-crm-inbound-emails',
      triggerSource: 'vercel_cron',
      context: { path: '/api/cron/poll-crm-inbound-emails', method: 'GET' },
    });

    const result = await processInboundGmailMessages();
    await finishCronRun(runId, {
      status: result.errors.length > 0 ? 'partial' : 'success',
      startedAt,
      processedCount: result.checked,
      successCount: result.matched,
      failedCount: result.errors.length,
      route: '/api/cron/poll-crm-inbound-emails',
      method: 'GET',
    });
    return NextResponse.json({
      success: true,
      checked: result.checked,
      matched: result.matched,
      unmatched: result.unmatched,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error: any) {
    console.error('Error in cron poll-crm-inbound-emails:', error);
    await finishCronRun(runId, {
      status: 'failed',
      startedAt,
      errorMessage: error.message || 'Failed to poll CRM inbound emails',
      route: '/api/cron/poll-crm-inbound-emails',
      method: 'GET',
    });
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to poll CRM inbound emails' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  let runId: string | null = null;
  try {
    const authError = validateCronSecret(request);
    if (authError) return authError;
    runId = await startCronRun({
      jobName: 'poll-crm-inbound-emails',
      triggerSource: 'manual',
      context: { path: '/api/cron/poll-crm-inbound-emails', method: 'POST' },
    });

    const result = await processInboundGmailMessages();
    await finishCronRun(runId, {
      status: result.errors.length > 0 ? 'partial' : 'success',
      startedAt,
      processedCount: result.checked,
      successCount: result.matched,
      failedCount: result.errors.length,
      route: '/api/cron/poll-crm-inbound-emails',
      method: 'POST',
    });
    return NextResponse.json({
      success: true,
      checked: result.checked,
      matched: result.matched,
      unmatched: result.unmatched,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error: any) {
    console.error('Error in manual CRM inbound email poll:', error);
    await finishCronRun(runId, {
      status: 'failed',
      startedAt,
      errorMessage: error.message || 'Failed to poll CRM inbound emails',
      route: '/api/cron/poll-crm-inbound-emails',
      method: 'POST',
    });
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to poll CRM inbound emails' },
      { status: 500 }
    );
  }
}
