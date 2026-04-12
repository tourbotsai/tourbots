import { NextRequest, NextResponse } from 'next/server';
import { toggleSetupMode } from '@/lib/services/admin/venue-creation-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';
import { getPlatformAdminUserId } from '@/lib/platform-admin';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;
    const platformAdminUserId = getPlatformAdminUserId();

    const venueId = params.id;
    const { enableSetupMode, notes } = await request.json();

    // Toggle setup mode
    await toggleSetupMode(venueId, enableSetupMode, platformAdminUserId, notes);

    return NextResponse.json({
      success: true,
      message: `Setup mode ${enableSetupMode ? 'enabled' : 'disabled'}`,
    });
  } catch (error: any) {
    console.error('Error toggling setup mode:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to toggle setup mode' },
      { status: 500 }
    );
  }
}

