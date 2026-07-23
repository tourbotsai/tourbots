import { NextRequest, NextResponse } from 'next/server';
import {
  completeCrmSequenceStep,
  uncompleteCrmSequenceStep,
  CrmCallOutcome,
} from '@/lib/services/admin/crm-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export const dynamic = 'force-dynamic';

const VALID_OUTCOMES: CrmCallOutcome[] = ['no_answer', 'positive', 'negative'];

// Completing a sequence step for a contact is the ONLY way sequence activity
// gets logged. It atomically writes a crm_activities row (the single source
// of truth for what happened) and upserts crm_sequence_step_status (which
// only exists to render completion state on this page).
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; stepId: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const companyId = body.companyId as string;

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'companyId is required' }, { status: 400 });
    }

    const outcome = body.outcome as CrmCallOutcome | undefined;
    if (outcome && !VALID_OUTCOMES.includes(outcome)) {
      return NextResponse.json({ success: false, error: 'Invalid outcome' }, { status: 400 });
    }

    const result = await completeCrmSequenceStep(params.stepId, companyId, {
      outcome: outcome || null,
      note: typeof body.note === 'string' ? body.note : null,
      stopContact: Boolean(body.stopContact),
      markScheduledEmailSent: Boolean(body.markScheduledEmailSent),
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error in POST /api/admin/crm/sequences/[id]/steps/[stepId]/complete:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to complete sequence step' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; stepId: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'companyId is required' }, { status: 400 });
    }

    await uncompleteCrmSequenceStep(params.stepId, companyId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/crm/sequences/[id]/steps/[stepId]/complete:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to revert step completion' },
      { status: 500 }
    );
  }
}
