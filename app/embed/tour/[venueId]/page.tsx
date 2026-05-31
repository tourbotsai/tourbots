import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { TourEmbedClient } from './tour-embed-client';
import { NestedTourShell } from './nested-tour-shell';
import { isCanonicalEmbedHost, getCanonicalEmbedOrigin } from '@/lib/embed-host';
import { createHmac } from 'crypto';

function createPublicEmbedToken(venueId: string, embedId: string): string | null {
  const secret = process.env.PUBLIC_CHATBOT_EMBED_TOKEN_SECRET;
  if (!secret) return null;

  const payload = {
    v: venueId,
    e: embedId,
    exp: Math.floor(Date.now() / 1000) + (12 * 60 * 60), // 12 hours
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(payloadBase64).digest('hex');
  return `${payloadBase64}.${signature}`;
}

// Tour menu (settings + blocks) for instant first-paint of the overlay. Fetched server-side
// so the embed no longer needs a client round trip after hydration.
async function getMenuData(tourId: string) {
  // Single round trip: settings with their blocks embedded via the menu_id foreign key.
  const { data } = await supabase
    .from('tour_menu_settings')
    .select('*, tour_menu_blocks(*)')
    .eq('tour_id', tourId)
    .eq('enabled', true)
    .maybeSingle();

  if (!data) {
    return { settings: null, blocks: [] };
  }

  const { tour_menu_blocks, ...settings } = data as any;
  const blocks = (tour_menu_blocks || []).sort(
    (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );

  return { settings, blocks };
}

// Minimal chatbot config (name / welcome / active) so the widget can render immediately
// without its own client config fetch. Returns null if no config exists for this tour, in
// which case the widget falls back to its existing client fetch behaviour.
async function getChatbotConfigData(venueId: string, locationTourId: string, venueName?: string) {
  const { data: rows } = await supabase
    .from('chatbot_configs')
    .select('chatbot_name, welcome_message, is_active')
    .eq('venue_id', venueId)
    .eq('chatbot_type', 'tour')
    .eq('tour_id', locationTourId)
    .limit(1);

  const config = rows && rows.length > 0 ? rows[0] : null;
  // Only take the SSR fast path for active chatbots. If there is no config or it is inactive,
  // return null so the widget keeps its existing client-fetch fallback behaviour unchanged.
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

// Once the tour row is known, everything else (customisation, menu, chatbot config) depends
// only on the location-scope tour id, so they run in a single parallel batch.
async function buildTourResult(venueId: string, tour: any) {
  const locationTourId = tour.parent_tour_id || tour.id;
  const venue = tour.venues;

  const [customisation, menu, chatbotConfig] = await Promise.all([
    supabase
      .from('chatbot_customisations')
      .select('*')
      .eq('venue_id', venueId)
      .eq('tour_id', locationTourId)
      .eq('chatbot_type', 'tour')
      .eq('is_active', true)
      .maybeSingle()
      .then((res) => res.data || null),
    getMenuData(locationTourId),
    getChatbotConfigData(venueId, locationTourId, venue?.name),
  ]);

  return { tour, venue, customisation, menu, chatbotConfig };
}

async function getTourData(venueId: string, modelId?: string, requestedTourId?: string) {
  if (requestedTourId) {
    const { data: requestedTour, error: requestedTourError } = await supabase
      .from('tours')
      .select(`
        *,
        venues (
          id,
          name,
          city,
          country,
          logo_url
        )
      `)
      .eq('venue_id', venueId)
      .eq('id', requestedTourId)
      .eq('is_active', true)
      .maybeSingle();

    if (!requestedTourError && requestedTour) {
      return buildTourResult(venueId, requestedTour);
    }
  }

  if (modelId) {
    const { data: tourResult, error: tourError } = await supabase
      .from('tours')
      .select(`
        *,
        venues (
          id,
          name,
          city,
          country,
          logo_url
        )
      `)
      .eq('venue_id', venueId)
      .eq('matterport_tour_id', modelId)
      .eq('is_active', true)
      .single();

    if (!tourError && tourResult) {
      return buildTourResult(venueId, tourResult);
    }
  }

  const tourResult = await supabase
    .from('tours')
    .select(`
      *,
      venues (
        id,
        name,
        city,
        country,
        logo_url
      )
    `)
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .or('tour_type.eq.primary,tour_type.is.null')
    .limit(1)
    .single();

  if (tourResult.error || !tourResult.data) {
    return null;
  }

  return buildTourResult(venueId, tourResult.data);
}

export default async function TourEmbedPage({ 
  params, 
  searchParams 
}: { 
  params: { venueId: string };
  searchParams: { 
    id?: string; 
    showTitle?: string; 
    showChat?: string;
    model?: string;
    tourId?: string;
    domain?: string;
    pageUrl?: string;
  };
}) {
  // White-label custom domains can't run the Matterport SDK (domain-locked key)
  // or first-party chat directly, so nest the canonical tourbots embed instead.
  // The canonical host (and Vercel previews / local) render the tour directly.
  const host = headers().get('host');
  if (!isCanonicalEmbedHost(host)) {
    return (
      <NestedTourShell
        venueId={params.venueId}
        canonicalOrigin={getCanonicalEmbedOrigin()}
        searchParams={searchParams}
      />
    );
  }

  const data = await getTourData(params.venueId, searchParams.model, searchParams.tourId);
  
  if (!data) {
    notFound();
  }

  const options = {
    showTitle: searchParams.showTitle === 'true',
    showChat: searchParams.showChat !== 'false',
    embedId: searchParams.id,
    requestedModelId: searchParams.model
  };
  const resolvedEmbedId = options.embedId || `tour-widget-${params.venueId}`;
  const embedToken = createPublicEmbedToken(params.venueId, resolvedEmbedId);

  return (
    <TourEmbedClient 
      tour={data.tour} 
      venue={data.venue} 
      customisation={data.customisation}
      menu={data.menu}
      chatbotConfig={data.chatbotConfig}
      options={options}
      embedToken={embedToken}
    />
  );
}
