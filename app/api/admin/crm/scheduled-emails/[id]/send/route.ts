import { NextRequest, NextResponse } from 'next/server';
import { sendCrmScheduledEmailNow } from '@/lib/services/admin/crm-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export const dynamic = 'force-dynamic';

// Manual "Send now" action — sends this one queued email immediately via the
// connected Gmail account, bypassing its scheduled_for time. Uses the exact
// same send-and-log path as the cron job.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    await sendCrmScheduledEmailNow(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /api/admin/crm/scheduled-emails/[id]/send:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
