import { NextRequest, NextResponse } from 'next/server';
import { getPlatformOutboundLeads } from '@/lib/services/admin/platform-outbound-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export async function GET(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;

    const leads = await getPlatformOutboundLeads(search);

    return NextResponse.json({
      success: true,
      leads,
      total: leads.length,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/outbound/leads:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch outbound leads' },
      { status: 500 }
    );
  }
}
