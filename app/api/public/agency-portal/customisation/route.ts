import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAgencyPortalSession } from '@/lib/agency-portal-auth';
import {
  getScopedTourCustomisation,
  updateScopedTourCustomisation,
} from '@/lib/agency-portal-module-service';

const updateSchema = z.object({
  shareSlug: z.string().trim().min(3).max(120).optional(),
  customisation: z.record(z.unknown()),
});

const RESERVED_CUSTOMISATION_KEYS = new Set([
  'id',
  'venue_id',
  'tour_id',
  'chatbot_type',
  'created_at',
  'updated_at',
]);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareSlug = searchParams.get('shareSlug') || undefined;

    const session = await requireAgencyPortalSession(request, {
      shareSlug,
      requiredModule: 'customisation',
    });
    if (session instanceof NextResponse) return session;

    const customisation = await getScopedTourCustomisation(session.venueId, session.tourId);
    if (!customisation) {
      return NextResponse.json({ customisation: null }, { status: 200 });
    }

    return NextResponse.json({
      customisation,
      scope: {
        shareId: session.shareId,
        shareSlug: session.shareSlug,
        tourId: session.tourId,
      },
    });
  } catch (error: any) {
    console.error('Agency portal customisation GET error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load portal customisation.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = updateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid customisation payload.' }, { status: 400 });
    }
    const hasReservedKeys = Object.keys(parsed.data.customisation).some((key) =>
      RESERVED_CUSTOMISATION_KEYS.has(key)
    );
    if (hasReservedKeys) {
      return NextResponse.json({ error: 'Reserved customisation keys are not allowed.' }, { status: 400 });
    }

    const session = await requireAgencyPortalSession(request, {
      shareSlug: parsed.data.shareSlug,
      requiredModule: 'customisation',
      requireCsrf: true,
    });
    if (session instanceof NextResponse) return session;

    const customisation = await updateScopedTourCustomisation(
      session.venueId,
      session.tourId,
      parsed.data.customisation
    );

    return NextResponse.json({ customisation });
  } catch (error: any) {
    console.error('Agency portal customisation PUT error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update portal customisation.' },
      { status: 500 }
    );
  }
}

