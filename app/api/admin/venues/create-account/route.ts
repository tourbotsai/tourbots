import { NextRequest, NextResponse } from 'next/server';
import { createVenueAccountForCustomer } from '@/lib/services/admin/venue-creation-service';
import { AdminVenueCreationRequest } from '@/lib/types';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';
import { getPlatformAdminUserId } from '@/lib/platform-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;
    const platformAdminUserId = getPlatformAdminUserId();

    const body: AdminVenueCreationRequest = await request.json();
    
    const {
      venueName,
      ownerEmail,
      ownerFirstName,
      ownerLastName,
      phone,
      address,
      city,
      postcode,
      planName,
      enableSetupMode,
    } = body;

    // Validate required fields
    if (!venueName || !ownerEmail || !ownerFirstName || !ownerLastName || !planName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create venue account
    const result = await createVenueAccountForCustomer(body, platformAdminUserId);

    return NextResponse.json({
      success: true,
      venue: result.venue,
      user: result.user,
      tempPassword: result.tempPassword,
      message: 'Venue account created successfully',
    });
  } catch (error: any) {
    console.error('Error creating venue account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create venue account' },
      { status: 500 }
    );
  }
}

