import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { trackEmbedView } from '@/lib/embed-analytics';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function getOriginHost(request: NextRequest): string | null {
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      return new URL(origin).hostname.toLowerCase();
    } catch {
      return null;
    }
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).hostname.toLowerCase();
    } catch {
      return null;
    }
  }

  return null;
}

function isAllowedPublicChatOriginHost(host: string | null): boolean {
  if (!host) return process.env.NODE_ENV === 'development';
  if (host === 'localhost' || host === '127.0.0.1') return true;
  return host === 'tourbots.ai' || host.endsWith('.tourbots.ai');
}

function verifyEmbedToken(params: {
  token: string;
  venueId: string;
  embedId: string;
}): boolean {
  const secret = process.env.PUBLIC_CHATBOT_EMBED_TOKEN_SECRET;
  if (!secret) return true;

  const [payloadBase64, signature] = params.token.split('.');
  if (!payloadBase64 || !signature) return false;

  const expectedSignature = createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('hex');

  const signatureBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson) as { v?: string; e?: string; exp?: number };
    if (payload.v !== params.venueId) return false;
    if (payload.e !== params.embedId) return false;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

// Tour chatbot config endpoint only.
export async function GET(
  request: NextRequest,
  { params }: { params: { venueId: string } }
) {
  try {
    const { venueId } = params;
    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get('tourId');
    const modelId = searchParams.get('modelId');
    const embedToken = searchParams.get('embedToken');
    const embedIdParam = searchParams.get('embedId');
    if (!venueId) {
      return NextResponse.json({ error: 'Venue ID required' }, { status: 400 });
    }

    const originHost = getOriginHost(request);
    const isFirstPartyOrigin = isAllowedPublicChatOriginHost(originHost);
    const resolvedEmbedId = typeof embedIdParam === 'string' && embedIdParam.trim().length > 0
      ? embedIdParam.trim()
      : `tour-widget-${venueId}`;
    const embedTokenSecret = process.env.PUBLIC_CHATBOT_EMBED_TOKEN_SECRET;

    if (!isFirstPartyOrigin) {
      if (!embedTokenSecret) {
        return NextResponse.json(
          { error: 'Forbidden origin for public chatbot route' },
          { status: 403 }
        );
      }

      if (typeof embedToken !== 'string' || !verifyEmbedToken({
        token: embedToken,
        venueId,
        embedId: resolvedEmbedId,
      })) {
        return NextResponse.json(
          { error: 'Invalid or missing embed token' },
          { status: 403 }
        );
      }
    }

    let resolvedTourId = tourId;
    if (!resolvedTourId && modelId) {
      const { data: tourByModel } = await supabase
        .from('tours')
        .select('id, parent_tour_id')
        .eq('venue_id', venueId)
        .eq('matterport_tour_id', modelId)
        .maybeSingle();
      resolvedTourId = (tourByModel?.parent_tour_id || tourByModel?.id) || null;
    }

    if (resolvedTourId) {
      const { data: tourRow } = await supabase
        .from('tours')
        .select('id, parent_tour_id')
        .eq('venue_id', venueId)
        .eq('id', resolvedTourId)
        .maybeSingle();
      resolvedTourId = (tourRow?.parent_tour_id || tourRow?.id) || resolvedTourId;
    }

    let query = supabase
      .from('chatbot_configs')
      .select(`
        *,
        venues (
          id,
          name,
          slug
        )
      `)
      .eq('venue_id', venueId)
      .eq('chatbot_type', 'tour');

    if (resolvedTourId) {
      query = query.eq('tour_id', resolvedTourId);
    }

    const { data: rows, error: configError } = await query.limit(1);
    const config = rows && rows.length > 0 ? rows[0] : null;

    if (configError || !config) {
      return NextResponse.json({ error: 'Tour chatbot config not found' }, { status: 404 });
    }

    if (!config.is_active) {
      return NextResponse.json({ error: 'Tour chatbot not active' }, { status: 400 });
    }

    const venue = config.venues;
    const welcomeMessage =
      config.welcome_message ||
      `Hello! I'm ${config.chatbot_name}, your virtual tour guide for ${venue.name}. I'm here to help you explore and understand our facilities during your virtual tour. What would you like to know about our venue?`;

    return NextResponse.json({
      chatbot_name: config.chatbot_name,
      welcome_message: welcomeMessage,
      is_active: config.is_active,
      chatbot_type: 'tour',
      venue_name: venue.name,
      venue_id: venueId,
    });
  } catch (error: any) {
    console.error('Error fetching chatbot config:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch config' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { venueId: string } }
) {
  try {
    const {
      embedId,
      embedToken,
      domain,
      pageUrl,
      sessionId,
      conversationId: existingConversationId,
      tourId,
      modelId
    } = await request.json();
    const { venueId } = params;

    if (!venueId) {
      return NextResponse.json({ error: 'Venue ID required' }, { status: 400 });
    }

    const originHost = getOriginHost(request);
    const isFirstPartyOrigin = isAllowedPublicChatOriginHost(originHost);
    const resolvedEmbedId = typeof embedId === 'string' && embedId.trim().length > 0
      ? embedId.trim()
      : `tour-widget-${venueId}`;
    const embedTokenSecret = process.env.PUBLIC_CHATBOT_EMBED_TOKEN_SECRET;

    if (!isFirstPartyOrigin) {
      if (!embedTokenSecret) {
        return NextResponse.json(
          { error: 'Forbidden origin for public chatbot route' },
          { status: 403 }
        );
      }

      if (typeof embedToken !== 'string' || !verifyEmbedToken({
        token: embedToken,
        venueId,
        embedId: resolvedEmbedId,
      })) {
        return NextResponse.json(
          { error: 'Invalid or missing embed token' },
          { status: 403 }
        );
      }
    }

    const finalSessionId = sessionId || `tour-${venueId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    let conversationId = existingConversationId;
    if (!conversationId || !isValidUUID(conversationId)) {
      conversationId = randomUUID();
    }

    if (resolvedEmbedId) {
      try {
        await trackEmbedView(resolvedEmbedId, venueId, 'tour', domain, pageUrl, 'tour');
      } catch (error) {
        console.error('Failed to track embed view:', error);
      }
    }

    let resolvedTourId = tourId;
    if (!resolvedTourId && modelId) {
      const { data: tourByModel } = await supabase
        .from('tours')
        .select('id')
        .eq('venue_id', venueId)
        .eq('matterport_tour_id', modelId)
        .maybeSingle();
      resolvedTourId = tourByModel?.id || null;
    }

    let query = supabase
      .from('chatbot_configs')
      .select(`
        *,
        venues (
          id,
          name,
          slug
        )
      `)
      .eq('venue_id', venueId)
      .eq('chatbot_type', 'tour');

    if (resolvedTourId) {
      query = query.eq('tour_id', resolvedTourId);
    }

    const { data: rows, error: configError } = await query.limit(1);
    const config = rows && rows.length > 0 ? rows[0] : null;

    if (configError || !config) {
      return NextResponse.json({ error: 'Tour chatbot config not found' }, { status: 404 });
    }

    if (!config.is_active) {
      return NextResponse.json({ error: 'Tour chatbot not active' }, { status: 400 });
    }

    const venue = config.venues;
    const welcomeMessage =
      config.welcome_message ||
      `Hello! I'm ${config.chatbot_name}, your virtual tour guide for ${venue.name}. I'm here to help you explore and understand our facilities during your virtual tour. What would you like to know about our venue?`;

    return NextResponse.json({
      response: welcomeMessage,
      chatbot_name: config.chatbot_name,
      welcome_message: welcomeMessage,
      is_active: config.is_active,
      chatbot_type: 'tour',
      chatbotType: 'tour',
      venue_name: venue.name,
      venue_id: venueId,
      sessionId: finalSessionId,
      conversationId,
    });
  } catch (error: any) {
    console.error('Error fetching chatbot config:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch config' }, { status: 500 });
  }
}