import { NextRequest, NextResponse } from 'next/server';
import { trackEmbedView } from '@/lib/embed-analytics';
import {
  getMarketingSiteMoveGateConfig,
  isMarketingSiteTourMoveOriginAllowed,
} from '@/lib/marketing-site-tour-move-request';

// Helper to extract domain and pageUrl from query parameters
function extractFromQueryParams(url: string) {
  try {
    const urlObj = new URL(url);
    const queryDomain = urlObj.searchParams.get('domain');
    const queryPageUrl = urlObj.searchParams.get('pageUrl');
    
    if (queryDomain && queryPageUrl) {
      console.log('🎯 Extracted from query params:', { 
        domain: queryDomain, 
        pageUrl: decodeURIComponent(queryPageUrl) 
      });
      return {
        domain: queryDomain,
        pageUrl: decodeURIComponent(queryPageUrl)
      };
    }
  } catch (e) {
    console.warn('⚠️ Failed to parse URL for query params:', url, e);
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    if (!raw?.trim()) {
      return NextResponse.json({ error: 'Empty body' }, { status: 400 });
    }
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const {
      embedId,
      venueId,
      type,
      domain,
      pageUrl,
      chatbotType,
      debugInfo,
      tourId,
    } = body as {
      embedId?: string;
      venueId?: string;
      type?: string;
      domain?: string;
      pageUrl?: string;
      chatbotType?: 'tour';
      debugInfo?: unknown;
      tourId?: string;
    };

    console.log('📊 Embed tracking request:', { embedId, venueId, type, domain, pageUrl });
    console.log('🔍 Request origin:', request.headers.get('origin'));
    console.log('🔍 Request referer:', request.headers.get('referer'));
    
    // Log debug info if provided
    if (debugInfo) {
      console.log('🐛 Debug info from embed:', debugInfo);
    }

    if (!embedId || !venueId || !type) {
      console.warn('❌ Missing required fields:', { embedId, venueId, type });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const gate = getMarketingSiteMoveGateConfig();
    if (gate && embedId === gate.embedId) {
      if (venueId !== gate.venueId || tourId !== gate.tourId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (!isMarketingSiteTourMoveOriginAllowed(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Get user agent from request headers
    const userAgent = request.headers.get('user-agent') || undefined;
    
    // Use the domain and pageUrl passed from the iframe (now correctly extracted)
    let finalDomain = domain;
    let finalPageUrl = pageUrl;
    
    // Fallback: if we still get the primary host, try to extract from referer as backup
    const referer = request.headers.get('referer');
    if (finalDomain === 'tourbots.ai' || finalDomain === 'www.tourbots.ai') {
      const extracted = extractFromQueryParams(referer || '');
      if (extracted) {
        finalDomain = extracted.domain;
        finalPageUrl = extracted.pageUrl;
        console.log('✅ Using fallback extracted values from referer');
      }
    }
    
    // Final fallbacks if we still don't have good values
    if (!finalDomain || finalDomain === 'unknown') {
      finalDomain = (referer ? new URL(referer).hostname : null) ||
                   request.headers.get('origin')?.replace(/^https?:\/\//, '') ||
                   'unknown';
    }
    
    if (!finalPageUrl || finalPageUrl === 'unknown') {
      finalPageUrl = referer || 'unknown';
    }
    
    console.log('🎯 Final tracking values:', { 
      domain: finalDomain, 
      pageUrl: finalPageUrl, 
      userAgent: userAgent?.substring(0, 100) 
    });

    await trackEmbedView(embedId, venueId, type, finalDomain, finalPageUrl, chatbotType, userAgent, tourId);

    console.log('✅ Tracking successful');
    return NextResponse.json({ success: true, tracked: true });
  } catch (error) {
    console.error('❌ Error tracking embed:', error);
    return NextResponse.json(
      { error: 'Failed to track embed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}