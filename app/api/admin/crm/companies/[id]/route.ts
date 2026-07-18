import { NextRequest, NextResponse } from 'next/server';
import {
  getCrmCompanyById,
  listCrmNotes,
  listCrmActivities,
  updateCrmCompanyStatus,
  CrmCompanyStatus,
} from '@/lib/services/admin/crm-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export const dynamic = 'force-dynamic';

const VALID_STATUSES: CrmCompanyStatus[] = [
  'not_started',
  'attempted',
  'in_sequence',
  'interested',
  'not_interested',
  'dormant',
];

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const companyId = params.id;
    const company = await getCrmCompanyById(companyId);
    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    const [notes, activities] = await Promise.all([listCrmNotes(companyId), listCrmActivities(companyId)]);

    return NextResponse.json({ success: true, company, notes, activities });
  } catch (error: any) {
    console.error('Error in GET /api/admin/crm/companies/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch company details' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const companyId = params.id;
    const body = await request.json();
    const status = body.status as CrmCompanyStatus;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: 'A valid status is required' }, { status: 400 });
    }

    const company = await updateCrmCompanyStatus(companyId, status);

    return NextResponse.json({ success: true, company });
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/crm/companies/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update company' },
      { status: 500 }
    );
  }
}
