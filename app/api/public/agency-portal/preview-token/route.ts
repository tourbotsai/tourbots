import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAgencyPortalSession } from '@/lib/agency-portal-auth';
import { createPublicEmbedToken } from '@/lib/public-embed-token';

const previewTokenSchema = z.object({
  shareSlug: z.string().trim().min(1).max(160),
  venueId: z.string().uuid(),
  embedId: z.string().trim().min(1).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const { shareSlug, venueId, embedId } = previewTokenSchema.parse(await request.json());
    const session = await requireAgencyPortalSession(request, {
      shareSlug,
      requiredModule: 'tour',
    });
    if (session instanceof NextResponse) return session;
    if (session.venueId !== venueId) {
      return NextResponse.json({ error: 'Venue access denied' }, { status: 403 });
    }

    const embedToken = createPublicEmbedToken(venueId, embedId);
    if (!embedToken) {
      return NextResponse.json({ error: 'Embed capabilities are not configured' }, { status: 503 });
    }
    return NextResponse.json({ embedToken });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid preview token request' }, { status: 400 });
    }
    console.error('Agency preview token issuance error:', error);
    return NextResponse.json({ error: 'Unable to create preview capability' }, { status: 500 });
  }
}
