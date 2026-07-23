import { NextRequest, NextResponse } from 'next/server';
import {
  getCrmCompanyById,
  listCrmNotes,
  listCrmActivities,
  updateCrmCompanyStatus,
  updateCrmCompanyDetails,
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

const DETAIL_FIELDS = ['company_name', 'first_name', 'last_name', 'email', 'phone', 'region'] as const;

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const companyId = params.id;
    const body = await request.json();

    let company = null;

    if (body.status !== undefined) {
      const status = body.status as CrmCompanyStatus;
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ success: false, error: 'A valid status is required' }, { status: 400 });
      }
      company = await updateCrmCompanyStatus(companyId, status);
    }

    const hasDetailUpdate = DETAIL_FIELDS.some((field) => body[field] !== undefined);
    if (hasDetailUpdate) {
      company = await updateCrmCompanyDetails(companyId, {
        company_name: body.company_name,
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        phone: body.phone,
        region: body.region,
      });
    }

    if (!company) {
      return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 });
    }

    return NextResponse.json({ success: true, company });
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/crm/companies/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update company' },
      { status: 500 }
    );
  }
}
