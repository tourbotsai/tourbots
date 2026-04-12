import { NextRequest, NextResponse } from 'next/server';
import { requireAgencyPortalSession } from '@/lib/agency-portal-auth';
import { getScopedTourTriggers } from '@/lib/agency-portal-module-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareSlug = searchParams.get('shareSlug') || undefined;

    const session = await requireAgencyPortalSession(request, {
      shareSlug,
      requiredModule: 'settings',
    });
    if (session instanceof NextResponse) return session;

    const payload = await getScopedTourTriggers(session.venueId, session.tourId);
    return NextResponse.json({
      ...payload,
      scope: {
        shareId: session.shareId,
        shareSlug: session.shareSlug,
        tourId: session.tourId,
      },
    });
  } catch (error: any) {
    console.error('Agency portal triggers GET error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load portal triggers.' },
      { status: 500 }
    );
  }
}

