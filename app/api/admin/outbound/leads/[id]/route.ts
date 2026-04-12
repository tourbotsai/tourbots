import { NextRequest, NextResponse } from 'next/server';
import { getPlatformOutboundLeadById, getPlatformOutboundLeadNotes } from '@/lib/services/admin/platform-outbound-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const leadId = params.id;

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    const [lead, notes] = await Promise.all([
      getPlatformOutboundLeadById(leadId),
      getPlatformOutboundLeadNotes(leadId),
    ]);

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      lead,
      notes,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/outbound/leads/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch lead details' },
      { status: 500 }
    );
  }
}
