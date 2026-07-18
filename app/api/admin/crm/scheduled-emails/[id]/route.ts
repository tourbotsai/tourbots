import { NextRequest, NextResponse } from 'next/server';
import { cancelCrmScheduledEmail, rescheduleCrmScheduledEmail } from '@/lib/services/admin/crm-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const scheduledFor = body.scheduledFor as string;
    if (!scheduledFor) {
      return NextResponse.json({ success: false, error: 'scheduledFor is required' }, { status: 400 });
    }

    const scheduledEmail = await rescheduleCrmScheduledEmail(params.id, scheduledFor);
    return NextResponse.json({ success: true, scheduledEmail });
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/crm/scheduled-emails/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reschedule email' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const scheduledEmail = await cancelCrmScheduledEmail(params.id);
    return NextResponse.json({ success: true, scheduledEmail });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/crm/scheduled-emails/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel email' },
      { status: 500 }
    );
  }
}
