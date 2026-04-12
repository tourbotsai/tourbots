import { NextRequest, NextResponse } from 'next/server';
import { createPlatformOutboundLeadNote, getPlatformOutboundLeadById, getPlatformOutboundLeadNotes } from '@/lib/services/admin/platform-outbound-service';
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

    const lead = await getPlatformOutboundLeadById(leadId);
    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    const notes = await getPlatformOutboundLeadNotes(leadId);
    return NextResponse.json({ success: true, notes });
  } catch (error: any) {
    console.error('Error in GET /api/admin/outbound/leads/[id]/notes:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch lead notes' },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const lead = await getPlatformOutboundLeadById(leadId);
    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const note = typeof body.note === 'string' ? body.note : '';
    const createdBy = typeof body.createdBy === 'string' ? body.createdBy : null;

    if (!note.trim()) {
      return NextResponse.json(
        { success: false, error: 'Note is required' },
        { status: 400 }
      );
    }

    const createdNote = await createPlatformOutboundLeadNote(leadId, note, createdBy);

    return NextResponse.json(
      {
        success: true,
        note: createdNote,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/admin/outbound/leads/[id]/notes:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create note' },
      { status: 500 }
    );
  }
}
