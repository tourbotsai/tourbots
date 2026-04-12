import { NextRequest, NextResponse } from 'next/server';
import {
  AGENCY_CSRF_COOKIE,
  resolveAgencyPortalSession,
  validatePortalVenueAccess,
} from '@/lib/agency-portal-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareSlug = searchParams.get('shareSlug') || undefined;

    const context = await resolveAgencyPortalSession(request, shareSlug);
    if (!context) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const accessError = await validatePortalVenueAccess(request, context.venueId);
    if (accessError) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const csrfToken = request.cookies.get(AGENCY_CSRF_COOKIE)?.value || null;

    return NextResponse.json({
      authenticated: true,
      csrfToken,
      share: {
        id: context.shareId,
        shareSlug: context.shareSlug,
        venueId: context.venueId,
        tourId: context.tourId,
        enabledModules: context.enabledModules,
      },
      user: {
        id: context.user.id,
        email: context.user.email,
        displayName: context.user.displayName,
      },
    });
  } catch (error: any) {
    console.error('Agency portal session lookup error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch session.' }, { status: 500 });
  }
}

