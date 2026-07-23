import { NextRequest, NextResponse } from 'next/server';
import { stopCrmCompanyOutreach, resumeCrmCompanyOutreach } from '@/lib/services/admin/crm-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const company = await stopCrmCompanyOutreach(params.id);

    return NextResponse.json({ success: true, company });
  } catch (error: any) {
    console.error('Error in POST /api/admin/crm/companies/[id]/stop:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to stop company outreach' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const company = await resumeCrmCompanyOutreach(params.id);

    return NextResponse.json({ success: true, company });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/crm/companies/[id]/stop:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to resume company outreach' },
      { status: 500 }
    );
  }
}
