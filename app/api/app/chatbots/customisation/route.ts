import { NextRequest, NextResponse } from 'next/server';
import {
  getChatbotCustomisation,
  upsertChatbotCustomisation,
  getVenueChatbotCustomisations,
  deleteChatbotCustomisation,
} from '@/lib/server/chatbot-customisation-db';
import { authenticateChatbotRoute, ensureTourScope, ensureVenueScope, getScopedVenueId, logChatbotAudit } from '@/lib/chatbot-route-auth';

// Public marketing hero (website@tourbots.ai showcase) — must match the demo
// IDs hard-coded in components/website/home/Hero.tsx so the unauthenticated hero
// can read this tour's chatbot customisation.
const DEFAULT_PUBLIC_DEMO_VENUE_ID = 'aed89398-bb6d-44e7-8ff6-de45ffcbfcd0';
const DEFAULT_PUBLIC_DEMO_TOUR_ID = '77a2da98-8688-42c9-b702-8a24ba298092';
const PUBLIC_DEMO_VENUE_ID = process.env.NEXT_PUBLIC_DEMO_VENUE_ID || DEFAULT_PUBLIC_DEMO_VENUE_ID;
const PUBLIC_DEMO_TOUR_ID = process.env.NEXT_PUBLIC_DEMO_TOUR_ID || DEFAULT_PUBLIC_DEMO_TOUR_ID;

function isAllowedPublicDemoRead(
  venueId: string,
  chatbotType: string | null,
  tourId: string | null
): boolean {
  return Boolean(
    chatbotType === 'tour' &&
      tourId &&
      venueId === PUBLIC_DEMO_VENUE_ID &&
      tourId === PUBLIC_DEMO_TOUR_ID
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const chatbotType = searchParams.get('chatbotType') as string | null;
    const tourId = searchParams.get('tourId');

    if (!venueId) {
      return NextResponse.json(
        { error: 'Venue ID is required' },
        { status: 400 }
      );
    }

    const allowPublicDemoRead = isAllowedPublicDemoRead(venueId, chatbotType, tourId);
    // Scope to the requested venue. Platform admins may read any venue; everyone
    // else is constrained to their own (resolved via getScopedVenueId).
    let scopedVenueId = venueId;
    if (!allowPublicDemoRead) {
      const authResult = await authenticateChatbotRoute(request);
      if (authResult instanceof NextResponse) return authResult;

      const venueScopeError = ensureVenueScope(authResult, venueId);
      if (venueScopeError) return venueScopeError;

      scopedVenueId = getScopedVenueId(authResult, venueId);

      if (chatbotType === 'tour' && tourId) {
        const tourScopeError = await ensureTourScope(scopedVenueId, tourId);
        if (tourScopeError) return tourScopeError;
      }
    }

    if (chatbotType) {
      if (chatbotType !== 'tour') {
        return NextResponse.json(
          { error: 'Invalid chatbot type. Only "tour" is supported' },
          { status: 400 }
        );
      }
      if (!tourId) {
        return NextResponse.json(
          { error: 'Tour ID is required for tour chatbot customisation' },
          { status: 400 }
        );
      }
      const customisation = await getChatbotCustomisation(scopedVenueId, 'tour', tourId);
      return NextResponse.json(customisation);
    } else {
      // Get all customisations for venue
      const customisations = await getVenueChatbotCustomisations(scopedVenueId);
      return NextResponse.json(customisations);
    }
  } catch (error: any) {
    console.error('Error fetching chatbot customisation:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch chatbot customisation' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const { venueId, tourId, chatbotType, customisation } = await request.json();
    const venueScopeError = ensureVenueScope(authResult, venueId);
    if (venueScopeError) return venueScopeError;
    const scopedVenueId = getScopedVenueId(authResult, venueId);
    const tourScopeError = await ensureTourScope(scopedVenueId, tourId);
    if (tourScopeError) return tourScopeError;

    if (!venueId || !tourId || !chatbotType) {
      return NextResponse.json(
        { error: 'Venue ID, tour ID and chatbot type are required' },
        { status: 400 }
      );
    }

    if (chatbotType !== 'tour') {
      return NextResponse.json(
        { error: 'Invalid chatbot type. Only "tour" is supported' },
        { status: 400 }
      );
    }

    const updatedCustomisation = await upsertChatbotCustomisation(
      scopedVenueId,
      'tour',
      tourId,
      customisation
    );

    logChatbotAudit('chatbot_customisation_updated', authResult, { tour_id: tourId });
    return NextResponse.json(updatedCustomisation);
  } catch (error: any) {
    console.error('Error updating chatbot customisation:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update chatbot customisation' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const { venueId, tourId, chatbotType, customisation } = await request.json();
    const venueScopeError = ensureVenueScope(authResult, venueId);
    if (venueScopeError) return venueScopeError;
    const scopedVenueId = getScopedVenueId(authResult, venueId);
    const tourScopeError = await ensureTourScope(scopedVenueId, tourId);
    if (tourScopeError) return tourScopeError;

    if (!venueId || !tourId || !chatbotType) {
      return NextResponse.json(
        { error: 'Venue ID, tour ID and chatbot type are required' },
        { status: 400 }
      );
    }

    if (chatbotType !== 'tour') {
      return NextResponse.json(
        { error: 'Invalid chatbot type. Only "tour" is supported' },
        { status: 400 }
      );
    }

    const newCustomisation = await upsertChatbotCustomisation(
      scopedVenueId,
      'tour',
      tourId,
      customisation
    );

    logChatbotAudit('chatbot_customisation_created', authResult, { tour_id: tourId });
    return NextResponse.json(newCustomisation);
  } catch (error: any) {
    console.error('Error creating chatbot customisation:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create chatbot customisation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const { venueId, tourId, chatbotType } = await request.json();
    const venueScopeError = ensureVenueScope(authResult, venueId);
    if (venueScopeError) return venueScopeError;
    const scopedVenueId = getScopedVenueId(authResult, venueId);
    const tourScopeError = await ensureTourScope(scopedVenueId, tourId);
    if (tourScopeError) return tourScopeError;

    if (!venueId || !tourId || !chatbotType) {
      return NextResponse.json(
        { error: 'Venue ID, tour ID and chatbot type are required' },
        { status: 400 }
      );
    }

    if (chatbotType !== 'tour') {
      return NextResponse.json(
        { error: 'Invalid chatbot type. Only "tour" is supported' },
        { status: 400 }
      );
    }

    await deleteChatbotCustomisation(scopedVenueId, 'tour', tourId);

    logChatbotAudit('chatbot_customisation_deleted', authResult, { tour_id: tourId });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting chatbot customisation:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete chatbot customisation' },
      { status: 500 }
    );
  }
} 