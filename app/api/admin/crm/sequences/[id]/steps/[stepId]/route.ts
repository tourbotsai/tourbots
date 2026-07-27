import { NextRequest, NextResponse } from 'next/server';
import { updateCrmSequenceStep } from '@/lib/services/admin/crm-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; stepId: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const body = await request.json();

    if (!body.title || !String(body.title).trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }
    if (body.step_type !== 'email' && body.step_type !== 'call') {
      return NextResponse.json({ success: false, error: 'step_type must be email or call' }, { status: 400 });
    }

    const step = await updateCrmSequenceStep(params.stepId, {
      title: body.title,
      description: body.description || null,
      scheduled_date: body.scheduled_date || null,
      scheduled_time: body.scheduled_time || null,
      step_type: body.step_type,
      email_subject: body.email_subject || null,
      email_body: body.email_body || null,
      call_script: body.call_script || null,
    });

    return NextResponse.json({ success: true, step });
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/crm/sequences/[id]/steps/[stepId]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update sequence step' },
      { status: 500 }
    );
  }
}
