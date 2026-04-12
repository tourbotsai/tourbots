import { notFound } from 'next/navigation';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { TourEmbedClient } from './tour-embed-client';
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
      const locationTourId = requestedTour.parent_tour_id || requestedTour.id;
      const { data: customisationResult } = await supabase
        .from('chatbot_customisations')
        .select('*')
        .eq('venue_id', venueId)
        .eq('tour_id', locationTourId)
        .eq('chatbot_type', 'tour')
        .eq('is_active', true)
        .maybeSingle();

      return {
        tour: requestedTour,
        venue: requestedTour.venues,
        customisation: customisationResult || null
      };
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
      const locationTourId = tourResult.parent_tour_id || tourResult.id;
      const { data: customisationResult } = await supabase
        .from('chatbot_customisations')
        .select('*')
        .eq('venue_id', venueId)
        .eq('tour_id', locationTourId)
        .eq('chatbot_type', 'tour')
        .eq('is_active', true)
        .maybeSingle();

      return { 
        tour: tourResult, 
        venue: tourResult.venues,
        customisation: customisationResult || null
      };
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

  const locationTourId = tourResult.data.parent_tour_id || tourResult.data.id;
  const { data: customisationResult } = await supabase
    .from('chatbot_customisations')
    .select('*')
    .eq('venue_id', venueId)
    .eq('tour_id', locationTourId)
    .eq('chatbot_type', 'tour')
    .eq('is_active', true)
    .maybeSingle();

  return { 
    tour: tourResult.data, 
    venue: tourResult.data.venues,
    customisation: customisationResult || null
  };
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
  };
}) {
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
      options={options}
      embedToken={embedToken}
    />
  );
}
