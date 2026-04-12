import { NextRequest, NextResponse } from 'next/server';
import { listPlatformOutboundSequenceActions } from '@/lib/services/admin/platform-outbound-sequences-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const sequenceId = params.id;
    const actions = await listPlatformOutboundSequenceActions(sequenceId);
    return NextResponse.json({
      success: true,
      actions,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/outbound/sequences/[id]/actions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch sequence actions' },
      { status: 500 }
    );
  }
}
