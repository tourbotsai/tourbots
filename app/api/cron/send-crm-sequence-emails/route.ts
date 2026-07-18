import { NextRequest, NextResponse } from 'next/server';
import { processAllPendingCrmSequenceEmails } from '@/lib/services/admin/crm-service';
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
      jobName: 'send-crm-sequence-emails',
      triggerSource: 'vercel_cron',
      context: { path: '/api/cron/send-crm-sequence-emails', method: 'GET' },
    });

    const result = await processAllPendingCrmSequenceEmails();
    await finishCronRun(runId, {
      status: result.failed > 0 ? 'partial' : 'success',
      startedAt,
      processedCount: result.processed,
      successCount: result.sent,
      failedCount: result.failed,
      route: '/api/cron/send-crm-sequence-emails',
      method: 'GET',
    });
    return NextResponse.json({
      success: true,
      processed: result.processed,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error: any) {
    console.error('Error in cron send-crm-sequence-emails:', error);
    await finishCronRun(runId, {
      status: 'failed',
      startedAt,
      errorMessage: error.message || 'Failed to process CRM sequence emails',
      route: '/api/cron/send-crm-sequence-emails',
      method: 'GET',
    });
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process CRM sequence emails' },
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
      jobName: 'send-crm-sequence-emails',
      triggerSource: 'manual',
      context: { path: '/api/cron/send-crm-sequence-emails', method: 'POST' },
    });

    const result = await processAllPendingCrmSequenceEmails();
    await finishCronRun(runId, {
      status: result.failed > 0 ? 'partial' : 'success',
      startedAt,
      processedCount: result.processed,
      successCount: result.sent,
      failedCount: result.failed,
      route: '/api/cron/send-crm-sequence-emails',
      method: 'POST',
    });
    return NextResponse.json({
      success: true,
      processed: result.processed,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error: any) {
    console.error('Error in manual CRM sequence email processing:', error);
    await finishCronRun(runId, {
      status: 'failed',
      startedAt,
      errorMessage: error.message || 'Failed to process CRM sequence emails',
      route: '/api/cron/send-crm-sequence-emails',
      method: 'POST',
    });
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process CRM sequence emails' },
      { status: 500 }
    );
  }
}
