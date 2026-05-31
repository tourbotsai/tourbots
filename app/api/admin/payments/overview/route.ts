import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';
import { getAdminPaymentsOverview } from '@/lib/stripe-admin';

export const dynamic = 'force-dynamic';

/**
 * Platform-admin payments overview. Real per-account Stripe figures (plan,
 * add-ons, recurring monthly total, billing dates, cancel status) plus the
 * grouped headline MRR.
 */
export async function GET(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const overview = await getAdminPaymentsOverview();
    return NextResponse.json(overview);
  } catch (error: any) {
    console.error('Error fetching payments overview:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payments overview' },
      { status: 500 }
    );
  }
}
