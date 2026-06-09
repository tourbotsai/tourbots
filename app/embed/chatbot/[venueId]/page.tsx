import { notFound } from 'next/navigation';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { ChatbotEmbedClient } from './chatbot-embed-client';
import { createHmac } from 'crypto';

// Mirrors the HMAC embed token minted by the tour embed page so the public
// chatbot route accepts requests from this iframe regardless of the host page
// it is framed on (e.g. an MPskin tour).
function createPublicEmbedToken(venueId: string, embedId: string): string | null {
  const secret = process.env.PUBLIC_CHATBOT_EMBED_TOKEN_SECRET;
  if (!secret) return null;

  const payload = {
    v: venueId,
    e: embedId,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(payloadBase64).digest('hex');
  return `${payloadBase64}.${signature}`;
}

// Minimal chatbot config (name / welcome / active) so the widget renders immediately
// without its own client config fetch. Returns null when no active config exists, in
// which case the widget keeps its existing client-fetch fallback behaviour.
async function getChatbotConfigData(venueId: string, locationTourId: string, venueName?: string) {
  const { data: rows } = await supabase
    .from('chatbot_configs')
    .select('chatbot_name, welcome_message, is_active')
    .eq('venue_id', venueId)
    .eq('chatbot_type', 'tour')
    .eq('tour_id', locationTourId)
    .limit(1);

  const config = rows && rows.length > 0 ? rows[0] : null;
  if (!config || !config.is_active) {
    return null;
  }

  const welcomeMessage =
    config.welcome_message ||
    `Hello! I'm ${config.chatbot_name}, your virtual tour guide${venueName ? ` for ${venueName}` : ''}. I'm here to help you explore and understand our facilities during your virtual tour. What would you like to know about our venue?`;

  return {
    chatbot_name: config.chatbot_name,
    welcome_message: welcomeMessage,
    is_active: true,
  };
}

async function buildResult(venueId: string, tour: any) {
  const locationTourId = tour.parent_tour_id || tour.id;
  const venue = tour.venues;

  const [customisation, chatbotConfig] = await Promise.all([
    supabase
      .from('chatbot_customisations')
      .select('*')
      .eq('venue_id', venueId)
      .eq('tour_id', locationTourId)
      .eq('chatbot_type', 'tour')
      .eq('is_active', true)
      .maybeSingle()
      .then((res) => res.data || null),
    getChatbotConfigData(venueId, locationTourId, venue?.name),
  ]);

  return { tour, venue, customisation, chatbotConfig };
}

async function getChatbotEmbedData(venueId: string, requestedTourId?: string) {
  const venueSelect = `
    *,
    venues (
      id,
      name,
      city,
      country,
      logo_url
    )
  `;

  if (requestedTourId) {
    const { data: requestedTour } = await supabase
      .from('tours')
      .select(venueSelect)
      .eq('venue_id', venueId)
      .eq('id', requestedTourId)
      .eq('is_active', true)
      .maybeSingle();

    if (requestedTour) {
      return buildResult(venueId, requestedTour);
    }
  }

  const { data: primaryTour, error } = await supabase
    .from('tours')
    .select(venueSelect)
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .or('tour_type.eq.primary,tour_type.is.null')
    .limit(1)
    .single();

  if (error || !primaryTour) {
    return null;
  }

  return buildResult(venueId, primaryTour);
}

export default async function ChatbotEmbedPage({
  params,
  searchParams,
}: {
  params: { venueId: string };
  searchParams: {
    id?: string;
    tourId?: string;
    nav?: string;
    mode?: string;
    domain?: string;
    pageUrl?: string;
  };
}) {
  const data = await getChatbotEmbedData(params.venueId, searchParams.tourId);

  if (!data) {
    notFound();
  }

  // Navigation defaults ON; only the explicit "off" forms disable it.
  const navigationEnabled = !(
    searchParams.nav === '0' ||
    searchParams.nav === 'false' ||
    searchParams.nav === 'off'
  );

  const resolvedEmbedId = searchParams.id || `chatbot-widget-${params.venueId}`;
  const embedToken = createPublicEmbedToken(params.venueId, resolvedEmbedId);

  return (
    <ChatbotEmbedClient
      tour={data.tour}
      venue={data.venue}
      customisation={data.customisation}
      chatbotConfig={data.chatbotConfig}
      embedId={resolvedEmbedId}
      embedToken={embedToken}
      navigationEnabled={navigationEnabled}
      mode={searchParams.mode === 'embed' ? 'embed' : 'iframe'}
    />
  );
}
