import { NextRequest, NextResponse } from 'next/server';
import { trackEmbedView } from '@/lib/embed-analytics';

// 1x1 transparent pixel GIF
const PIXEL_DATA = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

function normaliseEmbedType(value: string | null): 'tour' | 'chatbot' {
  return value === 'chatbot' ? 'chatbot' : 'tour';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const embedId = searchParams.get('embedId');
    const venueId = searchParams.get('venueId');
    const type = normaliseEmbedType(searchParams.get('type'));
    const domain = searchParams.get('domain');
    const pageUrl = searchParams.get('pageUrl');
    const tourId = searchParams.get('tourId');
    const chatbotParam = searchParams.get('chatbotType');
    const chatbotType = chatbotParam === 'tour' ? chatbotParam : undefined;

    console.log('🖼️ Pixel tracking request:', { embedId, venueId, type, domain });

    if (embedId && venueId && type) {
      const userAgent = request.headers.get('user-agent') || undefined;
      await trackEmbedView(
        embedId,
        venueId,
        type,
        domain || undefined,
        pageUrl || undefined,
        chatbotType,
        userAgent,
        tourId || undefined
      );
      console.log('✅ Pixel tracking successful');
    } else {
      console.warn('⚠️ Missing required parameters for pixel tracking');
    }

    return new NextResponse(PIXEL_DATA, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('❌ Error in pixel tracking:', error);
    // Still return pixel even if tracking fails
    return new NextResponse(PIXEL_DATA, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
} 