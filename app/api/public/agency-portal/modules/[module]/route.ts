import { NextRequest, NextResponse } from 'next/server';
import { requireAgencyPortalSession } from '@/lib/agency-portal-auth';

type ModuleName = 'tour' | 'settings' | 'customisation' | 'analytics';

const VALID_MODULES: ModuleName[] = ['tour', 'settings', 'customisation', 'analytics'];

function isValidModule(value: string): value is ModuleName {
  return VALID_MODULES.includes(value as ModuleName);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { module: string } }
) {
  try {
    if (!isValidModule(params.module)) {
      return NextResponse.json({ error: 'Unknown module.' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const shareSlug = searchParams.get('shareSlug') || undefined;

    const session = await requireAgencyPortalSession(request, {
      shareSlug,
      requiredModule: params.module,
    });

    if (session instanceof NextResponse) return session;

    return NextResponse.json({
      ok: true,
      module: params.module,
      // Scope is always derived from session, never from client payload.
      scope: {
        shareId: session.shareId,
        shareSlug: session.shareSlug,
        venueId: session.venueId,
        tourId: session.tourId,
      },
      message: `Module "${params.module}" access granted.`,
    });
  } catch (error: any) {
    console.error('Agency portal module access error:', error);
    return NextResponse.json({ error: error?.message || 'Failed module access check.' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { module: string } }
) {
  try {
    if (!isValidModule(params.module)) {
      return NextResponse.json({ error: 'Unknown module.' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const shareSlug = typeof body?.shareSlug === 'string' ? body.shareSlug : undefined;

    const session = await requireAgencyPortalSession(request, {
      shareSlug,
      requiredModule: params.module,
      requireCsrf: true,
    });

    if (session instanceof NextResponse) return session;

    return NextResponse.json({
      ok: true,
      module: params.module,
      scope: {
        shareId: session.shareId,
        shareSlug: session.shareSlug,
        venueId: session.venueId,
        tourId: session.tourId,
      },
      message: `Write action authorised for "${params.module}".`,
    });
  } catch (error: any) {
    console.error('Agency portal module write error:', error);
    return NextResponse.json({ error: error?.message || 'Failed write authorisation.' }, { status: 500 });
  }
}

