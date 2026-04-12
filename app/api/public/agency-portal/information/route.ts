import { NextRequest, NextResponse } from 'next/server';
import { requireAgencyPortalSession } from '@/lib/agency-portal-auth';
import { getScopedTourInformationSections, updateScopedTourInformationSections } from '@/lib/agency-portal-module-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareSlug = searchParams.get('shareSlug') || undefined;

    const session = await requireAgencyPortalSession(request, {
      shareSlug,
      requiredModule: 'settings',
    });
    if (session instanceof NextResponse) return session;

    const sections = await getScopedTourInformationSections(session.venueId, session.tourId);
    return NextResponse.json({
      sections,
      scope: {
        shareId: session.shareId,
        shareSlug: session.shareSlug,
        tourId: session.tourId,
      },
    });
  } catch (error: any) {
    console.error('Agency portal information GET error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load portal information.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}));
    const shareSlug = typeof payload?.shareSlug === 'string' ? payload.shareSlug : undefined;

    const session = await requireAgencyPortalSession(request, {
      shareSlug,
      requiredModule: 'settings',
      requireCsrf: true,
    });
    if (session instanceof NextResponse) return session;

    if (!Array.isArray(payload?.sections)) {
      return NextResponse.json({ error: 'Invalid information sections payload.' }, { status: 400 });
    }

    const sections = await updateScopedTourInformationSections(
      session.venueId,
      session.tourId,
      payload.sections
    );

    return NextResponse.json({ sections });
  } catch (error: any) {
    console.error('Agency portal information PUT error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save portal information.' },
      { status: 500 }
    );
  }
}

