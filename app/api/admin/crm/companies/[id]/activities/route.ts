import { NextRequest, NextResponse } from 'next/server';
import { createCrmActivity, listCrmActivities } from '@/lib/services/admin/crm-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const activities = await listCrmActivities(params.id);
    return NextResponse.json({ success: true, activities });
  } catch (error: any) {
    console.error('Error in GET /api/admin/crm/companies/[id]/activities:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const body = await request.json();

    if (body.activity_type !== 'call' && body.activity_type !== 'email') {
      return NextResponse.json(
        { success: false, error: 'activity_type must be call or email' },
        { status: 400 }
      );
    }
    if (!body.activity_date) {
      return NextResponse.json({ success: false, error: 'activity_date is required' }, { status: 400 });
    }
    if (!body.summary || !String(body.summary).trim()) {
      return NextResponse.json({ success: false, error: 'summary is required' }, { status: 400 });
    }

    const activity = await createCrmActivity(params.id, {
      activity_type: body.activity_type,
      activity_date: body.activity_date,
      activity_time: body.activity_time || null,
      subject: body.subject || null,
      summary: body.summary,
      outcome: body.outcome || null,
    });

    return NextResponse.json({ success: true, activity }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/crm/companies/[id]/activities:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to log activity' },
      { status: 500 }
    );
  }
}
