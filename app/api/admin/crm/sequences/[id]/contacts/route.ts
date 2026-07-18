import { NextRequest, NextResponse } from 'next/server';
import {
  addCrmSequenceContact,
  listCrmSequenceContacts,
  removeCrmSequenceContact,
} from '@/lib/services/admin/crm-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const contacts = await listCrmSequenceContacts(params.id);
    return NextResponse.json({ success: true, contacts });
  } catch (error: any) {
    console.error('Error in GET /api/admin/crm/sequences/[id]/contacts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch sequence contacts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const companyId = body.companyId as string;

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'companyId is required' }, { status: 400 });
    }

    const contact = await addCrmSequenceContact(params.id, companyId);
    return NextResponse.json({ success: true, contact }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/crm/sequences/[id]/contacts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add contact to sequence' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'companyId is required' }, { status: 400 });
    }

    await removeCrmSequenceContact(params.id, companyId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/crm/sequences/[id]/contacts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to remove contact from sequence' },
      { status: 500 }
    );
  }
}
