import { NextRequest, NextResponse } from 'next/server';
import { updateCrmActivityOutcome } from '@/lib/services/admin/crm-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; activityId: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const outcome = typeof body.outcome === 'string' ? body.outcome : '';

    const activity = await updateCrmActivityOutcome(params.activityId, outcome);
    return NextResponse.json({ success: true, activity });
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/crm/companies/[id]/activities/[activityId]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update activity' },
      { status: 500 }
    );
  }
}
