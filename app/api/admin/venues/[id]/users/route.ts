import { NextRequest, NextResponse } from 'next/server';
import { getVenueAccessUsers } from '@/lib/services/multi-venue-access-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const venueId = params.id;
    const users = await getVenueAccessUsers(venueId);

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error: any) {
    console.error('Error fetching venue users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch venue users' },
      { status: 500 }
    );
  }
}
