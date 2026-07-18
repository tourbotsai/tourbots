import { NextRequest, NextResponse } from 'next/server';
import { listCrmCompanies } from '@/lib/services/admin/crm-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const region = searchParams.get('region') || undefined;
    const search = searchParams.get('search') || undefined;

    const companies = await listCrmCompanies({ status, region, search });

    return NextResponse.json({ success: true, companies });
  } catch (error: any) {
    console.error('Error in GET /api/admin/crm/companies:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}
