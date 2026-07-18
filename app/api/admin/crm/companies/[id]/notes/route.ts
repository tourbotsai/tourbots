import { NextRequest, NextResponse } from 'next/server';
import { createCrmNote, listCrmNotes } from '@/lib/services/admin/crm-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const notes = await listCrmNotes(params.id);
    return NextResponse.json({ success: true, notes });
  } catch (error: any) {
    console.error('Error in GET /api/admin/crm/companies/[id]/notes:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const noteText = typeof body.note_text === 'string' ? body.note_text : '';

    if (!noteText.trim()) {
      return NextResponse.json({ success: false, error: 'Note is required' }, { status: 400 });
    }

    const note = await createCrmNote(params.id, noteText);
    return NextResponse.json({ success: true, note }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/crm/companies/[id]/notes:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create note' },
      { status: 500 }
    );
  }
}
