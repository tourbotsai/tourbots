import { NextResponse } from 'next/server';
import { createPublicEmbedToken } from '@/lib/public-embed-token';

const DEMO_VENUE_ID = 'aed89398-bb6d-44e7-8ff6-de45ffcbfcd0';
const DEMO_EMBED_ID = `tour-widget-${DEMO_VENUE_ID}`;

export async function GET() {
  try {
    const embedToken = createPublicEmbedToken(DEMO_VENUE_ID, DEMO_EMBED_ID);
    if (!embedToken) {
      return NextResponse.json({ error: 'Embed capabilities are not configured' }, { status: 503 });
    }

    return NextResponse.json(
      { venueId: DEMO_VENUE_ID, embedId: DEMO_EMBED_ID, embedToken },
      { headers: { 'Cache-Control': 'private, max-age=0, no-store' } }
    );
  } catch (error) {
    console.error('Demo embed capability error:', error);
    return NextResponse.json({ error: 'Unable to create demo capability' }, { status: 500 });
  }
}
