import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  authenticateChatbotRoute,
  ensureVenueScope,
} from '@/lib/chatbot-route-auth';
import { createPublicEmbedToken } from '@/lib/public-embed-token';

const previewTokenSchema = z.object({
  venueId: z.string().uuid(),
  embedId: z.string().trim().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const authResult = await authenticateChatbotRoute(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { venueId, embedId } = previewTokenSchema.parse(await request.json());
    const venueScopeError = ensureVenueScope(authResult, venueId);
    if (venueScopeError) return venueScopeError;

    const embedToken = createPublicEmbedToken(venueId, embedId);
    if (!embedToken) {
      return NextResponse.json({ error: 'Embed capabilities are not configured' }, { status: 503 });
    }

    return NextResponse.json({ embedToken });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid preview token request' }, { status: 400 });
    }
    console.error('Preview token issuance error:', error);
    return NextResponse.json({ error: 'Unable to create preview capability' }, { status: 500 });
  }
}
