import { NextRequest, NextResponse } from 'next/server';
import { createCrmSequenceStep, listCrmSequenceSteps } from '@/lib/services/admin/crm-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const steps = await listCrmSequenceSteps(params.id);
    return NextResponse.json({ success: true, steps });
  } catch (error: any) {
    console.error('Error in GET /api/admin/crm/sequences/[id]/steps:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch sequence steps' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const step = await createCrmSequenceStep(params.id, {
      title: body.title,
      description: body.description || null,
      scheduled_date: body.scheduled_date || null,
      scheduled_time: body.scheduled_time || null,
      step_type: body.step_type,
      email_subject: body.email_subject || null,
      email_body: body.email_body || null,
      call_script: body.call_script || null,
    });

    return NextResponse.json({ success: true, step }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/crm/sequences/[id]/steps:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create sequence step' },
      { status: 500 }
    );
  }
}
