import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { trackEmbedView } from '@/lib/embed-analytics';
import { randomUUID } from 'crypto';
import {
  verifyPublicEmbedRequest,
} from '@/lib/public-embed-token';

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Tour and website chatbot config endpoint.
export async function GET(
  request: NextRequest,
  { params }: { params: { venueId: string } }
) {
  try {
    const { venueId } = params;
    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get('tourId');
    const modelId = searchParams.get('modelId');
    const chatbotConfigId = searchParams.get('chatbotConfigId');
    const embedToken = searchParams.get('embedToken');
    const embedIdParam = searchParams.get('embedId');
    if (!venueId) {
      return NextResponse.json({ error: 'Venue ID required' }, { status: 400 });
    }

    const resolvedEmbedId = typeof embedIdParam === 'string' && embedIdParam.trim().length > 0
      ? embedIdParam.trim()
      : `tour-widget-${venueId}`;

    if (!verifyPublicEmbedRequest({
      request,
      token: embedToken,
      venueId,
      embedId: resolvedEmbedId,
    })) {
      return NextResponse.json(
        { error: 'Invalid or missing embed token' },
        { status: 403 }
      );
    }

    const isWebsiteRequest = Boolean(chatbotConfigId);

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
      .eq('venue_id', venueId);

    if (isWebsiteRequest) {
      query = query.eq('chatbot_type', 'website').eq('id', chatbotConfigId as string);
    } else {
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

      query = query.eq('chatbot_type', 'tour');
      if (resolvedTourId) {
        query = query.eq('tour_id', resolvedTourId);
      }
    }

    const { data: rows, error: configError } = await query.limit(1);
    const config = rows && rows.length > 0 ? rows[0] : null;

    if (configError || !config) {
      return NextResponse.json(
        { error: isWebsiteRequest ? 'Website chatbot config not found' : 'Tour chatbot config not found' },
        { status: 404 }
      );
    }

    if (!config.is_active) {
      return NextResponse.json(
        { error: isWebsiteRequest ? 'Website chatbot not active' : 'Tour chatbot not active' },
        { status: 400 }
      );
    }

    const venue = config.venues;
    const welcomeMessage =
      config.welcome_message ||
      (isWebsiteRequest
        ? `Hello! I'm ${config.chatbot_name}, the assistant for ${venue.name}. What would you like to know?`
        : `Hello! I'm ${config.chatbot_name}, your virtual tour guide for ${venue.name}. I'm here to help you explore and understand our facilities during your virtual tour. What would you like to know about our venue?`);

    return NextResponse.json({
      chatbot_name: config.chatbot_name,
      welcome_message: welcomeMessage,
      is_active: config.is_active,
      chatbot_type: config.chatbot_type,
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
      modelId,
      chatbotConfigId
    } = await request.json();
    const { venueId } = params;
    const isWebsiteRequest = Boolean(chatbotConfigId);

    if (!venueId) {
      return NextResponse.json({ error: 'Venue ID required' }, { status: 400 });
    }

    const resolvedEmbedId = typeof embedId === 'string' && embedId.trim().length > 0
      ? embedId.trim()
      : `tour-widget-${venueId}`;

    if (!verifyPublicEmbedRequest({
      request,
      token: embedToken,
      venueId,
      embedId: resolvedEmbedId,
    })) {
      return NextResponse.json(
        { error: 'Invalid or missing embed token' },
        { status: 403 }
      );
    }

    const finalSessionId = sessionId || `tour-${venueId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    let conversationId = existingConversationId;
    if (!conversationId || !isValidUUID(conversationId)) {
      conversationId = randomUUID();
    }

    if (resolvedEmbedId) {
      try {
        await trackEmbedView(
          resolvedEmbedId,
          venueId,
          isWebsiteRequest ? 'website' : 'tour',
          domain,
          pageUrl,
          isWebsiteRequest ? 'website' : 'tour'
        );
      } catch (error) {
        console.error('Failed to track embed view:', error);
      }
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
      .eq('venue_id', venueId);

    if (isWebsiteRequest) {
      query = query.eq('chatbot_type', 'website').eq('id', chatbotConfigId);
    } else {
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

      query = query.eq('chatbot_type', 'tour');
      if (resolvedTourId) {
        query = query.eq('tour_id', resolvedTourId);
      }
    }

    const { data: rows, error: configError } = await query.limit(1);
    const config = rows && rows.length > 0 ? rows[0] : null;

    if (configError || !config) {
      return NextResponse.json(
        { error: isWebsiteRequest ? 'Website chatbot config not found' : 'Tour chatbot config not found' },
        { status: 404 }
      );
    }

    if (!config.is_active) {
      return NextResponse.json(
        { error: isWebsiteRequest ? 'Website chatbot not active' : 'Tour chatbot not active' },
        { status: 400 }
      );
    }

    const venue = config.venues;
    const welcomeMessage =
      config.welcome_message ||
      (isWebsiteRequest
        ? `Hello! I'm ${config.chatbot_name}, the assistant for ${venue.name}. What would you like to know?`
        : `Hello! I'm ${config.chatbot_name}, your virtual tour guide for ${venue.name}. I'm here to help you explore and understand our facilities during your virtual tour. What would you like to know about our venue?`);

    return NextResponse.json({
      response: welcomeMessage,
      chatbot_name: config.chatbot_name,
      welcome_message: welcomeMessage,
      is_active: config.is_active,
      chatbot_type: config.chatbot_type,
      chatbotType: config.chatbot_type,
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