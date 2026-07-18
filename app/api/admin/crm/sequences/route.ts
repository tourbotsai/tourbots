import { NextRequest, NextResponse } from 'next/server';
import { createCrmSequence, listCrmSequences } from '@/lib/services/admin/crm-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const sequences = await listCrmSequences();
    return NextResponse.json({ success: true, sequences });
  } catch (error: any) {
    console.error('Error in GET /api/admin/crm/sequences:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch sequences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    if (!body.title || !String(body.title).trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const sequence = await createCrmSequence({
      title: body.title,
      description: body.description || null,
      status: body.status === 'paused' ? 'paused' : 'active',
    });

    return NextResponse.json({ success: true, sequence }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/crm/sequences:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create sequence' },
      { status: 500 }
    );
  }
}
