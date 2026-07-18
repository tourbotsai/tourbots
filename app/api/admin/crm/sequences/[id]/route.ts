import { NextRequest, NextResponse } from 'next/server';
import {
  deleteCrmSequence,
  getCrmSequenceById,
  listCrmScheduledEmailsForSequence,
  listCrmSequenceContacts,
  listCrmSequenceStepStatuses,
  listCrmSequenceSteps,
  updateCrmSequence,
} from '@/lib/services/admin/crm-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const sequenceId = params.id;
    const sequence = await getCrmSequenceById(sequenceId);
    if (!sequence) {
      return NextResponse.json({ success: false, error: 'Sequence not found' }, { status: 404 });
    }

    const [contacts, steps, stepStatuses, scheduledEmails] = await Promise.all([
      listCrmSequenceContacts(sequenceId),
      listCrmSequenceSteps(sequenceId),
      listCrmSequenceStepStatuses(sequenceId),
      listCrmScheduledEmailsForSequence(sequenceId),
    ]);

    return NextResponse.json({ success: true, sequence, contacts, steps, stepStatuses, scheduledEmails });
  } catch (error: any) {
    console.error('Error in GET /api/admin/crm/sequences/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch sequence' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const sequence = await updateCrmSequence(params.id, {
      title: body.title,
      description: body.description,
      status: body.status,
    });

    return NextResponse.json({ success: true, sequence });
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/crm/sequences/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update sequence' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    await deleteCrmSequence(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/crm/sequences/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete sequence' },
      { status: 500 }
    );
  }
}
