import { notFound } from 'next/navigation';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { ChatbotEmbedClient } from './chatbot-embed-client';
import { createPublicEmbedToken } from '@/lib/public-embed-token';

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

// Website chatbots have no Matterport tour. Resolves the venue + active
// website config + its customisation, keyed only by chatbotConfigId.
async function getWebsiteChatbotEmbedData(venueId: string, chatbotConfigId: string) {
  const { data: config } = await supabase
    .from('chatbot_configs')
    .select('*, venues (id, name, city, country, logo_url)')
    .eq('venue_id', venueId)
    .eq('id', chatbotConfigId)
    .eq('chatbot_type', 'website')
    .eq('is_active', true)
    .maybeSingle();

  if (!config) {
    return null;
  }

  const venue = config.venues;

  const { data: customisation } = await supabase
    .from('chatbot_customisations')
    .select('*')
    .eq('chatbot_config_id', chatbotConfigId)
    .eq('chatbot_type', 'website')
    .eq('is_active', true)
    .maybeSingle();

  const welcomeMessage =
    config.welcome_message ||
    `Hello! I'm ${config.chatbot_name}, the assistant${venue?.name ? ` for ${venue.name}` : ''}. What would you like to know?`;

  return {
    tour: null,
    venue,
    customisation: customisation || null,
    chatbotConfig: {
      chatbot_name: config.chatbot_name,
      welcome_message: welcomeMessage,
      is_active: true,
    },
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
    chatbotConfigId?: string;
    nav?: string;
    mode?: string;
    domain?: string;
    pageUrl?: string;
  };
}) {
  const isWebsiteChatbot = Boolean(searchParams.chatbotConfigId);

  const data = isWebsiteChatbot
    ? await getWebsiteChatbotEmbedData(params.venueId, searchParams.chatbotConfigId as string)
    : await getChatbotEmbedData(params.venueId, searchParams.tourId);

  if (!data) {
    notFound();
  }

  // Navigation defaults ON for tour chatbots; only the explicit "off" forms
  // disable it. Website chatbots have no tour, so navigation is always off.
  const navigationEnabled = isWebsiteChatbot
    ? false
    : !(
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
      chatbotConfigId={isWebsiteChatbot ? (searchParams.chatbotConfigId as string) : null}
      embedId={resolvedEmbedId}
      embedToken={embedToken}
      navigationEnabled={navigationEnabled}
      mode={searchParams.mode === 'embed' ? 'embed' : 'iframe'}
    />
  );
}
